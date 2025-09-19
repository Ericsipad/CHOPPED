import { useEffect, useMemo, useState } from 'react'
import { Box, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { getBackendUrl } from '../lib/config'

export default function Account() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUpdatePassword, setShowUpdatePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const checks = useMemo(() => ({
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  }), [newPassword, confirmPassword])
  const canSave = checks.length && checks.upper && checks.lower && checks.number && checks.special && checks.match

  useEffect(() => {
    let isMounted = true
    async function init() {
      setLoading(true)
      try {
        const backend = getBackendUrl()
        const sessionRes = await fetch(`${backend}/auth/session`, { credentials: 'include' })
        if (!sessionRes.ok) {
          setError('Not logged in')
          return
        }
        const { user } = await sessionRes.json()
        setUserEmail(user?.email ?? null)
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Failed to load account'
        setError(errMsg)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    init()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const hash = url.hash || ''
      if (hash.includes('update-password')) {
        setShowUpdatePassword(true)
      }
    } catch {}
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    try {
      const backend = getBackendUrl()
      const res = await fetch(`${backend}/auth/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data?.error || 'Failed to update password')
      }
      setSaveMessage('Password updated. Redirecting...')
      setTimeout(() => { window.location.href = '/profile.html' }, 800)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update password'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxW="container.md" py={16}>
      <Stack gap={4}>
        <Heading size="lg">Account</Heading>
        {loading && <Text>Loading...</Text>}
        {error && <Box color="red.600">{error}</Box>}
        {!loading && !error && !showUpdatePassword && (
          <Box>
            <Text>Welcome, {userEmail}</Text>
            <Text mt={4} color="gray.600">(Placeholder) 5 profile cards will appear here.</Text>
          </Box>
        )}
        {!loading && !error && showUpdatePassword && (
          <Box>
            <Heading size="md" mb={2}>Set a new password</Heading>
            <form onSubmit={handleSave}>
              <Stack gap={3}>
                <label>
                  <Text fontSize="sm">New password</Text>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}
                    required
                  />
                </label>
                <label>
                  <Text fontSize="sm">Confirm password</Text>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}
                    required
                  />
                </label>
                <Box fontSize="sm" color="gray.700">
                  <div style={{ color: checks.length ? '#059669' : '#b91c1c' }}>8+ characters</div>
                  <div style={{ color: checks.upper ? '#059669' : '#b91c1c' }}>uppercase letter</div>
                  <div style={{ color: checks.lower ? '#059669' : '#b91c1c' }}>lowercase letter</div>
                  <div style={{ color: checks.number ? '#059669' : '#b91c1c' }}>number</div>
                  <div style={{ color: checks.special ? '#059669' : '#b91c1c' }}>special character</div>
                  <div style={{ color: checks.match ? '#059669' : '#b91c1c' }}>{checks.match ? 'Passwords match' : 'Passwords must match'}</div>
                </Box>
                {saveError && <Box color="red.600">{saveError}</Box>}
                {saveMessage && <Box color="green.600">{saveMessage}</Box>}
                <div>
                  <button type="submit" disabled={!canSave || saving} style={{ background: '#111', color: '#fff', padding: '10px 16px', borderRadius: 9999, border: 'none', cursor: 'pointer' }}>
                    {saving ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </Stack>
            </form>
          </Box>
        )}
      </Stack>
    </Container>
  )
}


