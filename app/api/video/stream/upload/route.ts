import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

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

const ACCEPTED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
])

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
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400, headers })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'FORM_PARSE_FAIL' }, { status: 400, headers })
    }

    const file = formData.get('file') as File | null
    const title = String(formData.get('title') || '')
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400, headers })
    }
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 30MB limit' }, { status: 413, headers })
    }
    if (file.type && !ACCEPTED_VIDEO_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported video type' }, { status: 415, headers })
    }

    const env = process.env as Record<string, string | undefined>
    const libraryId = env.BUNNY_STREAM_LIBRARY_ID
    const accessKey = env.BUNNY_STREAM_ACCESS_KEY
    const apiBase = env.BUNNY_STREAM_API_BASE || 'https://video.bunnycdn.com'
    const embedBase = env.BUNNY_STREAM_PLAYBACK_BASE || 'https://iframe.mediadelivery.net/embed'
    if (!libraryId || !accessKey) {
      const missing = [ ['BUNNY_STREAM_LIBRARY_ID', libraryId], ['BUNNY_STREAM_ACCESS_KEY', accessKey] ].filter(([,v]) => !v).map(([k]) => k)
      return NextResponse.json({ error: 'ENV_MISSING', missing }, { status: 500, headers })
    }

    // Step 1: Create a video (optional title)
    const createRes = await fetch(`${apiBase}/library/${encodeURIComponent(libraryId)}/videos`, {
      method: 'POST',
      headers: { 'AccessKey': accessKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || `Upload ${new Date().toISOString()}` }),
    })
    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '')
      return NextResponse.json({ error: 'BUNNY_CREATE_FAIL', status: createRes.status, detail: text }, { status: 502, headers })
    }
    type CreateVideoResponse = { guid?: string; Guid?: string }
    const createJson = await createRes.json().catch(() => null) as CreateVideoResponse | null
    const guid = String((createJson && (createJson.guid || (createJson as any).Guid)) || '')
    if (!guid) {
      return NextResponse.json({ error: 'BUNNY_CREATE_NO_GUID' }, { status: 502, headers })
    }

    // Step 2: Upload file
    let bodyBlob: Blob
    try {
      const ab = await file.arrayBuffer()
      bodyBlob = new Blob([ab], { type: file.type || 'application/octet-stream' })
    } catch {
      return NextResponse.json({ error: 'FILE_READ_FAIL' }, { status: 500, headers })
    }

    const uploadRes = await fetch(`${apiBase}/library/${encodeURIComponent(libraryId)}/videos/${encodeURIComponent(guid)}`, {
      method: 'PUT',
      headers: { 'AccessKey': accessKey, 'Content-Type': file.type || 'application/octet-stream' },
      body: bodyBlob,
    })
    if (!uploadRes.ok && uploadRes.status !== 201) {
      const text = await uploadRes.text().catch(() => '')
      return NextResponse.json({ error: 'BUNNY_UPLOAD_FAIL', status: uploadRes.status, detail: text }, { status: 502, headers })
    }

    const videoUrl = `${embedBase}/${encodeURIComponent(libraryId)}/${encodeURIComponent(guid)}`
    return NextResponse.json({ guid, videoUrl }, { headers })
  } catch {
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500, headers })
  }
}


