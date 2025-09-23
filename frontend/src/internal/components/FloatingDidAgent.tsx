import { useEffect, useRef, useState } from 'react'

type FloatingDidAgentProps = {
    onDock: () => void
}

export default function FloatingDidAgent({ onDock }: FloatingDidAgentProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const [position] = useState({ top: 100, left: 100 })

    useEffect(() => {
        // Wait a bit for the container to be properly mounted and visible
        const timer = setTimeout(() => {
            const container = containerRef.current
            if (!container) {
                console.log('Floating D-ID Agent: container not found')
                return
            }

            // Check if container is visible and has dimensions
            if (container.offsetWidth === 0 || container.offsetHeight === 0) {
                console.log('Floating D-ID Agent: container not visible', container.offsetWidth, 'x', container.offsetHeight)
                return
            }

            // Check if script already exists
            const existing = document.querySelector('script[data-name="floating-did-agent"]')
            if (existing) {
                console.log('Floating D-ID Agent: script already exists')
                return
            }

        // D-ID configuration
        const clientKey = 'Z29vZ2xlLW9hdXRoMnwxMDc5NTgwNzg3NjI5Nzc2NjE3Mjc6RXBaWnNzeWwxVVVLUldFRHZFbVRX'
        const agentId = 'v2_agt_lEvnXilr'

        // Create and inject script
        const script = document.createElement('script')
        script.type = 'module'
        script.src = 'https://agent.d-id.com/v2/index.js'
        script.setAttribute('data-mode', 'full')
        script.setAttribute('data-client-key', clientKey)
        script.setAttribute('data-agent-id', agentId)
        script.setAttribute('data-name', 'floating-did-agent')
        script.setAttribute('data-monitor', 'true')
        script.setAttribute('data-target-id', 'floating-did-container')

        script.addEventListener('load', () => {
            console.log('Floating D-ID Agent: script loaded')
        })
        script.addEventListener('error', (e) => {
            console.error('Floating D-ID Agent: script failed', e)
        })

            document.body.appendChild(script)
            console.log('Floating D-ID Agent: script injected')
        }, 500) // Wait 500ms for container to be ready

        return () => {
            clearTimeout(timer)
        }
    }, [])

    return (
        <div
            ref={wrapperRef}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                width: '420px',
                height: '580px',
                zIndex: 1100,
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)'
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
                    zIndex: 3,
                    background: '#ffffff',
                    color: '#111111',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700
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
