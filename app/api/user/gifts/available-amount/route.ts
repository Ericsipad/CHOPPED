import { NextResponse } from 'next/server'
import { getUsersCollection } from '@/lib/mongo'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
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
	try {
		const supabase = createSupabaseRouteClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
		}

		const users = await getUsersCollection()
		const viewer = await users.findOne<{ _id?: ObjectId; supabaseUserId?: string }>({ supabaseUserId: user.id })
		if (!viewer?._id) {
			return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
		}

		// Sum of gifts_got.amountCents where is_accepted === true and withdrawn === false
		const cursor = users.aggregate<{ availableCents: number }>([
			{ $match: { _id: viewer._id } },
			{
				$project: {
					availableCents: {
						$sum: {
							$map: {
								input: {
									$filter: {
										input: { $ifNull: ['$gifts_got', []] },
										as: 'g',
										cond: { $and: [ { $eq: ['$$g.is_accepted', true] }, { $eq: ['$$g.withdrawn', false] } ] },
									},
								},
								as: 'g',
								in: { $ifNull: ['$$g.amountCents', 0] },
							},
						},
					},
				},
			},
		])
		const first = await cursor.next()
		const availableCents = first?.availableCents ?? 0
		return NextResponse.json({ availableCents }, { headers })
	} catch {
		return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
	}
}


