import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusProps {
  status?: 'pending' | 'sent' | 'delivered' | 'seen';
  seenAt?: string;
  presentationScale?: number;
  isIncoming?: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  seenAt,
  presentationScale = 1,
  isIncoming = false
}) => {
  // Don't show status for incoming messages
  if (isIncoming) return null;
  if (!status || status === 'pending') return null;

  const iconSize = 14 * presentationScale;
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${4 * presentationScale}px`,
    marginTop: `${2 * presentationScale}px`,
    fontSize: `${11 * presentationScale}px`,
    color: '#8E8E8E',
  };

  const iconStyle: React.CSSProperties = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
  };

  const seenTextStyle: React.CSSProperties = {
    fontSize: `${11 * presentationScale}px`,
    color: '#8E8E8E',
    fontWeight: 400,
  };

  return (
    <div style={containerStyle}>
      {status === 'sent' && (
        <Check style={iconStyle} strokeWidth={2} />
      )}
      {status === 'delivered' && (
        <CheckCheck style={iconStyle} strokeWidth={2} />
      )}
      {status === 'seen' && (
        <>
          <span style={seenTextStyle}>Seen</span>
          {seenAt && <span style={seenTextStyle}>{seenAt}</span>}
        </>
      )}
    </div>
  );
};