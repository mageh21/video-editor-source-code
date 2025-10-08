import React, { useMemo, useRef, useEffect } from 'react';
import { WhatsAppConversation } from '@/app/types';
import { WhatsAppMessageBubble } from './WhatsAppMessageBubble';
import { WhatsAppHeader } from './WhatsAppHeader';

interface WhatsAppConversationRendererProps {
  conversation: WhatsAppConversation;
  currentTime: number;
  duration: number;
  presentationScale?: number;
  containerWidth?: number;
  containerHeight?: number;
}

// WhatsApp timing constants (slower than Instagram)
const TIMING = {
  INITIAL_DELAY: 10,           // Start after 0.33s
  TYPING_SPEED: 3,             // Characters per frame (slower)
  MIN_TYPING_TIME: 20,         // Minimum 0.67s typing time
  MAX_TYPING_TIME: 90,         // Maximum 3s typing time
  READING_TIME_BASE: 45,       // Base 1.5s reading time
  READING_SPEED: 5,            // Words per second (slower)
  PAUSE_BETWEEN_MESSAGES: 15,  // 0.5s pause between messages
  RESPONSE_DELAY_MIN: 10,      // 0.33s minimum response delay
  RESPONSE_DELAY_MAX: 60,      // 2s maximum response delay
  FPS: 30,                     // 30 frames per second
};

// WhatsApp spacing (more generous than Instagram)
const SPACING = {
  SAME_SENDER: 2,              // Tight spacing for same sender
  DIFFERENT_SENDER: 8,         // More spacing for different senders
  MESSAGE_MARGIN: 2,           // Standard margin
  TOP_PADDING: 10,             // Top padding
  BOTTOM_PADDING: 70,          // Bottom padding for input area
  MEDIA_SPACING: 2,            // Spacing after media
  GROUP_SPACING: 6,            // Group spacing
};

// WhatsApp color scheme (modern dark theme)
const WHATSAPP_COLORS = {
  background: '#0B141A', // Always use dark background like modern WhatsApp
  darkBackground: '#0B141A',
  inputBackground: '#2A3942',
  darkInputBackground: '#2A3942',
  border: '#2A3942',
  darkBorder: '#2A3942',
  text: '#E9EDEF',
  darkText: '#E9EDEF',
  textLight: '#8696A0',
  darkTextLight: '#8696A0',
  primary: '#00A884', // Modern WhatsApp green
  headerBg: '#202C33',
  darkHeaderBg: '#202C33',
  bubbleIncoming: '#202C33',
  darkBubbleIncoming: '#202C33',
  bubbleOutgoing: '#005C4B',
  darkBubbleOutgoing: '#005C4B',
};

// WhatsApp background (modern dark theme - solid color, no pattern)
const getWhatsAppBackground = (isDark: boolean) => {
  // Modern WhatsApp uses solid dark background without patterns
  return `
    <svg width="360" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="640" fill="#0B141A"/>
    </svg>
  `;
};

