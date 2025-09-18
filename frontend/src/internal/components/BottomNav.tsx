import { useEffect, useMemo, useRef, useState } from 'react'
import { DollarSign, Heart, Plus, User } from 'lucide-react'
import { fetchAvailableGiftsAmountCents } from '../lib/gifts'
import { useAuth } from '../hooks/useAuth'

export default function BottomNav() {
	const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
	const isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
	const isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
	const isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'

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

    const audioCtxRef = useRef<AudioContext | null>(null)
    const clickSound = useMemo(() => ({
        play: () => {
            try {
                if (!audioCtxRef.current) {
                    const Ctor: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
                    if (!Ctor) return
                    audioCtxRef.current = new Ctor()
                }
                const ctx = audioCtxRef.current
                if (!ctx) return
                const now = ctx.currentTime
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = 'square'
                osc.frequency.setValueAtTime(800, now)
                gain.gain.setValueAtTime(0.4, now)
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.start(now)
                osc.stop(now + 0.09)
            } catch { /* noop */ }
        }
    }), [])

    function handleClickSound() {
        // Play immediately on pointer interaction for responsiveness
        clickSound.play()
    }

    return (
		<nav className="pwa-bottom-nav" aria-label="Primary">
			<div className="pwa-bottom-nav__group pwa-bottom-nav__group--left">
				<a
					href="/profile.html"
					className={["pwa-bottom-nav__btn", isProfile ? 'is-active' : ''].filter(Boolean).join(' ')}
					aria-current={isProfile ? 'page' : undefined}
					aria-label="Profile"
                    onMouseDown={handleClickSound}
                    onTouchStart={handleClickSound as any}
				>
					<User size={24} aria-hidden="true" />
				</a>
				<a
					href="/chopping-board.html"
					className={["pwa-bottom-nav__btn", isChoppingBoard ? 'is-active' : ''].filter(Boolean).join(' ')}
					aria-current={isChoppingBoard ? 'page' : undefined}
					aria-label="Chopping Board"
                    onMouseDown={handleClickSound}
                    onTouchStart={handleClickSound as any}
				>
					<span className="pwa-bottom-nav__icon-stack" aria-hidden="true">
						<Heart size={24} />
						<Plus size={14} className="pwa-bottom-nav__icon-plus" />
					</span>
				</a>
			</div>
			<div className="pwa-bottom-nav__group pwa-bottom-nav__group--right">
				<a
					href="/account.html"
					className={["pwa-bottom-nav__btn", isAccount ? 'is-active' : ''].filter(Boolean).join(' ')}
					aria-current={isAccount ? 'page' : undefined}
					aria-label="Account"
                    onMouseDown={handleClickSound}
                    onTouchStart={handleClickSound as any}
				>
					<DollarSign size={24} aria-hidden="true" />
				</a>
				<div className="pwa-bottom-nav__value" aria-live="polite">{availableCents}</div>
			</div>
		</nav>
	)
}


