import { useEffect, useState } from 'react'
import { logout, redirectToLogin } from '../../lib/auth'
import { fetchAvailableGiftsAmountCents } from '../lib/gifts'

interface UserMenuListProps {
  isAuthenticated: boolean
  onClose: () => void
  variant?: 'dropdown' | 'mobile'
}

export default function UserMenuList(props: UserMenuListProps) {
  const { isAuthenticated, onClose, variant = 'dropdown' } = props
  const [availableCents, setAvailableCents] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      setAvailableCents(null)
      return
    }
    ;(async () => {
      try {
        const cents = await fetchAvailableGiftsAmountCents()
        if (!cancelled) setAvailableCents(cents)
      } catch {
        if (!cancelled) setAvailableCents(0)
      }
    })()
    return () => { cancelled = true }
  }, [isAuthenticated])

  const handleLogout = () => {
    onClose()
    logout()
  }

  const handleLogin = () => {
    onClose()
    redirectToLogin()
  }

  const handleNavigation = (href: string) => {
    onClose()
    window.location.href = href
  }

  const itemClass = variant === 'dropdown' ? 'user-dropdown__item' : 'mobile-menu__item'
  const itemLogoutClass = variant === 'dropdown' ? 'user-dropdown__item user-dropdown__item--logout' : 'mobile-menu__item mobile-menu__item--logout'
  const itemLoginClass = variant === 'dropdown' ? 'user-dropdown__item user-dropdown__item--login' : 'mobile-menu__item mobile-menu__item--login'
  const dividerClass = variant === 'dropdown' ? 'user-dropdown__divider' : 'mobile-menu__divider'

  return (
    <>
      {isAuthenticated ? (
        <>
          <button
            className={itemClass}
            onClick={() => handleNavigation('/account.html')}
          >
            <span className="user-dropdown__item-text">Account</span>
          </button>
          <button
            className={itemClass}
            onClick={() => handleNavigation('/profile.html')}
          >
            <span className="user-dropdown__item-text">Profile</span>
          </button>
          <button className={itemClass} tabIndex={-1} role="note" aria-live="polite">
            <span className="user-dropdown__item-text">Available {`$${(((availableCents ?? 0) / 100).toFixed(2))}`}</span>
          </button>
          <div className={dividerClass}></div>
          <button
            className={itemLogoutClass}
            onClick={handleLogout}
          >
            <span className="user-dropdown__item-text">Logout</span>
          </button>
        </>
      ) : (
        <button
          className={itemLoginClass}
          onClick={handleLogin}
        >
          <span className="user-dropdown__item-text">Login</span>
        </button>
      )}
    </>
  )
}


