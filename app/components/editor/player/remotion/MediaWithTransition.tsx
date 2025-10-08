import React from 'react';
import { useCurrentFrame } from 'remotion';
import { MediaFile } from '@/app/types';
import { getTransitionStyles } from '@/app/utils/transition-utils';

interface MediaWithTransitionProps {
  media: MediaFile;
  children: React.ReactNode;
}

export const MediaWithTransition: React.FC<MediaWithTransitionProps> = ({ media, children }) => {
  const frame = useCurrentFrame();
  const fps = 30; // TODO: Get from constants
  const currentTime = frame / fps;
  
  // Get transition styles
  const transitionStyles = getTransitionStyles(
    currentTime,
    media.positionStart,
    media.positionEnd,
    media.entranceTransition,
    media.exitTransition
  );
  
  // Combine with existing styles
  const combinedStyles: React.CSSProperties = {
    ...transitionStyles,
    position: 'absolute',
    left: media.x || 0,
    top: media.y || 0,
    width: media.width || '100%',
    height: media.height || '100%',
  };
  
  // Apply rotation if present
  if (media.rotation) {
    const existingTransform = combinedStyles.transform || '';
    combinedStyles.transform = `${existingTransform} rotate(${media.rotation}deg)`;
  }
  
  // Apply opacity (combine with transition opacity)
  if (media.opacity !== undefined) {
    combinedStyles.opacity = (Number(combinedStyles.opacity) || 1) * media.opacity;
  }
  
  return (
    <div style={combinedStyles}>
      {children}
    </div>
  );
};