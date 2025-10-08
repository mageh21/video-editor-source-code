import React from 'react';
import { InstagramMessage, InstagramParticipant, InstagramTheme } from '@/app/types';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './TypingIndicator';
import { MessageReactions } from './MessageReactions';
import { MessageStatus } from './MessageStatus';
import { VoiceMessage } from './VoiceMessage';
import { MultiImageMessage } from './MultiImageMessage';
import { DoubleTapAnimation } from './DoubleTapAnimation';
import { VideoMessage } from './VideoMessage';
import { StoryReplyMessage } from './StoryReplyMessage';
import { LocationMessage } from './LocationMessage';
import { MusicMessage } from './MusicMessage';
import { PollMessage } from './PollMessage';
import { AdminBadge } from './AdminBadge';
import { GroupSystemMessage } from './GroupSystemMessage';
import { MessageTextWithMentions } from './MessageTextWithMentions';
import { ReplyThread } from './ReplyThread';

interface InstagramMessageBubbleProps {
  message: InstagramMessage;
  participant?: InstagramParticipant;
  theme: InstagramTheme;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  presentationScale?: number;
  isGroupChat?: boolean;
  participants?: InstagramParticipant[];
  reactionOpacity?: number;
  onDoubleTap?: (messageId: string) => void;
  currentFrame?: number;
  messageStartFrame?: number;
  isInReplyThread?: boolean;
  isReplyThreadStart?: boolean;
  isReplyThreadEnd?: boolean;
}

