import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { WhatsAppConversation } from '@/app/types';
import { WhatsAppConversationRenderer } from '@/app/components/whatsapp/WhatsAppConversationRenderer';

interface WhatsAppSequenceWrapperProps {
  conversation: WhatsAppConversation;
}

export const WhatsAppSequenceWrapper: React.FC<WhatsAppSequenceWrapperProps> = ({ conversation }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  
  // Convert frame to seconds (current time within the sequence)
  const currentTime = frame / fps;
  const duration = durationInFrames / fps;
  
  return (
    <WhatsAppConversationRenderer
      conversation={conversation}
      currentTime={currentTime}
      duration={duration}
      containerWidth={width}
      containerHeight={height}
    />
  );
};