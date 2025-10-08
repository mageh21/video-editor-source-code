import React, { useRef, useMemo } from 'react';
import { MediaFile, TextElement } from '@/app/types';
import TimelineElement from './TimelineElement';
import { useAppSelector } from '@/app/store';
import { TransitionDropZone } from './TransitionDropZone';
import { TimelineTransition } from './TimelineTransition';
import { findAdjacentClipPairs } from '@/app/utils/transitions';

interface TimelineRowProps {
  rowIndex: number;
  mediaFiles: MediaFile[];
  textElements: TextElement[];
  height: number;
  isDraggedOver: boolean;
  onRowDragStart: (e: React.DragEvent, rowIndex: number) => void;
  onRowDragOver: (e: React.DragEvent, rowIndex: number) => void;
  onRowDrop: (e: React.DragEvent, rowIndex: number) => void;
  onElementDrag: (element: MediaFile | TextElement, newPosition: number, newRow: number, isMedia: boolean) => void;
  onDragEnd: () => void;
}

export default function TimelineRow({
  rowIndex,
  mediaFiles,
  textElements,
  height,
  isDraggedOver,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onElementDrag,
  onDragEnd,
}: TimelineRowProps) {
  const { timelineZoom, betweenClipTransitions } = useAppSelector(state => state.projectState);
  const rowRef = useRef<HTMLDivElement>(null);

  // Get only video/image clips for this row (transitions only work between these)
  const videoImageClips = mediaFiles
    .filter(m => (m.type === 'video' || m.type === 'image') && m.row === rowIndex)
    .sort((a, b) => a.positionStart - b.positionStart);

  // Find adjacent clip pairs for this row
  const adjacentPairs = useMemo(() => {
    const pairs: Array<{
      fromClip: MediaFile;
      toClip: MediaFile;
      dropPosition: number;
      existingTransition?: any;
    }> = [];

    for (let i = 0; i < videoImageClips.length - 1; i++) {
      const clip1 = videoImageClips[i];
      const clip2 = videoImageClips[i + 1];
      const gap = clip2.positionStart - clip1.positionEnd;

      // Show drop zones for clips that are reasonably close (within 1 second)
      if (gap >= -1.0 && gap <= 1.0) {
        // Find existing transition
        const existingTransition = Object.values(betweenClipTransitions).find(
          (t: any) => t.fromId === clip1.id && t.toId === clip2.id
        );

        // Calculate drop zone position (center between clips)
        const dropPosition = gap <= 0 
          ? clip1.positionEnd + gap / 2  // Overlapping clips
          : clip1.positionEnd + gap / 2;  // Gap between clips

        pairs.push({
          fromClip: clip1,
          toClip: clip2,
          dropPosition,
          existingTransition
        });
      }
    }

    return pairs;
  }, [videoImageClips, betweenClipTransitions]);

  // Combine all elements for this row
  const allElements = [
    ...mediaFiles.map(m => ({ ...m, elementType: 'media' as const })),
    ...textElements.map(t => ({ ...t, elementType: 'text' as const }))
  ].sort((a, b) => a.positionStart - b.positionStart);

  return (
    <div
      ref={rowRef}
      className={`relative border-b border-gray-700 transition-colors ${
        isDraggedOver ? 'bg-blue-900/20' : 'bg-gray-800/50'
      }`}
      style={{ height: `${height}px` }}
      onDragOver={(e) => onRowDragOver(e, rowIndex)}
      onDrop={(e) => onRowDrop(e, rowIndex)}
    >
      {/* Row drag handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 bg-gray-700/50 hover:bg-gray-600/50 cursor-move flex items-center justify-center"
        draggable
        onDragStart={(e) => onRowDragStart(e, rowIndex)}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>

      {/* Row content area */}
      <div className="absolute left-6 right-0 top-0 bottom-0 overflow-hidden">
        {/* Row background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-transparent" />

        {/* Elements in this row */}
        {allElements.map((element) => (
          <TimelineElement
            key={element.id}
            element={element}
            isMedia={element.elementType === 'media'}
            currentRow={rowIndex}
            onDrag={onElementDrag}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Transition drop zones */}
        {adjacentPairs.map((pair, index) => (
          <TransitionDropZone
            key={`transition-${pair.fromClip.id}-${pair.toClip.id}`}
            fromClip={pair.fromClip}
            toClip={pair.toClip}
            existingTransition={pair.existingTransition}
            timelineZoom={timelineZoom}
            position={pair.dropPosition}
            onTransitionChange={(transition) => {
              // Handle transition change if needed
              console.log('Transition changed:', transition);
            }}
          />
        ))}

        {/* Visual transition elements */}
        {adjacentPairs.map((pair) => {
          if (!pair.existingTransition) return null;
          
          const transition = pair.existingTransition;
          const transitionDuration = (transition.duration || 500) / 1000; // Convert to seconds
          
          return (
            <TimelineTransition
              key={`visual-transition-${transition.id}`}
              transition={transition}
              position={pair.dropPosition}
              duration={transitionDuration}
              timelineZoom={timelineZoom}
              height={height}
            />
          );
        })}
      </div>

      {/* Row number indicator */}
      <div className="absolute left-6 top-1 text-xs text-gray-500 pointer-events-none">
        Track {rowIndex + 1}
      </div>
    </div>
  );
}