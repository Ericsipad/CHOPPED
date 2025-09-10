import { useEffect, useRef } from 'react'

type GiftModalProps = {
  isOpen: boolean
  onClose: () => void
  otherUserId?: string
}

export default function GiftModal(props: GiftModalProps) {
  const { isOpen, onClose } = props
  const dialogRef = useRef<HTMLDivElement | null>(null)

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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      const list = Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter((el) => !el.hasAttribute('disabled'))
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
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Send a gift"
      onClick={handleOverlayClick}
      style={styles.overlay}
    >
      <div ref={dialogRef} style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>Send a gift</div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeBtn}>×</button>
        </div>
        <div style={styles.body}>
          {/* Intentionally left blank for future development */}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  },
  card: {
    width: '44vw', height: '50vh', maxWidth: 720, background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', color: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
  },
  header: {
    position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 14, fontWeight: 800, letterSpacing: 0.6,
  },
  closeBtn: {
    position: 'absolute', top: 6, right: 8, height: 28, width: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer',
  },
  body: {
    flex: 1, overflow: 'hidden', padding: '10px 12px', display: 'flex', flexDirection: 'column',
  },
}


