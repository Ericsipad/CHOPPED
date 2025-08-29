import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

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

function inferExtension(mime: string | null): string {
  if (!mime) return 'bin'
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
  }
  return map[mime] || 'bin'
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

    const contentType = req.headers.get('content-type') || ''
    const isForm = contentType.startsWith('multipart/form-data')
    if (!isForm) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400, headers })
    }

    const formData = await req.formData()
    const slot = String(formData.get('slot') || '')
    if (!/^main$|^thumb[1-6]$/.test(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400, headers })
    }
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400, headers })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 413, headers })
    }

    // Lookup or create user record to get Mongo _id
    const users = await getUsersCollection()
    const now = new Date()
    await users.updateOne(
      { supabaseUserId: user.id },
      { $setOnInsert: { createdAt: now, supabaseUserId: user.id }, $set: { updatedAt: now } },
      { upsert: true },
    )
    const doc = await users.findOne({ supabaseUserId: user.id })
    const mongoUserId = doc?._id?.toString()
    if (!mongoUserId) {
      return NextResponse.json({ error: 'Failed to resolve user id' }, { status: 500, headers })
    }

    const rand = Math.floor(1 + Math.random() * 100)
    const d = new Date()
    const yyyy = String(d.getFullYear())
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const HH = String(d.getHours()).padStart(2, '0')
    const MM = String(d.getMinutes()).padStart(2, '0')
    const SS = String(d.getSeconds()).padStart(2, '0')
    const ext = inferExtension(file.type)
    const env = process.env as Record<string, string | undefined>
    const storageZone = (
      env.BUNNY_STORAGE_ZONE ||
      env.BUNNY_STORAGE_ZONE_NAME ||
      env.BUNNY_STORAGE_NAME ||
      env.BUNNY_ZONE_NAME
    ) as string
    const storageHost = (
      env.BUNNY_STORAGE_HOST ||
      env.BUNNY_EDGE_STORAGE_HOST ||
      env.BUNNY_STORAGE_ENDPOINT ||
      env.BUNNY_STORAGE_REGION_HOST
    ) as string // e.g., ny.storage.bunnycdn.com
    const pullZoneHost = (
      env.BUNNY_PULLZONE_HOST ||
      env.BUNNY_PULL_ZONE_HOST ||
      env.BUNNY_CDN_HOST ||
      env.BUNNY_PULL_ZONE_DOMAIN ||
      env.BUNNY_THUMBS_CDN
    ) as string // required to build final public URL
    const accessKey = (
      env.BUNNY_ACCESS_KEY ||
      env.BUNNY_STORAGE_ACCESS_KEY ||
      env.BUNNY_STORAGE_PASSWORD
    ) as string
    if (!storageZone || !storageHost || !accessKey || !pullZoneHost) {
      // Log which ones are missing for server diagnostics only
      const missing = [
        ['storageZone', storageZone],
        ['storageHost', storageHost],
        ['pullZoneHost', pullZoneHost],
        ['accessKey', accessKey],
      ].filter(([, v]) => !v).map(([k]) => k)
      // eslint-disable-next-line no-console
      console.error('Bunny env misconfigured. Missing:', missing)
      return NextResponse.json({ error: 'Bunny env misconfigured' }, { status: 500, headers })
    }

    const path = `users/${mongoUserId}/profile/${mongoUserId}.${yyyy}${mm}${dd}.${HH}${MM}${SS}.${rand}.${slot}.${ext}`
    const uploadUrl = `https://${storageHost}/${encodeURIComponent(storageZone)}/${path}`
    const publicUrl = `https://${pullZoneHost}/${path}`

    const bunnyRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': accessKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file.stream(),
    })

    if (!bunnyRes.ok && bunnyRes.status !== 201) {
      const text = await bunnyRes.text().catch(() => '')
      return NextResponse.json({ error: 'Bunny upload failed', status: bunnyRes.status, detail: text }, { status: 502, headers })
    }

    return NextResponse.json({ publicUrl, path }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


