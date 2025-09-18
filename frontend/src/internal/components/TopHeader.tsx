import type { ReactNode } from 'react'
import Container from './Container'
import UserIndicator from './UserIndicator'
import PointsBadge from './PointsBadge'
import '../styles/internal.css'

type TopHeaderProps = { children?: ReactNode }

export default function TopHeader(props: TopHeaderProps) {
    const { children } = props
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAccount = pathname.endsWith('/account.html') || pathname === '/account.html'
    const isChoppingBoard = pathname.endsWith('/chopping-board.html') || pathname === '/chopping-board.html'
    const isProfile = pathname.endsWith('/profile.html') || pathname === '/profile.html'
    return (
        <header className="internal-top-header">
            <Container>
                <div className="internal-top-header-inner">
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
        </header>
    )
}
