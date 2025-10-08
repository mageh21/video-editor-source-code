import React from 'react';
import { Play } from 'lucide-react';

interface VideoMessageProps {
  src: string;
  thumbnail?: string;
  duration?: number | string;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const VideoMessage: React.FC<VideoMessageProps> = ({
  src,
  thumbnail,
  duration,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: `${240 * presentationScale}px`,
    height: `${180 * presentationScale}px`,
    borderRadius: `${18 * presentationScale}px`,
    overflow: 'hidden',
    backgroundColor: '#000',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const playButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${48 * presentationScale}px`,
    height: `${48 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  const durationStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `${8 * presentationScale}px`,
    right: `${8 * presentationScale}px`,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    padding: `${2 * presentationScale}px ${6 * presentationScale}px`,
    borderRadius: `${4 * presentationScale}px`,
    fontSize: `${11 * presentationScale}px`,
    fontWeight: 500,
  };

  const formatDuration = (dur: number | string | undefined) => {
    if (!dur) return '0:00';
    const seconds = typeof dur === 'string' ? parseInt(dur) : dur;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={containerStyle}>
      <img 
        src={thumbnail || src} 
        alt="Video thumbnail" 
        style={imageStyle}
      />
      <div style={playButtonStyle}>
        <Play 
          size={20 * presentationScale} 
          color="#000000"
          fill="#000000"
          style={{ marginLeft: 2 * presentationScale }}
        />
      </div>
      {duration && (
        <div style={durationStyle}>
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
};