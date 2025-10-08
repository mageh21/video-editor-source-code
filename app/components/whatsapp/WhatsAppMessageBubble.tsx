import React from 'react';
import { WhatsAppMessage, WhatsAppParticipant, WhatsAppTheme } from '@/app/types';

interface WhatsAppMessageBubbleProps {
  message: WhatsAppMessage;
  participant?: WhatsAppParticipant;
  participants: WhatsAppParticipant[];
  theme?: WhatsAppTheme;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  presentationScale?: number;
  isGroupChat?: boolean;
  isDarkMode?: boolean;
}

const WHATSAPP_COLORS = {
  bubbleIncoming: '#FFFFFF',
  darkBubbleIncoming: '#202C33',
  bubbleOutgoing: '#DCF8C6',
  darkBubbleOutgoing: '#005C4B',
  text: '#303030',
  darkText: '#E9EDEF',
  textLight: '#667781',
  darkTextLight: '#8696A0',
  timestamp: 'rgba(0, 0, 0, 0.45)',
  darkTimestamp: 'rgba(255, 255, 255, 0.6)',
  linkColor: '#34B7F1',
  systemMessage: '#8696A0',
  checkColor: '#53BDEB',
  checkReadColor: '#53BDEB',
  senderColors: [
    '#00AF9C', '#00A884', '#0099FF', '#A846A1', 
    '#CF9000', '#D56438', '#DF3449', '#CC5500'
  ],
};

