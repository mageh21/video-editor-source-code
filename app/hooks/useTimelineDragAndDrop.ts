import { useCallback, useRef } from 'react';
import { MediaFile, TextElement } from '@/app/types';
import { DragInfo, GhostElement } from './useTimelineState';
import { useAppDispatch } from '@/app/store';
import { setMediaFiles, setTextElements } from '@/app/store/slices/projectSlice';

type TimelineElement = MediaFile | TextElement;

interface UseTimelineDragAndDropProps {
  overlays: TimelineElement[];
  durationInFrames: number;
  onOverlayChange: (updatedOverlay: TimelineElement) => void;
  updateGhostElement: (updates: Partial<GhostElement>) => void;
  resetDragState: () => void;
  timelineRef: React.RefObject<HTMLDivElement>;
  dragInfo: DragInfo | null;
  maxRows: number;
  fps?: number; // Add fps for conversions
}

export const useTimelineDragAndDrop = ({
  overlays,
  durationInFrames,
  onOverlayChange,
  updateGhostElement,
  resetDragState,
  timelineRef,
  dragInfo,
  maxRows,
  fps = 30,
}: UseTimelineDragAndDropProps) => {
  const dispatch = useAppDispatch();
  const lastValidPositionRef = useRef<{ left: number; top: number } | null>(null);

  const handleDragStart = useCallback(
    (overlay: TimelineElement, clientX: number, clientY: number, action: DragInfo['action']) => {
      // Initial setup handled by useTimelineState
      lastValidPositionRef.current = null;
    },
    []
  );

  const handleDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragInfo || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const relativeX = clientX - rect.left + scrollLeft;
      
      // Account for the timeline header (markers) height
      const headerHeight = 24; // 6 * 0.25rem = 1.5rem = 24px
      const relativeY = clientY - rect.top - headerHeight;

      const timelineWidth = timelineRef.current.scrollWidth;
      const ROW_HEIGHT = 64; // Must match the timeline component
      const rowHeight = ROW_HEIGHT;

      let newPosition: number;
      let newWidth: number;
      let newRow = Math.floor(relativeY / rowHeight);
      newRow = Math.max(0, Math.min(maxRows - 1, newRow));


      if (dragInfo.action === 'move') {
        const deltaX = relativeX - dragInfo.startClientX + rect.left - scrollLeft;
        const deltaSeconds = (deltaX / timelineWidth) * (durationInFrames / fps);
        newPosition = Math.max(0, dragInfo.startPosition + deltaSeconds);
        newWidth = dragInfo.originalDuration || 0;
        
        // Prevent dragging past timeline end (convert to seconds)
        const durationInSeconds = durationInFrames / fps;
        if (newPosition + newWidth > durationInSeconds) {
          newPosition = durationInSeconds - newWidth;
        }
      } else {
        // Handle resize operations
        const currentPositionInSeconds = (relativeX / timelineWidth) * (durationInFrames / fps);
        
        if (dragInfo.action === 'resize-start') {
          // Resizing from the left edge
          newPosition = Math.min(currentPositionInSeconds, dragInfo.startPosition + (dragInfo.originalDuration || 0) - 0.1);
          newPosition = Math.max(0, newPosition); // Ensure position doesn't go negative
          newWidth = dragInfo.startPosition + (dragInfo.originalDuration || 0) - newPosition;
        } else {
          // Resizing from the right edge
          newPosition = dragInfo.startPosition;
          newWidth = Math.max(0.1, currentPositionInSeconds - dragInfo.startPosition);
          // Ensure we don't exceed timeline duration
          const durationInSeconds = durationInFrames / fps;
          if (newPosition + newWidth > durationInSeconds) {
            newWidth = durationInSeconds - newPosition;
          }
          
        }
        
        newRow = dragInfo.startRow;
      }

      // Update ghost element (convert seconds to percentage)
      const durationInSeconds = durationInFrames / fps;
      const ghostLeft = (newPosition / durationInSeconds) * 100;
      const ghostWidth = (newWidth / durationInSeconds) * 100;
      const ghostTop = (newRow / maxRows) * 100;

      updateGhostElement({
        left: ghostLeft,
        width: ghostWidth,
        top: ghostTop,
      });

      lastValidPositionRef.current = { left: ghostLeft, top: ghostTop, width: ghostWidth } as any;
    },
    [dragInfo, timelineRef, maxRows, durationInFrames, updateGhostElement]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragInfo || !lastValidPositionRef.current) {
      resetDragState();
      return;
    }

    // Calculate final position from ghost element (convert from percentage to seconds)
    const ghostData = lastValidPositionRef.current as any;
    const durationInSeconds = durationInFrames / fps;
    const finalPosition = (ghostData.left / 100) * durationInSeconds;
    const finalRow = Math.floor((ghostData.top / 100) * maxRows);
    const finalWidth = ghostData.width ? (ghostData.width / 100) * durationInSeconds : null;

    // Update the dragged element
    const draggedElement = overlays.find(o => o.id === dragInfo.draggedItemId);


    if (draggedElement) {
      let duration: number;
      let updatedElement: TimelineElement;
      
      if (dragInfo.action === 'move') {
        // For move, keep original duration
        duration = draggedElement.positionEnd - draggedElement.positionStart;
        updatedElement = {
          ...draggedElement,
          positionStart: finalPosition,
          positionEnd: finalPosition + duration,
          row: finalRow,
        };
      } else if (dragInfo.action === 'resize-start') {
        // For resize-start, adjust start position
        // Ensure the new start position doesn't go past the end position
        const newStartPosition = Math.min(finalPosition, draggedElement.positionEnd - 1);
        updatedElement = {
          ...draggedElement,
          positionStart: Math.max(0, newStartPosition), // Ensure non-negative
          row: dragInfo.startRow, // Keep original row for resize
        };
      } else {
        // For resize-end, adjust end position
        // Use the final width if available, otherwise calculate from position
        const newEndPosition = finalWidth !== null 
          ? draggedElement.positionStart + finalWidth
          : finalPosition;
        
        // Ensure valid end position
        const validEndPosition = Math.max(
          draggedElement.positionStart + 0.1, // Minimum duration of 0.1 seconds
          Math.min(newEndPosition, durationInSeconds) // Don't exceed timeline duration
        );
        
        updatedElement = {
          ...draggedElement,
          positionEnd: validEndPosition,
          row: dragInfo.startRow, // Keep original row for resize
        };
      }

      onOverlayChange(updatedElement);
    }

    resetDragState();
  }, [dragInfo, overlays, durationInFrames, maxRows, onOverlayChange, resetDragState]);

  return {
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
};