export const InstagramMessageBubble: React.FC<InstagramMessageBubbleProps> = ({
  message,
  participant,
  theme,
  isFirstInGroup,
  isLastInGroup,
  showAvatar = false,
  showSenderName = false,
  presentationScale = 1,
  isGroupChat = false,
  participants = [],
  reactionOpacity = 1,
  onDoubleTap,
  currentFrame = 0,
  messageStartFrame = 0,
  isInReplyThread = false,
  isReplyThreadStart = false,
  isReplyThreadEnd = false,
}) => {
  const { isIncoming, text, messageType, media, replyTo, reactions, disappearing, systemMessageData, mentions } = message;
  
  // Calculate disappearing opacity
  let disappearingOpacity = 1;
  if (messageType === 'disappearing' && disappearing && currentFrame > 0) {
    const frameSinceAppear = currentFrame - messageStartFrame;
    const fadeStartFrame = disappearing.duration * 30; // Convert seconds to frames (30 FPS)
    const fadeDuration = 30; // 1 second fade
    
    if (frameSinceAppear >= fadeStartFrame) {
      disappearingOpacity = Math.max(0, 1 - ((frameSinceAppear - fadeStartFrame) / fadeDuration));
    }
  }
  
  // Instagram-specific styling
  const isSystemMessage = messageType === 'system';
  const isTypingIndicator = messageType === 'typing';
  const hasMedia = (messageType === 'image' || messageType === 'gif') && !!media;
  
  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isIncoming ? 'flex-start' : 'flex-end',
    marginBottom: `${2 * presentationScale}px`,
    paddingLeft: `${16 * presentationScale}px`,
    paddingRight: `${16 * presentationScale}px`,
  };

  // Message wrapper styles
  const messageWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: `${8 * presentationScale}px`,
    maxWidth: '75%',
    flexDirection: isIncoming ? 'row' : 'row-reverse',
    position: 'relative',
  };

  // Avatar styles
  const avatarStyle: React.CSSProperties = {
    width: `${28 * presentationScale}px`,
    height: `${28 * presentationScale}px`,
    borderRadius: '50%',
    backgroundColor: participant?.color || '#E4405F',
    display: showAvatar ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${14 * presentationScale}px`,
    color: '#FFFFFF',
    flexShrink: 0,
    overflow: 'hidden',
  };

  // Bubble styles
  const bubbleStyle: React.CSSProperties = {
    padding: hasMedia ? 0 : `${8 * presentationScale}px ${12 * presentationScale}px`,
    borderRadius: `${theme.bubbleRadius * presentationScale}px`,
    fontSize: `${theme.fontSize * presentationScale}px`,
    lineHeight: 1.4,
    wordBreak: 'break-word',
    maxWidth: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...(isSystemMessage ? {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: (theme as any).textLight || '#8E8E8E',
      fontSize: `${12 * presentationScale}px`,
      fontStyle: 'italic',
      padding: `${4 * presentationScale}px ${8 * presentationScale}px`,
    } : {
      backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
      color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    }),
  };

  // Sender name styles
  const senderNameStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    color: participant?.color || '#E4405F',
    marginBottom: `${2 * presentationScale}px`,
    fontWeight: 500,
  };

  // Reply styles
  const replyStyle: React.CSSProperties = {
    backgroundColor: isIncoming ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)',
    borderLeft: `3px solid ${isIncoming ? '#E4405F' : '#FFFFFF'}`,
    padding: `${4 * presentationScale}px ${8 * presentationScale}px`,
    marginBottom: `${4 * presentationScale}px`,
    borderRadius: `${4 * presentationScale}px`,
  };

  const replyNameStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    fontWeight: 500,
    color: isIncoming ? '#E4405F' : '#FFFFFF',
    marginBottom: `${2 * presentationScale}px`,
  };

  const replyTextStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    opacity: 0.8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Media styles
  const mediaStyle: React.CSSProperties = {
    maxWidth: `${200 * presentationScale}px`,
    maxHeight: `${200 * presentationScale}px`,
    borderRadius: `${theme.bubbleRadius * presentationScale}px`,
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    display: 'block',
  };

  // Timestamp styles
  const timestampStyle: React.CSSProperties = {
    fontSize: `${11 * presentationScale}px`,
    color: (theme as any).textLight || '#8E8E8E',
    marginTop: `${2 * presentationScale}px`,
    textAlign: isIncoming ? 'left' : 'right',
  };

  // Call message styles
  const callStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${8 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
  };

  const callIconStyle: React.CSSProperties = {
    width: `${16 * presentationScale}px`,
    height: `${16 * presentationScale}px`,
  };

  // Handle group system messages
  if (['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(messageType || '')) {
    return (
      <div style={containerStyle}>
        <GroupSystemMessage
          type={messageType as any}
          affectedUsers={systemMessageData?.affectedUsers}
          oldValue={systemMessageData?.oldValue}
          newValue={systemMessageData?.newValue}
          actor={systemMessageData?.actor}
          participants={participants}
          presentationScale={presentationScale}
          theme={theme}
        />
      </div>
    );
  }

  if (isSystemMessage) {
    return (
      <div style={containerStyle}>
        <div style={{
          ...bubbleStyle,
          width: '100%',
          maxWidth: '100%',
        }}>
          {text}
        </div>
      </div>
    );
  }
  
  // Render typing indicator
  if (isTypingIndicator) {
    return (
      <div style={containerStyle}>
        <div style={messageWrapperStyle}>
          {showAvatar && isIncoming && isGroupChat && (
            <div style={avatarStyle}>
              {participant?.avatar ? (
                participant.avatar.startsWith('http') || participant.avatar.startsWith('data:') ? (
                  <img 
                    src={participant.avatar} 
                    alt={participant.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  participant.avatar
                )
              ) : (
                participant?.name?.charAt(0).toUpperCase() || '?'
              )}
            </div>
          )}
          <TypingIndicator 
            presentationScale={presentationScale} 
            bubbleColor={theme.bubbleColorIncoming}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, opacity: disappearingOpacity }}>
      {showSenderName && isGroupChat && isIncoming && (
        <div style={{ ...senderNameStyle, display: 'flex', alignItems: 'center' }}>
          <span>{participant?.name || 'Unknown'}</span>
          <AdminBadge role={participant?.role} presentationScale={presentationScale} />
        </div>
      )}
      
      <div style={messageWrapperStyle}>
        {/* Reply thread lines */}
        {isInReplyThread && (
          <ReplyThread
            isStart={isReplyThreadStart}
            isEnd={isReplyThreadEnd}
            isIncoming={isIncoming}
            presentationScale={presentationScale}
            theme={theme}
          />
        )}
        
        {/* Avatar */}
        {isIncoming && (
          <div style={avatarStyle}>
            {participant?.avatar ? (
              participant.avatar.startsWith('http') || participant.avatar.startsWith('data:') ? (
                <img 
                  src={participant.avatar} 
                  alt={participant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                participant.avatar
              )
            ) : (
              '👤'
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div>
          <DoubleTapAnimation
            onDoubleTap={() => onDoubleTap?.(message.id)}
            presentationScale={presentationScale}
          >
            <div style={bubbleStyle}>
            {/* Reply */}
            {replyTo && (
              <div style={replyStyle}>
                <div style={replyNameStyle}>
                  {replyTo.originalMessage.senderName}
                </div>
                <div style={replyTextStyle}>
                  {replyTo.originalMessage.text}
                </div>
              </div>
            )}
            
            {/* Voice Message */}
            {messageType === 'voice' && message.voice && (
              <VoiceMessage
                duration={message.voice.duration}
                waveform={message.voice.waveform}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Video Message */}
            {messageType === 'video' && message.media && (
              <VideoMessage
                src={message.media.src}
                thumbnail={message.media.thumbnail}
                duration={message.media.duration}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Story Reply */}
            {messageType === 'story_reply' && message.storyReply && (
              <StoryReplyMessage
                storyImage={message.storyReply.storyImage}
                storyOwner={message.storyReply.storyOwner}
                storyCaption={message.storyReply.storyCaption}
                replyText={message.text}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Location Message */}
            {messageType === 'location' && message.location && (
              <LocationMessage
                name={message.location.name}
                address={message.location.address}
                mapPreview={message.location.mapPreview}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Music Message */}
            {messageType === 'music' && message.music && (
              <MusicMessage
                title={message.music.title}
                artist={message.music.artist}
                albumArt={message.music.albumArt}
                duration={message.music.duration}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Poll Message */}
            {messageType === 'poll' && message.poll && (
              <PollMessage
                question={message.poll.question}
                options={message.poll.options}
                multipleChoice={message.poll.multipleChoice}
                anonymous={message.poll.anonymous}
                currentUserId={isIncoming ? participant?.id : 'me'}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Multiple Images */}
            {message.images && message.images.length > 0 && (
              <MultiImageMessage
                images={message.images}
                isIncoming={isIncoming}
                presentationScale={presentationScale}
                theme={theme}
              />
            )}
            
            {/* Media - for images and GIFs only (video handled above) */}
            {hasMedia && media && (messageType as any) !== 'video' && (
              <div style={mediaStyle}>
                {messageType === 'image' || messageType === 'gif' ? (
                  <img 
                    style={imageStyle}
                    src={media.src || message.mediaUrl}
                    alt="Message media"
                  />
                ) : null}
              </div>
            )}
            
            {/* Call message */}
            {messageType === 'call' && (
              <div style={callStyle}>
                <svg style={callIconStyle} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <span>{message.callStatus === 'missed' ? 'Missed call' : 'Call'}</span>
                {message.callDuration && <span>• {message.callDuration}</span>}
              </div>
            )}
            
            {/* Text content */}
            {text && !hasMedia && !['call', 'voice', 'story_reply', 'location', 'music', 'poll'].includes(messageType || '') && (
              <div>
                <MessageTextWithMentions
                  text={text}
                  mentions={mentions}
                  isIncoming={isIncoming}
                  presentationScale={presentationScale}
                  theme={theme}
                />
              </div>
            )}
            
            {/* Caption for media */}
            {text && hasMedia && (
              <div style={{ padding: `${8 * presentationScale}px ${12 * presentationScale}px` }}>
                <MessageTextWithMentions
                  text={text}
                  mentions={mentions}
                  isIncoming={isIncoming}
                  presentationScale={presentationScale}
                  theme={theme}
                />
              </div>
            )}
            </div>
          </DoubleTapAnimation>
          
          {/* Timestamp */}
          {theme.showTimestamps && (
            <div style={timestampStyle}>
              {message.timestamp}
              {!isIncoming && message.status && (
                <span style={{ marginLeft: `${4 * presentationScale}px` }}>
                  {message.status === 'sent' && '✓'}
                  {message.status === 'delivered' && '✓✓'}
                  {message.status === 'seen' && (
                    <span style={{ color: '#4FC3F7' }}>✓✓</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Reactions - positioned relative to bubble */}
        {reactions && Object.keys(reactions).length > 0 && (
          <MessageReactions 
            reactions={reactions}
            participants={participants || []}
            presentationScale={presentationScale}
            isIncoming={isIncoming}
            opacity={reactionOpacity}
          />
        )}
      </div>
      
      {/* Message Status - below the message */}
      {!isIncoming && (
        <MessageStatus
          status={message.status}
          seenAt={message.seenAt}
          presentationScale={presentationScale}
          isIncoming={isIncoming}
        />
      )}
    </div>
  );
};