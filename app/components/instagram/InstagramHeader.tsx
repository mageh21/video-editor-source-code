import React from 'react';
import { InstagramConversation } from '@/app/types';
import { ChevronLeft, Phone, Video, Info } from 'lucide-react';

interface InstagramHeaderProps {
  conversation: InstagramConversation;
  presentationScale?: number;
}

export const InstagramHeader: React.FC<InstagramHeaderProps> = ({
  conversation,
  presentationScale = 1,
}) => {
  const { chatTitle, chatSubtitle, participants, showBackButton, showVideoCallButton, showVoiceCallButton, showMenuButton, theme } = conversation;
  
  // Get the other participant for DMs
  const otherParticipant = participants.find(p => p.id !== 'me') || participants[0];
  
  // Header styles
  const headerStyle: React.CSSProperties = {
    backgroundColor: theme.headerColor || '#FFFFFF',
    borderBottom: `1px solid #DBDBDB`,
    padding: `${8 * presentationScale}px ${16 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: `${56 * presentationScale}px`,
    position: 'relative',
  };

  // Left section styles
  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${12 * presentationScale}px`,
    flex: 1,
  };

  // Back button styles
  const backButtonStyle: React.CSSProperties = {
    width: `${24 * presentationScale}px`,
    height: `${24 * presentationScale}px`,
    color: '#262626',
    cursor: 'pointer',
  };

  // Avatar styles
  const avatarStyle: React.CSSProperties = {
    width: `${32 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: otherParticipant?.color || '#E4405F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${16 * presentationScale}px`,
    color: '#FFFFFF',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  };

  // Online indicator styles
  const onlineIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: `${10 * presentationScale}px`,
    height: `${10 * presentationScale}px`,
    backgroundColor: '#44D362',
    borderRadius: '50%',
    border: `2px solid ${theme.headerColor || '#FFFFFF'}`,
  };

  // Title section styles
  const titleSectionStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: `${16 * presentationScale}px`,
    fontWeight: 600,
    color: '#262626',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: `${13 * presentationScale}px`,
    color: '#8E8E8E',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Action buttons styles
  const actionButtonsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${16 * presentationScale}px`,
  };

  const iconButtonStyle: React.CSSProperties = {
    width: `${24 * presentationScale}px`,
    height: `${24 * presentationScale}px`,
    color: '#262626',
    cursor: 'pointer',
  };

  // Status bar styles (iOS style)
  const statusBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${20 * presentationScale}px`,
    backgroundColor: theme.statusBarColor || '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${20 * presentationScale}px`,
    fontSize: `${11 * presentationScale}px`,
    color: '#000',
    fontWeight: 600,
  };

  const timeStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  };

  const statusIconsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${4 * presentationScale}px`,
    marginLeft: 'auto',
  };

  return (
    <>
      {/* Status bar */}
      {conversation.showNotificationBar && (
        <div style={statusBarStyle}>
          <div>{conversation.notificationBar?.carrier || 'Instagram'}</div>
          <div style={timeStyle}>{conversation.notificationBar?.time || '9:41 AM'}</div>
          <div style={statusIconsStyle}>
            {/* Signal bars */}
            <svg width={`${15 * presentationScale}px`} height={`${11 * presentationScale}px`} viewBox="0 0 15 11">
              <rect x="0" y="6" width="3" height="5" fill="#000" opacity={conversation.notificationBar?.signal && conversation.notificationBar.signal >= 1 ? 1 : 0.3} />
              <rect x="4" y="4" width="3" height="7" fill="#000" opacity={conversation.notificationBar?.signal && conversation.notificationBar.signal >= 2 ? 1 : 0.3} />
              <rect x="8" y="2" width="3" height="9" fill="#000" opacity={conversation.notificationBar?.signal && conversation.notificationBar.signal >= 3 ? 1 : 0.3} />
              <rect x="12" y="0" width="3" height="11" fill="#000" opacity={conversation.notificationBar?.signal && conversation.notificationBar.signal >= 4 ? 1 : 0.3} />
            </svg>
            
            {/* WiFi */}
            {conversation.notificationBar?.wifi && (
              <svg width={`${15 * presentationScale}px`} height={`${11 * presentationScale}px`} viewBox="0 0 15 11">
                <path d="M7.5 11C6.67 11 6 10.33 6 9.5C6 8.67 6.67 8 7.5 8C8.33 8 9 8.67 9 9.5C9 10.33 8.33 11 7.5 11ZM2.5 7.5L1 6C3.5 3.5 6.5 2 7.5 2C8.5 2 11.5 3.5 14 6L12.5 7.5C10.5 5.5 8.5 4.5 7.5 4.5C6.5 4.5 4.5 5.5 2.5 7.5ZM5 5L3.5 3.5C5 2 6.5 1 7.5 1C8.5 1 10 2 11.5 3.5L10 5C9 4 8 3.5 7.5 3.5C7 3.5 6 4 5 5Z" fill="#000"/>
              </svg>
            )}
            
            {/* Battery */}
            <svg width={`${25 * presentationScale}px`} height={`${12 * presentationScale}px`} viewBox="0 0 25 12">
              <rect x="0" y="2" width="21" height="8" rx="2" fill="none" stroke="#000" strokeWidth="1"/>
              <rect x="21.5" y="4.5" width="3" height="3" rx="0.5" fill="#000"/>
              <rect x="2" y="4" width={`${(conversation.notificationBar?.battery || 85) * 0.17}`} height="4" fill="#000"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Main header */}
      <div style={{
        ...headerStyle,
        marginTop: conversation.showNotificationBar ? `${20 * presentationScale}px` : 0,
      }}>
        <div style={leftSectionStyle}>
          {/* Back button */}
          {showBackButton && (
            <ChevronLeft style={backButtonStyle} strokeWidth={2} />
          )}
          
          {/* Avatar */}
          <div style={avatarStyle}>
            {otherParticipant?.avatar ? (
              otherParticipant.avatar.startsWith('http') || otherParticipant.avatar.startsWith('data:') ? (
                <img 
                  src={otherParticipant.avatar} 
                  alt={otherParticipant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                otherParticipant.avatar
              )
            ) : (
              '👤'
            )}
            {otherParticipant?.isOnline && theme.showOnlineStatus && (
              <div style={onlineIndicatorStyle} />
            )}
          </div>
          
          {/* Title section */}
          <div style={titleSectionStyle}>
            <div style={titleStyle}>{chatTitle}</div>
            {chatSubtitle && (
              <div style={subtitleStyle}>{chatSubtitle}</div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div style={actionButtonsStyle}>
          {showVoiceCallButton && (
            <Phone style={iconButtonStyle} strokeWidth={2} />
          )}
          {showVideoCallButton && (
            <Video style={iconButtonStyle} strokeWidth={2} />
          )}
          {showMenuButton && (
            <Info style={iconButtonStyle} strokeWidth={2} />
          )}
        </div>
      </div>
    </>
  );
};