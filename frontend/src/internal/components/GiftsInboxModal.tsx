import { useEffect, useRef, useState } from 'react'
import { fetchReceivedGifts, type ReceivedGift, updateGiftAcceptance } from '../lib/gifts'

type GiftsInboxModalProps = {
  isOpen: boolean
  onClose: () => void
  onChat: (userId: string, displayName?: string | null) => void
  onChop: (userId: string, imageUrl?: string | null) => void
}

export default function GiftsInboxModal(props: GiftsInboxModalProps) {
  const { isOpen, onClose, onChat, onChop } = props
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<ReceivedGift[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKeyDownCapture(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDownCapture, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDownCapture, { capture: true } as any)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const rows = await fetchReceivedGifts(50, 0)
        setItems(rows.filter(r => !r.is_accepted))
      } catch (e) {
        setError('Failed to load gifts')
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

  if (!isOpen) return null

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleChopClick(row: ReceivedGift) {
    if (actionLoadingId) return
    setActionLoadingId(`${row.senderUserId}-${row.createdAt}`)
    try {
      onChop(row.senderUserId, row.mainImageUrl)
      await updateGiftAcceptance(row.senderUserId, row.createdAt, false)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Gifts" onClick={handleOverlayClick} style={styles.overlay}>
      <div ref={dialogRef} style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>Gifts</div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeBtn}>×</button>
        </div>
        <div style={styles.body}>
          {loading ? (
            <div style={styles.empty}>Loading…</div>
          ) : error ? (
            <div style={{ ...styles.empty, color: '#fca5a5' }}>{error}</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>No gifts yet</div>
          ) : (
            <div style={styles.list}>
              {items.map((row) => {
                const id = `${row.senderUserId}-${row.createdAt}`
                const long = (row.giftMessage || '').length > 100
                const showFull = !!expanded[id]
                const text = row.giftMessage || ''
                const display = showFull ? text : text.slice(0, 100)
                return (
                  <div key={id} style={styles.item}>
                    <div style={styles.thumbWrap}>
                      <div style={styles.thumb}>
                        {row.mainImageUrl ? (
                          <img src={row.mainImageUrl} alt="Sender" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.08)' }} />
                        )}
                        <div style={styles.overlayBadge}>$?</div>
                      </div>
                    </div>
                    <div style={styles.middle}>
                      <div style={styles.name}>{row.displayName || 'Unknown'}</div>
                      <div style={styles.message}>
                        {display}
                        {long && (
                          <>
                            {showFull ? '' : '…'}
                            <button type="button" onClick={() => toggleExpanded(id)} style={styles.moreBtn}>{showFull ? 'Less' : 'More'}</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={styles.actions}>
                      <button type="button" onClick={() => onChat(row.senderUserId, row.displayName)} style={styles.chatBtn}>Chat</button>
                      <button type="button" onClick={() => handleChopClick(row)} style={{ ...styles.chopBtn, opacity: actionLoadingId === id ? 0.6 : 1 }} disabled={actionLoadingId === id}>Chop</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  card: {
    width: 'min(760px, 64vw)', maxWidth: 760, background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', color: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
  },
  header: {
    position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  headerTitle: {
    fontSize: 14, fontWeight: 800, letterSpacing: 0.6,
  },
  closeBtn: {
    position: 'absolute', top: 6, right: 8, height: 28, width: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer',
  },
  body: {
    maxHeight: '70vh', overflowY: 'auto', padding: 12,
  },
  empty: { opacity: 0.85, textAlign: 'center', padding: '20px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, background: 'rgba(0,0,0,0.35)' },
  thumbWrap: { width: 56, height: 56 },
  thumb: { position: 'relative', width: 56, height: 56, overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' },
  overlayBadge: { position: 'absolute', left: 4, top: 4, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px', fontSize: 12, borderRadius: 6 },
  middle: { minWidth: 0 },
  name: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  message: { fontSize: 13, opacity: 0.95, lineHeight: 1.35, wordBreak: 'break-word' },
  moreBtn: { marginLeft: 6, background: 'transparent', color: '#60a5fa', border: 'none', cursor: 'pointer' },
  actions: { display: 'flex', gap: 8 },
  chatBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 },
  chopBtn: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 },
}


