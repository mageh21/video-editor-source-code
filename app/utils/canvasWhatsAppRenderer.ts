import { WhatsAppConversation } from '@/app/types';

// WhatsApp color scheme (exactly matching the preview renderer)
const WHATSAPP_COLORS = {
  background: '#0B141A',
  inputBackground: '#2A3942',
  border: '#2A3942',
  text: '#E9EDEF',
  textLight: '#8696A0',
  primary: '#00A884',
  headerBackground: '#202C33',
  headerBorder: '#2A3942',
  messageReceived: '#202C33',
  messageSent: '#005C4B',
  bubbleReceived: '#202C33',
  bubbleSent: '#005C4B',
  textReceived: '#E9EDEF',
  textSent: '#E9EDEF',
  iconColor: '#8696A0',
};

// WhatsApp timing constants (similar to Instagram)
const TIMING = {
  INITIAL_DELAY: 0,
  TYPING_SPEED: 4,
  MIN_TYPING_TIME: 15,
  MAX_TYPING_TIME: 60,
  READING_TIME_BASE: 30,
  READING_SPEED: 6,
  PAUSE_BETWEEN_MESSAGES: 10,
  RESPONSE_DELAY_MIN: 5,
  RESPONSE_DELAY_MAX: 45,
  FPS: 30,
};

