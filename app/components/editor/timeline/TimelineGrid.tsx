import React, { useRef, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { MediaFile, TextElement } from '@/app/types';
import { setMediaFiles, setTextElements, swapRows } from '@/app/store/slices/projectSlice';
import TimelineRow from './TimelineRow';
// import { getSnapPoints, getSnappedPosition } from '@/app/utils/timelineUtils';

const ROW_HEIGHT = 64; // Height of each timeline row

export default function TimelineGrid() {
  const dispatch = useAppDispatch();
  const { 
    visibleRows, 
    mediaFiles, 
    textElements, 
    timelineZoom,
    currentTime,
    enableSnapping 
  } = useAppSelector(state => state.projectState);

  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const [dropTargetRow, setDropTargetRow] = useState<number | null>(null);
  const [snapIndicators, setSnapIndicators] = useState<number[]>([]);

  // Handle row drag start
  const handleRowDragStart = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rowIndex.toString());
    setDraggedRow(rowIndex);
  }, []);

  // Handle row drag over
  const handleRowDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedRow !== null && draggedRow !== rowIndex) {
      setDropTargetRow(rowIndex);
    }
  }, [draggedRow]);

  // Handle row drop
  const handleRowDrop = useCallback((e: React.DragEvent, targetRow: number) => {
    e.preventDefault();
    const sourceRow = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (!isNaN(sourceRow) && sourceRow !== targetRow) {
      dispatch(swapRows({ row1: sourceRow, row2: targetRow }));
    }
    
    setDraggedRow(null);
    setDropTargetRow(null);
  }, [dispatch]);

  // Handle element updates with row changes
  const handleUpdateMedia = useCallback((id: string, updates: Partial<MediaFile>) => {
    const updatedFiles = mediaFiles.map(file =>
      file.id === id ? { ...file, ...updates } : file
    );
    dispatch(setMediaFiles(updatedFiles));
  }, [mediaFiles, dispatch]);

  const handleUpdateText = useCallback((id: string, updates: Partial<TextElement>) => {
    const updatedTexts = textElements.map(text =>
      text.id === id ? { ...text, ...updates } : text
    );
    dispatch(setTextElements(updatedTexts));
  }, [textElements, dispatch]);

  // Handle element drag with snapping
  const handleElementDrag = useCallback((
    element: MediaFile | TextElement,
    newPosition: number,
    newRow: number,
    isMedia: boolean
  ) => {
    let finalPosition = newPosition;
    
    // Apply snapping if enabled
    // TODO: Implement snapping functionality
    // if (enableSnapping) {
    //   const snapPoints = getSnapPoints(mediaFiles, textElements, currentTime, element.id);
    //   const duration = element.positionEnd - element.positionStart;
    //   const snappedResult = getSnappedPosition(finalPosition, duration, snapPoints, timelineZoom, enableSnapping);
    //   
    //   if (snappedResult.snapped) {
    //     finalPosition = snappedResult.position;
    //     setSnapIndicators([snappedResult.snapPoint!.position]);
    //   } else {
    //     setSnapIndicators([]);
    //   }
    // }

    const positionDiff = finalPosition - element.positionStart;
    const updates = {
      positionStart: finalPosition,
      positionEnd: element.positionEnd + positionDiff,
      row: Math.max(0, Math.min(visibleRows - 1, newRow))
    };

    if (isMedia) {
      handleUpdateMedia(element.id, updates);
    } else {
      handleUpdateText(element.id, updates);
    }
  }, [mediaFiles, textElements, currentTime, timelineZoom, enableSnapping, visibleRows, handleUpdateMedia, handleUpdateText]);

  const handleDragEnd = useCallback(() => {
    setSnapIndicators([]);
  }, []);

  return (
    <div className="relative">
      {/* Snap indicators */}
      {snapIndicators.map((position, index) => (
        <div
          key={`snap-${index}`}
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-50 pointer-events-none"
          style={{ left: `${position * timelineZoom}px` }}
        />
      ))}

      {/* Timeline rows */}
      <div className="relative">
        {Array.from({ length: visibleRows }).map((_, rowIndex) => {
          const rowMediaFiles = mediaFiles.filter(f => f.row === rowIndex);
          const rowTextElements = textElements.filter(t => t.row === rowIndex);
          
          return (
            <TimelineRow
              key={rowIndex}
              rowIndex={rowIndex}
              mediaFiles={rowMediaFiles}
              textElements={rowTextElements}
              height={ROW_HEIGHT}
              isDraggedOver={dropTargetRow === rowIndex}
              onRowDragStart={handleRowDragStart}
              onRowDragOver={handleRowDragOver}
              onRowDrop={handleRowDrop}
              onElementDrag={handleElementDrag}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}