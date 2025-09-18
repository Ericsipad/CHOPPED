import type { ReactNode } from 'react'
import TopHeader from './TopHeader'
import BottomNav from './BottomNav'
import '../styles/internal.css'

type PageFrameProps = {
    children?: ReactNode
    headerContent?: ReactNode
}

export default function PageFrame(props: PageFrameProps) {
    const { children, headerContent } = props
    return (
        <div>
            <TopHeader>
                {headerContent}
            </TopHeader>
            <div className="with-bottom-nav">
                {children}
            </div>
            <BottomNav />
        </div>
    )
}
