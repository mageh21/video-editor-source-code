import React from 'react';

interface TypingIndicatorProps {
  presentationScale?: number;
  bubbleColor?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  presentationScale = 1,
  bubbleColor = '#F1F3F4'
}) => {
  const dotStyle: React.CSSProperties = {
    width: `${8 * presentationScale}px`,
    height: `${8 * presentationScale}px`,
    backgroundColor: '#8E8E8E',
    borderRadius: '50%',
    display: 'inline-block',
    margin: `0 ${2 * presentationScale}px`,
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: bubbleColor,
    padding: `${12 * presentationScale}px ${16 * presentationScale}px`,
    borderRadius: `${18 * presentationScale}px`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: `${60 * presentationScale}px`,
    height: `${40 * presentationScale}px`,
  };

  // Create a keyframe animation dynamically for different scales
  const animationName = `typing-bounce-${presentationScale.toString().replace('.', '-')}`;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ${animationName} {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-${10 * presentationScale}px);
        opacity: 1;
      }
    }
  `;
  if (typeof document !== 'undefined' && !document.querySelector(`style[data-animation="${animationName}"]`)) {
    style.setAttribute('data-animation', animationName);
    document.head.appendChild(style);
  }

  return (
    <div style={containerStyle}>
      <span 
        style={{
          ...dotStyle,
          animation: `${animationName} 1.4s infinite ease-in-out`,
          animationDelay: '0s'
        }} 
      />
      <span 
        style={{
          ...dotStyle,
          animation: `${animationName} 1.4s infinite ease-in-out`,
          animationDelay: '0.16s'
        }} 
      />
      <span 
        style={{
          ...dotStyle,
          animation: `${animationName} 1.4s infinite ease-in-out`,
          animationDelay: '0.32s'
        }} 
      />
    </div>
  );
};