import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

const ALLOWED_METHODS = ['GET', 'OPTIONS'] as const

function getAllowedOrigins(): string[] {
	const raw = process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN
	if (!raw) return []
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
}

function isOriginAllowed(requestOrigin: string, allowedOrigins: string[]): boolean {
	return allowedOrigins.includes(requestOrigin)
}

function buildCorsHeaders(allowedOrigins: string[], requestOrigin: string | null) {
	const allowOriginHeader =
		requestOrigin && allowedOrigins.length > 0 && isOriginAllowed(requestOrigin, allowedOrigins)
			? requestOrigin
			: 'null'
	return {
		'Access-Control-Allow-Origin': allowOriginHeader,
		'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
		'Vary': 'Origin',
	}
}

export async function OPTIONS(req: Request) {
	const allowedOrigins = getAllowedOrigins()
	const requestOrigin = req.headers.get('origin')
	if (allowedOrigins.length > 0 && requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
		return new NextResponse(null, {
			status: 403,
			headers: buildCorsHeaders(allowedOrigins, null),
		})
	}
	return new NextResponse(null, {
		status: 204,
		headers: buildCorsHeaders(allowedOrigins, requestOrigin),
	})
}

export async function GET(req: Request) {
	const allowedOrigins = getAllowedOrigins()
	const requestOrigin = req.headers.get('origin')
	const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
	try {
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
		}

		const url = new URL(req.url)
		const userIdParam = url.searchParams.get('userId') || ''
		if (!userIdParam) {
			return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers })
		}

		let targetId: ObjectId
		try {
			targetId = new ObjectId(userIdParam)
		} catch {
			return NextResponse.json({ error: 'Invalid userId' }, { status: 400, headers })
		}

		const users = await getUsersCollection()
		const doc = await users.findOne<{ _id: ObjectId; profile_videos?: Array<{ id?: unknown; video_thumb?: unknown; video_url?: unknown }> }>({ _id: targetId }, { projection: { profile_videos: 1 } })

		const itemsRaw = Array.isArray(doc?.profile_videos) ? (doc!.profile_videos as Array<{ id?: unknown; video_thumb?: unknown; video_url?: unknown }>) : []
		const items = itemsRaw.slice(0, 6).map((it) => ({
			id: String(it?.id || ''),
			video_thumb: typeof it?.video_thumb === 'string' ? (it!.video_thumb as string) : null,
			video_url: typeof it?.video_url === 'string' ? (it!.video_url as string) : null,
		}))

		return NextResponse.json({ items }, { headers })
	} catch {
		return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
	}
}



