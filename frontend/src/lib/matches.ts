import { getBackendApi } from './config'

export type MatchStatus = 'yes' | 'pending' | 'chopped'
export type MatchSlot = { matchedUserId: string; mainImageUrl: string; matchStatus: MatchStatus }

export async function fetchUserMatchArray(): Promise<Array<MatchSlot | null>> {
  const res = await fetch(getBackendApi('/api/user/matches'), { credentials: 'include' })
  if (!res.ok) {
    return new Array(50).fill(null)
  }
  const data = await res.json().catch(() => null) as { slots?: unknown }
  const raw = Array.isArray((data as any)?.slots) ? (data as any).slots as Array<any> : []
  const limit = 50
  const slots: Array<MatchSlot | null> = new Array(limit).fill(null)
  for (let i = 0; i < Math.min(raw.length, limit); i++) {
    const s = raw[i]
    if (s && typeof s === 'object' && typeof s.matchedUserId === 'string' && typeof s.mainImageUrl === 'string' && (s.matchStatus === 'yes' || s.matchStatus === 'pending' || s.matchStatus === 'chopped')) {
      slots[i] = { matchedUserId: s.matchedUserId, mainImageUrl: s.mainImageUrl, matchStatus: s.matchStatus }
    }
  }
  return slots
}


