'use client';

import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { updateCaption, setSelectedCaptionIds } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { Type } from 'lucide-react';

interface CaptionTimelineElementProps {
    caption: Caption;
    trackId: string;
    timelineZoom: number;
    row: number;
    isSelected: boolean;
}

export const CaptionTimelineElement: React.FC<CaptionTimelineElementProps> = ({
    caption,
    trackId,
    timelineZoom,
    row,
    isSelected
}) => {
    const dispatch = useAppDispatch();
    const elementRef = useRef<HTMLDivElement>(null);
    const { currentTime } = useAppSelector(state => state.projectState);
    
    const startSeconds = (caption as any).start ?? caption.startMs / 1000;
    const endSeconds = (caption as any).end ?? caption.endMs / 1000;
    const startX = startSeconds * timelineZoom;
    const width = (endSeconds - startSeconds) * timelineZoom;
    const isActive = currentTime >= startSeconds && currentTime <= endSeconds;
    
    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setSelectedCaptionIds([caption.id]));
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('captionId', caption.id);
        e.dataTransfer.setData('trackId', trackId);
        e.dataTransfer.setData('offsetX', String(e.clientX - startX));
    };
    
    const handleResize = (direction: 'left' | 'right', e: React.MouseEvent) => {
        e.stopPropagation();
        const startPos = e.clientX;
        const originalStart = (caption as any).start ?? caption.startMs / 1000;
        const originalEnd = (caption as any).end ?? caption.endMs / 1000;
        
        const handleMouseMove = (e: MouseEvent) => {
            const delta = (e.clientX - startPos) / timelineZoom;
            
            if (direction === 'left') {
                const newStart = Math.max(0, originalStart + delta);
                const newEnd = Math.max(newStart + 0.1, originalEnd); // Min duration 0.1s
                dispatch(updateCaption({
                    trackId,
                    captionId: caption.id,
                    updates: {
                        startMs: newStart * 1000,
                        endMs: newEnd * 1000
                    } as any
                }));
            } else {
                const newEnd = Math.max(originalStart + 0.1, originalEnd + delta);
                dispatch(updateCaption({
                    trackId,
                    captionId: caption.id,
                    updates: {
                        endMs: newEnd * 1000
                    } as any
                }));
            }
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    return (
        <div
            ref={elementRef}
            className={`
                absolute flex items-center px-2 cursor-move transition-all
                ${isSelected 
                    ? 'ring-2 ring-blue-500 z-20' 
                    : 'hover:ring-1 hover:ring-gray-400 z-10'
                }
                ${isActive ? 'shadow-lg' : ''}
            `}
            style={{
                left: `${startX}px`,
                width: `${width}px`,
                top: `${row * 60 + 10}px`,
                height: '40px',
                backgroundColor: isActive ? '#3B82F6' : '#6B7280',
                borderRadius: '4px',
                opacity: isActive ? 1 : 0.8
            }}
            onClick={handleSelect}
            draggable
            onDragStart={handleDragStart}
        >
            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-400"
                onMouseDown={(e) => handleResize('left', e)}
            />
            
            {/* Content */}
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <Type className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-xs text-white truncate">
                    {caption.text}
                </span>
            </div>
            
            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-400"
                onMouseDown={(e) => handleResize('right', e)}
            />
            
            {/* Time labels */}
            {width > 60 && (
                <>
                    <span className="absolute left-2 bottom-1 text-[10px] text-white/70">
                        {formatTime(startSeconds)}
                    </span>
                    <span className="absolute right-2 bottom-1 text-[10px] text-white/70">
                        {formatTime(endSeconds)}
                    </span>
                </>
            )}
        </div>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}