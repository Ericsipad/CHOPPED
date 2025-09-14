import { getBackendApi } from '../../lib/config'

export async function fetchUnwithdrawnGiftsCount(): Promise<number> {
	try {
		const res = await fetch(getBackendApi('/api/user/gifts/unwithdrawn-count'), { credentials: 'include' })
		if (!res.ok) return 0
		const data = await res.json().catch(() => null) as { giftsCount?: number } | null
		return typeof data?.giftsCount === 'number' ? data.giftsCount : 0
	} catch {
		return 0
	}
}

export type ReceivedGift = {
  senderUserId: string
  displayName: string | null
  mainImageUrl: string | null
  giftMessage: string | null
  createdAt: string
  is_accepted: boolean
  amountCents: number
  stripeTransactionId?: string | null
}

export async function fetchReceivedGifts(limit = 50, offset = 0): Promise<ReceivedGift[]> {
  try {
    const url = getBackendApi(`/api/user/gifts/received?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return []
    const data = await res.json().catch(() => null) as { items?: ReceivedGift[] } | null
    return Array.isArray(data?.items) ? data!.items! : []
  } catch {
    return []
  }
}

export async function updateGiftAcceptance(
  arg1: string | { stripeTransactionId?: string | null; senderUserId?: string; createdAt?: string },
  createdAtOrAccepted?: string | boolean,
  acceptedMaybe?: boolean
): Promise<boolean> {
  try {
    let body: any
    if (typeof arg1 === 'string') {
      body = { senderUserId: arg1, createdAt: createdAtOrAccepted as string, accepted: acceptedMaybe as boolean }
    } else {
      const { stripeTransactionId, senderUserId, createdAt } = arg1 || {}
      body = { stripeTransactionId: stripeTransactionId ?? null, senderUserId, createdAt, accepted: (createdAtOrAccepted as boolean) ?? false }
    }
    const res = await fetch(getBackendApi('/api/user/gifts/acceptance'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.ok
  } catch {
    return false
  }
}


export type SenderPendingGift = { senderUserId: string; createdAt: string; amountCents: number }
export type SenderPendingGiftWithStripe = { senderUserId: string; createdAt: string; amountCents: number; stripeTransactionId?: string | null }

export async function fetchPendingGiftFromSender(senderUserId: string): Promise<SenderPendingGiftWithStripe | null> {
  try {
    const rows = await fetchReceivedGifts(50, 0)
    const filtered = rows.filter(r => r.senderUserId === senderUserId && !r.is_accepted)
    if (filtered.length === 0) return null
    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    const top = filtered[0]
    return { senderUserId: top.senderUserId, createdAt: top.createdAt, amountCents: typeof top.amountCents === 'number' ? top.amountCents : 0, stripeTransactionId: (top as any).stripeTransactionId ?? null }
  } catch {
    return null
  }
}


export async function fetchAvailableGiftsAmountCents(): Promise<number> {
  try {
    const res = await fetch(getBackendApi('/api/user/gifts/available-amount'), { credentials: 'include' })
    if (!res.ok) return 0
    const data = await res.json().catch(() => null) as { availableCents?: number } | null
    return typeof data?.availableCents === 'number' ? data.availableCents : 0
  } catch {
    return 0
  }
}

