import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

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

type PendingRaw = { userId?: unknown; imageUrl?: unknown } | null | undefined

export async function GET(req: Request) {
	const allowedOrigins = getAllowedOrigins()
	const requestOrigin = req.headers.get('origin')
	const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
    const url = new URL(req.url)
    const debugEnabled = url.searchParams.get('debug') === '1' || process.env.DEBUG_API === '1'
    const debug: Record<string, unknown> = { step: 'start' }
	try {
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (debugEnabled) debug.user = !!user
        if (debugEnabled) console.log('[pending] start', { origin: requestOrigin })
		if (!user) {
			if (debugEnabled) console.warn('[pending] unauthorized')
			return NextResponse.json({ error: 'Unauthorized', debug: debugEnabled ? debug : undefined }, { status: 401, headers })
		}
        if (debugEnabled) console.log('[pending] supabase user', { present: true })

		const limitParam = url.searchParams.get('limit')
		const offsetParam = url.searchParams.get('offset')
		const userIdParam = url.searchParams.get('userId') || ''
		const limit = Number.isFinite(Number(limitParam)) ? Math.max(0, Math.min(500, Number(limitParam))) : 500
		const offset = Number.isFinite(Number(offsetParam)) ? Math.max(0, Number(offsetParam)) : 0
		if (debugEnabled) Object.assign(debug, { limit, offset, userIdParam })
        if (debugEnabled) console.log('[pending] params', { limit, offset, userIdParam })

		const usersCol = await getUsersCollection()
		const userDoc = await usersCol.findOne<{ _id?: unknown; pendingmatch_array?: unknown; supabaseUserId?: string }>({ supabaseUserId: user.id })
		if (debugEnabled) debug.userDoc = !!userDoc
		if (!userDoc) {
			if (debugEnabled) console.warn('[pending] user not linked')
			return NextResponse.json({ error: 'User not linked', debug: debugEnabled ? debug : undefined }, { status: 400, headers })
		}
        if (debugEnabled) console.log('[pending] mongo link', { found: true, mongoUserId: (userDoc as { _id?: { toString?: () => string } })._id?.toString?.() || null })

		// If a userId is provided, ensure it matches the logged-in user's Mongo _id
		if (userIdParam) {
			const currentMongoId = (userDoc as { _id?: { toString?: () => string } })._id?.toString?.() || ''
			if (debugEnabled) Object.assign(debug, { currentMongoId })
			if (!currentMongoId || userIdParam !== currentMongoId) {
				if (debugEnabled) console.warn('[pending] forbidden mismatch', { provided: userIdParam, currentMongoId })
				return NextResponse.json({ error: 'Forbidden', debug: debugEnabled ? debug : undefined }, { status: 403, headers })
			}
		}

		// Use actual database field 'pendingmatch_array' written by matching/trigger
		const baseArr: unknown = (userDoc as { pendingmatch_array?: unknown }).pendingmatch_array
		const rawArr: PendingRaw[] = Array.isArray(baseArr) ? baseArr as PendingRaw[] : []
		if (debugEnabled) Object.assign(debug, { total: rawArr.length })
        if (debugEnabled) console.log('[pending] counts', { total: rawArr.length })

		const sliced = rawArr.slice(offset, offset + limit)
		const items = sliced
			.map((entry) => {
				if (!entry || typeof entry !== 'object') return null
				const rec = entry as Record<string, unknown>
				const uidRaw = rec.userId
				const imgRaw = rec.imageUrl
				let uid: string | null = null
				if (typeof uidRaw === 'string') {
					uid = uidRaw
				} else if (uidRaw && typeof uidRaw === 'object' && typeof (uidRaw as { toHexString?: unknown }).toHexString === 'function') {
					try { uid = (uidRaw as { toHexString: () => string }).toHexString() } catch { uid = null }
				}
				const img = typeof imgRaw === 'string' ? imgRaw : null
				return (uid && img) ? { userId: uid, imageUrl: img } : null
			})
			.filter((v): v is { userId: string; imageUrl: string } => v !== null)
        if (debugEnabled) console.log('[pending] items', { count: items.length })

		return NextResponse.json({ items, debug: debugEnabled ? debug : undefined }, { headers })
	} catch (e) {
		if (debugEnabled) debug.error = e instanceof Error ? e.message : String(e)
		if (debugEnabled) console.error('[pending] error', e)
		return NextResponse.json({ error: 'Internal error', debug: debugEnabled ? debug : undefined }, { status: 500, headers })
	}
}