export const WhatsAppMessageBubble: React.FC<WhatsAppMessageBubbleProps> = ({
  message,
  participant,
  participants,
  theme,
  isFirstInGroup,
  isLastInGroup,
  showAvatar,
  showSenderName,
  presentationScale = 1,
  isGroupChat = false,
  isDarkMode = false,
}) => {
  const isIncoming = message.isIncoming;
  const isSystem = (message as any).messageType === 'system' || (message as any).messageType === 'member_added' ||
                   (message as any).messageType === 'member_removed' || (message as any).messageType === 'group_name_changed' ||
                   (message as any).messageType === 'group_photo_changed' || (message as any).messageType === 'pinned_message';
  
  // Get sender color for group chats
  const getSenderColor = (senderId: string) => {
    if (!isGroupChat || senderId === 'me') return null;
    const index = participants.findIndex(p => p.id === senderId);
    return WHATSAPP_COLORS.senderColors[index % WHATSAPP_COLORS.senderColors.length];
  };
  
  const senderColor = getSenderColor(message.sender);
  
  const bubbleContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isSystem ? 'center' : (isIncoming ? 'flex-start' : 'flex-end'),
    padding: `0 ${16 * presentationScale}px`,
    marginBottom: `${2 * presentationScale}px`,
  };
  
  const bubbleWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: `${8 * presentationScale}px`,
    maxWidth: isSystem ? '85%' : '75%',
  };
  
  const avatarStyle: React.CSSProperties = {
    width: `${28 * presentationScale}px`,
    height: `${28 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: '#DDD',
    display: showAvatar ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${14 * presentationScale}px`,
    overflow: 'hidden',
    flexShrink: 0,
  };
  
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: isSystem 
      ? 'rgba(225, 245, 254, 0.92)' 
      : (isIncoming 
          ? (isDarkMode ? WHATSAPP_COLORS.darkBubbleIncoming : WHATSAPP_COLORS.bubbleIncoming)
          : (isDarkMode ? WHATSAPP_COLORS.darkBubbleOutgoing : WHATSAPP_COLORS.bubbleOutgoing)),
    borderRadius: `${7 * presentationScale}px`,
    padding: (message as any).messageType === 'deleted'
      ? `${6 * presentationScale}px ${12 * presentationScale}px`
      : `${6 * presentationScale}px ${9 * presentationScale}px`,
    position: 'relative',
    boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.13)',
    minWidth: `${60 * presentationScale}px`,
  };
  
  // Add tail for last message in group
  const tailStyle: React.CSSProperties = isLastInGroup && !isSystem ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    width: `${8 * presentationScale}px`,
    height: `${13 * presentationScale}px`,
    backgroundColor: bubbleStyle.backgroundColor,
    ...(isIncoming ? {
      left: `-${8 * presentationScale}px`,
      borderBottomRightRadius: `${16 * presentationScale}px`,
    } : {
      right: `-${8 * presentationScale}px`,
      borderBottomLeftRadius: `${16 * presentationScale}px`,
    }),
  } : {};
  
  const senderNameStyle: React.CSSProperties = {
    fontSize: `${12.5 * presentationScale}px`,
    color: senderColor || (isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight),
    marginBottom: `${2 * presentationScale}px`,
    fontWeight: 500,
  };
  
  const textStyle: React.CSSProperties = {
    fontSize: `${14.2 * presentationScale}px`,
    lineHeight: `${19 * presentationScale}px`,
    color: isSystem 
      ? WHATSAPP_COLORS.systemMessage 
      : (isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text),
    margin: 0,
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  };
  
  const timestampStyle: React.CSSProperties = {
    fontSize: `${11 * presentationScale}px`,
    color: isDarkMode ? WHATSAPP_COLORS.darkTimestamp : WHATSAPP_COLORS.timestamp,
    marginTop: `${2 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    gap: `${3 * presentationScale}px`,
    justifyContent: isIncoming ? 'flex-start' : 'flex-end',
  };
  
  const systemMessageStyle: React.CSSProperties = {
    backgroundColor: 'rgba(225, 245, 254, 0.92)',
    borderRadius: `${7 * presentationScale}px`,
    padding: `${4 * presentationScale}px ${12 * presentationScale}px`,
    fontSize: `${12.5 * presentationScale}px`,
    color: WHATSAPP_COLORS.systemMessage,
    textAlign: 'center',
  };
  
  // Typing indicator styles
  const typingIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${3 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
  };
  
  const typingDotStyle: React.CSSProperties = {
    width: `${8 * presentationScale}px`,
    height: `${8 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
  };
  
  // Voice message styles
  const voiceMessageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${8 * presentationScale}px`,
    minWidth: `${200 * presentationScale}px`,
  };
  
  const playButtonStyle: React.CSSProperties = {
    width: `${34 * presentationScale}px`,
    height: `${34 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: isDarkMode ? '#00A884' : '#00A884',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };
  
  const waveformContainerStyle: React.CSSProperties = {
    flex: 1,
    height: `${30 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    gap: `${1 * presentationScale}px`,
  };
  
  // Document styles
  const documentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${8 * presentationScale}px`,
    padding: `${4 * presentationScale}px`,
    minWidth: `${200 * presentationScale}px`,
  };
  
  const documentIconStyle: React.CSSProperties = {
    width: `${40 * presentationScale}px`,
    height: `${40 * presentationScale}px`,
    backgroundColor: isDarkMode ? '#1F2C33' : '#F0F0F0',
    borderRadius: `${8 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  
  // Location styles
  const locationStyle: React.CSSProperties = {
    minWidth: `${200 * presentationScale}px`,
  };
  
  const mapPreviewStyle: React.CSSProperties = {
    width: '100%',
    height: `${100 * presentationScale}px`,
    backgroundColor: isDarkMode ? '#1F2C33' : '#E8E8E8',
    borderRadius: `${4 * presentationScale}px`,
    marginBottom: `${4 * presentationScale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // Poll styles
  const pollStyle: React.CSSProperties = {
    minWidth: `${250 * presentationScale}px`,
  };
  
  const pollQuestionStyle: React.CSSProperties = {
    fontSize: `${15 * presentationScale}px`,
    fontWeight: 500,
    marginBottom: `${8 * presentationScale}px`,
    color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
  };
  
  const pollOptionStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? '#1F2C33' : '#F0F4F5',
    borderRadius: `${8 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
    marginBottom: `${4 * presentationScale}px`,
    fontSize: `${14 * presentationScale}px`,
    color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
  };
  
  // Media styles
  const mediaStyle: React.CSSProperties = {
    maxWidth: '100%',
    borderRadius: `${4 * presentationScale}px`,
    marginBottom: message.text ? `${4 * presentationScale}px` : 0,
  };
  
  // Render typing indicator
  if ((message as any).messageType === 'typing') {
    return (
      <div style={bubbleContainerStyle}>
        <div style={bubbleWrapperStyle}>
          {showAvatar && (
            <div style={avatarStyle}>
              {participant?.avatar ? (
                participant.avatar.startsWith('http') || participant.avatar.startsWith('data:') ? (
                  <img src={participant.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{participant.avatar}</span>
                )
              ) : (
                <span>👤</span>
              )}
            </div>
          )}
          <div style={{ ...bubbleStyle, position: 'relative' }}>
            <div style={typingIndicatorStyle}>
              <div style={{ ...typingDotStyle, animation: `typing 1.4s infinite` }} />
              <div style={{ ...typingDotStyle, animation: `typing 1.4s infinite 0.2s` }} />
              <div style={{ ...typingDotStyle, animation: `typing 1.4s infinite 0.4s` }} />
            </div>
            <style>{`
              @keyframes typing {
                0%, 60%, 100% {
                  transform: translateY(0);
                  opacity: 0.7;
                }
                30% {
                  transform: translateY(-10px);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }
  
  // Render system messages
  if (isSystem) {
    return (
      <div style={bubbleContainerStyle}>
        <div style={systemMessageStyle}>
          {message.text}
        </div>
      </div>
    );
  }
  
  // Render deleted messages
  if ((message as any).messageType === 'deleted' || (message as any).isDeleted) {
    return (
      <div style={bubbleContainerStyle}>
        <div style={bubbleWrapperStyle}>
          {!isIncoming && showAvatar && <div style={{ width: avatarStyle.width }} />}
          {isIncoming && showAvatar && (
            <div style={avatarStyle}>
              {participant?.avatar ? (
                participant.avatar.startsWith('http') || participant.avatar.startsWith('data:') ? (
                  <img src={participant.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{participant.avatar}</span>
                )
              ) : (
                <span>👤</span>
              )}
            </div>
          )}
          <div style={{ ...bubbleStyle, fontStyle: 'italic', opacity: 0.6 }}>
            <div style={textStyle}>
              🚫 This message was deleted
            </div>
            <div style={timestampStyle}>
              {message.timestamp}
            </div>
          </div>
          {!isIncoming && isLastInGroup && <div style={tailStyle} />}
        </div>
      </div>
    );
  }
  
  return (
    <div style={bubbleContainerStyle}>
      <div style={bubbleWrapperStyle}>
        {/* Avatar for incoming messages */}
        {isIncoming && showAvatar && (
          <div style={avatarStyle}>
            {participant?.avatar ? (
              participant.avatar.startsWith('http') || participant.avatar.startsWith('data:') ? (
                <img src={participant.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{participant.avatar}</span>
              )
            ) : (
              <span>👤</span>
            )}
          </div>
        )}
        
        {/* Spacer for outgoing messages */}
        {!isIncoming && showAvatar && <div style={{ width: avatarStyle.width }} />}
        
        {/* Message bubble */}
        <div style={{ ...bubbleStyle, position: 'relative' }}>
          {/* Tail */}
          {isLastInGroup && <div style={tailStyle} />}
          
          {/* Sender name in groups */}
          {showSenderName && isGroupChat && (
            <div style={senderNameStyle}>
              {participant?.name || 'Unknown'}
            </div>
          )}
          
          {/* Reply reference */}
          {message.replyTo && (
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderLeft: `4px solid ${isDarkMode ? '#00A884' : '#00A884'}`,
              borderRadius: `${4 * presentationScale}px`,
              padding: `${4 * presentationScale}px ${8 * presentationScale}px`,
              marginBottom: `${4 * presentationScale}px`,
            }}>
              <div style={{
                fontSize: `${12 * presentationScale}px`,
                color: isDarkMode ? '#00A884' : '#00A884',
                fontWeight: 500,
              }}>
                {(message.replyTo as any).originalMessage.senderName}
              </div>
              <div style={{
                fontSize: `${13 * presentationScale}px`,
                color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {(message.replyTo as any).originalMessage.text}
              </div>
            </div>
          )}
          
          {/* Media content */}
          {message.media && (
            <div style={{ margin: `${-6 * presentationScale}px ${-9 * presentationScale}px ${message.text ? 4 * presentationScale : -6 * presentationScale}px` }}>
              {message.media.type === 'video' ? (
                <video
                  style={{ ...mediaStyle, width: '100%', maxHeight: `${200 * presentationScale}px` }}
                  controls
                >
                  <source src={(message.media as any).src} />
                </video>
              ) : message.media.type === 'sticker' ? (
                <img
                  src={(message.media as any).src}
                  alt=""
                  style={{
                    width: `${120 * presentationScale}px`,
                    height: `${120 * presentationScale}px`,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src={(message.media as any).src} 
                  alt="" 
                  style={{ ...mediaStyle, width: '100%', maxHeight: `${300 * presentationScale}px`, objectFit: 'cover' }} 
                />
              )}
            </div>
          )}
          
          {/* Voice message */}
          {message.messageType === 'voice' && (message as any).voice && (
            <div style={voiceMessageStyle}>
              <div style={playButtonStyle}>
                <svg width={`${16 * presentationScale}px`} height={`${16 * presentationScale}px`} viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div style={waveformContainerStyle}>
                {(message as any).voice.waveform?.map((height: number, i: number) => (
                  <div
                    key={i}
                    style={{
                      width: `${2 * presentationScale}px`,
                      height: `${height * 20 * presentationScale}px`,
                      backgroundColor: (message as any).voice?.isPlayed
                        ? (isDarkMode ? '#00A884' : '#00A884')
                        : (isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight),
                      borderRadius: `${1 * presentationScale}px`,
                    }}
                  />
                ))}
              </div>
              <div style={{
                fontSize: `${11 * presentationScale}px`,
                color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                minWidth: `${35 * presentationScale}px`,
              }}>
                {Math.floor((message as any).voice.duration / 60)}:{((message as any).voice.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}
          
          {/* Document */}
          {message.messageType === 'document' && (message as any).document && (
            <div style={documentStyle}>
              <div style={documentIconStyle}>
                <svg width={`${24 * presentationScale}px`} height={`${24 * presentationScale}px`} viewBox="0 0 24 24" fill="#6B7C85">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: `${14 * presentationScale}px`,
                  color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
                  fontWeight: 500,
                }}>
                  {(message as any).document.name}
                </div>
                <div style={{
                  fontSize: `${11 * presentationScale}px`,
                  color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                }}>
                  {(message as any).document.type.toUpperCase()} • {(message as any).document.size}
                  {(message as any).document.pages && ` • ${(message as any).document.pages} pages`}
                </div>
              </div>
            </div>
          )}
          
          {/* Location */}
          {message.messageType === 'location' && message.location && (
            <div style={locationStyle}>
              <div style={mapPreviewStyle}>
                {(message.location as any).mapPreview ? (
                  <img
                    src={(message.location as any).mapPreview}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: `${4 * presentationScale}px` }}
                  />
                ) : (
                  <svg width={`${40 * presentationScale}px`} height={`${40 * presentationScale}px`} viewBox="0 0 24 24" fill="#25D366">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                )}
              </div>
              <div style={{
                fontSize: `${14 * presentationScale}px`,
                color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
                fontWeight: 500,
              }}>
                {message.location.name}
              </div>
              {message.location.address && (
                <div style={{
                  fontSize: `${12 * presentationScale}px`,
                  color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                }}>
                  {message.location.address}
                </div>
              )}
            </div>
          )}
          
          {/* Contact */}
          {message.messageType === 'contact' && message.contact && (
            <div style={documentStyle}>
              <div style={{
                ...documentIconStyle,
                backgroundColor: '#00A884',
              }}>
                <svg width={`${24 * presentationScale}px`} height={`${24 * presentationScale}px`} viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: `${14 * presentationScale}px`,
                  color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
                  fontWeight: 500,
                }}>
                  {message.contact.name}
                </div>
                <div style={{
                  fontSize: `${13 * presentationScale}px`,
                  color: WHATSAPP_COLORS.linkColor,
                }}>
                  {message.contact.phone}
                </div>
              </div>
            </div>
          )}
          
          {/* Poll */}
          {message.messageType === 'poll' && message.poll && (
            <div style={pollStyle}>
              <div style={pollQuestionStyle}>
                {message.poll.question}
              </div>
              {message.poll.options.map((option) => (
                <div key={option.id} style={pollOptionStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{option.text}</span>
                    {option.votes.length > 0 && (
                      <span style={{
                        fontSize: `${12 * presentationScale}px`,
                        color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                      }}>
                        {option.votes.length}
                      </span>
                    )}
                  </div>
                  {(message.poll as any).totalVotes > 0 && (
                    <div style={{
                      marginTop: `${4 * presentationScale}px`,
                      height: `${4 * presentationScale}px`,
                      backgroundColor: isDarkMode ? '#1F2C33' : '#E0E0E0',
                      borderRadius: `${2 * presentationScale}px`,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${option.percentage}%`,
                        height: '100%',
                        backgroundColor: '#00A884',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  )}
                </div>
              ))}
              <div style={{
                marginTop: `${8 * presentationScale}px`,
                fontSize: `${11 * presentationScale}px`,
                color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                textAlign: 'center',
              }}>
                {(message.poll as any).allowMultipleAnswers ? 'Multiple answers allowed' : 'Single answer only'}
              </div>
            </div>
          )}
          
          {/* Call notification */}
          {(message as any).messageType === 'call' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${8 * presentationScale}px`,
            }}>
              <div style={{
                width: `${32 * presentationScale}px`,
                height: `${32 * presentationScale}px`,
                borderRadius: '50%',
                backgroundColor: (message as any).callStatus === 'missed' ? '#F15C6D' : '#00A884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width={`${18 * presentationScale}px`} height={`${18 * presentationScale}px`} viewBox="0 0 24 24" fill="white">
                  {(message as any).callType === 'video' ? (
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  ) : (
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  )}
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: `${14 * presentationScale}px`,
                  color: isDarkMode ? WHATSAPP_COLORS.darkText : WHATSAPP_COLORS.text,
                }}>
                  {(message as any).callStatus === 'missed' ? 'Missed' : 'Outgoing'} {(message as any).callType} call
                </div>
                {(message as any).callDuration && (message as any).callStatus !== 'missed' && (
                  <div style={{
                    fontSize: `${12 * presentationScale}px`,
                    color: isDarkMode ? WHATSAPP_COLORS.darkTextLight : WHATSAPP_COLORS.textLight,
                  }}>
                    {(message as any).callDuration}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Text content */}
          {message.text && (
            <div style={textStyle}>
              {message.text}
            </div>
          )}
          
          {/* Timestamp and status */}
          <div style={timestampStyle}>
            <span>{message.timestamp}</span>
            {!isIncoming && message.status && (
              <span style={{ display: 'flex' }}>
                {message.status === 'sent' && (
                  <svg width={`${16 * presentationScale}px`} height={`${11 * presentationScale}px`} viewBox="0 0 16 11" fill={isDarkMode ? WHATSAPP_COLORS.darkTimestamp : WHATSAPP_COLORS.timestamp}>
                    <path d="M0 7.5L1.5 6L5 9.5L14.5 0L16 1.5L5 12.5L0 7.5Z"/>
                  </svg>
                )}
                {message.status === 'delivered' && (
                  <svg width={`${16 * presentationScale}px`} height={`${11 * presentationScale}px`} viewBox="0 0 16 11" fill={isDarkMode ? WHATSAPP_COLORS.darkTimestamp : WHATSAPP_COLORS.timestamp}>
                    <path d="M0 7.5L1.5 6L5 9.5L14.5 0L16 1.5L5 12.5L0 7.5Z"/>
                    <path d="M5 7.5L6.5 6L10 9.5L19.5 0L21 1.5L10 12.5L5 7.5Z" transform="translate(-5 0)"/>
                  </svg>
                )}
                {message.status === 'read' && (
                  <svg width={`${16 * presentationScale}px`} height={`${11 * presentationScale}px`} viewBox="0 0 16 11" fill={WHATSAPP_COLORS.checkReadColor}>
                    <path d="M0 7.5L1.5 6L5 9.5L14.5 0L16 1.5L5 12.5L0 7.5Z"/>
                    <path d="M5 7.5L6.5 6L10 9.5L19.5 0L21 1.5L10 12.5L5 7.5Z" transform="translate(-5 0)"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};