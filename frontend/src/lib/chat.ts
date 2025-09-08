import { getBackendApi } from './config'

export type DbChatMessage = {
  id: string
  thread_id: string
  sender_supabase_id: string
  sender_mongo_id: string
  recipient_mongo_id: string
  body: string
  created_at: string
}

export async function fetchLatestMessages(threadId: string, limit = 50): Promise<DbChatMessage[]> {
  const response = await fetch(getBackendApi(`/api/chat/history?threadId=${encodeURIComponent(threadId)}&limit=${limit}`), {
    method: 'GET',
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`)
  }
  
  const data = await response.json()
  return data.messages || []
}

export async function fetchOlderMessages(threadId: string, beforeCreatedAt: string, limit = 50): Promise<DbChatMessage[]> {
  const response = await fetch(getBackendApi(`/api/chat/history?threadId=${encodeURIComponent(threadId)}&before=${encodeURIComponent(beforeCreatedAt)}&limit=${limit}`), {
    method: 'GET',
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch older messages: ${response.status}`)
  }
  
  const data = await response.json()
  return data.messages || []
}

export async function insertMessage(row: {
  thread_id: string
  sender_mongo_id: string
  recipient_mongo_id: string
  body: string
}): Promise<DbChatMessage> {
  const response = await fetch(getBackendApi('/api/chat/send'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      threadId: row.thread_id,
      senderMongoId: row.sender_mongo_id,
      recipientMongoId: row.recipient_mongo_id,
      body: row.body,
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `Failed to send message: ${response.status}`)
  }
  
  const data = await response.json()
  return data.message
}


