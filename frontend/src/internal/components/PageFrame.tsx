import type { ReactNode } from 'react'
import TopHeader from './TopHeader'
import BottomNav from './BottomNav'
import SidebarNav from './SidebarNav'
import '../styles/internal.css'
import '../styles/sidebar.css'

type PageFrameProps = {
    children?: ReactNode
    headerContent?: ReactNode
    headerLeftContent?: ReactNode
}

export default function PageFrame(props: PageFrameProps) {
    const { children, headerContent, headerLeftContent } = props
    return (
        <div className="internal-app-shell">
            <SidebarNav />
            <div className="internal-app-content">
                <TopHeader leftContent={headerLeftContent}>
                    {headerContent}
                </TopHeader>
                <div className="with-bottom-nav">
                    {children}
                </div>
                <BottomNav />
            </div>
        </div>
    )
}
