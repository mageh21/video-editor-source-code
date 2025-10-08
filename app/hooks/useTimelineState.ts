import { useState, useCallback, useRef } from 'react';
import { MediaFile, TextElement } from '@/app/types';

export interface DragInfo {
  startClientX: number;
  startClientY: number;
  startPosition: number;
  startRow: number;
  action: 'move' | 'resize-start' | 'resize-end';
  originalDuration?: number;
  draggedItemId: string;
}

export interface GhostElement {
  left: number;
  width: number;
  top: number;
}

type TimelineElement = MediaFile | TextElement;

export const useTimelineState = (
  durationInFrames: number,
  visibleRows: number,
  timelineRef: React.RefObject<HTMLDivElement>
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TimelineElement | null>(null);
  const [ghostElement, setGhostElement] = useState<GhostElement | null>(null);
  const [ghostMarkerPosition, setGhostMarkerPosition] = useState<number | null>(null);
  const [livePushOffsets, setLivePushOffsets] = useState<Map<string, number>>(new Map());
  const dragInfoRef = useRef<DragInfo | null>(null);

  const handleDragStart = useCallback(
    (element: TimelineElement, clientX: number, clientY: number, action: DragInfo['action']) => {
      setIsDragging(true);
      setDraggedItem(element);
      
      const dragInfo: DragInfo = {
        startClientX: clientX,
        startClientY: clientY,
        startPosition: element.positionStart,
        startRow: element.row || 0,
        action,
        originalDuration: element.positionEnd - element.positionStart,
        draggedItemId: element.id,
      };
      
      dragInfoRef.current = dragInfo;

      // Initialize ghost element
      const elementWidth = ((element.positionEnd - element.positionStart) / durationInFrames) * 100;
      const elementLeft = (element.positionStart / durationInFrames) * 100;
      const rowHeight = 100 / visibleRows;
      const elementTop = (element.row || 0) * rowHeight;

      setGhostElement({
        left: elementLeft,
        width: elementWidth,
        top: elementTop,
      });
    },
    [durationInFrames, visibleRows]
  );

  const updateGhostElement = useCallback((updates: Partial<GhostElement>) => {
    setGhostElement(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setGhostElement(null);
    setGhostMarkerPosition(null);
    setLivePushOffsets(new Map());
    dragInfoRef.current = null;
  }, []);

  return {
    isDragging,
    draggedItem,
    ghostElement,
    ghostMarkerPosition,
    livePushOffsets,
    dragInfo: dragInfoRef.current,
    handleDragStart,
    updateGhostElement,
    resetDragState,
    setGhostMarkerPosition,
    setLivePushOffsets,
  };
};