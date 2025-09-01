import { useEffect, useState } from 'react'
import { getBackendApi } from '../../lib/config'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Virtual, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/virtual'

type PendingItem = { userId: string; imageUrl: string }
type ProfilePublic = { displayName: string | null; age: number | null; heightCm?: number | null; bio: string | null }
type ByIdImages = { main: string | null; thumbs: Array<{ name: string; url: string }> }

function shuffleArray<T>(arr: T[]): T[] {
	const a = arr.slice()
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

function toImperial(heightCm?: number | null): string | null {
	if (typeof heightCm !== 'number' || !Number.isFinite(heightCm)) return null
	const totalInches = Math.round(heightCm / 2.54)
	const feet = Math.floor(totalInches / 12)
	const inches = totalInches % 12
	return `${feet}'${inches}"`
}

export default function BrowseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const [items, setItems] = useState<PendingItem[]>([])
	const [activeIdx, setActiveIdx] = useState(0)
	const [bioOpenIndex, setBioOpenIndex] = useState<number | null>(null)
	const [thumbsCache, setThumbsCache] = useState<Record<string, ByIdImages>>({})
	const [profileCache, setProfileCache] = useState<Record<string, ProfilePublic>>({})
    const [limitOpen, setLimitOpen] = useState(false)

	// fetch pending items once when opened
	useEffect(() => {
		let cancelled = false
		if (!isOpen) return
		;(async () => {
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
				const data = await res.json().catch(() => null) as { items?: PendingItem[] }
				const arr = Array.isArray(data?.items) ? data!.items! : []
				if (!cancelled) setItems(shuffleArray(arr).slice(0, 500))
			} catch {
				if (!cancelled) setItems([])
			}
		})()
		return () => { cancelled = true }
	}, [isOpen])

	// prefetch thumbs for +-5 around active index
	useEffect(() => {
		if (!isOpen || items.length === 0) return
		const start = Math.max(0, activeIdx - 5)
		const end = Math.min(items.length - 1, activeIdx + 5)
		const slice = items.slice(start, end + 1)
		let cancelled = false
		;(async () => {
			for (const it of slice) {
				if (cancelled) break
				if (thumbsCache[it.userId]) continue
				try {
					const res = await fetch(getBackendApi(`/api/profile-images/public?userId=${encodeURIComponent(it.userId)}`), { credentials: 'include' })
					if (!res.ok) continue
					const data = await res.json().catch(() => null) as ByIdImages
					if (cancelled) break
					setThumbsCache(prev => ({ ...prev, [it.userId]: { main: data?.main ?? null, thumbs: Array.isArray(data?.thumbs) ? data!.thumbs! : [] } }))
				} catch {}
			}
		})()
		return () => { cancelled = true }
	}, [isOpen, activeIdx, items, thumbsCache])

	// load profile when opening bio panel
	async function openBio(index: number) {
		setBioOpenIndex(index)
		const it = items[index]
		if (!it) return
		if (profileCache[it.userId]) return
		try {
			const res = await fetch(getBackendApi(`/api/profile-matching/public?userId=${encodeURIComponent(it.userId)}`), { credentials: 'include' })
			if (!res.ok) return
			const data = await res.json().catch(() => null) as ProfilePublic
			setProfileCache(prev => ({ ...prev, [it.userId]: { displayName: data?.displayName ?? null, age: typeof data?.age === 'number' ? data!.age! : null, heightCm: typeof data?.heightCm === 'number' ? data!.heightCm! : null, bio: data?.bio ?? null } }))
		} catch {}
	}

	if (!isOpen) return null

	const total = items.length
	const reachedEnd = total === 0

	return (
		<div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
			<div style={{ width: 'min(1100px, 92vw)', height: '60vh', position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)' }}>
				<button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 8, right: 10, zIndex: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Close</button>
				{limitOpen && (
					<div role="dialog" aria-modal onClick={() => setLimitOpen(false)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 6 }}>
						<div onClick={(e) => e.stopPropagation()} style={{ background: '#111', color: '#fff', borderRadius: 10, padding: 16, width: 'min(520px, 92%)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
							<div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>You've reached your browse limit for today</div>
							<div>Message more users to increase your daily limit.</div>
							<div style={{ height: 12 }} />
							<button onClick={() => setLimitOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>OK</button>
						</div>
					</div>
				)}
				{reachedEnd ? (
					<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center' }}>
						<div>
							<div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You've reached your browse limit for today</div>
							<div>Message more users to increase your daily limit.</div>
						</div>
					</div>
				) : (
					<Swiper
						modules={[Virtual, Keyboard]}
						direction="horizontal"
						virtual
						keyboard={{ enabled: true }}
						slidesPerView={1}
						allowTouchMove={bioOpenIndex === null}
						noSwiping
						noSwipingClass="no-swipe"
						onSlideChange={(s) => setActiveIdx(s.activeIndex)}
						onReachEnd={() => setLimitOpen(true)}
						style={{ width: '100%', height: '100%' }}
					>
						{items.map((it, index) => {
							const byId = thumbsCache[it.userId]
							const thumbs = byId?.thumbs ?? []
							return (
								<SwiperSlide key={it.userId} virtualIndex={index} style={{ position: 'relative', width: '100%', height: '100%' }}>
									<div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr', overflow: 'hidden' }}>
										<Swiper direction="vertical" nested keyboard={{ enabled: true }} style={{ width: '100%', height: '100%' }}>
											{(() => {
												const urls: string[] = []
												if (byId?.main) urls.push(byId.main)
												if (thumbs.length > 0) urls.push(...thumbs.map((t) => t.url))
												if (urls.length === 0) urls.push(byId?.main || it.imageUrl)
												return urls.filter(Boolean).map((src, i) => (
													<SwiperSlide key={i} style={{ width: '100%', height: '100%', background: '#000' }}>
														<img src={src} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
													</SwiperSlide>
												))
											})()}
										</Swiper>

										<div className="no-swipe" style={{ position: 'absolute', top: 0, left: bioOpenIndex === index ? 0 : '-25%', width: '25%', height: '100%', background: 'rgba(17,17,17,0.9)', color: '#fff', transition: 'left 0.3s ease', padding: 20, display: 'flex', flexDirection: 'column', zIndex: 20, pointerEvents: 'auto' }}>
											<button onClick={() => setBioOpenIndex(null)} aria-label="Close panel" style={{ alignSelf: 'flex-end', background: 'transparent', color: '#fff', border: 'none', fontSize: 28, lineHeight: 1, cursor: 'pointer' }}>×</button>
											<div style={{ flex: 1, overflowY: 'auto' }}>
												{(() => {
													const p = profileCache[it.userId]
													const name = p?.displayName || 'Unknown'
													const age = (typeof p?.age === 'number') ? p!.age! : null
													const heightStr = (typeof p?.heightCm === 'number') ? `${toImperial(p!.heightCm!)} / ${p!.heightCm!} cm` : null
													return (
														<div>
															<div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{name}</div>
															<div style={{ fontSize: 18, opacity: 0.9, marginBottom: 8 }}>
																{age !== null ? <span>Age: {age}</span> : null}
																{heightStr ? <span style={{ marginLeft: 12 }}>Height: {heightStr}</span> : null}
															</div>
															<div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{p?.bio || ''}</div>
														</div>
													)
												})()}
											</div>
											<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
												<button aria-label="Chat" style={{ background: '#16a34a', color: '#fff', height: 42, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Chat</button>
												<button aria-label="Chop" style={{ background: '#dc2626', color: '#fff', height: 42, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Chop</button>
											</div>
										</div>

										<button onClick={() => openBio(index)} aria-label="Open bio" style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 4, padding: '8px 14px', background: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>View Info</button>
									</div>
								</SwiperSlide>
							)
						})}
					</Swiper>
				)}
			</div>
		</div>
	)
}


