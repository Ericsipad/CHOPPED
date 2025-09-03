import { useEffect, useRef, useState } from 'react'
import { getSupabaseClient, authorizeFromBackend, getCurrentAccessToken } from '../../lib/supabase'
import { getBackendApi } from '../../lib/config'
import { fetchLatestMessages, fetchOlderMessages, insertMessage, type DbChatMessage } from '../../lib/chat'

type ChatMessage = {
  id: string
  text: string
  sender: 'me' | 'other'
  createdAt: number
  status?: 'sending' | 'sent' | 'error'
}

type ChatModalProps = {
  isOpen: boolean
  onClose: () => void
  otherUserLabel?: string
  initialMessages?: ChatMessage[]
  otherUserId?: string
}

export default function ChatModal(props: ChatModalProps) {
  const { isOpen, onClose, otherUserLabel, initialMessages, otherUserId } = props
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages || [])
  const [pendingText, setPendingText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [threadId, setThreadId] = useState<string>('')
  const [myMongoId, setMyMongoId] = useState<string>('')
  const [mySupabaseId, setMySupabaseId] = useState<string>('')
  const [loadingOlder, setLoadingOlder] = useState(false)

  // Colors (best guess per request)
  const magenta = '#ff2ec6'
  const electricBlue = '#00b7ff'

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    // Focus the textarea on open, but defer one tick to avoid layout issues
    const id = window.setTimeout(() => {
      const t = textareaRef.current
      if (t) {
        t.focus()
        const len = t.value.length
        try { t.setSelectionRange(len, len) } catch {}
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [isOpen])

  // Basic focus trap within the modal
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      const list = Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter((el) => !el.hasAttribute('disabled'))
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Window keydown (capture) to prioritize ChatModal over other dialogs for Escape
  useEffect(() => {
    if (!isOpen) return
    function onKeyDownCapture(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDownCapture, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDownCapture, { capture: true } as any)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const id = window.setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      el.scrollTop = el.scrollHeight
    }, 0)
    return () => window.clearTimeout(id)
  }, [isOpen, messages.length])

  // Compute myMongoId and threadId when opened
  useEffect(() => {
    if (!isOpen) return
    try {
      const raw = localStorage.getItem('chopped.mongoUserId')
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: string; ts?: number }
        if (parsed && typeof parsed.id === 'string' && parsed.id) {
          setMyMongoId(parsed.id)
        }
      }
    } catch {}
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!myMongoId || !otherUserId) { setThreadId(''); return }
    const a = myMongoId
    const b = otherUserId
    const tid = a < b ? `${a}__${b}` : `${b}__${a}`
    setThreadId(tid)
  }, [isOpen, myMongoId, otherUserId])

  // Fetch access token, set realtime auth, fetch supabase user id, load latest messages, subscribe
  useEffect(() => {
    if (!isOpen || !threadId) return
    let cancelled = false
    async function run() {
      try {
        const supabase = getSupabaseClient()
        const token = await authorizeFromBackend()
        if (!token || cancelled) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user && !cancelled) setMySupabaseId(user.id)

        // Ensure thread exists via backend to satisfy FK
        try {
          const ensureRes = await fetch(getBackendApi('/api/chat/threads/ensure'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otherUserMongoId: otherUserId }),
          })
          if (!ensureRes.ok) {
            // proceed anyway; insert will fail if FK missing
          }
        } catch {}

        const latest = await fetchLatestMessages(threadId, 50)
        if (cancelled) return
        const mapped = latest
          .slice()
          .reverse()
          .map(rowToUi(myMongoId))
        setMessages(mapped)

        const channel = supabase.channel(`chat:${threadId}`, { config: { broadcast: { self: false }, presence: { key: myMongoId }, private: true } as any })
        channel.on('broadcast', { event: 'INSERT' }, (payload: any) => {
          try {
            const rec = (payload?.payload?.record || payload?.record) as DbChatMessage | undefined
            if (!rec || rec.thread_id !== threadId) return
            const ui = rowToUi(myMongoId)(rec)
            setMessages((m) => [...m, ui])
          } catch {}
        })
        await channel.subscribe()

        return () => { supabase.removeChannel(channel) }
      } catch {
        // ignore
      }
    }
    run()
    return () => { cancelled = true }
  }, [isOpen, threadId, myMongoId])

  if (!isOpen) return null
  // Allow modal to render visually before any async logic
  // We only guard async effects using threadId; UI should still render
  const invalidTarget = !otherUserId || otherUserId.length === 0

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    // Intentionally do not close on backdrop click, and block propagation
    e.stopPropagation()
  }

  async function handleLoadOlder() {
    if (loadingOlder || messages.length === 0 || !threadId) return
    setLoadingOlder(true)
    try {
      const oldest = messages[0]
      const rows = await fetchOlderMessages(threadId, new Date(oldest.createdAt).toISOString(), 50)
      const mapped = rows
        .slice()
        .reverse()
        .map(rowToUi(myMongoId))
      setMessages((m) => [...mapped, ...m])
    } finally {
      setLoadingOlder(false)
    }
  }

  function handleSend() {
    const text = pendingText.trim()
    if (!text) return
    if (!otherUserId) {
      console.error('[ChatModal] Missing otherUserId; cannot send')
      return
    }
    setIsSending(true)
    const optimistic: ChatMessage = {
      id: 'local-' + Date.now().toString(36),
      text,
      sender: 'me',
      createdAt: Date.now(),
      status: 'sending',
    }
    setMessages((m) => [...m, optimistic])
    setPendingText('')
    ;(async () => {
      try {
        // Ensure auth token available for PostgREST
        if (!getCurrentAccessToken()) {
          await authorizeFromBackend().catch(() => null)
        }
        // Ensure we know Supabase user id for RLS equality
        const supabase = getSupabaseClient()
        if (!mySupabaseId) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.id) setMySupabaseId(user.id)
        }
        const senderId = mySupabaseId || (await supabase.auth.getUser()).data.user?.id || ''
        // Ensure thread exists (idempotent)
        try {
          await fetch(getBackendApi('/api/chat/threads/ensure'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otherUserMongoId: otherUserId }),
          })
        } catch {}
        // Compute local thread id if state not yet updated
        const localThreadId = threadId || (() => {
          if (!myMongoId) {
            try {
              const raw = localStorage.getItem('chopped.mongoUserId')
              if (raw) {
                const parsed = JSON.parse(raw) as { id?: string }
                if (parsed?.id) setMyMongoId(parsed.id)
              }
            } catch {}
          }
          const a = myMongoId
          const b = otherUserId
          return a && b ? (a < b ? `${a}__${b}` : `${b}__${a}`) : ''
        })()
        // Insert into DB
        await insertMessage({
          thread_id: localThreadId,
          sender_mongo_id: myMongoId,
          recipient_mongo_id: otherUserId,
          body: text,
        })
        setMessages((m) => m.map((msg) => msg.id === optimistic.id ? { ...msg, status: 'sent' } : msg))
      } catch (e) {
        console.error('[ChatModal] send failed', e)
        // Try to refresh token once, then retry insert
        try {
          const token = await authorizeFromBackend()
          if (token) {
            const supabase = getSupabaseClient()
            const { data: { user } } = await supabase.auth.getUser()
            const senderId2 = user?.id || mySupabaseId
            const localThreadId2 = threadId || (() => {
              const a = myMongoId
              const b = otherUserId
              return a && b ? (a < b ? `${a}__${b}` : `${b}__${a}`) : ''
            })()
            await insertMessage({ thread_id: localThreadId2, sender_mongo_id: myMongoId, recipient_mongo_id: otherUserId, body: text })
            setMessages((m) => m.map((msg) => msg.id === optimistic.id ? { ...msg, status: 'sent' } : msg))
            return
          }
        } catch {}
        setMessages((m) => m.map((msg) => msg.id === optimistic.id ? { ...msg, status: 'error' } : msg))
      } finally {
        setIsSending(false)
      }
    })()
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={otherUserLabel ? `Chat with ${otherUserLabel}` : 'Chat'}
      onClick={handleOverlayClick}
      style={styles.overlay}
    >
      <div ref={dialogRef} style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>{otherUserLabel || 'Chat'}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeBtn}>×</button>
        </div>
        {invalidTarget ? (
          <div style={styles.body}>
            <div style={styles.empty}>No recipient selected.</div>
          </div>
        ) : (
        <div ref={scrollRef} style={styles.body}>
          {messages.length === 0 ? (
            <div style={styles.empty}>
              Start the conversation
            </div>
          ) : (
            <div style={styles.list}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                <button type="button" onClick={handleLoadOlder} disabled={loadingOlder || !threadId} style={{ ...styles.sendBtn, opacity: (loadingOlder || !threadId) ? 0.6 : 1 }}>Load older</button>
              </div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  text={msg.text}
                  isOwn={msg.sender === 'me'}
                  status={msg.status}
                  magenta={magenta}
                  electricBlue={electricBlue}
                />
              ))}
            </div>
          )}
        </div>
        )}
        <div style={styles.footer}>
          <textarea
            ref={textareaRef}
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Type a message"
            rows={1}
            style={styles.textarea}
          />
          <button type="button" onClick={handleSend} disabled={isSending || pendingText.trim().length === 0} style={{ ...styles.sendBtn, opacity: (isSending || pendingText.trim().length === 0) ? 0.6 : 1 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ text, isOwn, status, magenta, electricBlue }: { text: string; isOwn: boolean; status?: ChatMessage['status']; magenta: string; electricBlue: string }) {
  const color = isOwn ? electricBlue : magenta
  const bubbleStyle: React.CSSProperties = {
    maxWidth: '70%',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    border: `2px solid ${color}`,
    borderRadius: 18,
    padding: '8px 12px',
    color: '#fff',
    background: 'rgba(0,0,0,0.25)',
    boxShadow: `0 0 12px ${toRgba(color, 0.55)}`,
    margin: '6px 0',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  }
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <div style={bubbleStyle}>
        <div>{text}</div>
        {status && status !== 'sent' ? (
          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4 }}>{status === 'sending' ? 'Sending…' : status}</div>
        ) : null}
      </div>
    </div>
  )
}

function toRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '')
  const bigint = parseInt(c, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function rowToUi(myMongoId: string) {
  return (row: DbChatMessage): ChatMessage => ({
    id: row.id,
    text: row.body,
    sender: row.sender_mongo_id === myMongoId ? 'me' : 'other',
    createdAt: new Date(row.created_at).getTime(),
    status: 'sent',
  })
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  },
  card: {
    width: '60vw', height: '80vh', maxWidth: 1000, background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', color: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
  },
  header: {
    position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 14, fontWeight: 800, letterSpacing: 0.6,
  },
  closeBtn: {
    position: 'absolute', top: 6, right: 8, height: 28, width: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  empty: {
    opacity: 0.8, textAlign: 'center', marginTop: 24,
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.08)', padding: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end',
  },
  textarea: {
    resize: 'none', maxHeight: 120, minHeight: 34, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.35)', color: '#fff', outline: 'none',
  },
  sendBtn: {
    background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700,
  },
}


