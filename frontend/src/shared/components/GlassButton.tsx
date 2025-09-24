import LiquidGlass from 'liquid-glass-react'
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
  // Advanced settings for buttons (slightly different from containers)
  const glassProps = {
    displacementScale: 100,
    blurAmount: 0.5,
    saturation: 150,
    elasticity: 0.5,
    cornerRadius: 8,
    mode: 'standard' as const
  }
  
  // Button-specific styling
  const combinedStyle: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ...style,
    // Dark tint on light mode as requested
    ...(document.documentElement.classList.contains('internal-bg--light') && {
      background: 'rgba(0, 0, 0, 0.1)',
    })
  }

  return (
    <LiquidGlass 
      {...glassProps} 
      className={className}
      style={combinedStyle}
    >
      <button 
        {...buttonProps}
        style={{ 
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          width: '100%',
          height: '100%',
          cursor: 'inherit',
          padding: 0
        }}
      >
        {children}
      </button>
    </LiquidGlass>
  )
}

export default GlassButton
