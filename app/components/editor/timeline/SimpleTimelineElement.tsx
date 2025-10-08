import React from 'react';
import { MediaFile, TextElement } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setActiveElement, setActiveElementIndex, setMediaFiles, setTextElements } from '@/app/store/slices/projectSlice';
import { Film, Music, Image as ImageIcon, Type } from 'lucide-react';

interface SimpleTimelineElementProps {
    element: MediaFile | TextElement;
    type: 'media' | 'text';
    index: number;
    timelineZoom: number;
    onDragStart: () => void;
    onDragEnd: () => void;
}

const SimpleTimelineElement: React.FC<SimpleTimelineElementProps> = ({
    element,
    type,
    index,
    timelineZoom,
    onDragStart,
    onDragEnd
}) => {
    const dispatch = useAppDispatch();
    const { activeElement, activeElementIndex, mediaFiles, textElements } = useAppSelector(
        (state) => state.projectState
    );

    const isActive = activeElement === type && activeElementIndex === index;
    const rowHeight = 40; // Height of each track row
    const minWidth = 20; // Minimum width for very short elements

    // Calculate position and dimensions
    const left = element.positionStart * timelineZoom;
    const width = Math.max((element.positionEnd - element.positionStart) * timelineZoom, minWidth);
    const top = (element.row || 0) * rowHeight;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setActiveElement(type));
        dispatch(setActiveElementIndex(index));
    };

    const getIcon = () => {
        if (type === 'text') return <Type className="w-3 h-3" />;
        
        const media = element as MediaFile;
        switch (media.type) {
            case 'video':
                return <Film className="w-3 h-3" />;
            case 'audio':
                return <Music className="w-3 h-3" />;
            case 'image':
                return <ImageIcon className="w-3 h-3" />;
            default:
                return <Film className="w-3 h-3" />;
        }
    };

    const getBackgroundColor = () => {
        if (type === 'text') return 'bg-yellow-600';
        
        const media = element as MediaFile;
        switch (media.type) {
            case 'video':
                return 'bg-blue-600';
            case 'audio':
                return 'bg-green-600';
            case 'image':
                return 'bg-purple-600';
            default:
                return 'bg-gray-600';
        }
    };

    const fileName = type === 'media' ? (element as MediaFile).fileName : 'Text';

    return (
        <div
            className={`absolute flex items-center px-2 py-1 rounded cursor-pointer select-none transition-all ${getBackgroundColor()} ${
                isActive ? 'ring-2 ring-white z-10' : 'hover:brightness-110'
            }`}
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${rowHeight - 8}px`
            }}
            onClick={handleClick}
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
        >
            <div className="flex items-center space-x-1 min-w-0">
                <div className="text-white opacity-80 flex-shrink-0">
                    {getIcon()}
                </div>
                <span className="text-xs text-white truncate opacity-90">
                    {fileName}
                </span>
            </div>
            
            {/* Duration indicator */}
            <span className="ml-auto text-xs text-white opacity-70 flex-shrink-0 pl-2">
                {Math.round(element.positionEnd - element.positionStart)}s
            </span>
        </div>
    );
};

export default SimpleTimelineElement;