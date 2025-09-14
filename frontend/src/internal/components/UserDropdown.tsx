import { forwardRef, useEffect, useState } from 'react'
import { logout, redirectToLogin } from '../../lib/auth'
import { fetchAvailableGiftsAmountCents } from '../lib/gifts'

interface UserDropdownProps {
  isAuthenticated: boolean
  onClose: () => void
}

const UserDropdown = forwardRef<HTMLDivElement, UserDropdownProps>(
  ({ isAuthenticated, onClose }, ref) => {
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

    return (
      <div ref={ref} className="user-dropdown">
        <div className="user-dropdown__content">
          {isAuthenticated ? (
            <>
              <button
                className="user-dropdown__item"
                onClick={() => handleNavigation('/account.html')}
              >
                <span className="user-dropdown__item-text">Account</span>
              </button>
              <button
                className="user-dropdown__item"
                onClick={() => handleNavigation('/profile.html')}
              >
                <span className="user-dropdown__item-text">Profile</span>
              </button>
              <button className="user-dropdown__item" tabIndex={-1} role="note" aria-live="polite">
                <span className="user-dropdown__item-text">Available {`$${(((availableCents ?? 0) / 100).toFixed(2))}`}</span>
              </button>
              <div className="user-dropdown__divider"></div>
              <button
                className="user-dropdown__item user-dropdown__item--logout"
                onClick={handleLogout}
              >
                <span className="user-dropdown__item-text">Logout</span>
              </button>
            </>
          ) : (
            <button
              className="user-dropdown__item user-dropdown__item--login"
              onClick={handleLogin}
            >
              <span className="user-dropdown__item-text">Login</span>
            </button>
          )}
        </div>
      </div>
    )
  }
)

UserDropdown.displayName = 'UserDropdown'

export default UserDropdown
