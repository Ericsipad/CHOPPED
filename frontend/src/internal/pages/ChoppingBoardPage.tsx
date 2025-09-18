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
import StatusBar from '../components/StatusBar'
import ViewCountDesktop from '../components/ViewCountDesktop'
import ViewCountTabs from '../components/ViewCountTabs'
import GiftModal from '../components/GiftModal'
import GiftsInboxModal from '../components/GiftsInboxModal'
import { fetchPendingMatchedMeCount } from '../lib/matchedMe'
import { fetchUnwithdrawnGiftsCount } from '../lib/gifts'

export default function ChoppingBoardPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [missingFields, setMissingFields] = useState<string[]>([])
    const [viewCount, setViewCount] = useState<10 | 20 | 50>(10)
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
    const [giftOpen, setGiftOpen] = useState(false)
    const [giftsInboxOpen, setGiftsInboxOpen] = useState(false)
    const chopInFlightRef = useRef(false)
    const syncTriggeredRef = useRef(false)
    const [isChopping, setIsChopping] = useState(false)
    const [chopSuccessOpen, setChopSuccessOpen] = useState(false)
    const [matchedMePendingCount, setMatchedMePendingCount] = useState<number>(0)
    const [giftsCount, setGiftsCount] = useState<number>(0)
	const statusBarRef = useRef<HTMLDivElement | null>(null)

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

	// (Removed) StatusBar height measurement; no longer needed when bar is in header

    // One-time fetch and cache of pending matched-me count after login
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                let currentId: string | null = null
                try {
                    const raw = localStorage.getItem('chopped.mongoUserId')
                    if (raw) {
                        const parsed = JSON.parse(raw) as { id?: string; ts?: number }
                        if (parsed && typeof parsed.id === 'string' && parsed.id) currentId = parsed.id
                    }
                } catch { /* ignore */ }
                if (!currentId) {
                    try {
                        const resMe = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
                        const dataMe = await resMe.json().catch(() => null) as { userId?: string | null }
                        if (dataMe && typeof dataMe.userId === 'string' && dataMe.userId) {
                            try { localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id: dataMe.userId, ts: Date.now() })) } catch { /* ignore */ }
                            currentId = dataMe.userId
                        }
                    } catch { /* ignore */ }
                }
                if (!currentId) return

                const cacheKey = `chopped.matchedMePendingCount:${currentId}`
                let cached: number | null = null
                try {
                    const raw = localStorage.getItem(cacheKey)
                    if (raw !== null) {
                        const parsed = JSON.parse(raw) as { v?: number; ts?: number } | number
                        if (typeof parsed === 'number') cached = parsed
                        else if (parsed && typeof (parsed as any).v === 'number') cached = (parsed as any).v as number
                    }
                } catch { /* ignore */ }
                if (typeof cached === 'number') {
                    if (!cancelled) setMatchedMePendingCount(cached)
                    return
                }

                const count = await fetchPendingMatchedMeCount()
                try { localStorage.setItem(cacheKey, JSON.stringify({ v: count, ts: Date.now() })) } catch { /* ignore */ }
                if (!cancelled) setMatchedMePendingCount(count)
            } catch { /* ignore */ }
        })()
        return () => { cancelled = true }
    }, [])

    // Fetch unwithdrawn gifts count
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const count = await fetchUnwithdrawnGiftsCount()
                if (!cancelled) setGiftsCount(count)
            } catch { /* ignore */ }
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

	// Compute viewport-fit sizing overrides for mobile
	const [overrides, setOverrides] = useState<{ cardPx?: number; columns?: number; gap?: string }>({})
	useEffect(() => {
		function compute() {
			// PWA-only: apply responsive sizing when running in standalone display-mode
			let isStandalone = false
			try {
				isStandalone = (
					(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
					((window as any).navigator?.standalone === true)
				)
			} catch { /* noop */ }
			if (!isStandalone) { setOverrides({}); return }
			const vw = window.innerWidth
			const vh = window.innerHeight
			const columns = 5
			const gapPx = (viewCount === 10) ? 15 : 8
			const totalGap = (columns - 1) * gapPx
			// assume zero horizontal container padding on mobile (we strip it via CSS)
			const cardPxByWidth = Math.floor((vw - totalGap) / columns)
			const rows = Math.ceil(viewCount / columns)
			const headerOffset = 52
			const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0') || 0
			const bottomNavH = 60 + safeBottom
			const tabsH = 60
			const extraTopPad = 22
			const available = vh - headerOffset - bottomNavH - tabsH - extraTopPad - 8
			const totalRowGap = (rows - 1) * gapPx
			const cardPxByHeight = Math.floor((available - totalRowGap) / rows)
			const cardPx = Math.max(60, Math.min(cardPxByWidth, cardPxByHeight))
			setOverrides({ cardPx, columns, gap: `${gapPx}px` })
		}
		compute()
		window.addEventListener('resize', compute)
		return () => window.removeEventListener('resize', compute)
	}, [viewCount])

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

    async function handleChop(targetUserId: string) {
        if (chopInFlightRef.current) return
        chopInFlightRef.current = true
        setIsChopping(true)
        try {
            let viewerId: string | null = null
            try {
                const raw = localStorage.getItem('chopped.mongoUserId')
                if (raw) {
                    const parsed = JSON.parse(raw) as { id?: string; ts?: number }
                    if (parsed && typeof parsed.id === 'string' && parsed.id) viewerId = parsed.id
                }
            } catch { /* ignore */ }
            if (!viewerId) {
                // Attempt a sync via /api/user/me as used elsewhere, then retry fetch from localStorage
                try {
                    const resMe = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
                    const dataMe = await resMe.json().catch(() => null) as { userId?: string | null }
                    if (dataMe && typeof dataMe.userId === 'string' && dataMe.userId) {
                        try { localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id: dataMe.userId, ts: Date.now() })) } catch { /* ignore */ }
                        viewerId = dataMe.userId
                    }
                } catch { /* ignore */ }
            }
            if (!viewerId) return

            // Find imageUrl for the selected user from current slots for backend payload
            const imageUrl = (slots.find(s => s?.matchedUserId === targetUserId)?.mainImageUrl) || null

            const res = await fetch(getBackendApi('/api/user/match'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewerId, targetUserId, imageUrl, action: 'chop' })
            })

            setProfileModalOpen(false)
            setSelectedUserId(null)

            // Refresh matches so UI reflects chopped entry removal
            try {
                const refreshed = await fetchUserMatchArray()
                setSlots(refreshed)
            } catch { /* ignore */ }

            try { if (res && (res as Response).ok) setChopSuccessOpen(true) } catch { /* ignore */ }
        } finally {
            chopInFlightRef.current = false
            setIsChopping(false)
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

	// Trigger reciprocal match status sync last, after other effects have initialized
	useEffect(() => {
		let cancelled = false
		;(async () => {
			if (syncTriggeredRef.current) return
			syncTriggeredRef.current = true
			try {
				let viewerId: string | null = null
				try {
					const raw = localStorage.getItem('chopped.mongoUserId')
					if (raw) {
						const parsed = JSON.parse(raw) as { id?: string; ts?: number }
						if (parsed && typeof parsed.id === 'string' && parsed.id) viewerId = parsed.id
					}
				} catch { /* ignore */ }
				if (!viewerId) {
					try {
						const resMe = await fetch(getBackendApi('/api/user/me'), { credentials: 'include' })
						const dataMe = await resMe.json().catch(() => null) as { userId?: string | null }
						if (dataMe && typeof dataMe.userId === 'string' && dataMe.userId) {
							try { localStorage.setItem('chopped.mongoUserId', JSON.stringify({ id: dataMe.userId, ts: Date.now() })) } catch { /* ignore */ }
							viewerId = dataMe.userId
						}
					} catch { /* ignore */ }
				}
				if (!viewerId) return
				await fetch(getBackendApi('/api/user/matches/sync-reciprocal'), {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ viewerId })
				}).catch(() => null)
				try {
					const refreshed = await fetchUserMatchArray()
					if (!cancelled) setSlots(refreshed)
				} catch { /* ignore */ }
			} catch { /* ignore */ }
		})()
		return () => { cancelled = true }
	}, [])

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
	// Determine mobile vs desktop at render time (non-SSR app)
	const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 1024px)').matches : false
	return (
		<PageFrame
			headerContent={isMobile ? (
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<div ref={statusBarRef}>
						<StatusBar variant="header" giftsCount={giftsCount} matchedMeCount={matchedMePendingCount} onGiftsClick={() => setGiftsInboxOpen(true)} />
					</div>
				</div>
			) : null}
		>
			<div>
				<Container className="chopping-page-root with-bottom-nav">
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, zIndex: 9 }}>
							<div style={{ position: 'relative', width: '100%', height: '100%' }}>
								{!isMobile && (
									<div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '8px 0', zIndex: 10 }}>
										<StatusBar giftsCount={giftsCount} matchedMeCount={matchedMePendingCount} onGiftsClick={() => setGiftsInboxOpen(true)} />
									</div>
								)}
								{!isMobile && (
									<div style={{ position: 'absolute', top: 0, left: 0, padding: '8px 12px', zIndex: 10 }}>
										<ViewCountDesktop value={viewCount} onChange={setViewCount} />
									</div>
								)}
								{/* Grid: align to top; provide extra space for desktop overlays (+15px below status bar) */}
								<div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: isMobile ? 22 : 91 }}>
									<ProfileGrid
										images={images}
										viewCount={viewCount}
										activeSlotsCount={activeSlotsCount}
										onCardClick={handleCardClick}
										cardPxOverride={overrides.cardPx}
										columnsOverride={overrides.columns}
										gapOverride={overrides.gap}
									/>
								</div>
							</div>
						</div>
					</div>
				</Container>
				{/* Fixed bottom view count tabs for mobile */}
				<ViewCountTabs value={viewCount} onChange={setViewCount} />
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
					onChat={(uid) => { if (uid) setSelectedUserId(uid); setProfileModalOpen(false); setChatOpen(true) }}
					onChop={(uid) => { if (uid) handleChop(uid) }}
					onGift={(uid) => { if (uid) setSelectedUserId(uid); setProfileModalOpen(false); setGiftOpen(true) }}
					isActionLoading={isChopping}
					viewerSubscription={subscription}
				/>
				<ChatModal
					isOpen={chatOpen}
					onClose={() => setChatOpen(false)}
					otherUserLabel={chatDisplayName || 'Chat'}
					otherUserId={selectedUserId || ''}
				/>
				<BrowseModal isOpen={browseOpen} onClose={() => setBrowseOpen(false)} />
				<GiftModal
					isOpen={giftOpen}
					onClose={() => setGiftOpen(false)}
					otherUserId={selectedUserId || ''}
				/>
				<GiftsInboxModal
					isOpen={giftsInboxOpen}
					onClose={() => setGiftsInboxOpen(false)}
					onChat={(uid, label) => { if (uid) { setSelectedUserId(uid); setChatDisplayName(label || null); setChatOpen(true) } }}
					onChop={(uid) => { if (uid) handleChop(uid) }}
				/>
				<ValidationModal
					isOpen={chopSuccessOpen}
					title="Success"
					onClose={() => setChopSuccessOpen(false)}
				>
					<div style={{ padding: '12px 0' }}>Successfully chopped.</div>
				</ValidationModal>
			</div>
		</PageFrame>
	)
}


