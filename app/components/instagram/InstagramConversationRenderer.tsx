import React, { useMemo, useRef, useEffect } from 'react';
import { InstagramConversation } from '@/app/types';
import { InstagramMessageBubble } from './InstagramMessageBubble';
import { InstagramHeader } from './InstagramHeader';

interface InstagramConversationRendererProps {
  conversation: InstagramConversation;
  currentTime: number;
  duration: number;
  presentationScale?: number;
  containerWidth?: number;
  containerHeight?: number;
}

// Instagram timing constants (simplified for testing)
const TIMING = {
  INITIAL_DELAY: 0,            // Start immediately
  TYPING_SPEED: 4,             // Characters per frame (faster)
  MIN_TYPING_TIME: 15,         // Minimum 0.5s typing time
  MAX_TYPING_TIME: 60,         // Maximum 2s typing time
  READING_TIME_BASE: 30,       // Base 1s reading time
  READING_SPEED: 6,            // Words per second (faster)
  PAUSE_BETWEEN_MESSAGES: 10,  // 0.33s pause between messages
  RESPONSE_DELAY_MIN: 5,       // 0.17s minimum response delay
  RESPONSE_DELAY_MAX: 45,      // 1.5s maximum response delay
  FPS: 30,                     // 30 frames per second
};

// Instagram spacing (tighter than WhatsApp)
const SPACING = {
  SAME_SENDER: 1,              // Very tight spacing for same sender
  DIFFERENT_SENDER: 6,         // Minimal spacing for different senders
  MESSAGE_MARGIN: 1,           // Minimal margin
  TOP_PADDING: 8,              // Less top padding
  BOTTOM_PADDING: 60,          // Bottom padding for input area
  MEDIA_SPACING: 1,            // Tight spacing after media
  GROUP_SPACING: 4,            // Minimal group spacing
};

// Instagram color scheme
const INSTAGRAM_COLORS = {
  background: '#FFFFFF',
  inputBackground: '#F1F3F4',
  border: '#DBDBDB',
  text: '#262626',
  textLight: '#8E8E8E',
  primary: '#E4405F',
};

