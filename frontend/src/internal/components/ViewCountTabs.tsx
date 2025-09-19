import { useEffect, useState } from 'react'
import '../styles/internal.css'

type Props = {
    value: 10 | 20 | 50
    onChange: (v: 10 | 20 | 50) => void
}

export default function ViewCountTabs(props: Props) {
    const { value, onChange } = props

    const [isMobile, setIsMobile] = useState(false)
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        try {
            const stored = localStorage.getItem('internal_background_mode')
            return stored === 'dark' ? 'dark' : 'light'
        } catch { return 'light' }
    })
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        const update = () => setIsMobile(mq.matches)
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

    if (!isMobile) return null

    return (
        <div
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 60,
                zIndex: 1000,
                padding: '8px 12px calc(env(safe-area-inset-bottom) + 8px)',
                display: 'flex',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(6px) saturate(120%)',
                WebkitBackdropFilter: 'blur(6px) saturate(120%)',
                borderTop: '1px solid rgba(255,255,255,0.08)'
            }}
        >
            <div className="profile-tabs__nav" style={{ margin: 0 }}>
                <button
                    className={["profile-tabs__btn", value === 10 ? 'is-active' : ''].filter(Boolean).join(' ')}
                    onClick={() => onChange(10)}
                    aria-pressed={value === 10}
                >
                    10
                </button>
                <button
                    className={["profile-tabs__btn", value === 20 ? 'is-active' : ''].filter(Boolean).join(' ')}
                    onClick={() => onChange(20)}
                    aria-pressed={value === 20}
                >
                    20
                </button>
                <button
                    className={["profile-tabs__btn", value === 50 ? 'is-active' : ''].filter(Boolean).join(' ')}
                    onClick={() => onChange(50)}
                    aria-pressed={value === 50}
                >
                    50
                </button>
                <button
                    className="profile-tabs__btn"
                    onClick={toggleMode}
                    aria-pressed={mode === 'light'}
                    aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    title={mode === 'light' ? 'Light' : 'Dark'}
                >
                    {mode === 'light' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10-9h-2v3h2V4zm7.45 2.46l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42zM17 11a5 5 0 11-10 0 5 5 0 0110 0zm3 2h3v-2h-3v2zm-7 7h-2v-3h2v3zm5.66-2.17l1.79 1.8 1.41-1.42-1.8-1.79-1.4 1.41zM4.24 17.66l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42z"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M21.64 13A9 9 0 1111 2.36 7 7 0 0021.64 13z"/>
                        </svg>
                    )}
                    {mode === 'light' ? 'Light' : 'Dark'}
                </button>
            </div>
        </div>
    )
}


