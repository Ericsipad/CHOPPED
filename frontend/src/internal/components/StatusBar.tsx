import '../styles/internal.css'
import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import ValidationModal from './ValidationModal'

type StatusBarProps = {
	giftsCount?: number
	matchedMeCount?: number
	onGiftsClick?: () => void
    variant?: 'default' | 'header'
}

export default function StatusBar(props: StatusBarProps) {
    const { giftsCount = 0, matchedMeCount = 0, onGiftsClick, variant = 'default' } = props

    const [aiModalOpen, setAiModalOpen] = useState(false)
    const [aiEnabled, setAiEnabled] = useState<boolean>(true)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        const apply = () => setIsMobile(mq.matches)
        apply()
        mq.addEventListener?.('change', apply)
        return () => mq.removeEventListener?.('change', apply)
    }, [])

    // Load/save toggle preference (local only)
    useEffect(() => {
        try {
            const v = localStorage.getItem('ai_personality_enabled')
            if (v === '0') setAiEnabled(false)
            if (v === '1') setAiEnabled(true)
        } catch { /* noop */ }
    }, [])
    const handleToggle = () => {
        setAiEnabled(prev => {
            const next = !prev
            try { localStorage.setItem('ai_personality_enabled', next ? '1' : '0') } catch { /* noop */ }
            return next
        })
    }

	return (
		<div className={["status-bar", variant === 'header' ? 'status-bar--header' : ''].filter(Boolean).join(' ')} role="region" aria-label="Status bar">
			<div className="status-bar__inner">
				{/* Legend - left */}
				<div className="status-bar__legend" aria-label="Legend">
					<div className="status-bar__legend-item" aria-label="Matched">
						<div className="status-bar__dot status-bar__dot--green" aria-hidden="true" />
						<div className="status-bar__legend-text">Matched</div>
					</div>
					<div className="status-bar__legend-item" aria-label="Pending">
						<div className="status-bar__dot status-bar__dot--yellow" aria-hidden="true" />
						<div className="status-bar__legend-text">Pending</div>
					</div>
					<div className="status-bar__legend-item" aria-label="Chopped">
						<div className="status-bar__dot status-bar__dot--red" aria-hidden="true" />
						<div className="status-bar__legend-text">Chopped</div>
					</div>
				</div>

				{/* Center - AI profile indicator */}
				<button type="button" className="status-bar__center" onClick={() => setAiModalOpen(true)} aria-label="AI personality profile">
					<span className="status-bar__center-top">
						<Brain size={20} aria-hidden="true" />
						<span className="status-bar__center-percent">0%</span>
					</span>
					<span className="status-bar__center-label">
						<span className="status-bar__center-label--mobile" aria-hidden={!isMobile}>AI profile</span>
						<span className="status-bar__center-label--desktop" aria-hidden={isMobile}>AI personality profile</span>
					</span>
				</button>

				{/* Counters - right */}
				<div className="status-bar__counters">
					<button className="status-bar__counter" aria-label={`Gifts ${giftsCount}`} tabIndex={0} type="button" onClick={onGiftsClick} style={{ background: 'transparent', border: 'none', padding: 0, cursor: onGiftsClick ? 'pointer' : 'default' }}>
						<div className="status-bar__icon" aria-hidden="true">
							<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M20 12H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8Z" fill="#3b82f6"/>
								<path d="M2 8h20v4H2z" fill="#60a5fa"/>
								<path d="M12 4v18" stroke="currentColor" strokeWidth="1.5"/>
								<path d="M7.5 6c0-1.657 1.57-3 3.5-3 1.2 0 2.286.48 3 .98.714-.5 1.8-.98 3-.98 1.93 0 3.5 1.343 3.5 3 0 1.105-.895 2-2 2h-9c-1.105 0-2-.895-2-2Z" fill="#ef4444"/>
							</svg>
						</div>
						<div className="status-bar__value" aria-live="polite">{giftsCount}</div>
						<div className="status-bar__tooltip status-bar__tooltip--below" role="tooltip">Someone has sent you a gift from $5 to $20, when you match with them you will be able to receive it directly to your email as a gift card</div>
					</button>

					<div className="status-bar__counter" aria-label={`Matched Me ${matchedMeCount}`} tabIndex={0}>
						<div className="status-bar__icon" aria-hidden="true">
							<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41 1.01 4.22 2.44C11.09 5.01 12.76 4 14.5 4 17.01 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ef4444"/>
							</svg>
						</div>
						<div className="status-bar__value" aria-live="polite">{matchedMeCount}</div>
						<div className="status-bar__tooltip" role="tooltip">Matched me</div>
					</div>
				</div>
		</div>

		<ValidationModal isOpen={aiModalOpen} title="AI Personality Matching" onClose={() => setAiModalOpen(false)}>
			<div style={{ padding: 12, lineHeight: 1.6 }}>
				Your matches improve over time as you have real conversations with other users. We privately analyze your conversations to produce a comprehensive profile across 500 character points to help find your perfect match. The more you chat openly and honestly the more intelligent the matching algorithm becomes. But don’t worry, your conversations are only read internally by a self-contained AI and no human viewers and never shared outside of the platform. Chat with anyone you can about a range of topics even if they may only be a friend, as it all helps us understand the real you. Have Fun!
				<div style={{ height: 12 }} />
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
					<div style={{ fontWeight: 700 }}>AI analysis</div>
					<button type="button" onClick={handleToggle} aria-pressed={aiEnabled} aria-label={aiEnabled ? 'Turn AI analysis off' : 'Turn AI analysis on'}
						style={{
							appearance: 'none',
							border: '1px solid rgba(255,255,255,0.2)',
							borderRadius: 9999,
							width: 54,
							height: 28,
							background: aiEnabled ? 'linear-gradient(90deg, rgba(34,197,94,0.9), rgba(34,197,94,0.7))' : 'rgba(255,255,255,0.12)',
							position: 'relative',
							cursor: 'pointer'
						}}>
						<span style={{
							display: 'block',
							position: 'absolute',
							top: 2,
							left: aiEnabled ? 28 : 2,
							width: 24,
							height: 24,
							borderRadius: '50%',
							background: '#ffffff',
							boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
							transition: 'left 160ms ease'
						}} />
					</button>
				</div>
			</div>
		</ValidationModal>
		</div>
	)
}


