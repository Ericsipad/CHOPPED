/**
 * Logout utility function
 * Clears local storage and redirects to landing page
 */
export function logout(): void {
  try {
    // Clear user-related localStorage items
    localStorage.removeItem('chopped.mongoUserId')
    
    // Clear any other cached user data if it exists
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('chopped.user') || key.startsWith('chopped.profile')) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    // Ignore localStorage errors (e.g., in incognito mode)
    console.warn('Failed to clear localStorage:', error)
  }
  
  // Redirect to landing page (cookies will be cleared by backend)
  window.location.href = '/'
}

/**
 * Redirect to login flow
 */
export function redirectToLogin(): void {
  // Redirect to landing page - the existing signin flow will handle it
  window.location.href = '/'
}
