import { useCallback } from 'react';
import { MediaFile, TextElement } from '../types';
import { useAppSelector } from '../store';

interface Position {
  from: number;
  row: number;
}

export const useTimelinePositioning = () => {
  const { mediaFiles, textElements, visibleRows } = useAppSelector(state => state.projectState);

  // Check if a position is available in a specific row
  const isPositionAvailable = useCallback((
    from: number,
    duration: number,
    row: number,
    excludeId?: string
  ): boolean => {
    const to = from + duration;

    // Check media files
    const hasMediaOverlap = mediaFiles.some(file => {
      if (file.row !== row || file.id === excludeId) return false;
      return !(to <= file.positionStart || from >= file.positionEnd);
    });

    // Check text elements
    const hasTextOverlap = textElements.some(text => {
      if (text.row !== row || text.id === excludeId) return false;
      return !(to <= text.positionStart || from >= text.positionEnd);
    });

    return !hasMediaOverlap && !hasTextOverlap;
  }, [mediaFiles, textElements]);

  // Find the next available position across all rows
  const findNextAvailablePosition = useCallback((
    duration: number,
    preferredRow?: number,
    excludeId?: string
  ): Position => {
    // If preferred row is specified, try it first
    if (preferredRow !== undefined && preferredRow < visibleRows) {
      // Check if position 0 is available
      if (isPositionAvailable(0, duration, preferredRow, excludeId)) {
        return { from: 0, row: preferredRow };
      }

      // Get all elements in this row
      const rowElements = [
        ...mediaFiles.filter(f => f.row === preferredRow && f.id !== excludeId),
        ...textElements.filter(t => t.row === preferredRow && t.id !== excludeId)
      ].sort((a, b) => a.positionStart - b.positionStart);

      // Find gaps in the preferred row
      for (let i = 0; i < rowElements.length - 1; i++) {
        const gap = rowElements[i + 1].positionStart - rowElements[i].positionEnd;
        if (gap >= duration) {
          return { from: rowElements[i].positionEnd, row: preferredRow };
        }
      }

      // Check after the last element
      if (rowElements.length > 0) {
        const lastElement = rowElements[rowElements.length - 1];
        return { from: lastElement.positionEnd, row: preferredRow };
      }
    }

    // Try all rows to find the earliest available position
    let bestPosition: Position = { from: Infinity, row: 0 };

    for (let row = 0; row < visibleRows; row++) {
      // Check if position 0 is available
      if (isPositionAvailable(0, duration, row, excludeId)) {
        if (0 < bestPosition.from) {
          bestPosition = { from: 0, row };
        }
      }

      // Get all elements in this row
      const rowElements = [
        ...mediaFiles.filter(f => f.row === row && f.id !== excludeId),
        ...textElements.filter(t => t.row === row && t.id !== excludeId)
      ].sort((a, b) => a.positionStart - b.positionStart);

      // Find gaps
      for (let i = 0; i < rowElements.length - 1; i++) {
        const gapStart = rowElements[i].positionEnd;
        const gap = rowElements[i + 1].positionStart - gapStart;
        if (gap >= duration && gapStart < bestPosition.from) {
          bestPosition = { from: gapStart, row };
        }
      }

      // Check after the last element
      if (rowElements.length > 0) {
        const lastElement = rowElements[rowElements.length - 1];
        if (lastElement.positionEnd < bestPosition.from) {
          bestPosition = { from: lastElement.positionEnd, row };
        }
      }
    }

    // If no position found, place at the end of the first row
    if (bestPosition.from === Infinity) {
      bestPosition = { from: 0, row: 0 };
    }

    return bestPosition;
  }, [mediaFiles, textElements, visibleRows, isPositionAvailable]);

  // Get all elements in a specific row
  const getRowElements = useCallback((row: number) => {
    const media = mediaFiles.filter(f => f.row === row);
    const text = textElements.filter(t => t.row === row);
    return [...media, ...text].sort((a, b) => a.positionStart - b.positionStart);
  }, [mediaFiles, textElements]);

  // Check if row is empty
  const isRowEmpty = useCallback((row: number) => {
    return !mediaFiles.some(f => f.row === row) && !textElements.some(t => t.row === row);
  }, [mediaFiles, textElements]);

  return {
    isPositionAvailable,
    findNextAvailablePosition,
    getRowElements,
    isRowEmpty,
  };
};