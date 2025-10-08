"use client";

import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '@/app/store';
import { addTransition, updateTransition, removeTransition } from '@/app/store/slices/projectSlice';
import { MediaFile, ITransition } from '@/app/types';
import { generateTransitionId } from '@/app/utils/transitions';

interface TransitionDropZoneProps {
  fromClip: MediaFile;
  toClip: MediaFile;
  existingTransition?: ITransition;
  timelineZoom: number;
  position: number; // Position in seconds where the drop zone should appear
  onTransitionChange?: (transition: ITransition | null) => void;
}

export const TransitionDropZone: React.FC<TransitionDropZoneProps> = ({
  fromClip,
  toClip,
  existingTransition,
  timelineZoom,
  position,
  onTransitionChange
}) => {
  const dispatch = useAppDispatch();
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitionBeingDragged, setIsTransitionBeingDragged] = useState(false);

  // Listen for global transition drag events
  React.useEffect(() => {
    const handleDragStart = (e: any) => {
      if (e.detail?.type === 'transition') {
        setIsTransitionBeingDragged(true);
        setIsVisible(true);
      }
    };

    const handleDragEnd = () => {
      setIsTransitionBeingDragged(false);
      if (!isDraggedOver) {
        setIsVisible(false);
      }
    };

    window.addEventListener('transition-drag-start', handleDragStart);
    window.addEventListener('transition-drag-end', handleDragEnd);

    return () => {
      window.removeEventListener('transition-drag-start', handleDragStart);
      window.removeEventListener('transition-drag-end', handleDragEnd);
    };
  }, [isDraggedOver]);

  // Calculate position and size
  const leftPx = position * timelineZoom;
  const widthPx = Math.max(40, 80); // Minimum width for drop zone

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(true);
    setIsVisible(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only hide if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggedOver(false);
      setIsVisible(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    setIsVisible(false);

    console.log('Drop event triggered on transition zone');
    console.log('DataTransfer types:', Array.from(e.dataTransfer.types));
    
    try {
      // Use the reference app's approach - the first type IS the data
      const draggedDataString = e.dataTransfer.types[0];
      
      if (!draggedDataString || draggedDataString === 'Files') {
        console.error('No valid drag data found');
        return;
      }
      
      console.log('Drag data string from types[0]:', draggedDataString);
      
      // Get the actual data using the stringified object as key
      const actualData = e.dataTransfer.getData(draggedDataString);
      console.log('Actual data retrieved:', actualData);
      
      const dragData = JSON.parse(draggedDataString);
      
      if (dragData.type !== 'transition') {
        return;
      }

      // Handle "none" transition - remove existing transition
      if (dragData.kind === "none") {
        if (existingTransition) {
          dispatch(removeTransition(existingTransition.id));
          onTransitionChange?.(null);
        }
        return;
      }

      if (existingTransition) {
        // Update existing transition
        const updatedTransition: ITransition = {
          ...existingTransition,
          kind: dragData.kind,
          type: dragData.kind,
          name: dragData.name,
          duration: dragData.duration * 1000, // Convert to milliseconds
          direction: dragData.direction,
        };
        
        dispatch(updateTransition({
          id: existingTransition.id,
          updates: {
            kind: dragData.kind,
            type: dragData.kind,
            name: dragData.name,
            duration: dragData.duration * 1000,
            direction: dragData.direction,
            }
        }));
        
        onTransitionChange?.(updatedTransition);
      } else {
        // Create new transition
        const newTransition: ITransition = {
          id: generateTransitionId(),
          fromId: fromClip.id,
          toId: toClip.id,
          kind: dragData.kind,
          type: dragData.kind,
          name: dragData.name,
          duration: dragData.duration * 1000, // Convert to milliseconds
          direction: dragData.direction,
          trackId: `row-${fromClip.row}`,
        };
        
        dispatch(addTransition(newTransition));
        onTransitionChange?.(newTransition);
      }

      // Show success feedback
      console.log(`Transition ${dragData.name} applied between clips`);
      
    } catch (error) {
      console.error('Error handling transition drop:', error);
    }
  }, [dispatch, fromClip, toClip, existingTransition, onTransitionChange]);

  // Show drop zone on hover, when transition exists, or when dragging transitions
  const shouldShow = isVisible || isDraggedOver || existingTransition || isTransitionBeingDragged;

  if (!shouldShow) {
    return (
      <div
        className="absolute top-1/2 transform -translate-y-1/2 h-full opacity-0 hover:opacity-100 transition-opacity z-40 pointer-events-auto"
        style={{
          left: `${leftPx - widthPx/2}px`,
          width: `${widthPx}px`,
          height: '40px',
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-full h-full border-2 border-dashed border-purple-400/30 rounded bg-purple-500/10 flex items-center justify-center">
          <span className="text-purple-400 text-xs font-medium">Drop Transition</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute top-1/2 transform -translate-y-1/2 z-50 pointer-events-auto"
      style={{
        left: `${leftPx - widthPx/2}px`,
        width: `${widthPx}px`,
        height: '40px',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className={`w-full h-full rounded flex items-center justify-center transition-all ${
          isDraggedOver 
            ? 'bg-purple-500 border-2 border-purple-300 scale-110' 
            : existingTransition
              ? 'bg-purple-500/80 border border-purple-400'
              : 'border-2 border-dashed border-purple-400/50 bg-purple-500/20'
        }`}
      >
        {existingTransition ? (
          <span className="text-white text-[10px] font-bold uppercase tracking-wide">
            {existingTransition.kind.substr(0, 4)}
          </span>
        ) : (
          <span className="text-purple-300 text-[10px] font-medium">
            {isDraggedOver ? 'Drop Here' : '+'}
          </span>
        )}
      </div>
    </div>
  );
};