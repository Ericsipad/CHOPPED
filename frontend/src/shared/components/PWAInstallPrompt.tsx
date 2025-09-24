import { useEffect, useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';

interface PWAInstallPromptProps {
  isVisible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PWAInstallPrompt({ isVisible, onInstall, onDismiss }: PWAInstallPromptProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Slight delay to ensure smooth animation
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: isAnimating ? 'auto' : 'none'
        }}
        onClick={onDismiss}
      />
      
      {/* Slide-up panel */}
      <GlassContainer
        variant="modal"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1a1a1a',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '24px',
          zIndex: 10000,
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />

        {/* App icon placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#1e90ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            C
          </div>
          <div>
            <div
              style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '4px',
              }}
            >
              CHOPPED
            </div>
            <div
              style={{
                color: '#888',
                fontSize: '14px',
              }}
            >
              Real Dating App
            </div>
          </div>
        </div>

        {/* Main message */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          Install the app for the best experience
        </div>
        
        <div
          style={{
            color: '#aaa',
            fontSize: '14px',
            marginBottom: '24px',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          Get faster access, offline support, and a native app experience
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <GlassButton
            variant="secondary"
            onClick={onDismiss}
            style={{
              flex: '0 0 auto',
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
          >
            Not Now
          </GlassButton>
          
          <GlassButton
            variant="primary"
            onClick={onInstall}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: '#1e90ff',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
          >
            Install App
          </GlassButton>
        </div>
      </GlassContainer>
    </>
  );
}


