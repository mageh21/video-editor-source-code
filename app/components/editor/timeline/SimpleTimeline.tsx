import React, { useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setCurrentTime } from '@/app/store/slices/projectSlice';
import SimpleTimelineElement from './SimpleTimelineElement';

export const SimpleTimeline: React.FC = () => {
    const dispatch = useAppDispatch();
    const { mediaFiles, textElements, currentTime, duration, timelineZoom } = useAppSelector(
        (state) => state.projectState
    );
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Format time markers
    const getTimeMarkers = () => {
        const markers = [];
        const step = 5; // 5 second intervals
        for (let i = 0; i <= duration; i += step) {
            markers.push(i);
        }
        return markers;
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current || isDragging) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = x / timelineZoom;
        const clampedTime = Math.max(0, Math.min(duration, time));
        
        dispatch(setCurrentTime(clampedTime));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-scroll to keep playhead visible
    useEffect(() => {
        if (!timelineRef.current) return;
        
        const playheadPosition = currentTime * timelineZoom;
        const scrollLeft = timelineRef.current.scrollLeft;
        const clientWidth = timelineRef.current.clientWidth;
        
        if (playheadPosition < scrollLeft || playheadPosition > scrollLeft + clientWidth - 100) {
            timelineRef.current.scrollTo({
                left: playheadPosition - clientWidth / 2,
                behavior: 'smooth'
            });
        }
    }, [currentTime, timelineZoom]);

    const timelineWidth = Math.max(duration * timelineZoom, 1000);

    return (
        <div className="h-full flex flex-col bg-black">
            {/* Timeline Header with time markers */}
            <div className="h-8 bg-gray-900 border-b border-gray-800 relative overflow-hidden">
                <div 
                    ref={timelineRef}
                    className="h-full overflow-x-auto overflow-y-hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                        {getTimeMarkers().map((time) => (
                            <div
                                key={time}
                                className="absolute top-0 h-full flex items-center"
                                style={{ left: `${time * timelineZoom}px` }}
                            >
                                <span className="text-xs text-gray-500 ml-1">{formatTime(time)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div 
                className="flex-1 relative overflow-x-auto overflow-y-hidden bg-gray-950"
                onClick={handleTimelineClick}
                style={{ scrollbarWidth: 'thin' }}
            >
                <div className="relative" style={{ width: `${timelineWidth}px`, height: '100%' }}>
                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                        {getTimeMarkers().map((time) => (
                            <div
                                key={time}
                                className="absolute top-0 bottom-0 w-px bg-gray-800"
                                style={{ left: `${time * timelineZoom}px` }}
                            />
                        ))}
                    </div>

                    {/* Track rows background */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[0, 1, 2, 3, 4].map((row) => (
                            <div
                                key={row}
                                className="absolute left-0 right-0 border-b border-gray-800"
                                style={{ 
                                    top: `${row * 40}px`,
                                    height: '40px',
                                    backgroundColor: row % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Timeline Elements */}
                    <div className="relative h-full">
                        {/* Media elements */}
                        {mediaFiles.map((media, index) => (
                            <SimpleTimelineElement
                                key={media.id}
                                element={media}
                                type="media"
                                index={index}
                                timelineZoom={timelineZoom}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={() => setIsDragging(false)}
                            />
                        ))}
                        
                        {/* Text elements */}
                        {textElements.map((text, index) => (
                            <SimpleTimelineElement
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
                        className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-50"
                        style={{ left: `${currentTime * timelineZoom}px` }}
                    >
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleTimeline;