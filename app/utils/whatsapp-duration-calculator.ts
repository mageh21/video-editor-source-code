import { WhatsAppConversation } from '@/app/types';

export function calculateWhatsAppConversationDuration(conversation: WhatsAppConversation): number {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return 10; // Default duration in seconds
  }

  const messages = conversation.messages;
  let totalFrames = 0;
  
  // Initial delay (10 frames = 0.33s)
  totalFrames += 10;
  
  messages.forEach((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    
    // Use existing timing if available
    if (message.animationDelay !== undefined && message.typingDuration !== undefined) {
      if (index === messages.length - 1) {
        totalFrames = message.animationDelay + message.typingDuration + 60; // Extra time at end
      }
      return;
    }
    
    // Calculate typing duration based on text length (slower for WhatsApp)
    let typingDuration = 20; // Min 0.67s typing
    if (message.text) {
      const charCount = message.text.length;
      // 3 chars per frame typing speed for WhatsApp
      typingDuration = Math.min(90, Math.max(20, Math.floor(charCount / 3)));
    }
    
    // Voice messages have no typing
    if (message.messageType === 'voice') {
      typingDuration = 0;
    }
    
    // System messages appear instantly
    if (message.messageType === 'system') {
      typingDuration = 0;
    }
    
    // Calculate reading time for previous message (slower for WhatsApp)
    let readingTime = 45; // Base 1.5s reading time
    if (prevMessage && prevMessage.text) {
      const wordCount = prevMessage.text.split(/\s+/).length;
      // 5 words per second reading speed
      readingTime = Math.max(45, Math.floor((wordCount / 5) * 30));
    }
    
    // Add response delay between different senders
    let responseDelay = 15; // 0.5s pause between messages
    if (prevMessage && prevMessage.sender !== message.sender) {
      // Random delay between 0.33s and 2s for different senders
      responseDelay = 10 + Math.floor(Math.random() * 50);
    }
    
    // Add delays
    if (index > 0) {
      totalFrames += readingTime + responseDelay;
    }
    
    // Add typing time
    totalFrames += typingDuration;
    
    // Extra time for media
    if (message.messageType === 'image' || message.messageType === 'video' || message.media) {
      totalFrames += 30; // Extra 1s for media
    }
    
    // Extra time for voice messages
    if (message.messageType === 'voice' && message.voice) {
      totalFrames += Math.min(90, message.voice.duration * 30); // Up to 3s extra
    }
  });
  
  // Add extra time at the end
  totalFrames += 60; // 2 seconds to view final state
  
  // Convert frames to seconds (30 FPS)
  const durationInSeconds = Math.ceil(totalFrames / 30);
  
  // Minimum duration of 5 seconds
  return Math.max(5, durationInSeconds);
}