import { forwardRef } from 'react'
import UserMenuList from './UserMenuList'

interface UserDropdownProps {
  isAuthenticated: boolean
  onClose: () => void
}

const UserDropdown = forwardRef<HTMLDivElement, UserDropdownProps>(
  ({ isAuthenticated, onClose }, ref) => {
    return (
      <div ref={ref} className="user-dropdown">
        <div className="user-dropdown__content">
          <UserMenuList isAuthenticated={isAuthenticated} onClose={onClose} variant="dropdown" />
        </div>
      </div>
    )
  }
)

UserDropdown.displayName = 'UserDropdown'

export default UserDropdown
