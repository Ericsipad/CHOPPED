import React from 'react'

type ButtonVariant = 'default' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
}

function getVariantClasses(variant: ButtonVariant): string {
	switch (variant) {
		case 'outline':
			return 'border border-white/30 bg-transparent text-white hover:bg-white hover:text-foreground'
		default:
			return 'bg-primary text-white hover:bg-primary/90'
	}
}

function getSizeClasses(size: ButtonSize): string {
	switch (size) {
		case 'sm':
			return 'px-3 py-2 text-sm'
		case 'lg':
			return 'px-6 py-4 text-lg'
		default:
			return 'px-4 py-3'
	}
}

export const Button: React.FC<ButtonProps> = ({
	variant = 'default',
	size = 'md',
	className = '',
	children,
	...rest
}) => {
	const base = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-60 disabled:pointer-events-none'
	const classes = `${base} ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`
	return (
		<button className={classes} {...rest}>
			{children}
		</button>
	)
}

export default Button


