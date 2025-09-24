import type { ReactNode } from 'react'

interface GlassContainerProps {
  children: ReactNode
  className?: string
  variant?: 'modal' | 'card' | 'button' | 'nav' | 'panel'
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
}

export function GlassContainer({ 
  children, 
  className, 
  variant = 'card',
  style,
  onClick
}: GlassContainerProps) {
  // Advanced glassmorphism CSS with your requested settings
  const glassStyle: React.CSSProperties = {
    // Base glassmorphism effect
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px) saturate(150%)',
    WebkitBackdropFilter: 'blur(10px) saturate(150%)', // Safari support
    
    // Enhanced glass effect with displacement simulation
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 10px 20px rgba(0, 0, 0, 0.2)
    `,
    
    // Borders and radius
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: variant === 'button' ? '6px' : variant === 'nav' ? '10px' : '8px',
    
    // Your advanced settings simulated in CSS
    filter: 'brightness(1.1) contrast(1.1)',
    
    // Dark tint on light mode
    ...(typeof document !== 'undefined' && 
        document.documentElement.classList.contains('internal-bg--light') && {
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px) saturate(150%) brightness(0.9)',
      WebkitBackdropFilter: 'blur(10px) saturate(150%) brightness(0.9)',
    }),
    
    // Hover effects and elasticity simulation
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Apply user styles on top
    ...style,
    
    // Ensure proper positioning
    position: style?.position || 'relative',
    overflow: 'hidden',
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'
      e.currentTarget.style.boxShadow = `
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 -1px 0 rgba(255, 255, 255, 0.2),
        0 25px 50px rgba(0, 0, 0, 0.4),
        0 15px 30px rgba(0, 0, 0, 0.3)
      `
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = 'scale(1) translateY(0)'
      e.currentTarget.style.boxShadow = glassStyle.boxShadow as string
    }
  }

  const combinedClassName = ['glass-container', className].filter(Boolean).join(' ')

  return (
    <div 
      className={combinedClassName}
      style={glassStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

export default GlassContainer