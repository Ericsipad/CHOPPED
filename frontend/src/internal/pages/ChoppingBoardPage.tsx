import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileGrid from '../components/ProfileGrid'
import ValidationModal from '../components/ValidationModal'
import { fetchReadiness } from '../components/readiness'
import { useEffect, useState } from 'react'
import '../styles/internal.css'
import { fetchUserMatchArray, type MatchSlot } from '../../lib/matches'

export default function ChoppingBoardPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [missingFields, setMissingFields] = useState<string[]>([])
    const [viewCount, setViewCount] = useState<10 | 25 | 50>(10)
    const [slots, setSlots] = useState<Array<MatchSlot | null>>([])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const { ready, missing } = await fetchReadiness()
                if (!cancelled && !ready) {
                    setMissingFields(missing)
                    setModalOpen(true)
                }
                if (!cancelled) {
                    const s = await fetchUserMatchArray()
                    if (!cancelled) setSlots(s)
                }
            } catch {
                // On error, conservatively block and redirect path via modal
                if (!cancelled) {
                    setMissingFields(['profile information'])
                    setModalOpen(true)
                }
            }
        })()
        return () => { cancelled = true }
    }, [])
	// Build images array from slots with status for glow; fallback to placeholder when empty
	const placeholderUrl = '/profile-placeholder.svg'
	const images = new Array(50).fill(null).map((_, i) => {
		const slot = slots[i]
		return {
			url: slot?.mainImageUrl || placeholderUrl,
			alt: `profile ${i + 1}`,
			status: slot?.matchStatus ?? null,
		}
	})
	return (
		<PageFrame>
			<div>
				<Container>
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div
							style={{
								position: 'absolute',
								top: 48, // keep clear of the 48px header so nav remains clickable
								left: 0,
								right: 0,
								bottom: 0,
								zIndex: 9,
							}}
						>
							<div style={{ position: 'relative', width: '100%', height: '100%' }}>
								{/* Glass toggle buttons - top-left */}
								<div style={{ position: 'absolute', top: 8, left: 12, zIndex: 10 }}>
									<div className="profile-tabs__nav">
										<button
											className={["profile-tabs__btn", viewCount === 10 ? 'is-active' : ''].filter(Boolean).join(' ')}
											onClick={() => setViewCount(10)}
											aria-pressed={viewCount === 10}
										>
											10
										</button>
										<button
											className={["profile-tabs__btn", viewCount === 25 ? 'is-active' : ''].filter(Boolean).join(' ')}
											onClick={() => setViewCount(25)}
											aria-pressed={viewCount === 25}
										>
											25
										</button>
										<button
											className={["profile-tabs__btn", viewCount === 50 ? 'is-active' : ''].filter(Boolean).join(' ')}
											onClick={() => setViewCount(50)}
											aria-pressed={viewCount === 50}
										>
											50
										</button>
									</div>
								</div>

								{/* Centered grid */}
								<div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<ProfileGrid images={images} viewCount={viewCount} />
								</div>
							</div>
						</div>
					</div>
				</Container>
				<ValidationModal
					isOpen={modalOpen}
					title="Complete your profile"
					onClose={() => { window.location.replace('/profile.html') }}
				>
					<div style={{ marginBottom: 8 }}>Please complete the following before browsing:</div>
					<ul style={{ margin: 0, paddingLeft: 18 }}>
						{missingFields.map((f) => (<li key={f}>{f}</li>))}
					</ul>
				</ValidationModal>
			</div>
		</PageFrame>
	)
}


