import React, { useRef, useState, useEffect } from 'react';
import { Type } from 'lucide-react';
import { TextElement } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setTextElements, setSelectedTextIds, setActiveElement, setSelectedMediaIds } from '@/app/store/slices/projectSlice';

interface TimelineTextElementProps {
    element: TextElement;
    timelineZoom: number;
    isSelected: boolean;
    currentTime: number;
}

const TimelineTextElement: React.FC<TimelineTextElementProps> = ({
    element,
    timelineZoom,
    isSelected,
    currentTime
}) => {
    const dispatch = useAppDispatch();
    const { textElements } = useAppSelector((state) => state.projectState);
    const elementRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [originalPositionStart, setOriginalPositionStart] = useState(0);
    const [originalPositionEnd, setOriginalPositionEnd] = useState(0);

    const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();
        
        setDragStartX(e.clientX);
        setOriginalPositionStart(element.positionStart);
        setOriginalPositionEnd(element.positionEnd);
        
        if (action === 'drag') {
            setIsDragging(true);
        } else if (action === 'resize-left') {
            setIsResizingLeft(true);
        } else if (action === 'resize-right') {
            setIsResizingRight(true);
        }
        
        // Select this element and clear media selection
        dispatch(setSelectedTextIds([element.id]));
        dispatch(setSelectedMediaIds([]));
        dispatch(setActiveElement('text'));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartX;
            const deltaTime = deltaX / timelineZoom;
            
            if (isDragging) {
                const newPositionStart = Math.max(0, originalPositionStart + deltaTime);
                const duration = originalPositionEnd - originalPositionStart;
                const newPositionEnd = newPositionStart + duration;
                
                updateTextElement({
                    positionStart: newPositionStart,
                    positionEnd: newPositionEnd
                });
            } else if (isResizingLeft) {
                const newPositionStart = Math.max(0, Math.min(originalPositionStart + deltaTime, originalPositionEnd - 0.1));
                updateTextElement({ positionStart: newPositionStart });
            } else if (isResizingRight) {
                const newPositionEnd = Math.max(originalPositionStart + 0.1, originalPositionEnd + deltaTime);
                updateTextElement({ positionEnd: newPositionEnd });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };

        if (isDragging || isResizingLeft || isResizingRight) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizingLeft, isResizingRight, dragStartX, timelineZoom, originalPositionStart, originalPositionEnd]);

    const updateTextElement = (updates: Partial<TextElement>) => {
        const updatedElements = textElements.map(text =>
            text.id === element.id ? { ...text, ...updates } : text
        );
        dispatch(setTextElements(updatedElements));
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setSelectedTextIds([element.id]));
        dispatch(setSelectedMediaIds([]));
        dispatch(setActiveElement('text'));
    };

    const left = element.positionStart * timelineZoom;
    const width = (element.positionEnd - element.positionStart) * timelineZoom;
    const isActive = currentTime >= element.positionStart && currentTime <= element.positionEnd;

    return (
        <div
            ref={elementRef}
            className={`absolute h-12 group transition-all ${
                isSelected ? 'ring-2 ring-blue-500 z-20' : 'z-10'
            } ${isActive ? 'brightness-110' : ''}`}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                top: '4px',
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onClick={handleClick}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
            <div className={`h-full rounded-lg overflow-hidden relative ${
                isSelected ? 'bg-purple-600' : 'bg-purple-700'
            } hover:brightness-110 transition-all`}>
                {/* Left resize handle */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 z-30"
                    onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                />
                
                {/* Right resize handle */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 z-30"
                    onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                />
                
                {/* Content */}
                <div className="flex items-center h-full px-3 select-none">
                    <Type className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                    <span className="text-xs text-white truncate">
                        {element.text.substring(0, 20)}{element.text.length > 20 ? '...' : ''}
                    </span>
                </div>
                
                {/* Duration indicator */}
                <div className="absolute bottom-1 right-2 text-xs text-white text-opacity-70">
                    {(element.positionEnd - element.positionStart).toFixed(1)}s
                </div>
            </div>
        </div>
    );
};

export default TimelineTextElement;