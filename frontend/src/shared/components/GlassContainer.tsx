import LiquidGlass from 'liquid-glass-react'
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
  // Advanced settings as requested - adjust corner radius based on variant
  const cornerRadius = variant === 'button' ? 6 : variant === 'nav' ? 10 : 8
  
  const glassProps = {
    displacementScale: 100,
    blurAmount: 0.5,
    saturation: 150,
    elasticity: 0.5, // Interpreted 50 as 0.5 (normal range)
    cornerRadius,
    mode: 'standard' as const
  }
  
  // Combine any existing styles with glass container
  const combinedStyle: React.CSSProperties = {
    ...style,
    // Dark tint on light mode as requested
    ...(document.documentElement.classList.contains('internal-bg--light') && {
      background: 'rgba(0, 0, 0, 0.1)',
    })
  }

  return (
    <div onClick={onClick} style={{ width: '100%', height: '100%' }}>
      <LiquidGlass 
        {...glassProps} 
        className={className}
        style={combinedStyle}
      >
        {children}
      </LiquidGlass>
    </div>
  )
}

export default GlassContainer
