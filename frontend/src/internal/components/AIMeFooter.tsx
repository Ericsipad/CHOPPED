import aimeStillImage from '../../assets/Aime_image_still.png'
import { useState } from 'react'

interface AIMeFooterProps {
    onPopOutDidAgent: () => void
}

export default function AIMeFooter({ onPopOutDidAgent }: AIMeFooterProps) {
    const [isRotated, setIsRotated] = useState(false)
    return (
        <div
            className="ai-me-footer"
            style={{
                position: 'fixed',
                bottom: '20px',
                // left and transform handled by CSS for proper sidebar-aware centering
                width: 'fit-content',
                minWidth: '1080px',
                maxWidth: 'min(1480px, calc(100vw - 280px))',
                height: '185px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                display: 'flex',
                overflow: 'hidden'
            }}
        >
            {/* Left side: AI-me D-ID Agent (permanent) */}
            <div
                style={{
                    width: '300px',
                    height: '100%',
                    borderRadius: '20px 0 0 20px',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Toggle arrow overlay */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsRotated(!isRotated)
                        onPopOutDidAgent()
                    }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease, transform 0.3s ease',
                        transform: `rotate(${isRotated ? 180 : 0}deg)`
                    }}
                    aria-label="Toggle D-ID agent visibility"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)'
                        e.currentTarget.style.transform = `rotate(${isRotated ? 180 : 0}deg) scale(1.05)`
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                        e.currentTarget.style.transform = `rotate(${isRotated ? 180 : 0}deg) scale(1)`
                    }}
                >
                    ⬈
                </button>

                {/* AI-me Still Image */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '20px 0 0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src={aimeStillImage}
                        alt="AI-me Assistant"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '20px 0 0 20px'
                        }}
                    />
                </div>
            </div>

            {/* Right side: Dynamic content area */}
            <div
                style={{
                    flex: 1,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}
            >
                <h2
                    style={{
                        color: '#ffffff',
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: '0 0 12px 0',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    Meet AI-me — Your Personal Matchmaking Guide 💘
                </h2>
                <p
                    style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        margin: 0,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    AI-me isn't just another chatbot. She's your smart, intuitive companion on the journey to meaningful connection. Instead of tedious forms, AI-me uses natural conversation to guide you through our proprietary 500-point matching system — designed to uncover what truly matters to you.
                    <br />
                    As you chat, she learns your preferences and builds a personalized profile to match you with handpicked personalities who align with your vibe. The more you share, the better your matches become.
                    <br />
                    ✨ Want to help us find your perfect partner? Share Chopped on social media so they can sign up too — and let AI-me do the rest.
                </p>
            </div>
        </div>
    )
}
