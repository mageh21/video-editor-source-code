import React from 'react';
import { WhatsAppConversation } from '@/app/types';

interface WhatsAppHeaderProps {
  conversation: WhatsAppConversation;
  presentationScale?: number;
  isDarkMode?: boolean;
}

const WHATSAPP_COLORS = {
  headerBg: '#202C33', // Modern WhatsApp header color
  darkHeaderBg: '#202C33',
  text: '#E9EDEF',
  textLight: '#8696A0',
  iconColor: '#8696A0',
};

export const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({ 
  conversation, 
  presentationScale = 1,
  isDarkMode = false 
}) => {
  const { participants = [], chatTitle, chatSubtitle, isGroupChat, showBackButton, showVideoCallButton, showVoiceCallButton, showMenuButton, isBusinessChat } = conversation;
  
  // Get the other participant for 1-on-1 chats
  const otherParticipant = !isGroupChat ? participants.find(p => p.id !== 'me') : null;
  const displayTitle = chatTitle || (isGroupChat ? 'Group Chat' : (otherParticipant?.name || 'WhatsApp User'));
  const displaySubtitle = chatSubtitle || (isGroupChat ? `${participants.length} participants` : (otherParticipant?.lastSeen || 'last seen recently'));
  
  const headerStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? WHATSAPP_COLORS.darkHeaderBg : WHATSAPP_COLORS.headerBg,
    height: `${60 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${12 * presentationScale}px`,
    gap: `${12 * presentationScale}px`,
    boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
  };
  
  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: WHATSAPP_COLORS.iconColor,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    marginRight: `-${4 * presentationScale}px`,
  };
  
  const avatarStyle: React.CSSProperties = {
    width: `${40 * presentationScale}px`,
    height: `${40 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: '#DDD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${18 * presentationScale}px`,
    overflow: 'hidden',
    flexShrink: 0,
  };
  
  const infoContainerStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };
  
  const titleStyle: React.CSSProperties = {
    color: WHATSAPP_COLORS.text,
    fontSize: `${16 * presentationScale}px`,
    fontWeight: 500,
    lineHeight: `${20 * presentationScale}px`,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: `${4 * presentationScale}px`,
  };
  
  const subtitleStyle: React.CSSProperties = {
    color: WHATSAPP_COLORS.textLight,
    fontSize: `${13 * presentationScale}px`,
    lineHeight: `${16 * presentationScale}px`,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  
  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${16 * presentationScale}px`,
  };
  
  const actionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: WHATSAPP_COLORS.iconColor,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // Get avatar for the chat
  let chatAvatar = '👤';
  if (isGroupChat) {
    chatAvatar = '👥';
  } else if (otherParticipant?.avatar) {
    chatAvatar = otherParticipant.avatar;
  }
  
  return (
    <>
      {/* Status bar */}
      <div style={{
        backgroundColor: WHATSAPP_COLORS.headerBg,
        height: `${24 * presentationScale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${16 * presentationScale}px`,
        fontSize: `${12 * presentationScale}px`,
        fontWeight: 600,
        color: WHATSAPP_COLORS.text,
      }}>
        <span>WhatsApp</span>
        <span>16:02</span>
      </div>
      
      <div style={headerStyle}>
        {/* Back button */}
        {showBackButton !== false && (
          <button style={backButtonStyle}>
            <svg 
              width={`${20 * presentationScale}px`} 
              height={`${20 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        )}
      
      {/* Avatar */}
      <div style={avatarStyle}>
        {chatAvatar.startsWith('http') || chatAvatar.startsWith('data:') || chatAvatar.startsWith('/') ? (
          <img 
            src={chatAvatar} 
            alt={displayTitle}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{chatAvatar}</span>
        )}
      </div>
      
      {/* Title and subtitle */}
      <div style={infoContainerStyle}>
        <h3 style={titleStyle}>
          {displayTitle}
          {isBusinessChat && (
            <svg 
              width={`${16 * presentationScale}px`} 
              height={`${16 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="#00E676"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
        </h3>
        <p style={subtitleStyle}>{displaySubtitle}</p>
      </div>
      
      {/* Action buttons */}
      <div style={actionsStyle}>
        {showVideoCallButton !== false && (
          <button style={actionButtonStyle}>
            <svg 
              width={`${24 * presentationScale}px`} 
              height={`${24 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>
        )}
        
        {showVoiceCallButton !== false && (
          <button style={actionButtonStyle}>
            <svg 
              width={`${24 * presentationScale}px`} 
              height={`${24 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          </button>
        )}
        
        {showMenuButton !== false && (
          <button style={actionButtonStyle}>
            <svg 
              width={`${24 * presentationScale}px`} 
              height={`${24 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
    </>
  );
};