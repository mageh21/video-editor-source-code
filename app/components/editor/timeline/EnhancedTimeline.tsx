import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setCurrentTime } from '@/app/store/slices/projectSlice';
import EnhancedTimelineElement from './EnhancedTimelineElement';

export const EnhancedTimeline: React.FC = () => {
    const dispatch = useAppDispatch();
    const { mediaFiles, textElements, currentTime, duration, timelineZoom } = useAppSelector(
        (state) => state.projectState
    );
    const timelineRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    
    // Ensure minimum duration for timeline visibility
    const minDuration = 30; // 30 seconds minimum
    const effectiveDuration = Math.max(duration, minDuration);

    // Debug logging
    console.log('EnhancedTimeline - mediaFiles:', mediaFiles);
    console.log('EnhancedTimeline - timelineZoom:', timelineZoom);
    console.log('EnhancedTimeline - duration:', duration);
    console.log('EnhancedTimeline - effectiveDuration:', effectiveDuration);

    // Format time markers with more granularity
    const getTimeMarkers = () => {
        const markers = [];
        const interval = timelineZoom < 50 ? 10 : timelineZoom < 100 ? 5 : 1;
        
        for (let i = 0; i <= effectiveDuration; i += interval) {
            markers.push(i);
        }
        return markers;
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!scrollRef.current || isDragging) return;
        
        // Check if click is on timeline background (not on an element)
        const target = e.target as HTMLElement;
        const isTimelineBackground = target.closest('.timeline-content') || target.closest('.timeline-grid');
        if (!isTimelineBackground) return;
        
        const rect = scrollRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollRef.current.scrollLeft;
        const time = x / timelineZoom;
        const clampedTime = Math.max(0, Math.min(effectiveDuration, time));
        
        dispatch(setCurrentTime(clampedTime));
    };

    // Handle timeline dragging for smooth cursor movement
    const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return; // Only on left mouse button
        
        // Check if drag started on timeline background
        const target = e.target as HTMLElement;
        const isTimelineBackground = target.closest('.timeline-content') || target.closest('.timeline-grid');
        if (!isTimelineBackground) return;
        
        const startX = e.clientX;
        const startTime = currentTime;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!scrollRef.current) return;
            
            const deltaX = moveEvent.clientX - startX;
            const deltaTime = deltaX / timelineZoom;
            const newTime = Math.max(0, Math.min(effectiveDuration, startTime + deltaTime));
            
            dispatch(setCurrentTime(newTime));
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    };

    // Auto-scroll to keep playhead visible
    useEffect(() => {
        if (!scrollRef.current || isScrolling) return;
        
        const playheadPosition = currentTime * timelineZoom;
        const scrollLeft = scrollRef.current.scrollLeft;
        const clientWidth = scrollRef.current.clientWidth;
        
        if (playheadPosition < scrollLeft + 50 || playheadPosition > scrollLeft + clientWidth - 50) {
            scrollRef.current.scrollTo({
                left: playheadPosition - clientWidth / 2,
                behavior: 'smooth'
            });
        }
    }, [currentTime, timelineZoom, isScrolling]);
    
    const timelineWidth = Math.max(effectiveDuration * timelineZoom + 200, 1000);
    const rowHeight = 60; // Increased for thumbnails
    const numRows = 5;

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Timeline Header with time markers */}
            <div className="h-10 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
                <div 
                    className="h-full overflow-x-auto overflow-y-hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onScroll={(e) => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        }
                    }}
                >
                    <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                        {getTimeMarkers().map((time) => (
                            <div
                                key={time}
                                className="absolute top-0 h-full"
                                style={{ left: `${time * timelineZoom}px` }}
                            >
                                <div className="h-2 w-px bg-gray-600" />
                                <span className="text-xs text-gray-400 ml-1 select-none">
                                    {formatTime(time)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div 
                ref={scrollRef}
                className="flex-1 relative overflow-x-auto overflow-y-auto cursor-pointer"
                onClick={handleTimelineClick}
                onMouseDown={handleTimelineDrag}
                onScroll={() => setIsScrolling(true)}
                style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#374151 #111827'
                }}
            >
                <div className="relative timeline-content" style={{ 
                    width: `${timelineWidth}px`, 
                    height: `${numRows * rowHeight}px`,
                    minHeight: '100%'
                }}>
                    {/* Grid background */}
                    <div className="absolute inset-0 pointer-events-none timeline-grid">
                        {/* Vertical grid lines */}
                        {getTimeMarkers().map((time) => (
                            <div
                                key={time}
                                className="absolute top-0 bottom-0 w-px bg-gray-800"
                                style={{ left: `${time * timelineZoom}px` }}
                            />
                        ))}
                        
                        {/* Horizontal track lines */}
                        {Array.from({ length: numRows }).map((_, row) => (
                            <div
                                key={row}
                                className="absolute left-0 right-0 border-b border-gray-800"
                                style={{ 
                                    top: `${row * rowHeight}px`,
                                    height: `${rowHeight}px`,
                                    backgroundColor: row % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'transparent'
                                }}
                            />
                        ))}
                    </div>

                    {/* Track labels */}
                    <div className="absolute left-0 top-0 pointer-events-none">
                        {['Video 1', 'Video 2', 'Audio', 'Text', 'Effects'].map((label, index) => (
                            <div
                                key={label}
                                className="absolute left-2 text-xs text-gray-500 select-none"
                                style={{ top: `${index * rowHeight + 5}px` }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Timeline Elements */}
                    <div className="relative">
                        {/* Media elements */}
                        {mediaFiles.map((media, index) => {
                            console.log(`Rendering media element ${media.id}:`, {
                                positionStart: media.positionStart,
                                positionEnd: media.positionEnd,
                                row: media.row,
                                fileName: media.fileName
                            });
                            return (
                                <EnhancedTimelineElement
                                    key={media.id}
                                    element={media}
                                    type="media"
                                    index={index}
                                    timelineZoom={timelineZoom}
                                    onDragStart={() => setIsDragging(true)}
                                    onDragEnd={() => setIsDragging(false)}
                                />
                            );
                        })}
                        
                        {/* Text elements */}
                        {textElements.map((text, index) => (
                            <EnhancedTimelineElement
                                key={text.id}
                                element={text}
                                type="text"
                                index={index}
                                timelineZoom={timelineZoom}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={() => setIsDragging(false)}
                            />
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none z-30"
                        style={{ left: `${currentTime * timelineZoom}px` }}
                    >
                        <div className="w-0.5 h-full bg-red-500" />
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
                        </div>
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {formatTime(currentTime)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedTimeline;