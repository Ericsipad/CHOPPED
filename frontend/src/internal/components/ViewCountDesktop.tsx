import { useEffect, useState } from 'react'
import '../styles/internal.css'
import { GlassButton } from '../../shared/components/GlassButton'

type Props = {
    value: 10 | 20 | 50
    onChange: (v: 10 | 20 | 50) => void
}

export default function ViewCountDesktop(props: Props) {
    const { value, onChange } = props

    const [isDesktop, setIsDesktop] = useState(false)
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        try {
            const stored = localStorage.getItem('internal_background_mode')
            return stored === 'dark' ? 'dark' : 'light'
        } catch { return 'light' }
    })
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1025px)')
        const update = () => setIsDesktop(mq.matches)
        update()
        mq.addEventListener?.('change', update)
        return () => mq.removeEventListener?.('change', update)
    }, [])

    const toggleMode = () => {
        const next = mode === 'light' ? 'dark' : 'light'
        setMode(next)
        try {
            localStorage.setItem('internal_background_mode', next)
            const evt = new CustomEvent('internal-background-change', { detail: { mode: next } })
            window.dispatchEvent(evt)
        } catch { /* noop */ }
    }

    if (!isDesktop) return null

    return (
        <div className="profile-tabs__nav" style={{ margin: 0, alignItems: 'center', paddingTop: '6px', paddingBottom: '6px' }}>
            <GlassButton
                variant="nav"
                onClick={() => onChange(10)}
                aria-pressed={value === 10}
                style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    // Dark mode: white text, Light mode: dark text  
                    color: typeof document !== 'undefined' && document.documentElement.classList.contains('internal-bg--light') ? '#333333' : '#ffffff',
                    // Apply active state styling
                    ...(value === 10 && {
                        background: 'rgba(0,0,0,0.45)',
                        borderColor: 'rgba(255,255,255,0.2)'
                    })
                }}
            >
                10
            </GlassButton>
            <GlassButton
                variant="nav"
                onClick={() => onChange(20)}
                aria-pressed={value === 20}
                style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    // Dark mode: white text, Light mode: dark text
                    color: typeof document !== 'undefined' && document.documentElement.classList.contains('internal-bg--light') ? '#333333' : '#ffffff',
                    // Apply active state styling
                    ...(value === 20 && {
                        background: 'rgba(0,0,0,0.45)',
                        borderColor: 'rgba(255,255,255,0.2)'
                    })
                }}
            >
                20
            </GlassButton>
            <GlassButton
                variant="nav"
                onClick={() => onChange(50)}
                aria-pressed={value === 50}
                style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    // Dark mode: white text, Light mode: dark text
                    color: typeof document !== 'undefined' && document.documentElement.classList.contains('internal-bg--light') ? '#333333' : '#ffffff',
                    // Apply active state styling
                    ...(value === 50 && {
                        background: 'rgba(0,0,0,0.45)',
                        borderColor: 'rgba(255,255,255,0.2)'
                    })
                }}
            >
                50
            </GlassButton>
            <GlassButton
                variant="nav"
                onClick={toggleMode}
                aria-pressed={mode === 'light'}
                aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                title={mode === 'light' ? 'Light' : 'Dark'}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    // Dark mode: white text, Light mode: dark text
                    color: typeof document !== 'undefined' && document.documentElement.classList.contains('internal-bg--light') ? '#333333' : '#ffffff'
                }}
            >
                {mode === 'light' ? (
                    // Sun icon
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10-9h-2v3h2V4zm7.45 2.46l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42zM17 11a5 5 0 11-10 0 5 5 0 0110 0zm3 2h3v-2h-3v2zm-7 7h-2v-3h2v3zm5.66-2.17l1.79 1.8 1.41-1.42-1.8-1.79-1.4 1.41zM4.24 17.66l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42z"/>
                    </svg>
                ) : (
                    // Moon icon
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M21.64 13A9 9 0 1111 2.36 7 7 0 0021.64 13z"/>
                    </svg>
                )}
                {mode === 'light' ? 'Light' : 'Dark'}
            </GlassButton>
        </div>
    )
}


