import { useState } from 'react'

interface AIMeFooterProps {
    onPopOutDidAgent: () => void
    didAgentComponent?: React.ReactNode
}

export default function AIMeFooter({ onPopOutDidAgent, didAgentComponent }: AIMeFooterProps) {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(90vw, 800px)',
                height: '400px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                display: 'flex',
                overflow: 'hidden'
            }}
        >
            {/* Close button */}
            <button
                type="button"
                onClick={() => setIsVisible(false)}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    zIndex: 2
                }}
                aria-label="Close footer"
            >
                ×
            </button>

            {/* Left side: D-ID Agent */}
            <div
                style={{
                    width: '300px',
                    height: '100%',
                    borderRadius: '20px 0 0 20px',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer'
                }}
                onClick={onPopOutDidAgent}
            >
                {/* Pop out button overlay */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onPopOutDidAgent()
                    }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}
                    aria-label="Pop out D-ID agent"
                >
                    Pop Out
                </button>

                {/* D-ID Agent container */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '20px 0 0 20px'
                    }}
                >
                    {didAgentComponent || (
                        <div
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                textAlign: 'center',
                                padding: '20px'
                            }}
                        >
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                                AI-me Agent
                            </div>
                            <div style={{ fontSize: '12px' }}>
                                Click to activate
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side: Text content */}
            <div
                style={{
                    flex: 1,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}
            >
                <h2
                    style={{
                        color: '#ffffff',
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: '0 0 16px 0',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    ASK AI-me!
                </h2>
                <p
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: 0,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    AI-me is your guide to dating and relationships. She is here to walk you through our proprietary 500 point matching system with normal conversation instead of boring forms. Over time she will ask questions and build your profile to help match you with the best available personalities hand picked for you. So please share Chopped on your social media so your perfect partner signs up and we can find them.
                </p>
            </div>
        </div>
    )
}
