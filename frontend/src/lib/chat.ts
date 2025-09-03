import { createAuthedClient, getSupabaseClient } from './supabase'

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
  const supabase = createAuthedClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as DbChatMessage[]) || []
}

export async function fetchOlderMessages(threadId: string, beforeCreatedAt: string, limit = 50): Promise<DbChatMessage[]> {
  const supabase = createAuthedClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .lt('created_at', beforeCreatedAt)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as DbChatMessage[]) || []
}

export async function insertMessage(row: {
  thread_id: string
  sender_supabase_id: string
  sender_mongo_id: string
  recipient_mongo_id: string
  body: string
}): Promise<DbChatMessage> {
  const supabase = createAuthedClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([row])
    .select('*')
    .single()
  if (error) throw error
  return data as DbChatMessage
}


