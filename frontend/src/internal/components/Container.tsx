import type { ReactNode } from 'react'
import '../styles/internal.css'

type ContainerProps = {
	children?: ReactNode
	className?: string
}

export default function Container(props: ContainerProps) {
	const { children, className } = props
	const classes = ['internal-container', className].filter(Boolean).join(' ')
	return <div className={classes}>{children}</div>
}
