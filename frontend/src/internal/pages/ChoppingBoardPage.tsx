import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileGrid from '../components/ProfileGrid'
import ValidationModal from '../components/ValidationModal'
import { fetchReadiness } from '../components/readiness'
import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/internal.css'
import { fetchUserMatchArray, type MatchSlot } from '../../lib/matches'
import MatchProfileModal from '../components/MatchProfileModal'
import { getBackendApi } from '../../lib/config'
import BrowseModal from '../components/BrowseModal'
import ChatModal from '../components/ChatModal'

export default function ChoppingBoardPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [missingFields, setMissingFields] = useState<string[]>([])
    const [viewCount, setViewCount] = useState<10 | 25 | 50>(10)
    const [slots, setSlots] = useState<Array<MatchSlot | null>>([])
    const [subscription, setSubscription] = useState<number>(0)
    const [searchModalOpen, setSearchModalOpen] = useState(false)
    const [searchMessageIndex, setSearchMessageIndex] = useState(0)
    const searchIntervalRef = useRef<number | null>(null)
    const searchInFlightRef = useRef(false)
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [browseOpen, setBrowseOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [chatDisplayName, setChatDisplayName] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const { ready, missing } = await fetchReadiness()
                if (!cancelled && !ready) {
                    setMissingFields(missing)
                    setModalOpen(true)
                }
                // Fetch subscription after readiness
                if (!cancelled) {
                    try {
                        const res = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
                        if (res.ok) {
                            const data = await res.json().catch(() => null) as { subscription?: number }
                            const sub = typeof data?.subscription === 'number' ? data.subscription : 3
                            if (!cancelled) setSubscription(sub)
                        } else {
                            if (!cancelled) setSubscription(3)
                        }
                    } catch {
                        if (!cancelled) setSubscription(3)
                    }
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
			hasProfile: slot !== null,
		}
	})
	const activeSlotsCount = Math.min(50, Math.max(0, subscription || 0))

	const funnyLines = useMemo(() => ([
		'Searching for your perfect match…',
		'Narrowing preferences…',
		"Maybe at least with a job… no promises.",
		'Calibrating cupid algorithms…',
	]), [])

	async function triggerMatchSearchFlow(doTrigger: boolean = true) {
		if (searchInFlightRef.current) return
		searchInFlightRef.current = true
		setSearchModalOpen(true)
		setSearchMessageIndex(0)
		// Rotate messages every ~3s, play a short cycle regardless of API timing
		const interval = window.setInterval(() => {
			setSearchMessageIndex((i) => (i + 1) % funnyLines.length)
		}, 3000)
		searchIntervalRef.current = interval as unknown as number
		try {
			// Optionally fire and forget the trigger; we don't block the modal on it
			if (doTrigger) {
				await fetch(getBackendApi('/api/user/matching/trigger'), {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({})
				}).catch(() => null)
			}
		} finally {
			// Ensure modal stays visible for at least ~10-12s
			setTimeout(() => {
				if (searchIntervalRef.current !== null) {
					window.clearInterval(searchIntervalRef.current)
					searchIntervalRef.current = null
				}
				setSearchModalOpen(false)
				searchInFlightRef.current = false
			}, 10000)
		}
	}

	async function getPendingCount(): Promise<number> {
		try {
			let url = '/api/user/pending'
			try {
				const raw = localStorage.getItem('chopped.mongoUserId')
				if (raw) {
					const parsed = JSON.parse(raw) as { id?: string; ts?: number }
					if (parsed && typeof parsed.id === 'string' && parsed.id) {
						url = `/api/user/pending?userId=${encodeURIComponent(parsed.id)}`
					}
				}
			} catch { /* ignore */ }
			const res = await fetch(getBackendApi(url), { credentials: 'include' })
			if (!res.ok) return 0
			const data = await res.json().catch(() => null) as { items?: Array<{ userId: string; imageUrl: string }> }
			return Array.isArray(data?.items) ? data!.items!.length : 0
		} catch { return 0 }
	}

	async function runBrowseFlow() {
		triggerMatchSearchFlow(false)
		setBrowseOpen(true)
		try {
			const count = await getPendingCount()
			if (count < 200) {
				fetch(getBackendApi('/api/user/matching/trigger'), {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({})
				}).catch(() => null)
			}
		} catch { /* ignore */ }
	}

	// Fetch display name for chat header when chat opens
	useEffect(() => {
		let cancelled = false
		async function run() {
			if (!chatOpen || !selectedUserId) {
				setChatDisplayName(null)
				return
			}
			try {
				const res = await fetch(getBackendApi(`/api/profile-matching/public?userId=${encodeURIComponent(selectedUserId)}`), { credentials: 'include' })
				if (!cancelled && res.ok) {
					const data = await res.json().catch(() => null) as { displayName?: string | null } | null
					setChatDisplayName(data?.displayName ?? null)
				} else if (!cancelled) {
					setChatDisplayName(null)
				}
			} catch {
				if (!cancelled) setChatDisplayName(null)
			}
		}
		run()
		return () => { cancelled = true }
	}, [chatOpen, selectedUserId])

	const handleCardClick = (index: number) => {
		const isActive = index < activeSlotsCount
		const hasProfile = images[index]?.hasProfile
		if (!isActive) return
		// Whole active empty card triggers the gate
		if (!hasProfile) {
			runBrowseFlow()
		} else {
			const slot = slots[index]
			if (slot && typeof slot.matchedUserId === 'string') {
				setSelectedUserId(slot.matchedUserId)
				setProfileModalOpen(true)
			}
		}
	}
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
									<ProfileGrid images={images} viewCount={viewCount} activeSlotsCount={activeSlotsCount} onCardClick={handleCardClick} />
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
				<ValidationModal
					isOpen={searchModalOpen}
					title="Hang tight"
					onClose={() => { /* disable manual close during sequence */ }}
				>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
						<div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.25)', borderTopColor: 'rgba(0, 200, 120, 0.9)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
						<div style={{ height: 12 }} />
						<div style={{ textAlign: 'center' }}>{funnyLines[searchMessageIndex]}</div>
					</div>
					<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
				</ValidationModal>
				<MatchProfileModal
					isOpen={profileModalOpen}
					userId={selectedUserId}
					onClose={() => { setProfileModalOpen(false); setSelectedUserId(null) }}
					onChat={(uid) => { if (uid) setSelectedUserId(uid); setChatOpen(true) }}
					onChop={() => { /* integrate when chop is built */ }}
				/>
				<ChatModal
					isOpen={chatOpen}
					onClose={() => setChatOpen(false)}
					otherUserLabel={chatDisplayName || 'Chat'}
					otherUserId={selectedUserId || ''}
				/>
				<BrowseModal isOpen={browseOpen} onClose={() => setBrowseOpen(false)} />
			</div>
		</PageFrame>
	)
}


