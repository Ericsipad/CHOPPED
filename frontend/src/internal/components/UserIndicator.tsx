import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import UserDropdown from './UserDropdown'

export default function UserIndicator() {
  const { isAuthenticated, displayName, loading } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownOpen &&
        indicatorRef.current &&
        dropdownRef.current &&
        !indicatorRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [dropdownOpen])

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  if (loading) {
    return (
      <div className="user-indicator user-indicator--loading">
        <img src="/profile-placeholder.svg" alt="Loading" className="user-avatar" />
        <span className="user-name">Loading...</span>
      </div>
    )
  }

  const userName = isAuthenticated 
    ? (displayName || 'User') 
    : 'not logged in'
  
  const userNameClass = isAuthenticated 
    ? 'user-name user-name--authenticated' 
    : 'user-name user-name--unauthenticated'

  return (
    <div className="user-indicator-container">
      <div 
        ref={indicatorRef}
        className={`user-indicator${dropdownOpen ? ' user-indicator--active' : ''}`}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleDropdown()
          }
        }}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <img src="/profile-placeholder.svg" alt="User avatar" className="user-avatar" />
        <span className={userNameClass}>{userName}</span>
        <svg 
          className={`dropdown-chevron${dropdownOpen ? ' dropdown-chevron--open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path 
            d="M3 4.5L6 7.5L9 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {dropdownOpen && (
        <UserDropdown 
          ref={dropdownRef}
          isAuthenticated={isAuthenticated}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}
