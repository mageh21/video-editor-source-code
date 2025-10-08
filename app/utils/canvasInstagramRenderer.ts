import { InstagramConversation } from '@/app/types';

// Instagram color scheme
const INSTAGRAM_COLORS = {
  background: '#FFFFFF',
  inputBackground: '#EFEFEF',
  border: '#DBDBDB',
  text: '#262626',
  textLight: '#8E8E8E',
  primary: '#E4405F',
  headerBackground: '#FFFFFF',
  headerBorder: '#DBDBDB',
};

// Reaction emojis
const REACTION_EMOJIS: { [key: string]: string } = {
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  thumbsup: '👍',
};

// Instagram timing constants (same as component)
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

export function renderInstagramConversation(
  ctx: CanvasRenderingContext2D,
  conversation: InstagramConversation,
  currentTime: number,
  imageCache?: Map<string, HTMLImageElement>
) {
  const { messages, participants, theme } = conversation;
  const frame = Math.floor(currentTime * TIMING.FPS);
  
  // Debug logging (commented out for production)
  // console.log('Canvas Instagram Render:', { frame, messagesCount: messages.length });
  
  // Save context state
  ctx.save();
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Clear and set background with subpixel rendering
  ctx.fillStyle = INSTAGRAM_COLORS.background;
  ctx.fillRect(0, 0, 360, 640);
  
  // Set better text rendering properties
  if ('textRendering' in ctx) {
    (ctx as any).textRendering = 'optimizeLegibility';
  }
  if ('webkitFontSmoothing' in ctx) {
    (ctx as any).webkitFontSmoothing = 'antialiased';
  }
  
  // Add subtle shadow for depth (glassy effect)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  
  // Draw header
  renderHeader(ctx, conversation);
  
  // Calculate message timings
  const messageTimings = calculateMessageTimings(messages);
  
  // Draw messages
  const statusBarHeight = conversation.showNotificationBar ? 20 : 0;
  const headerHeight = 56;
  let currentY = statusBarHeight + headerHeight + 20; // Total header height + padding
  
  // Drawing messages
  
  messages.forEach((message, index) => {
    const timing = messageTimings[index];
    let isVisible = false;
    
    // Special handling for typing indicators
    if (message.messageType === 'typing') {
      // Typing indicators are only visible during their duration
      isVisible = frame >= timing.startTyping && frame < timing.finishTyping;
      // Typing indicator visibility check
    } else {
      // Regular messages appear after their timing
      isVisible = frame >= timing.finishTyping;
    }
    
    // Message visibility check
    
    if (!isVisible) return;
    
    const participant = participants.find(p => p.id === message.sender);
    const isIncoming = message.isIncoming;
    
    // Draw profile picture for incoming messages
    if (isIncoming && participant && theme.showProfilePictures !== false) {
      const avatarSize = 28;
      const avatarX = 16;
      const avatarY = currentY;
      
      // Draw avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.clip();
      
      // Check if we have an avatar image
      const avatarImage = imageCache?.get(participant.avatar || '');
      if (avatarImage && avatarImage.complete && participant.avatar) {
        try {
          ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
        } catch (e) {
          drawDefaultAvatar();
        }
      } else {
        drawDefaultAvatar();
      }
      
      function drawDefaultAvatar() {
        // Draw colored circle background
        ctx.fillStyle = participant?.color || '#E4405F';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        
        // Draw initial
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = participant?.name?.charAt(0).toUpperCase() || '?';
        ctx.fillText(initial, avatarX + avatarSize/2, avatarY + avatarSize/2);
      }
      
      ctx.restore();
    }
    
    // Check if this is a typing indicator
    if (message.messageType === 'typing') {
      // Draw typing indicator bubble
      const bubbleWidth = 60;
      const bubbleHeight = 40;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - bubbleWidth - 16;
      const bubbleY = currentY;
      const bubbleRadius = 18;
      
      // Draw bubble background
      ctx.fillStyle = theme.bubbleColorIncoming;
      drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
      ctx.fill();
      
      // Draw typing dots with animation
      const dotRadius = 4;
      const dotSpacing = 12;
      const centerX = bubbleX + bubbleWidth / 2;
      const centerY = bubbleY + bubbleHeight / 2;
      
      // Calculate animation progress (3 dots bouncing)
      const animationDuration = 1400; // 1.4 seconds
      const animProgress = (frame * (1000 / TIMING.FPS)) % animationDuration;
      
      // Draw three dots
      for (let i = 0; i < 3; i++) {
        const dotX = centerX + (i - 1) * dotSpacing;
        const dotDelay = i * 160; // 0.16s delay between dots
        const dotProgress = ((animProgress - dotDelay + animationDuration) % animationDuration) / animationDuration;
        
        // Calculate bounce
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
        
        ctx.fillStyle = `rgba(142, 142, 142, ${opacity})`;
        ctx.beginPath();
        ctx.arc(dotX, centerY + yOffset, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      currentY += bubbleHeight + 8;
      return; // Skip regular message rendering
    }
    
    // Handle Voice Messages
    if (message.messageType === 'voice' && message.voice) {
      const maxWidth = 200;
      const bubbleHeight = 56;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw bubble
      ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, bubbleHeight, 18);
      ctx.fill();
      
      // Draw play button
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.beginPath();
      ctx.moveTo(bubbleX + 20, bubbleY + 18);
      ctx.lineTo(bubbleX + 20, bubbleY + 38);
      ctx.lineTo(bubbleX + 35, bubbleY + 28);
      ctx.closePath();
      ctx.fill();
      
      // Draw waveform
      const waveformX = bubbleX + 50;
      ctx.strokeStyle = isIncoming ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const height = 10 + Math.sin(i * 0.5) * 8;
        ctx.beginPath();
        ctx.moveTo(waveformX + i * 6, bubbleY + 28 - height/2);
        ctx.lineTo(waveformX + i * 6, bubbleY + 28 + height/2);
        ctx.stroke();
      }
      
      // Draw duration
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.textAlign = 'right';
      ctx.fillText(String(message.voice.duration || '0:00'), bubbleX + maxWidth - 12, bubbleY + 32);
      
      currentY += bubbleHeight + 8;
      return;
    }
    
    // Handle Video Messages
    if (message.messageType === 'video' && message.media) {
      const maxWidth = 200;
      const videoHeight = 150;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw video frame
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, videoHeight, 18);
      ctx.fill();
      
      // Draw play button overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(bubbleX + maxWidth/2, bubbleY + videoHeight/2, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(bubbleX + maxWidth/2 - 8, bubbleY + videoHeight/2 - 12);
      ctx.lineTo(bubbleX + maxWidth/2 - 8, bubbleY + videoHeight/2 + 12);
      ctx.lineTo(bubbleX + maxWidth/2 + 12, bubbleY + videoHeight/2);
      ctx.closePath();
      ctx.fill();
      
      // Draw duration if available
      if (message.media.duration) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(bubbleX + maxWidth - 50, bubbleY + videoHeight - 25, 45, 20);
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(String(message.media.duration), bubbleX + maxWidth - 27.5, bubbleY + videoHeight - 10);
      }
      
      currentY += videoHeight + 8;
      return;
    }
    
    // Handle Story Reply
    if (message.messageType === 'story_reply' && message.storyReply) {
      const maxWidth = 240;
      const storyHeight = 80;
      const textPadding = 12;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw story preview
      ctx.fillStyle = '#F0F0F0';
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, storyHeight, 12);
      ctx.fill();
      
      // Draw story thumbnail placeholder
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(bubbleX + 8, bubbleY + 8, 64, 64);
      
      // Draw story owner and caption
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(message.storyReply.storyOwner + "'s story", bubbleX + 80, bubbleY + 25);
      
      if (message.storyReply.storyCaption) {
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#666666';
        const caption = message.storyReply.storyCaption.length > 40 
          ? message.storyReply.storyCaption.substring(0, 37) + '...'
          : message.storyReply.storyCaption;
        ctx.fillText(caption, bubbleX + 80, bubbleY + 40);
      }
      
      // Draw reply text bubble
      if (message.text) {
        const replyY = bubbleY + storyHeight + 8;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(message.text).width;
        const bubbleWidth = Math.min(textWidth + textPadding * 2, maxWidth);
        
        ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
        drawRoundedRect(ctx, bubbleX, replyY, bubbleWidth, 36, 18);
        ctx.fill();
        
        ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
        ctx.textAlign = 'left';
        ctx.fillText(message.text, bubbleX + textPadding, replyY + 23);
        
        currentY += storyHeight + 36 + 16;
      } else {
        currentY += storyHeight + 8;
      }
      return;
    }
    
    // Handle Location Messages
    if (message.messageType === 'location' && message.location) {
      const maxWidth = 200;
      const mapHeight = 120;
      const infoHeight = 50;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw bubble
      ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, mapHeight + infoHeight, 18);
      ctx.fill();
      
      // Draw map area
      ctx.fillStyle = '#E5E5E5';
      ctx.fillRect(bubbleX, bubbleY, maxWidth, mapHeight);
      
      // Draw location pin
      ctx.fillStyle = '#E4405F';
      ctx.beginPath();
      ctx.arc(bubbleX + maxWidth/2, bubbleY + mapHeight/2 - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bubbleX + maxWidth/2 - 8, bubbleY + mapHeight/2);
      ctx.lineTo(bubbleX + maxWidth/2, bubbleY + mapHeight/2 + 15);
      ctx.lineTo(bubbleX + maxWidth/2 + 8, bubbleY + mapHeight/2);
      ctx.closePath();
      ctx.fill();
      
      // Draw location info
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(message.location.name, bubbleX + 12, bubbleY + mapHeight + 20);
      
      if (message.location.address) {
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isIncoming ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
        ctx.fillText(message.location.address, bubbleX + 12, bubbleY + mapHeight + 36);
      }
      
      currentY += mapHeight + infoHeight + 8;
      return;
    }
    
    // Handle Music Messages
    if (message.messageType === 'music' && message.music) {
      const maxWidth = 240;
      const bubbleHeight = 64;
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw bubble
      ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, bubbleHeight, 18);
      ctx.fill();
      
      // Draw album art placeholder
      ctx.fillStyle = isIncoming ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)';
      ctx.fillRect(bubbleX + 8, bubbleY + 8, 48, 48);
      ctx.fillStyle = isIncoming ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', bubbleX + 32, bubbleY + 38);
      
      // Draw song info
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(message.music.title, bubbleX + 64, bubbleY + 24);
      
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isIncoming ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
      ctx.fillText(message.music.artist, bubbleX + 64, bubbleY + 40);
      
      // Draw play button
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.beginPath();
      ctx.arc(bubbleX + maxWidth - 24, bubbleY + 32, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bubbleX + maxWidth - 28, bubbleY + 26);
      ctx.lineTo(bubbleX + maxWidth - 28, bubbleY + 38);
      ctx.lineTo(bubbleX + maxWidth - 18, bubbleY + 32);
      ctx.closePath();
      ctx.fill();
      
      currentY += bubbleHeight + 8;
      return;
    }
    
    // Handle Poll Messages
    if (message.messageType === 'poll' && message.poll) {
      const maxWidth = 260;
      const optionHeight = 36;
      const totalHeight = 40 + (message.poll.options.length * (optionHeight + 8));
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      
      // Draw bubble
      ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, totalHeight, 18);
      ctx.fill();
      
      // Draw question
      ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(message.poll.question, bubbleX + 12, bubbleY + 24);
      
      // Draw options
      let optionY = bubbleY + 40;
      message.poll.options.forEach((option) => {
        // Draw option background
        ctx.fillStyle = isIncoming ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
        drawRoundedRect(ctx, bubbleX + 12, optionY, maxWidth - 24, optionHeight, 8);
        ctx.fill();
        
        // Draw option text
        ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(option.text, bubbleX + 20, optionY + 22);
        
        // Draw percentage if votes exist
        if (option.votes.length > 0 || option.percentage > 0) {
          ctx.textAlign = 'right';
          ctx.fillText(`${option.percentage}%`, bubbleX + maxWidth - 20, optionY + 22);
          ctx.textAlign = 'left';
        }
        
        optionY += optionHeight + 8;
      });
      
      currentY += totalHeight + 8;
      return;
    }
    
    // Handle Group System Messages
    if (['member_added', 'member_removed', 'group_name_changed', 'group_photo_changed'].includes(message.messageType || '')) {
      const iconMap: Record<string, string> = {
        'member_added': '➕',
        'member_removed': '➖',
        'group_name_changed': '✏️',
        'group_photo_changed': '📷'
      };
      
      // Center-aligned system message
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = (theme as any).textLight || '#8E8E8E';
      ctx.textAlign = 'center';
      
      const icon = iconMap[message.messageType || ''] || '📢';
      const text = message.text || 'System message';
      
      // Draw icon and text
      ctx.fillText(`${icon} ${text}`, 180, currentY + 16);
      
      currentY += 32;
      return;
    }
    
    // Check if this is an image or GIF message
    if ((message.messageType === 'image' || message.messageType === 'gif') && message.media?.src) {
      // Handle image/GIF message
      const maxWidth = 200;
      const imageHeight = 200; // Fixed height for images
      const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
      const bubbleX = isIncoming ? 16 + avatarSpace : 360 - maxWidth - 16;
      const bubbleY = currentY;
      const bubbleRadius = 18;
      
      // Drawing image message
      
      // Draw bubble background
      ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
      drawRoundedRect(ctx, bubbleX, bubbleY, maxWidth, imageHeight, bubbleRadius);
      ctx.fill();
      
      // Try to draw the actual image if available in cache
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, bubbleX + 4, bubbleY + 4, maxWidth - 8, imageHeight - 8, bubbleRadius - 4);
      ctx.clip();
      
      const cachedImage = imageCache?.get(message.media.src);
      if (cachedImage && cachedImage.complete) {
        // Draw the actual image
        try {
          const imgWidth = maxWidth - 8;
          const imgHeight = imageHeight - 8;
          ctx.drawImage(cachedImage, bubbleX + 4, bubbleY + 4, imgWidth, imgHeight);
        } catch (e) {
          console.error('Failed to draw Instagram image:', e);
          // Fall back to placeholder
          drawImagePlaceholder();
        }
      } else {
        // Draw placeholder
        drawImagePlaceholder();
      }
      
      ctx.restore();
      
      function drawImagePlaceholder() {
        // Draw a placeholder for the image
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(bubbleX + 4, bubbleY + 4, maxWidth - 8, imageHeight - 8);
        
        // Draw image icon in center
        ctx.fillStyle = '#808080';
        ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️', bubbleX + maxWidth / 2, bubbleY + imageHeight / 2);
      }
      
      // Update currentY for next message
      currentY += imageHeight + 8;
      
      // Draw timestamp
      if (theme.showTimestamps) {
        ctx.font = `400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = INSTAGRAM_COLORS.textLight;
        ctx.textAlign = isIncoming ? 'left' : 'right';
        
        const timestampY = bubbleY + imageHeight + 4;
        const timestampX = isIncoming ? bubbleX : bubbleX + maxWidth;
        
        ctx.fillText(message.timestamp, timestampX, timestampY);
        currentY += 16; // Add space for timestamp
      }
      
      return; // Skip the text rendering below
    }
    
    // Handle text messages (existing code)
    // Calculate message width and position
    const paddingX = 12;
    const paddingY = 8;
    const messageFontSize = 14;
    
    // Set font with better rendering and subpixel positioning
    ctx.font = `400 ${messageFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
    (ctx as any).textRendering = 'optimizeLegibility';
    
    // Apply subtle shadow for depth
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    
    // Calculate max width for bubbles
    const maxWidth = 240;
    
    // First wrap text to see how many lines we need
    const lines = wrapText(ctx, message.text || '', maxWidth - paddingX * 2);
    
    // Now measure the actual width of each line
    let actualTextWidth = 0;
    lines.forEach(line => {
      const lineMetrics = ctx.measureText(line);
      actualTextWidth = Math.max(actualTextWidth, lineMetrics.width);
    });
    
    // Calculate actual bubble width based on longest line
    const actualBubbleWidth = Math.min(maxWidth, actualTextWidth + paddingX * 2);
    const lineHeight = messageFontSize * 1.4;
    const messageHeight = lines.length * lineHeight + paddingY * 2;
    
    // Draw bubble - adjust position for avatar space with subpixel precision
    const avatarSpace = (isIncoming && participant && theme.showProfilePictures !== false) ? 36 : 0;
    // Use subpixel positioning for sharper rendering
    const bubbleX = Math.round((isIncoming ? 16 + avatarSpace : 360 - actualBubbleWidth - 16) * 2) / 2;
    const bubbleY = Math.round(currentY * 2) / 2;
    const bubbleRadius = 18;
    
    // Drawing message bubble
    
    // Set bubble color
    ctx.fillStyle = isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing;
    
    // Draw rounded rectangle with actual width
    drawRoundedRect(ctx, bubbleX, bubbleY, actualBubbleWidth, messageHeight, bubbleRadius);
    ctx.fill();
    
    // Draw text with improved rendering
    ctx.restore(); // Remove shadow for text
    ctx.fillStyle = isIncoming ? theme.textColorIncoming : theme.textColorOutgoing;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Use subpixel positioning for text
    lines.forEach((line, lineIndex) => {
      const textX = Math.round((bubbleX + paddingX) * 2) / 2;
      const textY = Math.round((bubbleY + paddingY + lineIndex * lineHeight) * 2) / 2;
      ctx.fillText(line, textX, textY);
    });
    
    // Draw timestamp
    if (theme.showTimestamps) {
      ctx.font = `400 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = INSTAGRAM_COLORS.textLight;
      ctx.textAlign = isIncoming ? 'left' : 'right';
      
      const timestampY = bubbleY + messageHeight + 4;
      const timestampX = isIncoming ? bubbleX : bubbleX + actualBubbleWidth;
      
      ctx.fillText(message.timestamp, timestampX, timestampY);
    }
    
    // Draw reactions with delay (30 frames after message appears)
    if (message.reactions && Object.keys(message.reactions).length > 0) {
      const reactionFrame = frame - (timing.finishTyping + 30);
      if (reactionFrame >= 0) {
        // Calculate opacity for fade-in effect
        const reactionOpacity = Math.min(1, Math.max(0, reactionFrame / 10));
        ctx.save();
        ctx.globalAlpha = reactionOpacity;
        drawReactions(ctx, message.reactions, bubbleX, bubbleY + messageHeight, actualBubbleWidth, isIncoming);
        ctx.restore();
      }
    }
    
    // Update Y position for next message
    currentY += messageHeight + 20;
    
    // Add extra spacing between different senders
    const nextMessage = messages[index + 1];
    if (nextMessage && nextMessage.sender !== message.sender) {
      currentY += 8;
    }
  });
  
  // Messages will appear based on their timing
  
  // Draw input field at bottom
  renderInputField(ctx);
  
  // Restore context state
  ctx.restore();
}

function renderHeader(ctx: CanvasRenderingContext2D, conversation: InstagramConversation) {
  const statusBarHeight = conversation.showNotificationBar ? 20 : 0;
  const headerHeight = 56;
  const totalHeaderHeight = statusBarHeight + headerHeight;
  
  // Status bar
  if (conversation.showNotificationBar) {
    // Status bar background
    ctx.fillStyle = conversation.theme.statusBarColor || INSTAGRAM_COLORS.headerBackground;
    ctx.fillRect(0, 0, 360, statusBarHeight);
    
    // Status bar text
    ctx.fillStyle = '#000000';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Carrier/App name
    ctx.textAlign = 'left';
    ctx.fillText(conversation.notificationBar?.carrier || 'Instagram', 20, 14);
    
    // Time
    ctx.textAlign = 'center';
    ctx.fillText(conversation.notificationBar?.time || '16:51', 180, 14);
    
    // Battery and signal icons (simplified)
    ctx.textAlign = 'right';
    ctx.fillText('🔋', 340, 14);
  }
  
  // Header background with subtle gradient for depth
  const gradient = ctx.createLinearGradient(0, statusBarHeight, 0, statusBarHeight + headerHeight);
  gradient.addColorStop(0, conversation.theme.headerColor || INSTAGRAM_COLORS.headerBackground);
  gradient.addColorStop(1, conversation.theme.headerColor || INSTAGRAM_COLORS.headerBackground);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, statusBarHeight, 360, headerHeight);
  
  // Header border with perfect pixel alignment
  ctx.strokeStyle = INSTAGRAM_COLORS.headerBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, totalHeaderHeight - 0.5);
  ctx.lineTo(360, totalHeaderHeight - 0.5);
  ctx.stroke();
  
  // Get other participant
  const otherParticipant = conversation.participants.find(p => p.id !== 'me') || conversation.participants[0];
  
  // Back button (ChevronLeft icon)
  if (conversation.showBackButton !== false) {
    ctx.strokeStyle = INSTAGRAM_COLORS.text;
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
  
  // Avatar with improved rendering
  const avatarX = 48;
  const avatarY = statusBarHeight + 12;
  const avatarSize = 32;
  
  // Add subtle shadow for avatar depth
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  // Draw avatar background
  ctx.fillStyle = otherParticipant?.color || '#E4405F';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // Draw avatar text/emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const avatarText = otherParticipant?.avatar && !otherParticipant.avatar.startsWith('http') 
    ? otherParticipant.avatar 
    : otherParticipant?.name?.charAt(0).toUpperCase() || '?';
  ctx.fillText(avatarText, avatarX + avatarSize/2, avatarY + avatarSize/2);
  
  // Title and subtitle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  
  // Title with improved font rendering
  ctx.save();
  ctx.fillStyle = INSTAGRAM_COLORS.text;
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  // Enable better font smoothing
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = '-0.01em';
  }
  ctx.fillText(conversation.chatTitle, avatarX + avatarSize + 12, statusBarHeight + 28);
  ctx.restore();
  
  // Subtitle
  if (conversation.chatSubtitle) {
    ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = INSTAGRAM_COLORS.textLight;
    ctx.fillText(conversation.chatSubtitle, avatarX + avatarSize + 12, statusBarHeight + 44);
  }
  
  // Action icons (phone, video, info) - matching Lucide React icons
  const iconSize = 24;
  const iconY = statusBarHeight + 16;
  let iconX = 360 - 24;
  
  ctx.save();
  ctx.strokeStyle = INSTAGRAM_COLORS.text;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Add subtle anti-aliasing for icons
  if ('imageSmoothingEnabled' in ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  
  // Info icon (Lucide Info)
  if (conversation.showMenuButton !== false) {
    const cx = iconX - 12;
    const cy = iconY + 12;
    const radius = 10;
    
    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Info "i" - use line cap for dot
    ctx.save();
    ctx.lineCap = 'round';
    
    // Dot
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy - 4.1); // Very short line to create dot with round cap
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cx, cy - 1);
    ctx.lineTo(cx, cy + 5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
    
    iconX -= 36;
  }
  
  // Video icon (Lucide Video)
  if (conversation.showVideoCallButton !== false) {
    const vx = iconX - 12;
    const vy = iconY + 12;
    
    // Main camera body
    ctx.beginPath();
    ctx.roundRect(vx - 8, vy - 5, 12, 10, 2);
    ctx.stroke();
    
    // Camera lens (right side extension)
    ctx.beginPath();
    ctx.moveTo(vx + 4, vy - 3);
    ctx.lineTo(vx + 9, vy - 5);
    ctx.lineTo(vx + 9, vy + 5);
    ctx.lineTo(vx + 4, vy + 3);
    ctx.closePath();
    ctx.stroke();
    
    iconX -= 36;
  }
  
  // Phone icon (Lucide Phone)
  if (conversation.showVoiceCallButton !== false) {
    const px = iconX - 12;
    const py = iconY + 12;
    const scale = 0.8; // Scale down to match icon size
    
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);
    
    // Lucide Phone icon path
    ctx.beginPath();
    // Start from bottom left
    ctx.moveTo(-6, 8);
    // Bottom curve
    ctx.quadraticCurveTo(-8, 8, -8, 6);
    // Left side
    ctx.lineTo(-8, 2);
    // Top left curve
    ctx.quadraticCurveTo(-8, -4, -4, -7);
    // Diagonal top
    ctx.quadraticCurveTo(-2, -8, 0, -8);
    // Top right
    ctx.quadraticCurveTo(2, -8, 4, -7);
    // Right ear piece
    ctx.quadraticCurveTo(6, -6, 7, -4);
    ctx.quadraticCurveTo(8, -2, 8, 0);
    // Right side
    ctx.quadraticCurveTo(8, 2, 7, 4);
    // Bottom right
    ctx.quadraticCurveTo(6, 6, 4, 7);
    ctx.quadraticCurveTo(2, 8, 0, 8);
    // Bottom left
    ctx.quadraticCurveTo(-2, 8, -4, 7);
    ctx.quadraticCurveTo(-6, 6, -6, 8);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Reset text align and baseline
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function renderInputField(ctx: CanvasRenderingContext2D) {
  const inputY = 640 - 50;
  
  // Input container background
  ctx.fillStyle = INSTAGRAM_COLORS.background;
  ctx.fillRect(0, inputY, 360, 50);
  
  // Border with pixel-perfect alignment
  ctx.strokeStyle = INSTAGRAM_COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, inputY - 0.5);
  ctx.lineTo(360, inputY - 0.5);
  ctx.stroke();
  
  // Input field
  const inputFieldX = 16;
  const inputFieldY = inputY + 8;
  const inputFieldWidth = 296;
  const inputFieldHeight = 36;
  
  ctx.fillStyle = INSTAGRAM_COLORS.inputBackground;
  drawRoundedRect(ctx, inputFieldX, inputFieldY, inputFieldWidth, inputFieldHeight, 20);
  ctx.fill();
  
  // Placeholder text
  ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = INSTAGRAM_COLORS.textLight;
  ctx.fillText('Message...', inputFieldX + 16, inputFieldY + 20);
  
  // Send button
  const sendButtonX = 320;
  const sendButtonY = inputY + 9;
  const sendButtonSize = 32;
  
  ctx.fillStyle = INSTAGRAM_COLORS.primary;
  ctx.beginPath();
  ctx.arc(sendButtonX + sendButtonSize/2, sendButtonY + sendButtonSize/2, sendButtonSize/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Send icon (simple arrow)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(sendButtonX + 10, sendButtonY + 15);
  ctx.lineTo(sendButtonX + 20, sendButtonY + 15);
  ctx.lineTo(sendButtonX + 16, sendButtonY + 11);
  ctx.moveTo(sendButtonX + 20, sendButtonY + 15);
  ctx.lineTo(sendButtonX + 16, sendButtonY + 19);
  ctx.stroke();
}

function calculateMessageTimings(messages: InstagramConversation['messages']) {
  // Check if all messages have existing timing
  const hasExistingTiming = messages.every(msg => 
    msg.animationDelay !== undefined && msg.typingDuration !== undefined
  );
  
  // Message timing mode check
  
  if (hasExistingTiming) {
    // Use existing timing (already in frames)
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
        // This message should appear AFTER typing completes
        const start = (prevMessage.animationDelay || 0) + (prevMessage.typingDuration || 30);
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
  
  // Calculate new timing
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
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  // Use subpixel positioning for sharper corners
  const px = Math.round(x * 2) / 2;
  const py = Math.round(y * 2) / 2;
  const pw = Math.round(width * 2) / 2;
  const ph = Math.round(height * 2) / 2;
  
  ctx.beginPath();
  ctx.moveTo(px + radius, py);
  ctx.lineTo(px + pw - radius, py);
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + radius);
  ctx.lineTo(px + pw, py + ph - radius);
  ctx.quadraticCurveTo(px + pw, py + ph, px + pw - radius, py + ph);
  ctx.lineTo(px + radius, py + ph);
  ctx.quadraticCurveTo(px, py + ph, px, py + ph - radius);
  ctx.lineTo(px, py + radius);
  ctx.quadraticCurveTo(px, py, px + radius, py);
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
  
  // Text wrapping completed
  
  return lines;
}

function drawReactions(
  ctx: CanvasRenderingContext2D,
  reactions: { [userId: string]: string },
  bubbleX: number,
  bubbleY: number,
  bubbleWidth: number,
  isIncoming: boolean
) {
  // Group reactions by type
  const reactionGroups = Object.entries(reactions).reduce((acc, [userId, reaction]) => {
    if (!acc[reaction]) acc[reaction] = [];
    acc[reaction].push(userId);
    return acc;
  }, {} as { [reaction: string]: string[] });
  
  // Set up reaction styling
  ctx.save();
  
  const reactionHeight = 18;
  const reactionPadding = 8;
  const reactionGap = 2;
  // Position inside the bubble, at bottom right/left corner
  let currentX = isIncoming ? bubbleX + bubbleWidth - 4 : bubbleX + 4;
  const reactionY = bubbleY - reactionHeight - 4; // Inside the bubble, above the bottom edge
  
  // Draw each reaction group
  Object.entries(reactionGroups).forEach(([reaction, userIds], index) => {
    const emoji = REACTION_EMOJIS[reaction] || '❓';
    const showCount = userIds.length > 1;
    
    // Measure reaction width
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const emojiWidth = ctx.measureText(emoji).width;
    
    let reactionWidth = emojiWidth + reactionPadding * 2;
    if (showCount) {
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const countWidth = ctx.measureText(userIds.length.toString()).width;
      reactionWidth += countWidth + 4;
    }
    
    // Adjust X position based on alignment
    if (!isIncoming) {
      currentX -= reactionWidth;
      if (index > 0) currentX -= reactionGap;
    } else if (index > 0) {
      currentX += reactionGap;
    }
    
    // Draw reaction background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    drawRoundedRect(ctx, currentX, reactionY, reactionWidth, reactionHeight, 9);
    ctx.fill();
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    
    // Draw emoji
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, currentX + reactionPadding, reactionY + reactionHeight / 2);
    
    // Draw count if needed
    if (showCount) {
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        userIds.length.toString(), 
        currentX + reactionPadding + emojiWidth + 4, 
        reactionY + reactionHeight / 2
      );
    }
    
    // Update position for next reaction
    if (isIncoming) {
      currentX += reactionWidth;
    }
  });
  
  ctx.restore();
}