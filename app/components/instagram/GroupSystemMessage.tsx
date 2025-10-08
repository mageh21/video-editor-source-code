import React from 'react';
import { UserPlus, UserMinus, Edit3, Camera } from 'lucide-react';
import { InstagramParticipant } from '@/app/types';

interface GroupSystemMessageProps {
  type: 'member_added' | 'member_removed' | 'group_name_changed' | 'group_photo_changed';
  affectedUsers?: string[];
  oldValue?: string;
  newValue?: string;
  actor?: string;
  participants: InstagramParticipant[];
  presentationScale?: number;
  theme: any;
}

export const GroupSystemMessage: React.FC<GroupSystemMessageProps> = ({
  type,
  affectedUsers = [],
  oldValue,
  newValue,
  actor,
  participants,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${8 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${16 * presentationScale}px`,
    textAlign: 'center',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: `${32 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: 'rgba(142, 142, 142, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${13 * presentationScale}px`,
    color: theme.textLight || '#8E8E8E',
    lineHeight: 1.4,
  };

  const nameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#000000',
  };

  const getIcon = () => {
    const iconSize = 16 * presentationScale;
    const iconColor = '#8E8E8E';
    
    switch (type) {
      case 'member_added':
        return <UserPlus size={iconSize} color={iconColor} />;
      case 'member_removed':
        return <UserMinus size={iconSize} color={iconColor} />;
      case 'group_name_changed':
        return <Edit3 size={iconSize} color={iconColor} />;
      case 'group_photo_changed':
        return <Camera size={iconSize} color={iconColor} />;
    }
  };

  const getMessage = () => {
    const actorName = participants.find(p => p.id === actor)?.name || 'Someone';
    
    switch (type) {
      case 'member_added': {
        const addedNames = affectedUsers
          .map(userId => participants.find(p => p.id === userId)?.name || 'Unknown')
          .join(', ');
        return (
          <>
            <span style={nameStyle}>{actorName}</span> added{' '}
            <span style={nameStyle}>{addedNames}</span>
          </>
        );
      }
      case 'member_removed': {
        const removedNames = affectedUsers
          .map(userId => participants.find(p => p.id === userId)?.name || 'Unknown')
          .join(', ');
        if (actor === affectedUsers[0]) {
          return <><span style={nameStyle}>{removedNames}</span> left</>;
        }
        return (
          <>
            <span style={nameStyle}>{actorName}</span> removed{' '}
            <span style={nameStyle}>{removedNames}</span>
          </>
        );
      }
      case 'group_name_changed':
        return (
          <>
            <span style={nameStyle}>{actorName}</span> changed the group name from{' '}
            "{oldValue}" to "<span style={nameStyle}>{newValue}</span>"
          </>
        );
      case 'group_photo_changed':
        return (
          <>
            <span style={nameStyle}>{actorName}</span> changed the group photo
          </>
        );
    }
  };

  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        {getIcon()}
      </div>
      <div style={textStyle}>
        {getMessage()}
      </div>
    </div>
  );
};