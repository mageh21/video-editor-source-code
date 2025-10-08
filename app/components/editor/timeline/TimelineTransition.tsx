import React from 'react';
import { ITransition } from '@/app/types';
import { useAppDispatch } from '@/app/store';
import { removeTransition } from '@/app/store/slices/projectSlice';

interface TimelineTransitionProps {
  transition: ITransition;
  position: number; // Position in seconds
  duration: number; // Duration in seconds
  timelineZoom: number;
  height: number;
}

export const TimelineTransition: React.FC<TimelineTransitionProps> = ({
  transition,
  position,
  duration,
  timelineZoom,
  height
}) => {
  const dispatch = useAppDispatch();
  
  // Calculate position and width in pixels
  const leftPx = position * timelineZoom;
  const widthPx = Math.max(20, duration * timelineZoom); // Minimum 20px width

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For now, clicking removes the transition
    // In future, this could select the transition for editing
    if (confirm(`Remove ${transition.name || transition.kind} transition?`)) {
      dispatch(removeTransition(transition.id));
    }
  };

  return (
    <div
      className="absolute top-1/2 transform -translate-y-1/2 bg-purple-500/80 border border-purple-400 rounded-sm text-white text-xs flex items-center justify-center cursor-pointer hover:bg-purple-600/90 transition-colors z-30"
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
        height: `${Math.min(height * 0.6, 24)}px`,
      }}
      title={`${transition.name || transition.kind} transition (click to remove)`}
      onClick={handleClick}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide truncate px-1">
        {transition.kind?.substr(0, 4) || 'T'}
      </span>
    </div>
  );
};