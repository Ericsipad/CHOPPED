import type { ReactNode } from 'react'
import TopHeader from './TopHeader'
import BottomNav from './BottomNav'
import '../styles/internal.css'

type PageFrameProps = {
	children?: ReactNode
}

export default function PageFrame(props: PageFrameProps) {
	const { children } = props
	return (
		<div>
			<TopHeader />
			<div className="with-bottom-nav">
				{children}
			</div>
			<BottomNav />
		</div>
	)
}
