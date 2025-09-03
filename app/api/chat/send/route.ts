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
    return new NextResponse(null, { status: 403, headers: buildCorsHeaders(allowedOrigins, null) })
  }
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(allowedOrigins, requestOrigin) })
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

    const body = await req.json().catch(() => null) as {
      threadId?: string
      recipientMongoId?: string
      body?: string
      senderMongoId?: string
    } | null

    if (!body?.threadId || !body?.recipientMongoId || !body?.body || !body?.senderMongoId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers })
    }

    // For now, skip thread ensure and let the RPC handle it
    // The existing /api/chat/threads/ensure endpoint can be called separately if needed

    // Use the RPC function to insert the message
    const { data, error } = await supabase.rpc('insert_chat_message', {
      _thread_id: body.threadId,
      _sender_mongo_id: body.senderMongoId,
      _recipient_mongo_id: body.recipientMongoId,
      _body: body.body,
    })

    if (error) {
      console.error('[Chat Send] RPC error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500, headers })
    }

    return NextResponse.json({ message: data }, { headers })
  } catch (error) {
    console.error('[Chat Send] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}
