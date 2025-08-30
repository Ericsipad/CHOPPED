import type { ReactNode } from 'react'

type ValidationModalProps = {
  isOpen: boolean
  title?: string
  children?: ReactNode
  onClose: () => void
}

export default function ValidationModal(props: ValidationModalProps) {
  const { isOpen, title, children, onClose } = props
  if (!isOpen) return null
  return (
    <div role="dialog" aria-modal="true" className="profile-public-panel" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="profile-public-panel" style={{ maxWidth: 500, width: '90%' }}>
        <div className="profile-public-panel__header">
          <div className="profile-public-panel__title">
            <span>{title || 'Action required'}</span>
          </div>
          <div className="profile-public-panel__right">
            <button className="profile-public-panel__save" onClick={onClose}>Close</button>
          </div>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}


