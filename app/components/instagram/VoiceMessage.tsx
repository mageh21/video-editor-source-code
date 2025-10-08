import React, { useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessageProps {
  duration: number;
  waveform?: number[];
  isPlaying?: boolean;
  currentTime?: number;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  duration,
  waveform,
  isPlaying = false,
  currentTime = 0,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  // Generate default waveform if not provided
  const waveformData = useMemo(() => {
    if (waveform && waveform.length > 0) return waveform;
    
    // Generate random waveform data
    const bars = 40;
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  }, [waveform]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${12 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
    borderRadius: `${18 * presentationScale}px`,
    minWidth: `${200 * presentationScale}px`,
    position: 'relative',
  };

  const playButtonStyle: React.CSSProperties = {
    width: `${32 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: isIncoming ? '#E4405F' : '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const waveformContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: `${2 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
  };

  const durationStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    fontWeight: 500,
    marginLeft: `${8 * presentationScale}px`,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div style={containerStyle}>
      <div style={playButtonStyle}>
        {isPlaying ? (
          <Pause 
            size={16 * presentationScale} 
            color={isIncoming ? '#FFFFFF' : '#E4405F'}
            strokeWidth={2}
          />
        ) : (
          <Play 
            size={16 * presentationScale} 
            color={isIncoming ? '#FFFFFF' : '#E4405F'}
            strokeWidth={2}
            style={{ marginLeft: 2 * presentationScale }}
          />
        )}
      </div>
      
      <div style={waveformContainerStyle}>
        {waveformData.map((amplitude, index) => {
          const barProgress = index / waveformData.length;
          const isPlayed = barProgress <= progress;
          
          const barStyle: React.CSSProperties = {
            width: `${3 * presentationScale}px`,
            height: `${amplitude * 24 * presentationScale}px`,
            backgroundColor: isPlayed 
              ? (isIncoming ? '#E4405F' : '#FFFFFF')
              : (isIncoming ? 'rgba(142, 142, 142, 0.5)' : 'rgba(255, 255, 255, 0.5)'),
            borderRadius: `${1.5 * presentationScale}px`,
            transition: 'background-color 0.2s ease',
          };
          
          return <div key={index} style={barStyle} />;
        })}
      </div>
      
      <span style={durationStyle}>
        {formatDuration(duration)}
      </span>
    </div>
  );
};