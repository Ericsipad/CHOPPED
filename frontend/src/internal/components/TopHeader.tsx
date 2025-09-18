import type { ReactNode } from 'react'
import Container from './Container'
import UserIndicator from './UserIndicator'
import '../styles/internal.css'

type TopHeaderProps = { children?: ReactNode }

export default function TopHeader(props: TopHeaderProps) {
    const { children } = props
    return (
        <header className="internal-top-header">
            <Container>
                <div className="internal-top-header-inner">
                    <div className="internal-user-indicator">
                        <UserIndicator />
                    </div>
                    {children ? (
                        <div style={{ marginLeft: 'auto' }}>
                            {children}
                        </div>
                    ) : null}
                </div>
            </Container>
        </header>
    )
}
