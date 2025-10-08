import React from 'react';
import { InstagramParticipant } from '@/app/types';

interface MessageReactionsProps {
  reactions: { [userId: string]: string };
  participants: InstagramParticipant[];
  presentationScale?: number;
  isIncoming?: boolean;
  opacity?: number;
}

const REACTION_EMOJIS: { [key: string]: string } = {
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  thumbsup: '👍',
};

export const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  reactions, 
  participants,
  presentationScale = 1,
  isIncoming = false,
  opacity = 1
}) => {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  // Group reactions by type
  const reactionGroups = Object.entries(reactions).reduce((acc, [userId, reaction]) => {
    if (!acc[reaction]) acc[reaction] = [];
    acc[reaction].push(userId);
    return acc;
  }, {} as { [reaction: string]: string[] });

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `${4 * presentationScale}px`,
    [isIncoming ? 'right' : 'left']: `${4 * presentationScale}px`,
    display: 'flex',
    gap: `${2 * presentationScale}px`,
    flexDirection: isIncoming ? 'row-reverse' : 'row',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
    opacity,
    transition: 'opacity 0.3s ease-in-out',
  };

  const reactionBubbleStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: `${10 * presentationScale}px`,
    padding: `${3 * presentationScale}px ${8 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    gap: `${3 * presentationScale}px`,
    fontSize: `${11 * presentationScale}px`,
    minHeight: `${18 * presentationScale}px`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: `${14 * presentationScale}px`,
    lineHeight: 1,
  };

  const countStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize: `${11 * presentationScale}px`,
    fontWeight: 500,
    lineHeight: 1,
  };

  return (
    <div style={containerStyle}>
      {Object.entries(reactionGroups).map(([reaction, userIds]) => (
        <div 
          key={reaction} 
          style={reactionBubbleStyle}
          title={userIds.map(id => participants.find(p => p.id === id)?.name || id).join(', ')}
        >
          <span style={emojiStyle}>{REACTION_EMOJIS[reaction]}</span>
          {userIds.length > 1 && (
            <span style={countStyle}>{userIds.length}</span>
          )}
        </div>
      ))}
    </div>
  );
};