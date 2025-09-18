import { useEffect, useRef, useState } from 'react'
import Container from './Container'
import UserIndicator from './UserIndicator'
import UserMenuList from './UserMenuList'
import { useAuth } from '../hooks/useAuth'
import '../styles/internal.css'

export default function TopHeader() {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
    const isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
    const isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'
    const { isAuthenticated } = useAuth()

    const [menuOpen, setMenuOpen] = useState(false)
    const firstFocusableRef = useRef<HTMLButtonElement | null>(null)
    const hamburgerRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [menuOpen])

    useEffect(() => {
        if (menuOpen) {
            const original = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            setTimeout(() => { firstFocusableRef.current?.focus() }, 0)
            return () => { document.body.style.overflow = original }
        } else {
            hamburgerRef.current?.focus()
        }
    }, [menuOpen])

    return (
        <header className="internal-top-header">
            <Container>
                <div className="internal-top-header-inner">
                    <button
                        ref={hamburgerRef}
                        className="internal-hamburger-btn"
                        aria-label="Open menu"
                        aria-controls="internal-mobile-menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(true)}
                    >
                        <span className="internal-hamburger-icon" aria-hidden="true"></span>
                    </button>
                    <nav className="internal-nav" aria-label="Primary">
                        <a
                            href="/account.html"
                            className={`internal-nav-link${isAccount ? ' is-active' : ''}`}
                            aria-current={isAccount ? 'page' : undefined}
                        >
                            Account
                        </a>
                        <a
                            href="/chopping-board.html"
                            className={`internal-nav-link${isChoppingBoard ? ' is-active' : ''}`}
                            aria-current={isChoppingBoard ? 'page' : undefined}
                        >
                            Chopping Board
                        </a>
                        <a
                            href="/profile.html"
                            className={`internal-nav-link${isProfile ? ' is-active' : ''}`}
                            aria-current={isProfile ? 'page' : undefined}
                        >
                            Profile
                        </a>
                    </nav>
                    <div className="internal-user-indicator">
                        <UserIndicator />
                    </div>
                </div>
            </Container>

            {/* Mobile menu overlay */}
            <div
                className={`mobile-menu-backdrop${menuOpen ? ' is-visible' : ''}`}
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
            />
            <div
                id="internal-mobile-menu"
                className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
            >
                <div className="mobile-menu__header">
                    <button
                        ref={firstFocusableRef}
                        className="mobile-menu__close"
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <nav className="mobile-menu__nav" aria-label="Primary">
                    <a
                        href="/account.html"
                        className={`mobile-menu__link${isAccount ? ' is-active' : ''}`}
                        aria-current={isAccount ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                    >
                        Account
                    </a>
                    <a
                        href="/chopping-board.html"
                        className={`mobile-menu__link${isChoppingBoard ? ' is-active' : ''}`}
                        aria-current={isChoppingBoard ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                    >
                        Chopping Board
                    </a>
                    <a
                        href="/profile.html"
                        className={`mobile-menu__link${isProfile ? ' is-active' : ''}`}
                        aria-current={isProfile ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                    >
                        Profile
                    </a>
                </nav>
                <div className="mobile-menu__divider"></div>
                <div className="mobile-menu__user">
                    <UserMenuList isAuthenticated={isAuthenticated} onClose={() => setMenuOpen(false)} variant="mobile" />
                </div>
            </div>
        </header>
    )
}
