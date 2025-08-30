import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileGrid from '../components/ProfileGrid'
import ValidationModal from '../components/ValidationModal'
import { fetchReadiness } from '../components/readiness'
import { useEffect, useState } from 'react'
import '../styles/internal.css'

export default function ChoppingBoardPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [missingFields, setMissingFields] = useState<string[]>([])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const { ready, missing } = await fetchReadiness()
                if (!cancelled && !ready) {
                    setMissingFields(missing)
                    setModalOpen(true)
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
	// Fixed filler images for wobble cards (2x5 grid)
	const images = new Array(10).fill(null).map((_, i) => ({
		url: `https://picsum.photos/seed/chopped-${i}/600/600`,
		alt: `profile ${i + 1}`,
	}))
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
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								zIndex: 9,
							}}
						>
							<ProfileGrid images={images} />
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


