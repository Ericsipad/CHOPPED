import { useEffect, useRef } from 'react'

interface DraggableDidAgentProps {
    onDock?: () => void
}

export default function DraggableDidAgent({ onDock }: DraggableDidAgentProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Check if script already exists
        const existing = document.querySelector('script[data-name="did-agent-floating"]')
        if (existing) return

        // D-ID configuration - simple working version
        const clientKey = 'Z29vZ2xlLW9hdXRoMnwxMDc5NTgwNzg3NjI5Nzc2NjE3Mjc6RXBaWnNzeWwxVVVLUldFRHZFbVRX'
        const agentId = 'v2_agt_lEvnXilr'

        // Create script exactly like the working version
        const script = document.createElement('script')
        script.type = 'module'
        script.src = 'https://agent.d-id.com/v2/index.js'
        script.setAttribute('data-mode', 'full')
        script.setAttribute('data-client-key', clientKey)
        script.setAttribute('data-agent-id', agentId)
        script.setAttribute('data-name', 'did-agent-floating')
        script.setAttribute('data-monitor', 'true')
        script.setAttribute('data-target-id', 'floating-did-container')

        document.body.appendChild(script)
        console.log('Floating D-ID: script injected')

        return () => {
            try {
                script.remove()
            } catch { /* noop */ }
        }
    }, [])

    return (
        <div
            style={{
                position: 'fixed',
                top: '100px',
                left: '100px',
                width: '420px',
                height: '580px',
                zIndex: 1100,
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
        >
            {/* Dock button */}
            <button
                type="button"
                onClick={onDock}
                style={{
                    position: 'absolute',
                    top: '-18px',
                    right: '-6px',
                    background: '#ffffff',
                    color: '#111111',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    zIndex: 3
                }}
            >
                Dock
            </button>

            <div
                id="floating-did-container"
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px'
                }}
            />
        </div>
    )
}