export function renderWhatsAppConversation(
  ctx: CanvasRenderingContext2D,
  conversation: WhatsAppConversation,
  currentTime: number,
  imageCache?: Map<string, HTMLImageElement>
) {
  const { messages, participants, theme } = conversation;
  const frame = Math.floor(currentTime * TIMING.FPS);
  
  // Save context state
  ctx.save();
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Clear and set background
  ctx.fillStyle = WHATSAPP_COLORS.background;
  ctx.fillRect(0, 0, 360, 640);
  
  // Set better text rendering properties
  if ('textRendering' in ctx) {
    (ctx as any).textRendering = 'optimizeLegibility';
  }
  if ('webkitFontSmoothing' in ctx) {
    (ctx as any).webkitFontSmoothing = 'antialiased';
  }
  
  // Draw header
  renderHeader(ctx, conversation);
  
  // Calculate message timings
  const messageTimings = calculateMessageTimings(messages);
  
  // Draw messages
  const statusBarHeight = 24; // Always show status bar for modern WhatsApp
  const headerHeight = 60;
  let currentY = statusBarHeight + headerHeight + 20;
  
  messages.forEach((message, index) => {
    const timing = messageTimings[index];
    let isVisible = false;
    
    // Special handling for typing indicators
    if ((message as any).messageType === 'typing') {
      isVisible = frame >= timing.startTyping && frame < timing.finishTyping;
    } else {
      isVisible = frame >= timing.finishTyping;
    }
    
    if (!isVisible) return;
    
    const participant = participants.find(p => p.id === message.sender);
    const isIncoming = message.isIncoming;
    
    // Check if this is a typing indicator
    if ((message as any).messageType === 'typing') {
      // Draw typing indicator bubble
      const bubbleWidth = 60;
      const bubbleHeight = 40;
      const bubbleX = isIncoming ? 16 : 360 - bubbleWidth - 16;
      const bubbleY = currentY;
      const bubbleRadius = 8;
      
      // Draw bubble background
      ctx.fillStyle = WHATSAPP_COLORS.bubbleReceived;
      drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
      ctx.fill();
      
      // Draw typing dots with animation
      const dotRadius = 3;
      const dotSpacing = 10;
      const centerX = bubbleX + bubbleWidth / 2;
      const centerY = bubbleY + bubbleHeight / 2;
      
      // Calculate animation progress (3 dots bouncing)
      const animationDuration = 1400;
      const animProgress = (frame * (1000 / TIMING.FPS)) % animationDuration;
      
      // Draw three dots
      for (let i = 0; i < 3; i++) {
        const dotX = centerX + (i - 1) * dotSpacing;
        const dotDelay = i * 160;
        const dotProgress = ((animProgress - dotDelay + animationDuration) % animationDuration) / animationDuration;
        
        let yOffset = 0;
        let opacity = 0.4;
        if (dotProgress > 0 && dotProgress < 0.5) {
          const bounceProgress = dotProgress / 0.5;
          if (bounceProgress < 0.3) {
            const t = bounceProgress / 0.3;
            yOffset = -8 * Math.sin(t * Math.PI);
            opacity = 0.4 + 0.6 * t;
          } else {
            const t = (bounceProgress - 0.3) / 0.7;
            yOffset = -8 * Math.sin((1 - t) * Math.PI);
            opacity = 1 - 0.6 * t;
          }
        }
        
        ctx.fillStyle = `rgba(139, 149, 160, ${opacity})`;
        ctx.beginPath();
        ctx.arc(dotX, centerY + yOffset, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      currentY += bubbleHeight + 8;
      return;
    }
    
    // Handle image messages
    if (message.messageType === 'image' && (message.media as any)?.src) {
      const maxWidth = 200;
      const imageHeight = 200;
      const bubbleX = isIncoming ? 16 : 360 - maxWidth - 16;
      const bubbleY = currentY;
      const bubbleRadius = 8;
      
      // Draw bubble background
      ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.bubbleReceived : WHATSAPP_COLORS.bubbleSent;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, imageHeight, bubbleRadius);
      ctx.fill();
      
      // Try to draw the actual image if available in cache
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, bubbleX + 4, bubbleY + 4, maxWidth - 8, imageHeight - 8, bubbleRadius - 4);
      ctx.clip();
      
      const cachedImage = imageCache?.get((message.media as any).src);
      if (cachedImage && cachedImage.complete) {
        try {
          const imgWidth = maxWidth - 8;
          const imgHeight = imageHeight - 8;
          ctx.drawImage(cachedImage, bubbleX + 4, bubbleY + 4, imgWidth, imgHeight);
        } catch (e) {
          console.error('Failed to draw WhatsApp image:', e);
          drawImagePlaceholder();
        }
      } else {
        drawImagePlaceholder();
      }
      
      ctx.restore();
      
      function drawImagePlaceholder() {
        ctx.fillStyle = '#2A3942';
        ctx.fillRect(bubbleX + 4, bubbleY + 4, maxWidth - 8, imageHeight - 8);
        
        ctx.fillStyle = '#8696A0';
        ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️', bubbleX + maxWidth / 2, bubbleY + imageHeight / 2);
      }
      
      currentY += imageHeight + 8;
      return;
    }
    
    // Handle voice messages
    if (message.messageType === 'voice' && (message as any).voice) {
      const maxWidth = 200;
      const bubbleHeight = 56;
      const bubbleX = isIncoming ? 16 : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw bubble
      ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.bubbleReceived : WHATSAPP_COLORS.bubbleSent;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, bubbleHeight, 8);
      ctx.fill();
      
      // Draw play button
      ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.textReceived : WHATSAPP_COLORS.textSent;
      ctx.beginPath();
      ctx.moveTo(bubbleX + 20, bubbleY + 18);
      ctx.lineTo(bubbleX + 20, bubbleY + 38);
      ctx.lineTo(bubbleX + 35, bubbleY + 28);
      ctx.closePath();
      ctx.fill();
      
      // Draw waveform
      const waveformX = bubbleX + 50;
      ctx.strokeStyle = isIncoming ? 'rgba(233, 237, 239, 0.3)' : 'rgba(233, 237, 239, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 15; i++) {
        const height = 8 + Math.sin(i * 0.5) * 6;
        ctx.beginPath();
        ctx.moveTo(waveformX + i * 6, bubbleY + 28 - height/2);
        ctx.lineTo(waveformX + i * 6, bubbleY + 28 + height/2);
        ctx.stroke();
      }
      
      // Draw duration
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.textReceived : WHATSAPP_COLORS.textSent;
      ctx.textAlign = 'right';
      ctx.fillText((message as any).voice.duration || '0:00', bubbleX + maxWidth - 12, bubbleY + 32);
      
      currentY += bubbleHeight + 8;
      return;
    }
    
    // Handle text messages
    const paddingX = 12;
    const paddingY = 8;
    const messageFontSize = 14;
    
    ctx.font = `400 ${messageFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
    
    const maxWidth = 240;
    const lines = wrapText(ctx, message.text || '', maxWidth - paddingX * 2);
    
    let actualTextWidth = 0;
    lines.forEach(line => {
      const lineMetrics = ctx.measureText(line);
      actualTextWidth = Math.max(actualTextWidth, lineMetrics.width);
    });
    
    const actualBubbleWidth = Math.min(maxWidth, actualTextWidth + paddingX * 2);
    const lineHeight = messageFontSize * 1.4;
    const messageHeight = lines.length * lineHeight + paddingY * 2;
    
    const bubbleX = isIncoming ? 16 : 360 - actualBubbleWidth - 16;
    const bubbleY = currentY;
    const bubbleRadius = 8;
    
    // Draw bubble background
    ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.bubbleReceived : WHATSAPP_COLORS.bubbleSent;
    drawRoundedRect(ctx, bubbleX, bubbleY, actualBubbleWidth, messageHeight, bubbleRadius);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = isIncoming ? WHATSAPP_COLORS.textReceived : WHATSAPP_COLORS.textSent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, lineIndex) => {
      const textX = bubbleX + paddingX;
      const textY = bubbleY + paddingY + lineIndex * lineHeight;
      ctx.fillText(line, textX, textY);
    });
    
    // Draw timestamp
    if (message.timestamp) {
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = WHATSAPP_COLORS.textLight;
      ctx.textAlign = isIncoming ? 'left' : 'right';
      
      const timestampY = bubbleY + messageHeight + 4;
      const timestampX = isIncoming ? bubbleX : bubbleX + actualBubbleWidth;
      
      ctx.fillText(message.timestamp, timestampX, timestampY);
    }
    
    currentY += messageHeight + 20;
    
    // Add extra spacing between different senders
    const nextMessage = messages[index + 1];
    if (nextMessage && nextMessage.sender !== message.sender) {
      currentY += 8;
    }
  });
  
  // Draw input field at bottom
  renderInputField(ctx);
  
  // Restore context state
  ctx.restore();
}

function renderHeader(ctx: CanvasRenderingContext2D, conversation: WhatsAppConversation) {
  const statusBarHeight = 24; // Always show status bar
  const headerHeight = 60;
  const totalHeaderHeight = statusBarHeight + headerHeight;
  
  // Status bar (always shown for modern WhatsApp)
  ctx.fillStyle = WHATSAPP_COLORS.headerBackground;
  ctx.fillRect(0, 0, 360, statusBarHeight);
  
  ctx.fillStyle = WHATSAPP_COLORS.text;
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  // App name
  ctx.textAlign = 'left';
  ctx.fillText('WhatsApp', 16, 17);
  
  // Time
  ctx.textAlign = 'center';
  ctx.fillText('16:02', 180, 17);
  
  // Header background
  ctx.fillStyle = WHATSAPP_COLORS.headerBackground;
  ctx.fillRect(0, statusBarHeight, 360, headerHeight);
  
  // Header border
  ctx.strokeStyle = WHATSAPP_COLORS.headerBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, totalHeaderHeight - 0.5);
  ctx.lineTo(360, totalHeaderHeight - 0.5);
  ctx.stroke();
  
  // Get other participant
  const otherParticipant = conversation.participants.find(p => p.id !== 'me') || conversation.participants[0];
  
  // Back button
  if (conversation.showBackButton !== false) {
    ctx.strokeStyle = WHATSAPP_COLORS.text;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const chevronX = 20;
    const chevronY = statusBarHeight + 28;
    const chevronSize = 8;
    
    ctx.beginPath();
    ctx.moveTo(chevronX + chevronSize, chevronY - chevronSize);
    ctx.lineTo(chevronX, chevronY);
    ctx.lineTo(chevronX + chevronSize, chevronY + chevronSize);
    ctx.stroke();
  }
  
  // Avatar
  const avatarX = 48;
  const avatarY = statusBarHeight + 12;
  const avatarSize = 32;
  
  ctx.fillStyle = otherParticipant?.color || WHATSAPP_COLORS.primary;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw avatar text/emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const avatarText = otherParticipant?.avatar && !otherParticipant.avatar.startsWith('http') 
    ? otherParticipant.avatar 
    : otherParticipant?.name?.charAt(0).toUpperCase() || '?';
  ctx.fillText(avatarText, avatarX + avatarSize/2, avatarY + avatarSize/2);
  
  // Title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = WHATSAPP_COLORS.text;
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(conversation.chatTitle, avatarX + avatarSize + 12, statusBarHeight + 28);
  
  // Subtitle
  if (conversation.chatSubtitle) {
    ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = WHATSAPP_COLORS.textLight;
    ctx.fillText(conversation.chatSubtitle, avatarX + avatarSize + 12, statusBarHeight + 44);
  }
  
  // Action icons (video, voice, menu)
  const iconSize = 24;
  const iconY = statusBarHeight + 16;
  let iconX = 360 - 24;
  
  ctx.save();
  ctx.strokeStyle = WHATSAPP_COLORS.text;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Menu icon (three dots)
  const menuX = iconX - 12;
  const menuY = iconY + 12;
  
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(menuX, menuY - 8 + i * 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  iconX -= 36;
  
  // Video call icon
  const vx = iconX - 12;
  const vy = iconY + 12;
  
  ctx.beginPath();
  ctx.roundRect(vx - 8, vy - 5, 12, 10, 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(vx + 4, vy - 3);
  ctx.lineTo(vx + 9, vy - 5);
  ctx.lineTo(vx + 9, vy + 5);
  ctx.lineTo(vx + 4, vy + 3);
  ctx.closePath();
  ctx.stroke();
  
  iconX -= 36;
  
  // Voice call icon
  const px = iconX - 12;
  const py = iconY + 12;
  
  ctx.beginPath();
  ctx.moveTo(px - 6, py + 8);
  ctx.quadraticCurveTo(px - 8, py + 8, px - 8, py + 6);
  ctx.lineTo(px - 8, py + 2);
  ctx.quadraticCurveTo(px - 8, py - 4, px - 4, py - 7);
  ctx.quadraticCurveTo(px - 2, py - 8, px, py - 8);
  ctx.quadraticCurveTo(px + 2, py - 8, px + 4, py - 7);
  ctx.quadraticCurveTo(px + 6, py - 6, px + 7, py - 4);
  ctx.quadraticCurveTo(px + 8, py - 2, px + 8, py);
  ctx.quadraticCurveTo(px + 8, py + 2, px + 7, py + 4);
  ctx.quadraticCurveTo(px + 6, py + 6, px + 4, py + 7);
  ctx.quadraticCurveTo(px + 2, py + 8, px, py + 8);
  ctx.quadraticCurveTo(px - 2, py + 8, px - 4, py + 7);
  ctx.quadraticCurveTo(px - 6, py + 6, px - 6, py + 8);
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

function renderInputField(ctx: CanvasRenderingContext2D) {
  const inputY = 640 - 56;
  const inputHeight = 56;
  
  // Input container background (same as header)
  ctx.fillStyle = WHATSAPP_COLORS.headerBackground;
  ctx.fillRect(0, inputY, 360, inputHeight);
  
  // Input field
  const inputFieldX = 50; // Leave space for attachment button
  const inputFieldY = inputY + 8;
  const inputFieldWidth = 260; // Adjusted for mic button
  const inputFieldHeight = 40;
  
  ctx.fillStyle = WHATSAPP_COLORS.inputBackground;
  drawRoundedRect(ctx, inputFieldX, inputFieldY, inputFieldWidth, inputFieldHeight, 20);
  ctx.fill();
  
  // Attachment button (paperclip icon)
  ctx.fillStyle = WHATSAPP_COLORS.iconColor;
  ctx.save();
  ctx.translate(20, inputY + 28);
  ctx.rotate(-45 * Math.PI / 180);
  ctx.fillRect(-1, -8, 2, 16);
  ctx.beginPath();
  ctx.arc(0, -8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Placeholder text
  ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = WHATSAPP_COLORS.textLight;
  ctx.textAlign = 'left';
  ctx.fillText('Type a message', inputFieldX + 16, inputFieldY + 26);
  
  // Mic button
  const micButtonX = 320;
  const micButtonY = inputY + 8;
  const micButtonSize = 40;
  
  ctx.fillStyle = WHATSAPP_COLORS.primary;
  ctx.beginPath();
  ctx.arc(micButtonX + micButtonSize/2, micButtonY + micButtonSize/2, micButtonSize/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Mic icon (white)
  ctx.fillStyle = '#FFFFFF';
  const micX = micButtonX + micButtonSize/2;
  const micY = micButtonY + micButtonSize/2;
  
  // Microphone body
  drawRoundedRect(ctx, micX - 4, micY - 8, 8, 12, 4);
  ctx.fill();
  
  // Microphone stand
  ctx.fillRect(micX - 1, micY + 4, 2, 6);
  ctx.fillRect(micX - 6, micY + 10, 12, 2);
}

function calculateMessageTimings(messages: WhatsAppConversation['messages']) {
  // Check if all messages have existing timing
  const hasExistingTiming = messages.every(msg => 
    msg.animationDelay !== undefined && msg.typingDuration !== undefined
  );
  
  if (hasExistingTiming) {
    let accumulatedDelay = 0;
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      
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
      
      if ((prevMessage as any)?.messageType === 'typing') {
        const start = (prevMessage.animationDelay || 0) + (prevMessage.typingDuration || 30);
        accumulatedDelay = start;
        return {
          startTyping: start,
          finishTyping: start,
          typingDuration: 0,
          readingTime: 45,
          isTypingIndicator: false
        };
      }
      
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
  
  // Calculate new timing
  let currentTime = TIMING.INITIAL_DELAY;
  
  return messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    
    let typingDuration = TIMING.MIN_TYPING_TIME;
    if (message.text) {
      const charCount = message.text.length;
      typingDuration = Math.min(
        TIMING.MAX_TYPING_TIME,
        Math.max(TIMING.MIN_TYPING_TIME, charCount / TIMING.TYPING_SPEED)
      );
    }
    
    let readingTime = TIMING.READING_TIME_BASE;
    if (prevMessage?.text) {
      const wordCount = prevMessage.text.split(/\s+/).length;
      readingTime = Math.max(
        TIMING.READING_TIME_BASE,
        (wordCount / TIMING.READING_SPEED) * 30
      );
    }
    
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
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}