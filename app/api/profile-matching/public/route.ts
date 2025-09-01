import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getProfileMatchingCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
		'Cache-Control': 'no-store',
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
	const url = new URL(req.url)
	const debug: Record<string, unknown> = { origin: requestOrigin, method: 'GET' }
	try {
		console.log('[profile-matching/public][GET] start', { origin: requestOrigin })
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		debug.userPresent = !!user
		if (!user) {
			console.warn('[profile-matching/public][GET] unauthorized')
			return NextResponse.json({ error: 'Unauthorized', debug }, { status: 401, headers })
		}

		const userIdParam = url.searchParams.get('userId') || ''
		debug.userIdParam = userIdParam
		if (!userIdParam) {
			return NextResponse.json({ error: 'Missing userId', debug }, { status: 400, headers })
		}

		let targetId: ObjectId
		try {
			targetId = new ObjectId(userIdParam)
		} catch {
			console.warn('[profile-matching/public][GET] invalid userId', { userIdParam })
			return NextResponse.json({ error: 'Invalid userId', debug }, { status: 400, headers })
		}
		debug.targetId = String(targetId)

		const collection = await getProfileMatchingCollection()
		const doc = await collection.findOne<{ userId: ObjectId; displayName?: string; age?: number; heightCm?: number; bio?: string }>(
			{ userId: targetId },
			{ projection: { _id: 0, userId: 0, displayName: 1, age: 1, heightCm: 1, bio: 1 } }
		)
		if (!doc) {
			console.warn('[profile-matching/public][GET] not found', { userIdParam })
			return NextResponse.json({ displayName: null, age: null, heightCm: null, bio: null, debug }, { headers })
		}

		const displayName = typeof doc?.displayName === 'string' ? doc!.displayName : null
		const age = typeof doc?.age === 'number' ? doc!.age : null
		const heightCm = typeof doc?.heightCm === 'number' ? doc!.heightCm : null
		const bio = typeof doc?.bio === 'string' ? doc!.bio : null

		return NextResponse.json({ displayName, age, heightCm, bio, debug }, { headers })
	} catch (e) {
		console.error('[profile-matching/public][GET] error', e)
		debug.error = e instanceof Error ? e.message : String(e)
		return NextResponse.json({ error: 'Internal error', debug }, { status: 500, headers })
	}
}


