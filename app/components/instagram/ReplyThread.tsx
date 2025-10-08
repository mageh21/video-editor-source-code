import React from 'react';

interface ReplyThreadProps {
  isStart: boolean;
  isEnd: boolean;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const ReplyThread: React.FC<ReplyThreadProps> = ({
  isStart,
  isEnd,
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const threadLineStyle: React.CSSProperties = {
    position: 'absolute',
    [isIncoming ? 'left' : 'right']: `${-20 * presentationScale}px`,
    width: `${2 * presentationScale}px`,
    backgroundColor: theme.textLight || '#E0E0E0',
    opacity: 0.5,
  };

  const connectorStyle: React.CSSProperties = {
    position: 'absolute',
    [isIncoming ? 'left' : 'right']: `${-20 * presentationScale}px`,
    width: `${12 * presentationScale}px`,
    height: `${2 * presentationScale}px`,
    backgroundColor: theme.textLight || '#E0E0E0',
    opacity: 0.5,
    top: '50%',
    transform: 'translateY(-50%)',
  };

  if (isStart) {
    return (
      <>
        <div style={{
          ...threadLineStyle,
          top: '50%',
          bottom: 0,
        }} />
        <div style={connectorStyle} />
      </>
    );
  }

  if (isEnd) {
    return (
      <>
        <div style={{
          ...threadLineStyle,
          top: 0,
          height: '50%',
        }} />
        <div style={connectorStyle} />
      </>
    );
  }

  // Middle message in thread
  return (
    <>
      <div style={{
        ...threadLineStyle,
        top: 0,
        bottom: 0,
      }} />
      <div style={connectorStyle} />
    </>
  );
};