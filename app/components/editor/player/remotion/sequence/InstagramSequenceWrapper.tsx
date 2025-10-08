import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { InstagramConversation } from '@/app/types';
import { InstagramConversationRenderer } from '@/app/components/instagram/InstagramConversationRenderer';

interface InstagramSequenceWrapperProps {
  conversation: InstagramConversation;
}

export const InstagramSequenceWrapper: React.FC<InstagramSequenceWrapperProps> = ({ conversation }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  
  // Convert frame to seconds (current time within the sequence)
  const currentTime = frame / fps;
  const duration = durationInFrames / fps;
  
  return (
    <InstagramConversationRenderer
      conversation={conversation}
      currentTime={currentTime}
      duration={duration}
      containerWidth={width}
      containerHeight={height}
    />
  );
};