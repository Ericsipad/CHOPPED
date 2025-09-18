import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileImageCard from '../components/ProfileImageCard'
import PublicProfilePanel from '../components/PublicProfilePanel'
import PrivateSettingsPanel from '../components/PrivateSettingsPanel'
import '../styles/internal.css'
import { useMemo, useRef, useState } from 'react'
 
 
export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState<'pics' | 'bio' | 'settings'>('pics')

	const audioCtxRef = useRef<AudioContext | null>(null)
	const clickSound = useMemo(() => ({
		play: () => {
			try {
				if (!audioCtxRef.current) {
					const Ctor: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
					if (!Ctor) return
					audioCtxRef.current = new Ctor()
				}
				const ctx = audioCtxRef.current
				if (!ctx) return
				const now = ctx.currentTime
				const osc = ctx.createOscillator()
				const gain = ctx.createGain()
				osc.type = 'square'
				osc.frequency.setValueAtTime(850, now)
				gain.gain.setValueAtTime(0.45, now)
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
				osc.connect(gain)
				gain.connect(ctx.destination)
				osc.start(now)
				osc.stop(now + 0.09)
			} catch { /* noop */ }
		}
	}), [])

	function handleTabClick(next: 'pics' | 'bio' | 'settings') {
		clickSound.play()
		setActiveTab(next)
	}

	return (
		<PageFrame>
			<div>
				<Container className="profile-page-root with-bottom-nav">
					<div style={{ position: 'relative' }}>
						<HeroImage />
					<div className="profile-page__overlay"
							style={{
								position: 'absolute',
								top: '15%',
								left: 0,
								right: 0,
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'flex-start',
								zIndex: 9,
							}}
						>
							<div className="profile-page__content" style={{ width: 'clamp(30vw, calc(-118vw + 2127px), 90vw)', maxWidth: 1100 }}>
								<div className="profile-tabs__nav">
							<button
										className={["profile-tabs__btn", activeTab === 'pics' ? 'is-active' : ''].filter(Boolean).join(' ')}
								onClick={() => handleTabClick('pics')}
										aria-pressed={activeTab === 'pics'}
									>
										Profile pics
									</button>
									<button
										className={["profile-tabs__btn", activeTab === 'bio' ? 'is-active' : ''].filter(Boolean).join(' ')}
								onClick={() => handleTabClick('bio')}
										aria-pressed={activeTab === 'bio'}
									>
										Public BIO
									</button>
									<button
										className={["profile-tabs__btn", activeTab === 'settings' ? 'is-active' : ''].filter(Boolean).join(' ')}
								onClick={() => handleTabClick('settings')}
										aria-pressed={activeTab === 'settings'}
									>
										Settings
									</button>
								</div>
								<div className="profile-tabs__content">
									<div className={activeTab === 'pics' ? '' : 'is-hidden'}>
										<ProfileImageCard />
									</div>
									<div className={activeTab === 'bio' ? '' : 'is-hidden'}>
										<PublicProfilePanel />
									</div>
									<div className={activeTab === 'settings' ? '' : 'is-hidden'}>
										<PrivateSettingsPanel />
									</div>
								</div>
							</div>
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


