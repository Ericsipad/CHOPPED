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

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('UPLOAD FORM_PARSE_FAIL', err)
      return NextResponse.json({ error: 'FORM_PARSE_FAIL' }, { status: 400, headers })
    }
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
    const users = await getUsersCollection().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('UPLOAD MONGO_CONNECT_FAIL', err)
      return null
    })
    if (!users) {
      return NextResponse.json({ error: 'MONGO_CONNECT_FAIL' }, { status: 500, headers })
    }
    const now = new Date()
    try {
      await users.updateOne(
        { supabaseUserId: user.id },
        { $setOnInsert: { createdAt: now, supabaseUserId: user.id }, $set: { updatedAt: now } },
        { upsert: true },
      )
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('UPLOAD MONGO_UPSERT_FAIL', err)
      return NextResponse.json({ error: 'MONGO_UPSERT_FAIL' }, { status: 500, headers })
    }
    const doc = await users.findOne({ supabaseUserId: user.id }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('UPLOAD MONGO_FIND_FAIL', err)
      return null
    })
    const mongoUserId = doc?._id?.toString()
    if (!mongoUserId) {
      return NextResponse.json({ error: 'USER_LOOKUP_FAIL' }, { status: 500, headers })
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
      console.error('UPLOAD ENV_MISSING', missing)
      return NextResponse.json({ error: 'ENV_MISSING', missing }, { status: 500, headers })
    }

    // Option B: one folder level by userId, filename without slot
    const filename = `${yyyy}${mm}${dd}.${HH}${MM}${SS}.${rand}.${ext}`
    const path = `${mongoUserId}/${filename}`
    const uploadUrl = `https://${storageHost}/${encodeURIComponent(storageZone)}/${encodeURIComponent(mongoUserId)}/${encodeURIComponent(filename)}`
    const publicUrl = `https://${pullZoneHost}/${encodeURIComponent(mongoUserId)}/${encodeURIComponent(filename)}`

    // Convert to Buffer for reliable Node upload
    let bodyBlob: Blob
    try {
      const ab = await file.arrayBuffer()
      bodyBlob = new Blob([ab], { type: file.type || 'application/octet-stream' })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('UPLOAD FILE_READ_FAIL', err)
      return NextResponse.json({ error: 'FILE_READ_FAIL' }, { status: 500, headers })
    }

    const bunnyRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': accessKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: bodyBlob,
    })

    if (!bunnyRes.ok && bunnyRes.status !== 201) {
      const text = await bunnyRes.text().catch(() => '')
      // eslint-disable-next-line no-console
      console.error('UPLOAD BUNNY_UPLOAD_FAIL', bunnyRes.status, text)
      return NextResponse.json({ error: 'BUNNY_UPLOAD_FAIL', status: bunnyRes.status, detail: text }, { status: 502, headers })
    }

    return NextResponse.json({ publicUrl, path }, { headers })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('UPLOAD UNKNOWN', err)
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500, headers })
  }
}


