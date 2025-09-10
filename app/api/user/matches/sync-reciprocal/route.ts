import { NextResponse } from 'next/server'
import { Filter, ObjectId, UpdateFilter } from 'mongodb'
import { getUsersCollection } from '@/lib/mongo'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

export const revalidate = 0

const ALLOWED_METHODS = ['POST', 'OPTIONS'] as const

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
		return new NextResponse(null, { status: 403, headers: buildCorsHeaders(allowedOrigins, null) })
	}
	return new NextResponse(null, { status: 204, headers: buildCorsHeaders(allowedOrigins, requestOrigin) })
}

type RawMatch = { userId?: unknown; matchedUserId?: unknown; imageUrl?: unknown; mainImageUrl?: unknown; status?: unknown; matchStatus?: unknown } | null | undefined

function extractUserId(entry: RawMatch): string | null {
	if (!entry || typeof entry !== 'object') return null
	const rec = entry as Record<string, unknown>
	const a = rec.userId
	if (typeof a === 'string' && a) return a
	const b = rec.matchedUserId
	if (typeof b === 'string' && b) return b
	return null
}

function extractStatus(entry: RawMatch): string | null {
	if (!entry || typeof entry !== 'object') return null
	const rec = entry as Record<string, unknown>
	const a = rec.status
	if (typeof a === 'string' && a) return a
	const b = rec.matchStatus
	if (typeof b === 'string' && b) return b as string
	return null
}

export async function POST(req: Request) {
	const allowedOrigins = getAllowedOrigins()
	const requestOrigin = req.headers.get('origin')
	const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
	try {
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
		}

		// Accept optional viewerId from client to avoid extra lookup
		let viewerIdFromBody: string | null = null
		try {
			const bodyUnknown = await req.json().catch(() => ({}))
			if (bodyUnknown && typeof bodyUnknown === 'object') {
				const v = (bodyUnknown as { viewerId?: unknown }).viewerId
				if (typeof v === 'string' && v) viewerIdFromBody = v
			}
		} catch { /* ignore body parse */ }

		const usersCol = await getUsersCollection()
		// Verify linkage and that provided viewerId matches the logged-in user
		const linked = await usersCol.findOne<{ _id?: ObjectId; supabaseUserId?: string }>({ supabaseUserId: user.id })
		if (!linked?._id) {
			return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
		}
		const viewerObjectId = linked._id
		if (viewerIdFromBody && viewerIdFromBody !== viewerObjectId.toHexString()) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
		}

		// Load current user's Match_array (cap 50), skip chopped entries
		const meDoc = await usersCol.findOne<{ Match_array?: unknown }>({ _id: viewerObjectId }, { projection: { Match_array: 1 } })
		const rawArr: RawMatch[] = Array.isArray(meDoc?.Match_array) ? (meDoc!.Match_array as RawMatch[]) : []
		const pairs: Array<{ userId: string; isChopped: boolean }> = []
		for (let i = 0; i < Math.min(rawArr.length, 50); i++) {
			const entry = rawArr[i]
			const uid = extractUserId(entry)
			if (!uid) continue
			const status = (extractStatus(entry) || '').toLowerCase()
			pairs.push({ userId: uid, isChopped: status === 'chopped' })
		}
		const candidateIds = pairs.filter(p => !p.isChopped).map(p => p.userId)
		if (candidateIds.length === 0) {
			return NextResponse.json({ ok: true }, { headers })
		}

		// Prepare ObjectIds for peers
		const peerIdToObj: Map<string, ObjectId> = new Map()
		for (const uid of candidateIds) {
			try {
				if (uid && /^[0-9a-fA-F]{24}$/.test(uid)) {
					peerIdToObj.set(uid, new ObjectId(uid))
				}
			} catch { /* skip invalid */ }
		}
		const peerObjIds = Array.from(peerIdToObj.values())
		if (peerObjIds.length === 0) {
			return NextResponse.json({ ok: true }, { headers })
		}

		// Bulk fetch peer docs
		const peers = await usersCol
			.find<{ _id: ObjectId; Match_array?: unknown }>({ _id: { $in: peerObjIds } as unknown as Filter<unknown> }, { projection: { Match_array: 1 } })
			.toArray()

		const viewerIdStr = viewerObjectId.toHexString()
		const mutualPeerIds: string[] = []
		const nonMutualPeerIds: string[] = []

		const candidateSet = new Set(candidateIds)

		for (const peer of peers) {
			const rawPeerArr: RawMatch[] = Array.isArray(peer?.Match_array) ? (peer!.Match_array as RawMatch[]) : []
			let found = false
			for (let i = 0; i < Math.min(rawPeerArr.length, 50); i++) {
				const e = rawPeerArr[i]
				const uid = extractUserId(e)
				if (uid !== viewerIdStr) continue
				const st = (extractStatus(e) || '').toLowerCase()
				if (st === 'chopped') { found = false; break }
				found = true
				break
			}
			const peerIdStr = peer._id.toHexString()
			if (!candidateSet.has(peerIdStr)) continue
			if (found) mutualPeerIds.push(peerIdStr)
			else nonMutualPeerIds.push(peerIdStr)
		}

		// Update current user's statuses in two simple operations (skip chopped via arrayFilters)
		if (mutualPeerIds.length > 0) {
			await usersCol.updateOne(
				({ _id: viewerObjectId } as unknown) as Filter<unknown>,
				({
					$set: { 'Match_array.$[mutual].status': 'yes' },
				} as unknown) as UpdateFilter<unknown>,
				{ arrayFilters: [{ 'mutual.userId': { $in: mutualPeerIds }, 'mutual.status': { $ne: 'chopped' } }] }
			)
		}
		if (nonMutualPeerIds.length > 0) {
			await usersCol.updateOne(
				({ _id: viewerObjectId } as unknown) as Filter<unknown>,
				({
					$set: { 'Match_array.$[non].status': 'pending' },
				} as unknown) as UpdateFilter<unknown>,
				{ arrayFilters: [{ 'non.userId': { $in: nonMutualPeerIds }, 'non.status': { $ne: 'chopped' } }] }
			)
		}

		// Update peers where mutual to 'yes' for the viewer entry (skip chopped)
		if (mutualPeerIds.length > 0) {
			const bulk = mutualPeerIds.map((pid) => ({
				updateOne: {
					filter: ({ _id: new ObjectId(pid) } as unknown) as Filter<unknown>,
					update: ({ $set: { 'Match_array.$[elem].status': 'yes' } } as unknown) as UpdateFilter<unknown>,
					arrayFilters: [{ 'elem.userId': viewerIdStr, 'elem.status': { $ne: 'chopped' } }],
				},
			}))
			if (bulk.length > 0) {
				await usersCol.bulkWrite(bulk, { ordered: false })
			}
		}

		return NextResponse.json({ ok: true }, { headers })
	} catch (e) {
		return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: buildCorsHeaders(getAllowedOrigins(), req.headers.get('origin')) })
	}
}


