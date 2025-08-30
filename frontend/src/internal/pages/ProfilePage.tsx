import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileImageCard from '../components/ProfileImageCard'
import PublicProfilePanel from '../components/PublicProfilePanel'
import '../styles/internal.css'
import { useState } from 'react'
 
 
export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState<'pics' | 'bio' | 'settings'>('pics')

	return (
		<PageFrame>
			<div>
				<Container>
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div
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
							<div style={{ width: 'clamp(30vw, calc(-118vw + 2127px), 90vw)', maxWidth: 1100 }}>
								<div className="profile-tabs__nav">
									<button
										className={["profile-tabs__btn", activeTab === 'pics' ? 'is-active' : ''].filter(Boolean).join(' ')}
										onClick={() => setActiveTab('pics')}
										aria-pressed={activeTab === 'pics'}
									>
										Profile pics
									</button>
									<button
										className={["profile-tabs__btn", activeTab === 'bio' ? 'is-active' : ''].filter(Boolean).join(' ')}
										onClick={() => setActiveTab('bio')}
										aria-pressed={activeTab === 'bio'}
									>
										Public BIO
									</button>
									<button
										className={["profile-tabs__btn", activeTab === 'settings' ? 'is-active' : ''].filter(Boolean).join(' ')}
										onClick={() => setActiveTab('settings')}
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
										<div className="profile-public-panel" style={{ minHeight: 200 }} />
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


