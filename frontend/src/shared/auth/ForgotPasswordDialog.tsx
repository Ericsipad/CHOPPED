import React, { useCallback, useMemo, useState } from 'react'
import { getBackendApi } from '../../lib/config'

export type ForgotPasswordDialogProps = {
  open: boolean
  onClose: () => void
}

export default function ForgotPasswordDialog(props: ForgotPasswordDialogProps) {
  const { open, onClose } = props
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isValid = useMemo(() => /.+@.+\..+/.test(email), [email])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const url = getBackendApi('/auth/password-reset')
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || 'Request failed')
      }
      setMessage('If an account exists, we sent a reset link.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [email, isValid, submitting])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Forgot password dialog" style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>Reset your password</div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            <span style={styles.labelText}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </label>
          {error ? <div style={styles.error}>{error}</div> : null}
          {message ? <div style={styles.success}>{message}</div> : null}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={submitting}>Close</button>
            <button type="submit" style={styles.submitBtn} disabled={!isValid || submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    width: 'min(92vw, 420px)',
    background: '#111',
    color: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    padding: 20,
    border: '1px solid rgba(255,255,255,0.08)'
  },
  header: {
    fontSize: 22,
    marginBottom: 12,
    fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', gap: 6 },
  labelText: { fontSize: 14, opacity: 0.9 },
  input: {
    background: '#000',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 16,
    outline: 'none',
  },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: {
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: 9999,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  submitBtn: {
    background: '#fff',
    color: '#111',
    border: 'none',
    borderRadius: 9999,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  error: { color: '#ff7676', fontSize: 14 },
  success: { color: '#6ee7b7', fontSize: 14 },
}


