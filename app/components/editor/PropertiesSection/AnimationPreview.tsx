"use client";

import React, { useState } from 'react';
import { TransitionTemplate } from '@/app/utils/transition-templates';

interface AnimationPreviewProps {
  animationKey: string;
  animation: TransitionTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  animationKey,
  animation,
  isSelected,
  onClick,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const getAnimationStyle = (): React.CSSProperties => {
    // Get animation at progress 0.8 when hovering, 0 when not
    const progress = isHovering ? 0.8 : 0;
    const styles = animation.enter(progress);
    
    return {
      ...styles,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative aspect-square w-full rounded-lg border-2 p-2 transition-all duration-200 group overflow-hidden ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-700'
      }`}
      title={animation.name}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1.5">
        {/* Preview element */}
        <div className="relative h-8 w-8 flex-shrink-0">
          {/* Static preview */}
          <div
            className={`absolute inset-0 rounded-full ${
              isSelected
                ? 'border-2 border-dashed border-blue-500'
                : 'border border-gray-500'
            } transition-all duration-500`}
            style={{
              opacity: isHovering ? 0 : 0.8,
            }}
          />
          
          {/* Animated preview */}
          {animationKey !== 'none' && (
            <div
              className="absolute inset-0 rounded-full border-2 border-gray-400"
              style={getAnimationStyle()}
            />
          )}
        </div>

        {/* Animation name */}
        <span
          className={`text-[10px] font-medium transition-colors text-center w-full px-1 leading-tight ${
            isSelected
              ? 'text-blue-400'
              : 'text-gray-400 group-hover:text-gray-300'
          }`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            minHeight: '1.5rem',
          }}
        >
          {animation.name}
        </span>
      </div>
    </button>
  );
};