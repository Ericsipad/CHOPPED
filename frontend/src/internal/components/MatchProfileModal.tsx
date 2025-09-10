import { useEffect, useMemo, useRef, useState } from 'react'
import { getBackendApi } from '../../lib/config'

type MatchProfileModalProps = {
	isOpen: boolean
	userId: string | null
	onClose: () => void
	onChat?: (userId: string) => void
	onChop?: (userId: string) => void
	onGift?: (userId: string) => void
	isActionLoading?: boolean
}

type PublicImages = { main: string | null; thumbs: Array<{ name: string; url: string }> }
type PublicProfile = { displayName: string | null; age: number | null; bio: string | null }

export default function MatchProfileModal(props: MatchProfileModalProps) {
	const { isOpen, userId, onClose, onChat, onChop, onGift, isActionLoading } = props
	const [images, setImages] = useState<PublicImages | null>(null)
	const [profile, setProfile] = useState<PublicProfile | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [activeIndex, setActiveIndex] = useState<number>(0)
	const dialogRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!isOpen) return
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose()
			if (e.key === 'ArrowLeft') setActiveIndex((i) => Math.max(0, i - 1))
			if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(6, i + 1))
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [isOpen, onClose])

	// Basic focus trap and initial focus
	useEffect(() => {
		if (!isOpen) return
		const root = dialogRef.current
		if (!root) return
		const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		const focusables = Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter((el) => !el.hasAttribute('disabled'))
		if (focusables.length > 0) {
			focusables[0].focus()
		}
		function handleTab(e: KeyboardEvent) {
			if (e.key !== 'Tab') return
			const r = dialogRef.current
			if (!r) return
			const list = Array.from(r.querySelectorAll<HTMLElement>(selectors)).filter((el) => !el.hasAttribute('disabled'))
			if (list.length === 0) return
			const first = list[0]
			const last = list[list.length - 1]
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault()
					last.focus()
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault()
					first.focus()
				}
			}
		}
		window.addEventListener('keydown', handleTab)
		return () => window.removeEventListener('keydown', handleTab)
	}, [isOpen])

	useEffect(() => {
		let cancelled = false
		if (!isOpen || !userId) return
		;(async () => {
			setLoading(true)
			setError(null)
			setImages(null)
			setProfile(null)
			try {
				const [imgRes, profRes] = await Promise.all([
					fetch(getBackendApi(`/api/profile-images/public?userId=${encodeURIComponent(userId)}`), { credentials: 'include' }).catch(() => null),
					fetch(getBackendApi(`/api/profile-matching/public?userId=${encodeURIComponent(userId)}`), { credentials: 'include' }).catch(() => null),
				])
				if (!cancelled && imgRes && imgRes.ok) {
					const data = await imgRes.json().catch(() => null) as PublicImages | null
					if (data) setImages({ main: data.main ?? null, thumbs: Array.isArray(data.thumbs) ? data.thumbs : [] })
				}
				if (!cancelled && profRes && profRes.ok) {
					const data = await profRes.json().catch(() => null) as PublicProfile | null
					if (data) setProfile({ displayName: data.displayName ?? null, age: typeof data.age === 'number' ? data.age : null, bio: data.bio ?? null })
				}
				if (!cancelled) setActiveIndex(0)
			} catch {
				if (!cancelled) setError('Failed to load')
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => { cancelled = true }
	}, [isOpen, userId])

	const thumbUrls: string[] = useMemo(() => {
		const arr = new Array<string>(6).fill('')
		const thumbs = images?.thumbs ?? []
		for (const t of thumbs) {
			const m = /^thumb([1-6])$/.exec(t.name)
			if (!m) continue
			const idx = parseInt(m[1], 10) - 1
			if (idx >= 0 && idx < 6) arr[idx] = t.url
		}
		return arr
	}, [images])

	const largeUrl = useMemo(() => {
		if (activeIndex === 0) return images?.main || null
		const idx = activeIndex - 1
		return thumbUrls[idx] || null
	}, [images, thumbUrls, activeIndex])

	// Preload large when selection changes
	useEffect(() => {
		if (!largeUrl) return
		const img = new Image()
		img.decoding = 'async'
		img.loading = 'eager'
		img.src = largeUrl
	}, [largeUrl])

	if (!isOpen) return null

	function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
		if (e.target === e.currentTarget) onClose()
	}

	function handleChat() {
		if (userId && onChat) onChat(userId)
	}

	function handleChop() {
		if (userId && onChop && !isActionLoading) onChop(userId)
	}

	function handleGift() {
		if (userId && onGift) onGift(userId)
	}

	return (
		<div role="dialog" aria-modal="true" aria-label="Match profile" aria-describedby="match-profile-desc" onClick={handleOverlayClick} style={styles.overlay}>
			<div ref={dialogRef} style={styles.card}>
				<div style={styles.headerBar}>
					<button type="button" onClick={handleChat} style={styles.chatBtn} aria-label="Chat">
						<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" stroke="white" strokeWidth="1.5"/></svg>
							<span>CHAT</span>
						</span>
					</button>
					<button type="button" onClick={handleChop} style={styles.chopBtn} aria-label="Chop" disabled={!!isActionLoading} aria-busy={!!isActionLoading}>
						<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
							{isActionLoading ? (
								<div aria-hidden style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
							) : (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 3h6l4 6-7 7-6-4 3-3" stroke="white" strokeWidth="1.5"/></svg>
							)}
							<span>{isActionLoading ? 'Chopping…' : 'CHOP'}</span>
						</span>
					</button>
				</div>
				<div style={styles.body}>
					<div style={styles.mainImageWrap}>
						{loading ? (
							<div style={styles.loading}>Loading…</div>
						) : largeUrl ? (
							<img src={largeUrl} alt="Selected image" style={styles.mainImage} />
						) : (
							<div style={styles.empty}>No image</div>
						)}
					</div>
					<div style={styles.thumbs}>
						{[images?.main || '', ...thumbUrls].slice(1, 7).map((url, i) => {
							const idx = i + 1
							const isActive = activeIndex === idx
							return (
								<button key={idx} type="button" onClick={() => setActiveIndex(idx)} aria-pressed={isActive} style={{ ...styles.thumbBtn, outline: isActive ? '2px solid #22c55e' : 'none' }}>
									{url ? <img src={url} alt={`Thumbnail ${idx} ${profile?.displayName ? `for ${profile.displayName}` : ''}`} loading="lazy" decoding="async" style={styles.thumbImg} /> : <div style={styles.thumbEmpty}>—</div>}
								</button>
							)
						})}
					</div>
					<div style={styles.details} id="match-profile-desc">
						<div style={styles.nameRow}>
							<span style={styles.nameText}>{profile?.displayName || 'Unknown'}</span>
							{typeof profile?.age === 'number' ? <span style={styles.ageText}> · {profile!.age}</span> : null}
						</div>
						{profile?.bio ? <div style={styles.bioText}>{profile.bio}</div> : null}
						{error ? <div style={styles.error}>{error}</div> : null}
					</div>
				</div>
				<div style={styles.footer}>
					<button type="button" onClick={handleGift} style={styles.giftBtn} aria-label="Send a gift">
						<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<path d="M20 7h-3.17A3 3 0 0 0 12 4a3 3 0 0 0-4.83 3H4v4h16V7zM4 13v7h7v-7H4zm9 7h7v-7h-7v7zM9 7a1 1 0 1 1 0-2 2 2 0 0 1 0 4H9V7zm6 2h-1a2 2 0 0 1 0-4 1 1 0 1 1 0 2v2z" stroke="#22c55e" strokeWidth="1.5"/>
							</svg>
							<span>Send a gift</span>
						</span>
					</button>
					<button type="button" onClick={onClose} style={styles.closeBtn}>Close</button>
				</div>
				<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
			</div>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	overlay: {
		position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
	},
	card: {
		width: 'min(700px, 64vw)', maxWidth: 700, background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', color: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
	},
	headerBar: {
		display: 'grid', gridTemplateColumns: '1fr 1fr', height: 35, width: '100%'
	},
	chatBtn: {
		background: '#16a34a', color: '#fff', height: '100%', width: '100%', border: 'none', cursor: 'pointer', fontWeight: 700
	},
	chopBtn: {
		background: '#dc2626', color: '#fff', height: '100%', width: '100%', border: 'none', cursor: 'pointer', fontWeight: 700
	},
	body: {
		padding: 12
	},
	mainImageWrap: {
		width: '100%', aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'
	},
	mainImage: {
		width: '100%', height: '100%', objectFit: 'cover', display: 'block'
	},
	loading: { opacity: 0.9 },
	empty: { opacity: 0.75 },
	thumbs: {
		display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 10
	},
	thumbBtn: {
		borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.35)', height: 50, cursor: 'pointer'
	},
	thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
	thumbEmpty: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
	details: { marginTop: 12 },
	nameRow: { fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'baseline' },
	nameText: { fontSize: 14, fontWeight: 700 },
	ageText: { fontSize: 12, opacity: 0.9 },
	bioText: { marginTop: 6, opacity: 0.95, lineHeight: 1.35, fontSize: 13 },
	error: { marginTop: 8, color: '#fca5a5' },
	footer: { padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' },
	closeBtn: { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
}


