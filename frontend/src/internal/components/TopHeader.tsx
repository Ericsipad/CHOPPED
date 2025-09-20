import type { ReactNode } from 'react'
import Container from './Container'
import UserIndicator from './UserIndicator'
import PointsBadge from './PointsBadge'
import '../styles/internal.css'

type TopHeaderProps = { children?: ReactNode }

export default function TopHeader(props: TopHeaderProps) {
    const { children } = props
    return (
        <header className="internal-top-header">
            <Container>
                <div className="internal-top-header-inner">
                    <div className="internal-header-left-spacer" />
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
