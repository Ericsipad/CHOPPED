import { useEffect, useState } from 'react'
import { DollarSign, Heart, Plus, User } from 'lucide-react'
import { fetchAvailableGiftsAmountCents } from '../lib/gifts'
import { useAuth } from '../hooks/useAuth'

export default function BottomNav() {
\tconst pathname = typeof window !== 'undefined' ? window.location.pathname : ''
\tconst isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
\tconst isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
\tconst isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'

\tconst { isAuthenticated } = useAuth()
\tconst [availableCents, setAvailableCents] = useState<number>(0)

\tuseEffect(() => {
\t\tlet cancelled = false
\t\t;(async () => {
\t\t\ttry {
\t\t\t\tif (!isAuthenticated) {
\t\t\t\t\tif (!cancelled) setAvailableCents(0)
\t\t\t\t\treturn
\t\t\t\t}
\t\t\t\tconst cents = await fetchAvailableGiftsAmountCents()
\t\t\t\tif (!cancelled) setAvailableCents(typeof cents === 'number' ? cents : 0)
\t\t\t} catch {
\t\t\t\tif (!cancelled) setAvailableCents(0)
\t\t\t}
\t\t})()
\t\treturn () => { cancelled = true }
\t}, [isAuthenticated])

\treturn (
\t\t<nav className="pwa-bottom-nav" aria-label="Primary">
\t\t\t<div className="pwa-bottom-nav__group pwa-bottom-nav__group--left">
\t\t\t\t<a
\t\t\t\t\thref="/profile.html"
\t\t\t\t\tclassName={["pwa-bottom-nav__btn", isProfile ? 'is-active' : ''].filter(Boolean).join(' ')}
\t\t\t\t\taria-current={isProfile ? 'page' : undefined}
\t\t\t\t\taria-label="Profile"
\t\t\t\t>
\t\t\t\t\t<User size={24} aria-hidden />
\t\t\t\t</a>
\t\t\t\t<a
\t\t\t\t\thref="/chopping-board.html"
\t\t\t\t\tclassName={["pwa-bottom-nav__btn", isChoppingBoard ? 'is-active' : ''].filter(Boolean).join(' ')}
\t\t\t\t\taria-current={isChoppingBoard ? 'page' : undefined}
\t\t\t\t\taria-label="Chopping Board"
\t\t\t\t>
\t\t\t\t\t<span className="pwa-bottom-nav__icon-stack" aria-hidden>
\t\t\t\t\t\t<Heart size={24} />
\t\t\t\t\t\t<Plus size={14} className="pwa-bottom-nav__icon-plus" />
\t\t\t\t\t</span>
\t\t\t\t</a>
\t\t\t</div>
\t\t\t<div className="pwa-bottom-nav__group pwa-bottom-nav__group--right">
\t\t\t\t<a
\t\t\t\t\thref="/account.html"
\t\t\t\t\tclassName={["pwa-bottom-nav__btn", isAccount ? 'is-active' : ''].filter(Boolean).join(' ')}
\t\t\t\t\taria-current={isAccount ? 'page' : undefined}
\t\t\t\t\taria-label="Account"
\t\t\t\t>
\t\t\t\t\t<DollarSign size={24} aria-hidden />
\t\t\t\t</a>
\t\t\t\t<div className="pwa-bottom-nav__value" aria-live="polite">{availableCents}</div>
\t\t\t</div>
\t\t</nav>
\t)
}


