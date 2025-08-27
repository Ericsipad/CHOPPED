import type { ReactNode } from 'react'
import TopHeader from './TopHeader'
import '../styles/internal.css'

type PageFrameProps = {
	children?: ReactNode
}

export default function PageFrame(props: PageFrameProps) {
	const { children } = props
	return (
		<div>
			<TopHeader />
			{children}
		</div>
	)
}
