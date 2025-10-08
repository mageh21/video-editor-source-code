import { useMemo } from 'react';
import { MediaFile, TextElement } from '@/app/types';
import { GhostElement } from './useTimelineState';

type TimelineElement = MediaFile | TextElement;

interface UseTimelineSnappingProps {
  isDragging: boolean;
  ghostElement: GhostElement | null;
  draggedItem: TimelineElement | null;
  dragInfo: any;
  overlays: TimelineElement[];
  durationInFrames: number;
  visibleRows: number;
  snapThreshold: number;
}

export const useTimelineSnapping = ({
  isDragging,
  ghostElement,
  draggedItem,
  dragInfo,
  overlays,
  durationInFrames,
  visibleRows,
  snapThreshold,
}: UseTimelineSnappingProps) => {
  const snapPoints = useMemo(() => {
    if (!isDragging || !draggedItem) return [];

    const points: number[] = [0, durationInFrames]; // Timeline start and end

    // Add start and end points of all other overlays
    overlays.forEach(overlay => {
      if (overlay.id !== draggedItem.id) {
        points.push(overlay.positionStart);
        points.push(overlay.positionEnd);
      }
    });

    // Remove duplicates and sort
    return Array.from(new Set(points)).sort((a, b) => a - b);
  }, [isDragging, draggedItem, overlays, durationInFrames]);

  const { snappedGhostElement, alignmentLines } = useMemo(() => {
    if (!isDragging || !ghostElement || !dragInfo) {
      return { snappedGhostElement: ghostElement, alignmentLines: [] };
    }

    const elementStartFrame = (ghostElement.left / 100) * durationInFrames;
    const elementEndFrame = elementStartFrame + ((ghostElement.width / 100) * durationInFrames);
    const activeAlignmentLines: number[] = [];

    let snappedStart = elementStartFrame;
    let snappedEnd = elementEndFrame;
    let didSnap = false;

    // Check for snapping at start position
    for (const point of snapPoints) {
      if (Math.abs(elementStartFrame - point) <= snapThreshold) {
        snappedStart = point;
        activeAlignmentLines.push(point);
        didSnap = true;
        break;
      }
    }

    // Check for snapping at end position
    for (const point of snapPoints) {
      if (Math.abs(elementEndFrame - point) <= snapThreshold) {
        snappedEnd = point;
        activeAlignmentLines.push(point);
        didSnap = true;
        break;
      }
    }

    if (!didSnap) {
      return { snappedGhostElement: ghostElement, alignmentLines: [] };
    }

    // Calculate snapped ghost element
    const snappedWidth = snappedEnd - snappedStart;
    const snappedLeft = (snappedStart / durationInFrames) * 100;
    const snappedWidthPercent = (snappedWidth / durationInFrames) * 100;

    const snappedGhost: GhostElement = {
      ...ghostElement,
      left: snappedLeft,
      width: snappedWidthPercent,
    };

    return { 
      snappedGhostElement: snappedGhost, 
      alignmentLines: activeAlignmentLines 
    };
  }, [isDragging, ghostElement, dragInfo, durationInFrames, snapPoints, snapThreshold]);

  return {
    alignmentLines,
    snappedGhostElement,
  };
};