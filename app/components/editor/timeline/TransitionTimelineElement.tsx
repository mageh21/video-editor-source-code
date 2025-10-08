import React from 'react';
import { ITransition } from '@/app/types';

interface TransitionTimelineElementProps {
    transition: ITransition;
    fromClipEnd: number;
    toClipStart: number;
    duration: number;
    timelineZoom: number;
    onDelete?: (transitionId: string) => void;
}

export const TransitionTimelineElement: React.FC<TransitionTimelineElementProps> = ({
    transition,
    fromClipEnd,
    toClipStart,
    duration,
    timelineZoom,
    onDelete
}) => {
    // Calculate position and width
    const gap = toClipStart - fromClipEnd;
    let transitionStart: number;
    let transitionWidth: number;
    
    if (gap <= 0) {
        // Overlapping clips - position in the overlap area
        const overlapCenter = fromClipEnd + gap / 2;
        transitionStart = overlapCenter - (transition.duration / 2000); // Convert ms to seconds
        transitionWidth = transition.duration / 1000; // Convert ms to seconds
    } else {
        // Gap between clips - center the transition in the gap
        transitionStart = fromClipEnd + gap / 2 - (transition.duration / 2000);
        transitionWidth = Math.min(gap, transition.duration / 1000);
    }
    
    // Convert to pixels
    const leftPx = transitionStart * timelineZoom;
    const widthPx = Math.max(20, transitionWidth * timelineZoom); // Minimum 20px width
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(transition.id);
        }
    };
    
    return (
        <div
            className="absolute top-1/2 transform -translate-y-1/2 bg-purple-500/80 border border-purple-400 rounded text-white text-xs flex items-center justify-center cursor-pointer hover:bg-purple-600/90 transition-colors"
            style={{
                left: `${leftPx}px`,
                width: `${widthPx}px`,
                height: '20px',
                zIndex: 10,
            }}
            title={`${transition.name || transition.kind} transition`}
            onClick={handleClick}
        >
            <span className="text-[10px] font-medium uppercase tracking-wide">
                {transition.kind?.substr(0, 4) || 'T'}
            </span>
        </div>
    );
};