import React from 'react';
import { Music, Play } from 'lucide-react';

interface MusicMessageProps {
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const MusicMessage: React.FC<MusicMessageProps> = ({
  title,
  artist,
  albumArt,
  duration,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
    borderRadius: `${18 * presentationScale}px`,
    padding: `${12 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    gap: `${12 * presentationScale}px`,
    minWidth: `${260 * presentationScale}px`,
  };

  const albumArtStyle: React.CSSProperties = {
    width: `${48 * presentationScale}px`,
    height: `${48 * presentationScale}px`,
    borderRadius: `${8 * presentationScale}px`,
    objectFit: 'cover',
    flexShrink: 0,
  };

  const musicInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: `${14 * presentationScale}px`,
    fontWeight: 600,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    marginBottom: `${2 * presentationScale}px`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const artistStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    opacity: 0.8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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

  const durationStyle: React.CSSProperties = {
    fontSize: `${11 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    opacity: 0.7,
    marginTop: `${4 * presentationScale}px`,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={containerStyle}>
      <img 
        src={albumArt} 
        alt={`${title} album art`} 
        style={albumArtStyle}
      />
      <div style={musicInfoStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={artistStyle}>{artist}</div>
        <div style={durationStyle}>{formatDuration(duration)}</div>
      </div>
      <div style={playButtonStyle}>
        <Play 
          size={16 * presentationScale} 
          color={isIncoming ? '#FFFFFF' : '#E4405F'}
          fill={isIncoming ? '#FFFFFF' : '#E4405F'}
          style={{ marginLeft: 2 * presentationScale }}
        />
      </div>
    </div>
  );
};