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


