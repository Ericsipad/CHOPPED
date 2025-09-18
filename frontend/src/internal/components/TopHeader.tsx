import type { ReactNode } from 'react'
import { useState } from 'react'
import Container from './Container'
import UserIndicator from './UserIndicator'
import PointsBadge from './PointsBadge'
import UserMenuList from './UserMenuList'
import { useAuth } from '../hooks/useAuth'
import '../styles/internal.css'

type TopHeaderProps = { children?: ReactNode }

export default function TopHeader(props: TopHeaderProps) {
    const { children } = props
    const { isAuthenticated } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
    const isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
    const isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'
    return (
        <header className="internal-top-header">
            <Container>
                <div className="internal-top-header-inner">
                    <div className="mobile-menu-trigger">
                        <button
                            type="button"
                            aria-label="Open menu"
                            className="mobile-menu-trigger__btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <span className="mobile-menu-trigger__icon" aria-hidden="true">
                                <span className="mobile-menu-trigger__bar" />
                                <span className="mobile-menu-trigger__bar" />
                                <span className="mobile-menu-trigger__bar" />
                            </span>
                        </button>
                    </div>
                    <nav className="internal-nav" aria-label="Primary">
                        <a
                            href="/profile.html"
                            className={["internal-nav-link", isProfile ? 'is-active' : ''].filter(Boolean).join(' ')}
                            aria-current={isProfile ? 'page' : undefined}
                        >
                            Profile
                        </a>
                        <a
                            href="/account.html"
                            className={["internal-nav-link", isAccount ? 'is-active' : ''].filter(Boolean).join(' ')}
                            aria-current={isAccount ? 'page' : undefined}
                        >
                            Account
                        </a>
                        <a
                            href="/chopping-board.html"
                            className={["internal-nav-link", isChoppingBoard ? 'is-active' : ''].filter(Boolean).join(' ')}
                            aria-current={isChoppingBoard ? 'page' : undefined}
                        >
                            Chopping board
                        </a>
                    </nav>
                    {children ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            {children}
                        </div>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}
                    <div className="internal-user-indicator">
                        <PointsBadge />
                        <UserIndicator />
                    </div>
                </div>
            </Container>
            {isMobileMenuOpen && (
                <div className="mobile-menu" role="dialog" aria-modal="true">
                    <div className="mobile-menu__backdrop" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="mobile-menu__panel">
                        <button
                            type="button"
                            aria-label="Close menu"
                            className="mobile-menu__close"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            ×
                        </button>
                        <div className="mobile-menu__content">
                            <UserMenuList
                                isAuthenticated={!!isAuthenticated}
                                onClose={() => setIsMobileMenuOpen(false)}
                                variant="mobile"
                            />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
