import { useEffect, useState } from 'react'
import '../styles/internal.css'

type Props = {
    value: 10 | 20 | 50
    onChange: (v: 10 | 20 | 50) => void
}

export default function ViewCountTabs(props: Props) {
    const { value, onChange } = props

    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener?.('change', update)
        return () => mq.removeEventListener?.('change', update)
    }, [])

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
            </div>
        </div>
    )
}


