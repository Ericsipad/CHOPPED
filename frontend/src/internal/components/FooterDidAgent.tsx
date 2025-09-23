import { useEffect, useRef } from 'react'

export default function FooterDidAgent() {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        // Wait a bit for the container to be properly mounted and visible
        const timer = setTimeout(() => {
            const container = containerRef.current
            if (!container) {
                console.log('Footer D-ID Agent: container not found')
                return
            }

            // Check if container is visible and has dimensions
            if (container.offsetWidth === 0 || container.offsetHeight === 0) {
                console.log('Footer D-ID Agent: container not visible', container.offsetWidth, 'x', container.offsetHeight)
                return
            }

            // Check if script already exists
            const existing = document.querySelector('script[data-name="footer-did-agent"]')
            if (existing) {
                console.log('Footer D-ID Agent: script already exists')
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
        script.setAttribute('data-name', 'footer-did-agent')
        script.setAttribute('data-monitor', 'true')
        script.setAttribute('data-target-id', 'footer-did-container')

        script.addEventListener('load', () => {
            console.log('Footer D-ID Agent: script loaded')
        })
        script.addEventListener('error', (e) => {
            console.error('Footer D-ID Agent: script failed', e)
        })

            document.body.appendChild(script)
            console.log('Footer D-ID Agent: script injected')
        }, 500) // Wait 500ms for container to be ready

        return () => {
            clearTimeout(timer)
        }
    }, [])

    return (
        <div
            id="footer-did-container"
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '12px'
            }}
        />
    )
}
