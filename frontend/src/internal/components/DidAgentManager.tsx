import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Point = { top: number; left: number }

function isDesktop(): boolean {
    try { return window.matchMedia('(min-width: 1024px)').matches } catch { return true }
}

function isStandalonePWA(): boolean {
    try {
        return (
            (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
            ((window as any).navigator?.standalone === true)
        )
    } catch { return false }
}

interface DidAgentManagerProps {
    mode: 'docked' | 'floating'
    onModeChange: (mode: 'docked' | 'floating') => void
}

export default function DidAgentManager({ mode, onModeChange }: DidAgentManagerProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = useState<Point | null>(null)
    const [hasEmbeddedContent, setHasEmbeddedContent] = useState(false)
    const BASE_W = 420
    const BASE_H = 580
    const [scale, setScale] = useState<number>(() => {
        try {
            const raw = localStorage.getItem('did_agent_scale')
            if (raw) {
                const v = parseFloat(raw)
                if (!Number.isNaN(v) && v > 0) return v
            }
        } catch { /* noop */ }
        return 1
    })
    const draggingRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null)

    // Guard: only render on desktop and not in standalone PWA
    const shouldRender = typeof window !== 'undefined' && isDesktop() && !isStandalonePWA()

    // Load saved position for floating mode
    useEffect(() => {
        if (!shouldRender || mode !== 'floating') return
        try {
            const raw = localStorage.getItem('did_agent_position')
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Point>
                if (typeof parsed.top === 'number' && typeof parsed.left === 'number') {
                    setPosition({ top: parsed.top, left: parsed.left })
                }
            }
        } catch { /* noop */ }
    }, [shouldRender, mode])

    // Center initially if no saved position (floating mode only)
    useLayoutEffect(() => {
        if (!shouldRender || mode !== 'floating') return
        if (position !== null) return
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const center = () => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const rect = wrapper.getBoundingClientRect()
            const w = rect.width || 360
            const h = rect.height || 240
            const top = Math.max(0, Math.round((vh - h) / 2))
            const left = Math.max(0, Math.round((vw - w) / 2))
            setPosition({ top, left })
        }
        requestAnimationFrame(center)
        const t = window.setTimeout(center, 300)
        return () => window.clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldRender, mode])

    // Inject the DID script (only once)
    useEffect(() => {
        if (!shouldRender) return
        const container = containerRef.current
        if (!container) return

        // Avoid duplicate injection
        const existing = document.querySelector('script[data-name="did-agent-manager"]') as HTMLScriptElement | null
        if (existing) { return }

        // Use provided D-ID configuration
        const clientKey = 'Z29vZ2xlLW9hdXRoMnwxMDc5NTgwNzg3NjI5Nzc2NjE3Mjc6RXBaWnNzeWwxVVVLUldFRHZFbVRX'
        const agentId = 'v2_agt_lEvnXilr'

        const script = document.createElement('script')
        script.type = 'module'
        script.src = 'https://agent.d-id.com/v2/index.js'
        script.setAttribute('data-mode', 'full')
        script.setAttribute('data-client-key', clientKey)
        script.setAttribute('data-agent-id', agentId)
        script.setAttribute('data-name', 'did-agent-manager')
        script.setAttribute('data-monitor', 'true')
        script.setAttribute('data-target-id', 'did-agent-container-single')

        document.body.appendChild(script)

        return () => {
            try {
                script.remove()
            } catch { /* noop */ }
            try { container.innerHTML = '' } catch { /* noop */ }
        }
    }, [shouldRender])

    // Detect when the DID widget populates the container
    useEffect(() => {
        if (!shouldRender) return
        const el = containerRef.current
        if (!el) return
        const observer = new MutationObserver(() => {
            try {
                if (el.childNodes.length > 0) setHasEmbeddedContent(true)
            } catch { /* noop */ }
        })
        observer.observe(el, { childList: true, subtree: false })
        return () => observer.disconnect()
    }, [shouldRender])

    // Drag handlers (floating mode only)
    useEffect(() => {
        if (!shouldRender || mode !== 'floating') return
        const wrapper = wrapperRef.current
        if (!wrapper) return

        function onPointerDown(e: PointerEvent) {
            const target = e.target as HTMLElement
            if (!target || !target.closest('.did-agent-drag-handle')) return
            e.preventDefault()
            wrapper!.setPointerCapture(e.pointerId)
            const startTop = position?.top ?? wrapper!.offsetTop
            const startLeft = position?.left ?? wrapper!.offsetLeft
            draggingRef.current = { startX: e.clientX, startY: e.clientY, startTop, startLeft }
        }

        function onPointerMove(e: PointerEvent) {
            if (!draggingRef.current) return
            e.preventDefault()
            const { startX, startY, startTop, startLeft } = draggingRef.current
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY
            const vw = window.innerWidth
            const vh = window.innerHeight
            const rect = wrapper!.getBoundingClientRect()
            const effW = Math.max(rect.width, BASE_W * scale, 360)
            const effH = Math.max(rect.height, BASE_H * scale, 360)
            const newLeft = Math.min(Math.max(0, startLeft + deltaX), Math.max(0, vw - effW))
            const newTop = Math.min(Math.max(0, startTop + deltaY), Math.max(0, vh - effH))
            setPosition({ top: Math.round(newTop), left: Math.round(newLeft) })
        }

        function endDrag(e: PointerEvent) {
            if (!draggingRef.current) return
            try { wrapper!.releasePointerCapture(e.pointerId) } catch { /* noop */ }
            draggingRef.current = null
            // Persist position
            try {
                if (position) localStorage.setItem('did_agent_position', JSON.stringify(position))
            } catch { /* noop */ }
        }

        wrapper.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', endDrag)
        window.addEventListener('pointercancel', endDrag)

        return () => {
            wrapper.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', endDrag)
            window.removeEventListener('pointercancel', endDrag)
        }
    }, [shouldRender, position, mode, scale])

    // Clamp position on resize (floating mode only)
    useEffect(() => {
        if (!shouldRender || mode !== 'floating') return
        const wrapper = wrapperRef.current
        if (!wrapper) return
        function clamp() {
            if (!position) return
            const rect = wrapper!.getBoundingClientRect()
            const effW = Math.max(rect.width, BASE_W * scale, 360)
            const effH = Math.max(rect.height, BASE_H * scale, 360)
            const vw = window.innerWidth
            const vh = window.innerHeight
            const left = Math.min(Math.max(0, position.left), Math.max(0, vw - effW))
            const top = Math.min(Math.max(0, position.top), Math.max(0, vh - effH))
            if (left !== position.left || top !== position.top) setPosition({ top, left })
        }
        window.addEventListener('resize', clamp)
        return () => window.removeEventListener('resize', clamp)
    }, [shouldRender, position, scale, mode])

    // Persist scale when it changes
    useEffect(() => {
        try { localStorage.setItem('did_agent_scale', String(scale)) } catch { /* noop */ }
    }, [scale])

    if (!shouldRender) return null

    // Docked mode: render for footer embedding
    if (mode === 'docked') {
        return (
            <div
                ref={wrapperRef}
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '12.5vw',
                    width: '300px',
                    height: '180px',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div
                    id="did-agent-container-single"
                    ref={containerRef}
                    style={{
                        width: '280px',
                        height: '180px',
                        background: hasEmbeddedContent ? 'transparent' : 'rgba(0,0,0,0.1)',
                        border: hasEmbeddedContent ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        boxShadow: hasEmbeddedContent ? 'none' : '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                />
            </div>
        )
    }

    // Floating mode: draggable behavior
    return (
        <div
            ref={wrapperRef}
            className="did-agent-draggable"
            style={{ position: 'fixed', top: position?.top ?? 0, left: position?.left ?? 0, zIndex: 1100, width: BASE_W * scale, height: BASE_H * scale }}
        >
            {/* Left: size toggle button */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setScale(prev => (prev < 1 ? 1 : 1/4)); }}
                style={{ position: 'absolute', top: -18, left: -6, zIndex: 3, background: '#ffffff', color: '#111111', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '4px 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                aria-pressed={scale < 1}
                aria-label={scale < 1 ? 'Expand avatar' : 'Minimize avatar'}
                title={scale < 1 ? 'Expand' : 'Minimize'}
            >
                <span style={{ fontSize: 12, fontWeight: 700 }}>{scale < 1 ? 'Expand' : 'Minimize'}</span>
                <span aria-hidden="true" style={{ fontSize: 12 }}>↕↔</span>
            </button>

            {/* Right: dock button (changes to dock/minimize based on mode) */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onModeChange('docked'); }}
                className="did-agent-drag-handle"
                style={{ position: 'absolute', top: -18, right: -6, zIndex: 3, background: '#ffffff', color: '#111111', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '4px 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                aria-label="Dock to footer"
                title="Dock"
            >
                <span style={{ fontSize: 12, fontWeight: 700 }}>Dock</span>
                <span aria-hidden="true" style={{ fontSize: 12 }}>⤓</span>
            </button>

            <div
                id="did-agent-container-single"
                ref={containerRef}
                style={{
                    width: BASE_W,
                    height: BASE_H,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: hasEmbeddedContent ? 'transparent' : 'rgba(0,0,0,0.2)',
                    border: hasEmbeddedContent ? 'none' : '1px solid rgba(255,255,255,0.35)',
                    borderRadius: 12,
                    boxShadow: hasEmbeddedContent ? 'none' : '0 8px 24px rgba(0,0,0,0.35)'
                }}
            />
        </div>
    )
}
