import React from 'react';
import { InstagramConversation } from '@/app/types';
import { MessageCircle } from 'lucide-react';

interface InstagramTimelineElementProps {
  conversation: InstagramConversation;
  isSelected: boolean;
  width: number;
  height: number;
  onSelect: () => void;
}

export const InstagramTimelineElement: React.FC<InstagramTimelineElementProps> = ({
  conversation,
  isSelected,
  width,
  height,
  onSelect,
}) => {
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: isSelected ? '#C13584' : '#E4405F',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    cursor: 'move',
    border: isSelected ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.3)',
    overflow: 'hidden',
    position: 'relative',
    backgroundImage: 'linear-gradient(135deg, #E4405F 0%, #C13584 50%, #833AB4 100%)',
    boxShadow: isSelected ? '0 2px 8px rgba(228, 64, 95, 0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
  };

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    marginRight: '6px',
    color: '#FFF',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    color: '#FFF',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#E4405F',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 600,
  };

  return (
    <div style={containerStyle} onClick={onSelect}>
      <MessageCircle style={iconStyle} />
      <span style={textStyle}>
        {conversation.chatTitle || 'Instagram DM'}
      </span>
      <div style={badgeStyle}>
        {conversation.messages.length} msgs
      </div>
    </div>
  );
};