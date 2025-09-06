import { useState, useEffect } from 'react'
import { getBackendApi } from '../../lib/config'

interface AuthState {
  isAuthenticated: boolean
  displayName: string | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    displayName: null,
    loading: true
  })

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        // Check if user is authenticated via /api/user/me
        const userRes = await fetch(getBackendApi('/api/user/me'), { 
          credentials: 'include' 
        })
        
        if (!userRes.ok) {
          // Not authenticated
          if (!cancelled) {
            setState({
              isAuthenticated: false,
              displayName: null,
              loading: false
            })
          }
          return
        }

        // User is authenticated, now get display name
        const profileRes = await fetch(getBackendApi('/api/profile-matching'), { 
          credentials: 'include' 
        })
        
        let displayName: string | null = null
        if (profileRes.ok) {
          const profileData = await profileRes.json().catch(() => null) as { displayName?: string | null }
          displayName = typeof profileData?.displayName === 'string' ? profileData.displayName : null
        }

        if (!cancelled) {
          setState({
            isAuthenticated: true,
            displayName,
            loading: false
          })
        }
      } catch (error) {
        // On error, assume not authenticated
        if (!cancelled) {
          setState({
            isAuthenticated: false,
            displayName: null,
            loading: false
          })
        }
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [])

  return state
}
