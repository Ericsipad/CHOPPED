import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ValidationModalProps = {
  isOpen: boolean
  title?: string
  children?: ReactNode
  onClose: () => void
}

export default function ValidationModal(props: ValidationModalProps) {
  const { isOpen, title, children, onClose } = props
  if (!isOpen) return null
  return createPortal(
    <div role="dialog" aria-modal="true" className="profile-public-panel" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, overflowY: 'auto' }}>
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 12px' }}>
        <div className="profile-public-panel profile-public-panel--modal" style={{ maxWidth: 520, width: '100%', backdropFilter: 'blur(10px)', background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(0, 200, 120, 0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="profile-public-panel__header">
            <div className="profile-public-panel__title">
              <span>{title || 'Action required'}</span>
            </div>
            <div className="profile-public-panel__right">
              <button className="profile-public-panel__save" onClick={onClose} style={{ borderColor: 'rgba(0, 200, 120, 0.8)' }}>Close</button>
            </div>
          </div>
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}