export const InstagramConversationRenderer: React.FC<InstagramConversationRendererProps> = ({
  conversation,
  currentTime,
  duration,
  presentationScale = 1,
  containerWidth,
  containerHeight,
}) => {
  const frame = Math.floor(currentTime * TIMING.FPS);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { messages = [], participants = [], theme } = conversation || {};
  
  // Ensure we have valid data
  if (!conversation || !messages || messages.length === 0) {
    return (
      <div style={{ 
        width: containerWidth || 360, 
        height: containerHeight || 640, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000'
      }}>
        <div style={{ color: '#fff' }}>No conversation data</div>
      </div>
    );
  }
  
  // Debug logging (commented out for production)
  // console.log('Instagram Renderer Debug:', {
  //   currentTime,
  //   frame,
  //   messagesCount: messages.length,
  //   firstMessageText: messages[0]?.text
  // });
  const fontFamily = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Calculate message timings
  const messageTimings = useMemo(() => {
    // If messages already have timing, use that
    const hasExistingTiming = messages.every(msg => 
      msg.animationDelay !== undefined && msg.typingDuration !== undefined
    );

    // console.log('Timing calculation:', { hasExistingTiming });

    if (hasExistingTiming) {
      let accumulatedDelay = 0;
      return messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        
        // For typing indicators
        if (message.messageType === 'typing') {
          const start = message.animationDelay || accumulatedDelay;
          const duration = message.typingDuration || 30;
          accumulatedDelay = start + duration;
          return {
            startTyping: start,
            finishTyping: start + duration,
            typingDuration: duration,
            readingTime: 0,
            isTypingIndicator: true
          };
        }
        
        // For regular messages that follow typing indicators
        if (prevMessage?.messageType === 'typing') {
          // This message should appear AFTER typing completes with a small gap
          const typingEnd = (prevMessage.animationDelay || 0) + (prevMessage.typingDuration || 30);
          const start = typingEnd + 5; // Add 5 frame gap after typing ends
          accumulatedDelay = start;
          return {
            startTyping: start,
            finishTyping: start, // Appear immediately after typing
            typingDuration: 0,
            readingTime: 45,
            isTypingIndicator: false
          };
        }
        
        // Regular messages
        const start = message.animationDelay || accumulatedDelay;
        const duration = message.typingDuration || 0;
        accumulatedDelay = start + duration;
        return {
          startTyping: start,
          finishTyping: start + duration,
          typingDuration: duration,
          readingTime: 45,
          isTypingIndicator: false
        };
      });
    }

    // Calculate timing if not present
    let currentTime = TIMING.INITIAL_DELAY;
    
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      
      // Calculate typing duration
      let typingDuration = TIMING.MIN_TYPING_TIME;
      if (message.text) {
        const charCount = message.text.length;
        typingDuration = Math.min(
          TIMING.MAX_TYPING_TIME,
          Math.max(TIMING.MIN_TYPING_TIME, charCount / TIMING.TYPING_SPEED)
        );
      }
      
      // Calculate reading time
      let readingTime = TIMING.READING_TIME_BASE;
      if (prevMessage?.text) {
        const wordCount = prevMessage.text.split(/\s+/).length;
        readingTime = Math.max(
          TIMING.READING_TIME_BASE,
          (wordCount / TIMING.READING_SPEED) * 30
        );
      }
      
      // Add response delay
      let responseDelay = TIMING.PAUSE_BETWEEN_MESSAGES;
      if (prevMessage && prevMessage.sender !== message.sender) {
        responseDelay = TIMING.RESPONSE_DELAY_MIN + 
          Math.random() * (TIMING.RESPONSE_DELAY_MAX - TIMING.RESPONSE_DELAY_MIN);
      }
      
      if (index > 0) {
        currentTime += readingTime + responseDelay;
      }
      
      const startTyping = currentTime;
      const finishTyping = currentTime + typingDuration;
      currentTime = finishTyping;
      
      return {
        startTyping,
        finishTyping,
        typingDuration,
        readingTime,
      };
    });
  }, [messages]);
  
  // Final timings calculated

  // Calculate viewport dimensions
  const headerHeight = Math.min(presentationScale * 60, 80);
  const inputHeight = 50 * presentationScale;
  const viewportHeight = 640 - headerHeight - inputHeight - (8 * presentationScale);

  // Calculate message heights and layouts
  const messageLayouts = useMemo(() => {
    let currentY = SPACING.TOP_PADDING * presentationScale;
    
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      // Group logic
      const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;
      const isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;
      
      // Spacing logic
      let marginTop = SPACING.MESSAGE_MARGIN * presentationScale;
      if (isFirstInGroup && index > 0) {
        marginTop = SPACING.DIFFERENT_SENDER * presentationScale;
      } else if (!isFirstInGroup) {
        marginTop = SPACING.SAME_SENDER * presentationScale;
      }
      
      // Height estimation
      let estimatedHeight = 40 * presentationScale; // Base height
      
      if (message.text) {
        const lines = Math.ceil(message.text.length / 30);
        estimatedHeight += lines * 16 * presentationScale;
      }
      
      if (message.messageType === 'image' || message.messageType === 'video' || message.media) {
        estimatedHeight += 120 * presentationScale;
      }
      
      if (message.messageType === 'system') {
        estimatedHeight = 30 * presentationScale;
      }
      
      if (message.messageType === 'typing') {
        estimatedHeight = 40 * presentationScale; // Fixed height for typing indicator
      }
      
      const y = currentY + marginTop;
      currentY = y + estimatedHeight;
      
      return {
        message,
        y,
        height: estimatedHeight,
        marginTop,
        isFirstInGroup,
        isLastInGroup,
        index,
      };
    });
  }, [messages, presentationScale]);

  // Calculate total content height and scroll position
  const totalContentHeight = messageLayouts.length > 0 
    ? messageLayouts[messageLayouts.length - 1].y + messageLayouts[messageLayouts.length - 1].height + (SPACING.BOTTOM_PADDING * presentationScale)
    : viewportHeight;

  // Calculate scroll for auto-scroll effect
  const visibleLayouts = messageLayouts.filter(layout => {
    const timing = messageTimings[layout.index];
    return frame >= timing.finishTyping;
  });

  const scrollY = useMemo(() => {
    if (visibleLayouts.length === 0) return 0;
    
    const lastVisible = visibleLayouts[visibleLayouts.length - 1];
    const targetScroll = Math.max(0, lastVisible.y + lastVisible.height - viewportHeight + (SPACING.BOTTOM_PADDING * presentationScale));
    
    return Math.min(targetScroll, Math.max(0, totalContentHeight - viewportHeight));
  }, [visibleLayouts, totalContentHeight, viewportHeight, presentationScale]);

  // Calculate scale if container dimensions are provided
  const scale = useMemo(() => {
    if (!containerWidth || !containerHeight) return 1;
    
    // Instagram conversation native size is 360x640
    const scaleX = containerWidth / 360;
    const scaleY = containerHeight / 640;
    
    // Use the smaller scale to maintain aspect ratio
    return Math.min(scaleX, scaleY);
  }, [containerWidth, containerHeight]);
  
  // Styles
  const wrapperStyle: React.CSSProperties = {
    width: containerWidth || "360px",
    height: containerHeight || "640px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  };
  
  const containerStyle: React.CSSProperties = {
    width: "360px",
    height: "640px",
    backgroundColor: INSTAGRAM_COLORS.background,
    position: "relative",
    overflow: "hidden",
    fontFamily,
    display: "flex",
    flexDirection: "column",
    transform: containerWidth && containerHeight ? `scale(${scale})` : undefined,
    transformOrigin: "center",
  };

  const scrollContainerStyle: React.CSSProperties = {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  };

  const messagesContainerStyle: React.CSSProperties = {
    transform: `translateY(-${scrollY}px)`,
    transition: "none", // No CSS transitions for video rendering
    minHeight: `${Math.max(viewportHeight, totalContentHeight)}px`,
    position: "relative",
  };

  const inputContainerStyle: React.CSSProperties = {
    backgroundColor: INSTAGRAM_COLORS.background,
    borderTop: `1px solid ${INSTAGRAM_COLORS.border}`,
    padding: `${8 * presentationScale}px ${16 * presentationScale}px`,
    display: "flex",
    alignItems: "center",
    gap: `${12 * presentationScale}px`,
    height: `${inputHeight}px`,
  };

  const inputFieldStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: INSTAGRAM_COLORS.inputBackground,
    border: `1px solid ${INSTAGRAM_COLORS.border}`,
    borderRadius: `${20 * presentationScale}px`,
    padding: `${8 * presentationScale}px ${16 * presentationScale}px`,
    fontSize: `${14 * presentationScale}px`,
    fontFamily,
    outline: "none",
    color: INSTAGRAM_COLORS.text,
  };

  const sendButtonStyle: React.CSSProperties = {
    backgroundColor: INSTAGRAM_COLORS.primary,
    border: "none",
    borderRadius: "50%",
    width: `${32 * presentationScale}px`,
    height: `${32 * presentationScale}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
      {/* Header */}
      <InstagramHeader 
        conversation={conversation} 
        presentationScale={presentationScale}
      />
      
      {/* Messages area */}
      <div ref={scrollContainerRef} style={scrollContainerStyle}>
        <div ref={messagesContainerRef} style={messagesContainerStyle}>
          {messageLayouts.map((layout) => {
            const timing = messageTimings[layout.index];
            const message = layout.message;
            
            // Special handling for typing indicators
            if (message.messageType === 'typing') {
              // Typing indicators are only visible during their duration
              const isTypingVisible = frame >= timing.startTyping && frame < timing.finishTyping;
              // Typing indicator visibility check
              if (!isTypingVisible) return null;
              // Continue to render the typing indicator below
            } else {
              // Regular messages appear after their timing
              const isVisible = frame >= timing.finishTyping;
              if (!isVisible) return null;
            }
            
            // Message visibility check

            // Entry animation
            const progress = message.messageType === 'typing' 
              ? 1 // Typing indicators don't need fade-in
              : Math.min(1, Math.max(0, (frame - timing.finishTyping) / 10));
            const opacity = progress;
            
            // Typing indicator rendering

            return (
              <div
                key={layout.message.id}
                style={{
                  position: "absolute",
                  top: `${layout.y}px`,
                  left: 0,
                  right: 0,
                  opacity,
                  transform: `translateY(0px)`, // No vertical movement for Instagram
                }}
              >
                <InstagramMessageBubble
                  message={{
                    ...layout.message,
                    // Show reactions 30 frames (1 second) after message appears
                    reactions: layout.message.reactions
                  }}
                  reactionOpacity={
                    layout.message.reactions && Object.keys(layout.message.reactions).length > 0
                      ? Math.min(1, Math.max(0, (frame - (timing.finishTyping + 30)) / 10))
                      : 0
                  }
                  participant={participants.find(p => p.id === layout.message.sender)}
                  participants={participants}
                  theme={theme}
                  isFirstInGroup={layout.isFirstInGroup}
                  isLastInGroup={layout.isLastInGroup}
                  showAvatar={layout.isLastInGroup && layout.message.isIncoming && participants.length > 2}
                  showSenderName={layout.isFirstInGroup && layout.message.isIncoming && participants.length > 2}
                  presentationScale={presentationScale}
                  isGroupChat={participants.length > 2}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Input field */}
      <div style={inputContainerStyle}>
        <input
          type="text"
          placeholder="Message..."
          style={inputFieldStyle}
          readOnly
        />
        <div style={sendButtonStyle}>
          <svg 
            width={`${16 * presentationScale}px`} 
            height={`${16 * presentationScale}px`} 
            viewBox="0 0 24 24" 
            fill="white"
          >
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
          </svg>
        </div>
      </div>
    </div>
    </div>
  );
};