import { useEffect, useState } from 'react'
import '../styles/internal.css'

type Props = {
    value: 10 | 20 | 50
    onChange: (v: 10 | 20 | 50) => void
}

export default function ViewCountDesktop(props: Props) {
    const { value, onChange } = props

    const [isDesktop, setIsDesktop] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1025px)')
        const update = () => setIsDesktop(mq.matches)
        update()
        mq.addEventListener?.('change', update)
        return () => mq.removeEventListener?.('change', update)
    }, [])

    if (!isDesktop) return null

    return (
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
    )
}


