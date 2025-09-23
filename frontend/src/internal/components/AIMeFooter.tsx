interface AIMeFooterProps {
    onPopOutDidAgent: () => void
    didAgentComponent: React.ReactNode
}

export default function AIMeFooter({ onPopOutDidAgent, didAgentComponent }: AIMeFooterProps) {
    return (
        <div
            className="ai-me-footer"
            style={{
                position: 'fixed',
                bottom: '20px',
                // left and transform handled by CSS for proper sidebar-aware centering
                width: 'fit-content',
                minWidth: '800px',
                maxWidth: 'min(1200px, calc(100vw - 280px))',
                height: '200px',
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
                {/* Pop out button overlay */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        console.log('Pop Out button clicked')
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
                        borderRadius: '20px 0 0 20px'
                    }}
                >
                    {didAgentComponent}
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
                    ASK AI-me!
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
                    AI-me is your guide to dating and relationships. She is here to walk you through our proprietary 500 point matching system with normal conversation instead of boring forms. Over time she will ask questions and build your profile to help match you with the best available personalities hand picked for you. So please share Chopped on your social media so your perfect partner signs up and we can find them.
                </p>
                <div
                    style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontStyle: 'italic'
                    }}
                >
                    • Dynamic content area •
                </div>
            </div>
        </div>
    )
}
