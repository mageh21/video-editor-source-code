import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface DoubleTapAnimationProps {
  onDoubleTap: () => void;
  children: React.ReactNode;
  presentationScale?: number;
}

export const DoubleTapAnimation: React.FC<DoubleTapAnimationProps> = ({
  onDoubleTap,
  children,
  presentationScale = 1
}) => {
  const [showHeart, setShowHeart] = useState(false);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentTime = Date.now();
    const tapDelay = currentTime - lastTap;
    
    if (tapDelay < 300 && tapDelay > 0) {
      // Double tap detected
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setTapPosition({ x, y });
      setShowHeart(true);
      onDoubleTap();
      
      // Reset animation after duration
      setTimeout(() => {
        setShowHeart(false);
      }, 1000);
    }
    
    setLastTap(currentTime);
  };

  const heartStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${tapPosition.x}px`,
    top: `${tapPosition.y}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 100,
    animation: showHeart ? 'doubleTapHeart 1s ease-out forwards' : 'none',
  };

  // Add keyframes for animation
  useEffect(() => {
    const styleId = 'double-tap-heart-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes doubleTapHeart {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          30% {
            transform: translate(-50%, -50%) scale(0.95);
          }
          45% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div 
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={handleTap}
    >
      {children}
      {showHeart && (
        <div style={heartStyle}>
          <Heart 
            size={80 * presentationScale} 
            fill="#FF0033"
            color="#FF0033"
          />
        </div>
      )}
    </div>
  );
};