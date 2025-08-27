import React from 'react'

export type SignUpButtonProps = {
	onClick?: () => void
	className?: string
	children?: React.ReactNode
}

export default function SignUpButton(props: SignUpButtonProps) {
	const { onClick, className, children } = props
	return (
		<button type="button" onClick={onClick} className={className}>
			{children ?? 'Sign up'}
		</button>
	)
}


