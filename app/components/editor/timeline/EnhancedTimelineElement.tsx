import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MediaFile, TextElement } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setActiveElement, setActiveElementIndex, setMediaFiles, setTextElements } from '@/app/store/slices/projectSlice';
import { Film, Music, Image as ImageIcon, Type, MoreVertical, Trash2, Copy, Scissors } from 'lucide-react';
import { generateVideoThumbnail, generateImageThumbnail, generateVideoFrames } from '@/app/utils/thumbnailUtils';
import { thumbnailCache } from '@/app/utils/thumbnailCache';
import toast from 'react-hot-toast';

interface EnhancedTimelineElementProps {
    element: MediaFile | TextElement;
    type: 'media' | 'text';
    index: number;
    timelineZoom: number;
    onDragStart: () => void;
    onDragEnd: () => void;
}

const EnhancedTimelineElement: React.FC<EnhancedTimelineElementProps> = ({
    element,
    type,
    index,
    timelineZoom,
    onDragStart,
    onDragEnd
}) => {
    const dispatch = useAppDispatch();
    const { activeElement, activeElementIndex, mediaFiles, textElements, currentTime } = useAppSelector(
        (state) => state.projectState
    );
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [thumbnail, setThumbnail] = useState<string>('');
    const [videoFrames, setVideoFrames] = useState<string[]>([]);
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const thumbnailGenerationRef = useRef<AbortController | null>(null);
    const lastThumbnailConfigRef = useRef<string>('');

    const isActive = activeElement === type && activeElementIndex === index;
    const rowHeight = 60; // Taller to accommodate thumbnails
    const minWidth = 30;
    const handleWidth = 10;

    // Calculate position and dimensions
    const left = element.positionStart * timelineZoom;
    const width = Math.max((element.positionEnd - element.positionStart) * timelineZoom, minWidth);
    const top = (element.row || 0) * rowHeight + 5; // Add padding

    // Generate thumbnail for media elements
    useEffect(() => {
        const generateThumbnails = async () => {
            if (type !== 'media' || isGeneratingThumbnails) return;
            
            const media = element as MediaFile;
            if (!media.src) return;
            
            // Create a cache key and check if we already have thumbnails
            const cacheKey = thumbnailCache.generateKey(media.src, width, media.startTime, media.endTime);
            const cachedEntry = thumbnailCache.get(cacheKey);
            
            if (cachedEntry) {
                setVideoFrames(cachedEntry.frames);
                setThumbnail(cachedEntry.thumbnail);
                lastThumbnailConfigRef.current = cacheKey;
                return;
            }
            
            // Check if this is the same configuration we just processed
            if (cacheKey === lastThumbnailConfigRef.current) {
                return; // Skip if same configuration
            }
            
            // Cancel any ongoing thumbnail generation
            if (thumbnailGenerationRef.current) {
                thumbnailGenerationRef.current.abort();
            }
            
            // Create new abort controller for this generation
            const abortController = new AbortController();
            thumbnailGenerationRef.current = abortController;
            
            try {
                setIsGeneratingThumbnails(true);
                
                if (media.type === 'video') {
                    // Only generate thumbnails if width is reasonable (not during drag)
                    if (width < 50) {
                        return; // Skip for very small widths
                    }
                    
                    // Calculate how many thumbnails to generate based on width
                    const thumbnailWidth = 80;
                    const frameCount = Math.max(1, Math.min(10, Math.floor(width / thumbnailWidth)));
                    
                    // Generate frames throughout the video duration
                    const videoDuration = media.endTime - media.startTime;
                    const frames: string[] = [];
                    
                    // Use batch processing to avoid overwhelming the browser
                    const batchSize = 3;
                    for (let i = 0; i < frameCount; i += batchSize) {
                        if (abortController.signal.aborted) break;
                        
                        const batchPromises = [];
                        for (let j = i; j < Math.min(i + batchSize, frameCount); j++) {
                            const progress = j / Math.max(1, frameCount - 1);
                            const seekTime = media.startTime + (progress * videoDuration);
                            
                            batchPromises.push(
                                generateVideoThumbnail(media.src, seekTime)
                                    .then(frame => ({ index: j, frame }))
                                    .catch(error => {
                                        console.warn('Thumbnail generation failed:', error);
                                        return { index: j, frame: '' };
                                    })
                            );
                        }
                        
                        try {
                            const results = await Promise.all(batchPromises);
                            if (!abortController.signal.aborted) {
                                results.forEach(({ index, frame }) => {
                                    if (frame) frames[index] = frame;
                                });
                            }
                        } catch (error) {
                            console.warn('Batch thumbnail generation failed:', error);
                        }
                        
                        // Small delay between batches to prevent blocking
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    if (!abortController.signal.aborted && frames.length > 0) {
                        const validFrames = frames.filter(Boolean);
                        const firstThumbnail = frames.find(Boolean) || '';
                        
                        setVideoFrames(validFrames);
                        setThumbnail(firstThumbnail);
                        
                        // Cache the results
                        thumbnailCache.set(cacheKey, firstThumbnail, validFrames);
                        lastThumbnailConfigRef.current = cacheKey;
                    }
                } else if (media.type === 'image') {
                    if (abortController.signal.aborted) return;
                    
                    try {
                        const thumb = await generateImageThumbnail(media.src);
                        if (!abortController.signal.aborted && thumb) {
                            setThumbnail(thumb);
                            // Cache image thumbnail too
                            thumbnailCache.set(cacheKey, thumb, []);
                            lastThumbnailConfigRef.current = cacheKey;
                        }
                    } catch (error) {
                        console.warn('Image thumbnail generation failed:', error);
                    }
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.warn('Thumbnail generation error:', error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsGeneratingThumbnails(false);
                }
            }
        };
        
        // Debounce thumbnail generation to avoid excessive calls during drag
        const timeoutId = setTimeout(generateThumbnails, isDragging || isResizing ? 500 : 100);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [element.id, type, width, isDragging, isResizing, isGeneratingThumbnails, type === 'media' ? (element as MediaFile).src : null, type === 'media' ? (element as MediaFile).startTime : null, type === 'media' ? (element as MediaFile).endTime : null]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (thumbnailGenerationRef.current) {
                thumbnailGenerationRef.current.abort();
            }
        };
    }, []);
    
    // Debug logging
    console.log(`Timeline element ${element.id}:`, {
        positionStart: element.positionStart,
        positionEnd: element.positionEnd,
        duration: element.positionEnd - element.positionStart,
        left,
        width,
        top,
        row: element.row,
        timelineZoom
    });

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setActiveElement(type));
        dispatch(setActiveElementIndex(index));
    };

    const handleMouseDown = useCallback((e: React.MouseEvent, action: 'move' | 'resize-start' | 'resize-end') => {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.clientX;
        const startPositionStart = element.positionStart;
        const startPositionEnd = element.positionEnd;

        if (action === 'move') {
            setIsDragging(true);
            onDragStart();
        } else {
            setIsResizing(action === 'resize-start' ? 'start' : 'end');
        }

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / timelineZoom;

            const elements = type === 'media' ? [...mediaFiles] : [...textElements];
            const elementIndex = elements.findIndex(el => el.id === element.id);
            
            if (elementIndex === -1) return;

            if (action === 'move') {
                const newStart = Math.max(0, startPositionStart + deltaTime);
                const duration = startPositionEnd - startPositionStart;
                const newEnd = newStart + duration;

                elements[elementIndex] = {
                    ...elements[elementIndex],
                    positionStart: newStart,
                    positionEnd: newEnd
                };
            } else if (action === 'resize-start') {
                const newStart = Math.max(0, Math.min(startPositionEnd - 0.5, startPositionStart + deltaTime));
                elements[elementIndex] = {
                    ...elements[elementIndex],
                    positionStart: newStart
                };
            } else if (action === 'resize-end') {
                const newEnd = Math.max(startPositionStart + 0.5, startPositionEnd + deltaTime);
                elements[elementIndex] = {
                    ...elements[elementIndex],
                    positionEnd: newEnd
                };
            }

            if (type === 'media') {
                dispatch(setMediaFiles(elements as MediaFile[]));
            } else {
                dispatch(setTextElements(elements as TextElement[]));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(null);
            onDragEnd();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [element, type, timelineZoom, mediaFiles, textElements, dispatch, onDragStart, onDragEnd]);

    const handleDelete = () => {
        if (type === 'media') {
            const filtered = mediaFiles.filter(el => el.id !== element.id);
            dispatch(setMediaFiles(filtered));
        } else {
            const filtered = textElements.filter(el => el.id !== element.id);
            dispatch(setTextElements(filtered));
        }
        setShowContextMenu(false);
    };

    const handleDuplicate = () => {
        if (type === 'media') {
            const newElement: MediaFile = {
                ...(element as MediaFile),
                id: crypto.randomUUID(),
                positionStart: element.positionEnd + 0.5,
                positionEnd: element.positionEnd + (element.positionEnd - element.positionStart) + 0.5
            };
            dispatch(setMediaFiles([...mediaFiles, newElement]));
        } else {
            const newElement: TextElement = {
                ...(element as TextElement),
                id: crypto.randomUUID(),
                positionStart: element.positionEnd + 0.5,
                positionEnd: element.positionEnd + (element.positionEnd - element.positionStart) + 0.5
            };
            dispatch(setTextElements([...textElements, newElement]));
        }
        setShowContextMenu(false);
    };

    const handleSplit = () => {
        if (currentTime <= element.positionStart || currentTime >= element.positionEnd) {
            toast.error('Position playhead within the element to split');
            return;
        }
        
        const elements = type === 'media' ? [...mediaFiles] : [...textElements];
        const elementIndex = elements.findIndex(el => el.id === element.id);
        
        if (elementIndex === -1) return;

        // Calculate split ratios
        const totalDuration = element.positionEnd - element.positionStart;
        const firstDuration = currentTime - element.positionStart;
        const secondDuration = element.positionEnd - currentTime;

        const firstPart: MediaFile | TextElement = type === 'media' ? {
            ...(element as MediaFile),
            id: crypto.randomUUID(),
            positionEnd: currentTime,
            endTime: (element as MediaFile).startTime + (firstDuration / totalDuration) * ((element as MediaFile).endTime - (element as MediaFile).startTime)
        } : {
            ...(element as TextElement),
            id: crypto.randomUUID(),
            positionEnd: currentTime
        };

        const secondPart: MediaFile | TextElement = type === 'media' ? {
            ...(element as MediaFile),
            id: crypto.randomUUID(),
            positionStart: currentTime,
            startTime: (firstPart as MediaFile).endTime
        } : {
            ...(element as TextElement),
            id: crypto.randomUUID(),
            positionStart: currentTime
        };

        // Debug logging to verify properties are copied correctly
        if (type === 'media') {
            console.log('TimelineElement Split - Original element:', {
                id: element.id,
                volume: (element as MediaFile).volume,
                startTime: (element as MediaFile).startTime,
                endTime: (element as MediaFile).endTime
            });
            console.log('TimelineElement Split - First part:', {
                id: firstPart.id,
                volume: (firstPart as MediaFile).volume,
                startTime: (firstPart as MediaFile).startTime,
                endTime: (firstPart as MediaFile).endTime
            });
            console.log('TimelineElement Split - Second part:', {
                id: secondPart.id,
                volume: (secondPart as MediaFile).volume,
                startTime: (secondPart as MediaFile).startTime,
                endTime: (secondPart as MediaFile).endTime
            });
        }

        if (type === 'media') {
            const mediaElements = elements as MediaFile[];
            mediaElements.splice(elementIndex, 1, firstPart as MediaFile, secondPart as MediaFile);
            dispatch(setMediaFiles(mediaElements));
            // Update active element to the first part of the split
            dispatch(setActiveElementIndex(elementIndex));
        } else {
            const textElementsArray = elements as TextElement[];
            textElementsArray.splice(elementIndex, 1, firstPart as TextElement, secondPart as TextElement);
            dispatch(setTextElements(textElementsArray));
            dispatch(setActiveElementIndex(elementIndex));
        }
        setShowContextMenu(false);
        toast.success('Element split successfully');
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
    const isAudio = type === 'media' && (element as MediaFile).type === 'audio';

    return (
        <>
            <div
                ref={elementRef}
                className={`absolute flex items-center rounded cursor-move select-none transition-all ${getBackgroundColor()} ${
                    isActive ? 'ring-2 ring-white z-20 shadow-lg' : 'hover:brightness-110'
                } ${isDragging || isResizing ? 'opacity-80' : ''}`}
                style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${rowHeight - 10}px`
                }}
                onClick={handleClick}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowContextMenu(true);
                }}
            >
                {/* Left resize handle */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30"
                    style={{ width: `${handleWidth}px` }}
                    onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
                />

                {/* Content */}
                <div className="flex items-center px-2 min-w-0 flex-1 h-full relative z-10">
                    {/* Thumbnail or icon */}
                    {type === 'media' && (element as MediaFile).type === 'video' && videoFrames.length > 0 ? (
                        <div className="absolute inset-0 flex">
                            {videoFrames.map((frame, i) => (
                                <div 
                                    key={`${element.id}-frame-${i}`} 
                                    className="h-full flex-1 relative overflow-hidden"
                                    style={{ minWidth: '0' }}
                                >
                                    <img 
                                        src={frame} 
                                        alt="" 
                                        className="h-full w-full object-cover"
                                        style={{ opacity: 0.7 }}
                                    />
                                </div>
                            ))}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
                            {isGeneratingThumbnails && (
                                <div className="absolute top-1 right-1 w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                            )}
                        </div>
                    ) : thumbnail ? (
                        <div className="relative h-full flex items-center ml-2">
                            <img 
                                src={thumbnail} 
                                alt="" 
                                className="h-full w-auto object-cover rounded opacity-60 mr-2"
                                style={{ maxWidth: '80px' }}
                            />
                            {isGeneratingThumbnails && (
                                <div className="absolute top-1 right-1 w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                            )}
                        </div>
                    ) : (
                        <div className="relative text-white opacity-80 flex-shrink-0 mr-2 ml-2">
                            {getIcon()}
                            {isGeneratingThumbnails && type === 'media' && (
                                <div className="absolute top-0 -right-1 w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                            )}
                        </div>
                    )}
                    <span className="text-xs text-white truncate opacity-90 font-medium z-10">
                        {fileName}
                    </span>
                </div>

                {/* Waveform for audio - placeholder for now */}
                {isAudio && (
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="h-full flex items-center justify-center space-x-0.5">
                            {Array.from({ length: Math.min(20, Math.floor(width / 3)) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-0.5 bg-white"
                                    style={{ height: `${30 + Math.random() * 40}%` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Right resize handle */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30"
                    style={{ width: `${handleWidth}px` }}
                    onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
                />

                {/* Context menu button */}
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowContextMenu(!showContextMenu);
                    }}
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>
            </div>

            {/* Context Menu */}
            {showContextMenu && (
                <div
                    className="absolute z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-[150px]"
                    style={{
                        left: `${left + width - 150}px`,
                        top: `${top + rowHeight}px`
                    }}
                >
                        <button
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 flex items-center space-x-2"
                            onClick={handleDuplicate}
                        >
                            <Copy className="w-4 h-4" />
                            <span>Duplicate</span>
                        </button>
                        <button
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 flex items-center space-x-2"
                            onClick={handleSplit}
                            disabled={currentTime <= element.positionStart || currentTime >= element.positionEnd}
                        >
                            <Scissors className="w-4 h-4" />
                            <span>Split at playhead</span>
                        </button>
                        <div className="h-px bg-gray-700 my-1" />
                        <button
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 text-red-400 flex items-center space-x-2"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                </div>
            )}
        </>
    );
};

export default EnhancedTimelineElement;