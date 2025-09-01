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
	try {
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
		}

		const url = new URL(req.url)
		const limitParam = url.searchParams.get('limit')
		const offsetParam = url.searchParams.get('offset')
		const limit = Number.isFinite(Number(limitParam)) ? Math.max(0, Math.min(500, Number(limitParam))) : 500
		const offset = Number.isFinite(Number(offsetParam)) ? Math.max(0, Number(offsetParam)) : 0

		const usersCol = await getUsersCollection()
		const userDoc = await usersCol.findOne<{ pendingmatch_array?: unknown; supabaseUserId?: string }>({ supabaseUserId: user.id })
		if (!userDoc) {
			return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
		}

		// Use actual database field 'pendingmatch_array' written by matching/trigger
		const baseArr: unknown = (userDoc as { pendingmatch_array?: unknown }).pendingmatch_array
		const rawArr: PendingRaw[] = Array.isArray(baseArr) ? baseArr as PendingRaw[] : []

		const sliced = rawArr.slice(offset, offset + limit)
		const items = sliced
			.map((entry) => {
				if (!entry || typeof entry !== 'object') return null
				const uidRaw = (entry as Record<string, unknown>).userId
				const img = (entry as Record<string, unknown>).imageUrl
				let uid: string | null = null
				if (typeof uidRaw === 'string') {
					uid = uidRaw
				} else if (uidRaw && typeof uidRaw === 'object' && typeof (uidRaw as { toHexString?: unknown }).toHexString === 'function') {
					try { uid = (uidRaw as { toHexString: () => string }).toHexString() } catch { uid = null }
				}
				return (uid && typeof img === 'string' && img) ? { userId: uid, imageUrl: img } : null
			})
			.filter((v): v is { userId: string; imageUrl: string } => v !== null)

		return NextResponse.json({ items }, { headers })
	} catch {
		return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
	}
}


