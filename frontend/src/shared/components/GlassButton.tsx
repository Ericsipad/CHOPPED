import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'action' | 'nav'
  style?: React.CSSProperties
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'primary',
  style,
  ...buttonProps
}: GlassButtonProps) {
  // Advanced glassmorphism button styling
  const glassButtonStyle: React.CSSProperties = {
    // Base glassmorphism effect
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px) saturate(150%)',
    WebkitBackdropFilter: 'blur(10px) saturate(150%)',
    
    // Enhanced glass effect
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),
      0 10px 20px rgba(0, 0, 0, 0.2),
      0 5px 10px rgba(0, 0, 0, 0.15)
    `,
    
    // Button specific styles
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    
    // Typography
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    
    // Your advanced settings
    filter: 'brightness(1.1) contrast(1.1)',
    
    // Dark tint on light mode
    ...(typeof document !== 'undefined' && 
        document.documentElement.classList.contains('internal-bg--light') && {
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px) saturate(150%) brightness(0.9)',
      WebkitBackdropFilter: 'blur(10px) saturate(150%) brightness(0.9)',
      color: '#333',
    }),
    
    // Elasticity and transitions
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateZ(0)', // Hardware acceleration
    
    // Apply user styles
    ...style,
    
    // Ensure proper display
    position: 'relative',
    overflow: 'hidden',
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.05) translateY(-1px) translateZ(0)'
    e.currentTarget.style.boxShadow = `
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(255, 255, 255, 0.2),
      0 15px 30px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.2)
    `
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1) translateY(0) translateZ(0)'
    e.currentTarget.style.boxShadow = glassButtonStyle.boxShadow as string
    e.currentTarget.style.background = glassButtonStyle.background as string
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.98) translateY(1px) translateZ(0)'
    // Call original onClick if provided
    if (buttonProps.onMouseDown) {
      buttonProps.onMouseDown(e)
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.05) translateY(-1px) translateZ(0)'
    // Call original onMouseUp if provided
    if (buttonProps.onMouseUp) {
      buttonProps.onMouseUp(e)
    }
  }

  const combinedClassName = ['glass-button', className].filter(Boolean).join(' ')

  return (
    <button 
      {...buttonProps}
      className={combinedClassName}
      style={glassButtonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </button>
  )
}

export default GlassButton