export const WhatsAppConversationRenderer: React.FC<WhatsAppConversationRendererProps> = ({
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
  
  // Always use dark mode for modern WhatsApp design
  const isDarkMode = true;
  
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
  
  const fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  // Calculate message timings
  const messageTimings = useMemo(() => {
    // If messages already have timing, use that
    const hasExistingTiming = messages.every(msg => 
      msg.animationDelay !== undefined && msg.typingDuration !== undefined
    );

    if (hasExistingTiming) {
      let accumulatedDelay = 0;
      return messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        
        // For typing indicators
        if ((message as any).messageType === 'typing') {
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
        if ((prevMessage as any)?.messageType === 'typing') {
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

  // Calculate viewport dimensions (accounting for status bar + header + input)
  const statusBarHeight = 24 * presentationScale;
  const headerHeight = 60 * presentationScale;
  const inputHeight = 56 * presentationScale;
  const viewportHeight = 640 - statusBarHeight - headerHeight - inputHeight;

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
        estimatedHeight += 140 * presentationScale;
      }
      
      if (message.messageType === 'voice') {
        estimatedHeight = 50 * presentationScale;
      }
      
      if (message.messageType === 'document') {
        estimatedHeight = 70 * presentationScale;
      }
      
      if (message.messageType === 'location') {
        estimatedHeight = 100 * presentationScale;
      }
      
      if ((message as any).messageType === 'system') {
        estimatedHeight = 30 * presentationScale;
      }

      if ((message as any).messageType === 'typing') {
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
    
    // WhatsApp conversation native size is 360x640
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
    backgroundColor: WHATSAPP_COLORS.background, // Always use dark background
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
    backgroundColor: WHATSAPP_COLORS.headerBg, // Same as header for modern look
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
    display: "flex",
    alignItems: "center",
    gap: `${8 * presentationScale}px`,
    height: `${inputHeight}px`,
  };

  const attachButtonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    width: `${24 * presentationScale}px`,
    height: `${24 * presentationScale}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: (WHATSAPP_COLORS as any).iconColor,
  };

  const inputFieldStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: WHATSAPP_COLORS.inputBackground,
    border: `1px solid ${WHATSAPP_COLORS.border}`,
    borderRadius: `${21 * presentationScale}px`,
    padding: `${10 * presentationScale}px ${16 * presentationScale}px`,
    fontSize: `${14 * presentationScale}px`,
    fontFamily,
    outline: "none",
    color: WHATSAPP_COLORS.textLight,
  };

  const micButtonStyle: React.CSSProperties = {
    backgroundColor: WHATSAPP_COLORS.primary,
    border: "none",
    borderRadius: "50%",
    width: `${40 * presentationScale}px`,
    height: `${40 * presentationScale}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
      {/* Header */}
      <WhatsAppHeader 
        conversation={conversation} 
        presentationScale={presentationScale}
        isDarkMode={isDarkMode}
      />
      
      {/* Encryption notice */}
      {theme?.encryptionNotice && frame > 30 && (
        <div style={{
          backgroundColor: '#FEF4C9',
          padding: `${8 * presentationScale}px ${16 * presentationScale}px`,
          textAlign: 'center',
          fontSize: `${12 * presentationScale}px`,
          color: '#54453B',
          display: frame > 30 && frame < 120 ? 'block' : 'none',
        }}>
          🔒 Messages and calls are end-to-end encrypted
        </div>
      )}
      
      {/* Messages area */}
      <div ref={scrollContainerRef} style={scrollContainerStyle}>
        <div ref={messagesContainerRef} style={messagesContainerStyle}>
          {messageLayouts.map((layout) => {
            const timing = messageTimings[layout.index];
            const message = layout.message;
            
            // Special handling for typing indicators
            if ((message as any).messageType === 'typing') {
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
            const progress = (message as any).messageType === 'typing'
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
                  transform: `translateY(0px)`, // No vertical movement for WhatsApp
                }}
              >
                <WhatsAppMessageBubble
                  message={layout.message}
                  participant={participants.find(p => p.id === layout.message.sender)}
                  participants={participants}
                  theme={theme}
                  isFirstInGroup={layout.isFirstInGroup}
                  isLastInGroup={layout.isLastInGroup}
                  showAvatar={layout.isLastInGroup && layout.message.isIncoming && participants.length > 2}
                  showSenderName={layout.isFirstInGroup && layout.message.isIncoming && participants.length > 2}
                  presentationScale={presentationScale}
                  isGroupChat={participants.length > 2}
                  isDarkMode={isDarkMode}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Input field */}
      <div style={inputContainerStyle}>
        {/* Attachment button */}
        {conversation.showAttachmentButton !== false && (
          <button style={attachButtonStyle}>
            <svg 
              width={`${24 * presentationScale}px`} 
              height={`${24 * presentationScale}px`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
          </button>
        )}
        
        <input
          type="text"
          placeholder="Type a message"
          style={inputFieldStyle}
          readOnly
        />
        
        {/* Mic button */}
        <button style={micButtonStyle}>
          <svg 
            width={`${20 * presentationScale}px`} 
            height={`${20 * presentationScale}px`} 
            viewBox="0 0 24 24" 
            fill="white"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
};