import React from 'react'

export type SignInButtonProps = {
	onClick?: () => void
	className?: string
	children?: React.ReactNode
}

export default function SignInButton(props: SignInButtonProps) {
	const { onClick, className, children } = props
	return (
		<button type="button" onClick={onClick} className={className}>
			{children ?? 'Sign in'}
		</button>
	)
}


