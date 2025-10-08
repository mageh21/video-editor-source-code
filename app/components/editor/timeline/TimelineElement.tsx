import React, { useRef, useEffect, useState } from 'react';
import Moveable, { OnDrag, OnResize } from 'react-moveable';
import { MediaFile, TextElement } from '@/app/types';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setActiveElement, setActiveElementIndex } from '@/app/store/slices/projectSlice';
import Image from 'next/image';
import { TimelineKeyframes } from './TimelineKeyframes';
import { AudioClipItem } from './AudioClipItem';

interface TimelineElementProps {
  element: (MediaFile | TextElement) & { elementType: 'media' | 'text' };
  isMedia: boolean;
  currentRow: number;
  onDrag: (element: MediaFile | TextElement, newPosition: number, newRow: number, isMedia: boolean) => void;
  onDragEnd: () => void;
}

const ROW_HEIGHT = 64;

export default function TimelineElement({
  element,
  isMedia,
  currentRow,
  onDrag,
  onDragEnd,
}: TimelineElementProps) {
  const dispatch = useAppDispatch();
  const { 
    timelineZoom, 
    activeElement, 
    activeElementIndex, 
    mediaFiles,
    textElements 
  } = useAppSelector(state => state.projectState);

  const targetRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isActive = activeElement === element.elementType && 
    (isMedia ? mediaFiles[activeElementIndex]?.id === element.id : textElements[activeElementIndex]?.id === element.id);

  // Handle element click
  const handleClick = () => {
    dispatch(setActiveElement(element.elementType));
    const index = isMedia 
      ? mediaFiles.findIndex(m => m.id === element.id)
      : textElements.findIndex(t => t.id === element.id);
    dispatch(setActiveElementIndex(index));
  };

  // Handle drag
  const handleDrag = (e: OnDrag) => {
    const { left, top } = e;
    const newPosition = left / timelineZoom;
    const newRow = currentRow + Math.round(top / ROW_HEIGHT);
    
    onDrag(element, newPosition, newRow, isMedia);
    
    if (targetRef.current) {
      targetRef.current.style.left = `${newPosition * timelineZoom}px`;
      targetRef.current.style.transform = `translateY(${(newRow - currentRow) * ROW_HEIGHT}px)`;
    }
  };

  // Handle resize
  const handleResize = (e: OnResize) => {
    const { width, direction } = e;
    if (direction[0] === 1 && targetRef.current) {
      // Right resize
      targetRef.current.style.width = `${width}px`;
      const newDuration = width / timelineZoom;
      onDrag(element, element.positionStart, currentRow, isMedia);
    }
  };

  // Update moveable rect when zoom changes
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [timelineZoom]);

  // Render media element content
  const renderMediaContent = () => {
    if (!isMedia) return null;
    const media = element as MediaFile;

    switch (media.type) {
      case 'video':
        return (
          <>
            <TimelineKeyframes media={media} timelineZoom={timelineZoom} />
            <div className="absolute inset-0 flex items-center px-2 bg-gradient-to-r from-black/60 via-transparent to-black/60">
              <Image
                alt="Video"
                className="h-7 w-7 min-w-6 mr-2 flex-shrink-0 drop-shadow-lg"
                height={30}
                width={30}
                src="https://www.svgrepo.com/show/532727/video.svg"
              />
              <span className="truncate text-xs font-medium drop-shadow-lg">{media.fileName}</span>
            </div>
          </>
        );

      case 'audio':
        return <AudioClipItem clip={media} isActive={isActive} timelineZoom={timelineZoom} />;

      case 'image':
        return (
          <div className="flex items-center px-2">
            <Image
              alt="Image"
              className="h-7 w-7 min-w-6 mr-2 flex-shrink-0"
              height={30}
              width={30}
              src="https://www.svgrepo.com/show/535454/image.svg"
            />
            <span className="truncate text-xs">{media.fileName}</span>
          </div>
        );
    }
  };

  // Render text element content
  const renderTextContent = () => {
    if (isMedia) return null;
    const text = element as TextElement;

    return (
      <div className="flex items-center px-2 h-full">
        <Image
          alt="Text"
          className="h-6 w-6 min-w-6 mr-2 flex-shrink-0"
          height={24}
          width={24}
          src="https://www.svgrepo.com/show/535686/text.svg"
        />
        <span className="truncate text-xs">{text.text}</span>
      </div>
    );
  };

  const duration = element.positionEnd - element.positionStart;

  return (
    <>
      <div
        ref={targetRef}
        onClick={handleClick}
        className={`absolute border rounded-md top-2 h-12 cursor-pointer overflow-hidden transition-colors ${
          isActive 
            ? 'bg-blue-600/30 border-blue-500' 
            : isMedia
              ? 'bg-gray-700/80 border-gray-600'
              : 'bg-purple-600/30 border-purple-500'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{
          left: `${element.positionStart * timelineZoom}px`,
          width: `${duration * timelineZoom}px`,
          zIndex: isMedia ? (element as MediaFile).zIndex : element.zIndex || 0,
        }}
      >
        {renderMediaContent()}
        {renderTextContent()}
      </div>

      <Moveable
        ref={moveableRef}
        target={targetRef.current}
        draggable={true}
        resizable={true}
        renderDirections={isActive ? ['e', 'w'] : []}
        throttleDrag={0}
        throttleResize={0}
        onDragStart={() => {
          setIsDragging(true);
          handleClick();
        }}
        onDrag={handleDrag}
        onDragEnd={() => {
          setIsDragging(false);
          onDragEnd();
          if (targetRef.current) {
            targetRef.current.style.transform = '';
          }
        }}
        onResizeStart={handleClick}
        onResize={handleResize}
      />
    </>
  );
}