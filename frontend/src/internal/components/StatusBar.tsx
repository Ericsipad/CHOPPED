import '../styles/internal.css'
import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'

type StatusBarProps = {
	giftsCount?: number
	matchedMeCount?: number
	onGiftsClick?: () => void
    variant?: 'default' | 'header'
    onCenterClick?: () => void
}

export default function StatusBar(props: StatusBarProps) {
    const { giftsCount = 0, matchedMeCount = 0, onGiftsClick, variant = 'default', onCenterClick } = props

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        const apply = () => setIsMobile(mq.matches)
        apply()
        mq.addEventListener?.('change', apply)
        return () => mq.removeEventListener?.('change', apply)
    }, [])

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

				{/* Center - icon + percent + label */}
				<button type="button" className="status-bar__center" onClick={onCenterClick} aria-label="AI personality profile">
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
	)
}


