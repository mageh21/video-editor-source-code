import { InstagramConversation } from '@/app/types';

export function calculateInstagramConversationDuration(conversation: InstagramConversation): number {
  // Base duration for the conversation header and setup
  let duration = 2; // 2 seconds for initial setup
  
  // Check if messages exist
  if (!conversation.messages || !Array.isArray(conversation.messages)) {
    return duration;
  }
  
  // Add duration for each message based on its type and content
  conversation.messages.forEach((message, index) => {
    // Time for message appearance animation
    duration += 0.5;
    
    // Time based on message content
    if (message.messageType === 'text' || !message.messageType) {
      // Estimate reading time: ~200 words per minute
      const words = message.text ? message.text.split(' ').length : 0;
      const readingTime = (words / 200) * 60; // Convert to seconds
      duration += Math.max(readingTime, 1); // Minimum 1 second per text message
    } else if (message.messageType === 'image' || message.messageType === 'video') {
      // Fixed time for media messages
      duration += 2;
    } else if (message.messageType === 'voice' || message.messageType === 'audio') {
      // Voice messages typically show for their actual duration
      duration += 3; // Default 3 seconds for voice messages
    }
    
    // Add time for typing indicator between messages
    if (index < conversation.messages.length - 1) {
      duration += 1; // 1 second typing indicator
    }
    
    // Note: reactions field doesn't exist in InstagramMessage type
  });
  
  // Add some buffer time at the end
  duration += 1;
  
  // Round to nearest 0.5 second
  return Math.round(duration * 2) / 2;
}