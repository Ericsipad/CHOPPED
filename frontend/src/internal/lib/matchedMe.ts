import { getBackendApi } from '../../lib/config'

export async function fetchPendingMatchedMeCount(): Promise<number> {
	try {
		const res = await fetch(getBackendApi('/api/user/matched-me/pending-count'), { credentials: 'include' })
		if (!res.ok) return 0
		const data = await res.json().catch(() => null) as { pendingCount?: number } | null
		return typeof data?.pendingCount === 'number' ? data.pendingCount : 0
	} catch {
		return 0
	}
}


