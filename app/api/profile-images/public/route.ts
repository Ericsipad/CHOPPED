import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUserProfileImagesCollection } from '@/lib/mongo'
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

		const collection = await getUserProfileImagesCollection()
		const doc = await collection.findOne<{ userId: ObjectId; main?: string | null; thumbs?: Array<{ name: string; url: string }> }>({ userId: targetId })

		const mainRaw = typeof doc?.main === 'string' ? doc!.main : null
		const main = mainRaw ? mainRaw : null
		const validThumbsRaw = Array.isArray(doc?.thumbs) ? doc!.thumbs!.filter((t) => typeof t?.name === 'string' && /^thumb[1-6]$/.test(t.name) && typeof t?.url === 'string') : []
		const thumbs = validThumbsRaw.map((t) => ({ name: t.name, url: t.url }))

		return NextResponse.json({ main, thumbs }, { headers })
	} catch {
		return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
	}
}


