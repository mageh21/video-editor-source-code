'use client';

import React, { useRef } from 'react';
import { PlayerRef } from '@remotion/player';
import { PreviewPlayer } from './remotion/Player';
import { SortedOutlines } from './selection/SortedOutlines';
import { StaticCaptionRenderer } from '../captions/CaptionRenderer';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setSelectedMediaIds, setSelectedTextIds, setActiveElement, setActiveElementIndex, setSelectedCaptionIds } from '@/app/store/slices/projectSlice';
import './selection/selection.css';

interface InteractivePreviewProps {
  playerRef?: React.RefObject<PlayerRef>;
  zoom: number;
}

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({ 
  playerRef: externalPlayerRef,
  zoom 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<PlayerRef>(null);
  const playerRef = externalPlayerRef || internalPlayerRef;
  const dispatch = useAppDispatch();
  const { currentTime, isPlaying, resolution } = useAppSelector((state) => state.projectState);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Check if the click was on background (not on selectable elements)
    const target = e.target as HTMLElement;
    const isBackgroundClick = target === containerRef.current || 
                              target === e.currentTarget ||
                              target.closest('video') || // clicking on video player itself
                              (!target.closest('[data-element-type]') && // not on a selectable element
                               !target.closest('.selection-outline')); // not on selection outline
    
    if (isBackgroundClick) {
      // Clear new selection system
      dispatch(setSelectedMediaIds([]));
      dispatch(setSelectedTextIds([]));
      dispatch(setSelectedCaptionIds([]));
      dispatch(setActiveElement(null));
      
      // Clear old selection system
      dispatch(setActiveElementIndex(-1));
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      onClick={handleContainerClick}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Remotion Player */}
      <div className="absolute inset-0">
        <PreviewPlayer ref={playerRef} />
      </div>
      
      {/* Caption Renderer */}
      <StaticCaptionRenderer 
        currentTime={currentTime}
        containerWidth={resolution.width}
        containerHeight={resolution.height}
      />
      
      {/* Selection Overlay - positioned above player content */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <SortedOutlines zoom={zoom} />
      </div>
    </div>
  );
};