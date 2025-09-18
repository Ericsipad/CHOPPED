import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchAvailableGiftsAmountCents } from '../lib/gifts'
import '../styles/internal.css'

export default function PointsBadge() {
    const { isAuthenticated } = useAuth()
    const [availableCents, setAvailableCents] = useState<number>(0)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                if (!isAuthenticated) {
                    if (!cancelled) setAvailableCents(0)
                    return
                }
                const cents = await fetchAvailableGiftsAmountCents()
                if (!cancelled) setAvailableCents(typeof cents === 'number' ? cents : 0)
            } catch {
                if (!cancelled) setAvailableCents(0)
            }
        })()
        return () => { cancelled = true }
    }, [isAuthenticated])

    if (!isAuthenticated) return null

    return (
        <div className="points-badge" aria-live="polite">Points: {availableCents}</div>
    )
}


