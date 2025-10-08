import React from 'react';
import { Trash2, Scissors, Copy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import EnhancedTimelineV2 from './timeline/EnhancedTimelineV2';
import { setCurrentTime, setIsPlaying, setTimelineZoom, setMediaFiles, setTextElements, setInstagramConversations, addRow, removeRow } from '@/app/store/slices/projectSlice';
import toast from 'react-hot-toast';
import { MediaFile, TextElement, InstagramConversation } from '@/app/types';

const TimelineSection: React.FC = () => {
    const dispatch = useAppDispatch();
    const { currentTime, duration, isPlaying, timelineZoom, activeElement, activeElementIndex, mediaFiles, textElements, instagramConversations, visibleRows, maxRows } = useAppSelector((state) => state.projectState);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        dispatch(setIsPlaying(!isPlaying));
    };

    const handleSkipBackward = () => {
        const newTime = Math.max(0, currentTime - 5);
        dispatch(setCurrentTime(newTime));
    };

    const handleSkipForward = () => {
        const newTime = Math.min(duration, currentTime + 5);
        dispatch(setCurrentTime(newTime));
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const newTime = progress * duration;
        dispatch(setCurrentTime(newTime));
    };

    const getActiveElementData = () => {
        if (!activeElement || activeElementIndex === -1) return null;
        if (activeElement === 'media') return mediaFiles[activeElementIndex];
        if (activeElement === 'text') return textElements[activeElementIndex];
        if ((activeElement as any) === 'instagram') return instagramConversations[activeElementIndex];
        return null;
    };

    const canSplit = () => {
        const element = getActiveElementData();
        if (!element) return false;
        return currentTime > element.positionStart && currentTime < element.positionEnd;
    };

    const handleDelete = () => {
        if (!activeElement || activeElementIndex === -1) return;
        
        if (activeElement === 'media') {
            const filtered = mediaFiles.filter((_, index) => index !== activeElementIndex);
            dispatch(setMediaFiles(filtered));
        } else if ((activeElement as any) === 'instagram') {
            const filtered = instagramConversations.filter((_, index) => index !== activeElementIndex);
            dispatch(setInstagramConversations(filtered));
        } else {
            const filtered = textElements.filter((_, index) => index !== activeElementIndex);
            dispatch(setTextElements(filtered));
        }
        
        toast.success('Element deleted');
    };

    const handleSplit = () => {
        const element = getActiveElementData();
        if (!element || !canSplit()) return;
        
        const totalDuration = element.positionEnd - element.positionStart;
        const firstDuration = currentTime - element.positionStart;
        
        let firstPart: MediaFile | TextElement | InstagramConversation;
        let secondPart: MediaFile | TextElement | InstagramConversation;
        
        if (activeElement === 'media') {
            const mediaElement = element as MediaFile;
            const splitPointInSource = mediaElement.startTime + (firstDuration / totalDuration) * (mediaElement.endTime - mediaElement.startTime);
            
            firstPart = {
                ...mediaElement,
                id: crypto.randomUUID(),
                positionEnd: currentTime,
                endTime: splitPointInSource
            };
            secondPart = {
                ...mediaElement,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                startTime: splitPointInSource,
                endTime: mediaElement.endTime
            };
        } else if ((activeElement as any) === 'instagram') {
            firstPart = {
                ...(element as InstagramConversation),
                id: crypto.randomUUID(),
                positionEnd: currentTime
            };
            secondPart = {
                ...(element as InstagramConversation),
                id: crypto.randomUUID(),
                positionStart: currentTime
            };
        } else {
            firstPart = {
                ...(element as TextElement),
                id: crypto.randomUUID(),
                positionEnd: currentTime
            };
            secondPart = {
                ...(element as TextElement),
                id: crypto.randomUUID(),
                positionStart: currentTime
            };
        }


        if (activeElement === 'media') {
            const newMediaFiles = [...mediaFiles];
            newMediaFiles.splice(activeElementIndex, 1, firstPart as MediaFile, secondPart as MediaFile);
            dispatch(setMediaFiles(newMediaFiles));
        } else if ((activeElement as any) === 'instagram') {
            const newInstagramConversations = [...instagramConversations];
            newInstagramConversations.splice(activeElementIndex, 1, firstPart as InstagramConversation, secondPart as InstagramConversation);
            dispatch(setInstagramConversations(newInstagramConversations));
        } else {
            const newTextElements = [...textElements];
            newTextElements.splice(activeElementIndex, 1, firstPart as TextElement, secondPart as TextElement);
            dispatch(setTextElements(newTextElements));
        }
        
        // Keep the same activeElementIndex since we're replacing the original element with two new ones
        // The first part will be at the same index
        
        toast.success('Element split');
    };

    const handleDuplicate = () => {
        const element = getActiveElementData();
        if (!element) return;
        
        const duration = element.positionEnd - element.positionStart;
        
        if (activeElement === 'media') {
            const newElement: MediaFile = {
                ...(element as MediaFile),
                id: crypto.randomUUID(),
                positionStart: element.positionEnd + 0.5,
                positionEnd: element.positionEnd + duration + 0.5
            };
            dispatch(setMediaFiles([...mediaFiles, newElement]));
        } else if ((activeElement as any) === 'instagram') {
            const newElement: InstagramConversation = {
                ...(element as InstagramConversation),
                id: crypto.randomUUID(),
                positionStart: element.positionEnd + 0.5,
                positionEnd: element.positionEnd + duration + 0.5
            };
            dispatch(setInstagramConversations([...instagramConversations, newElement]));
        } else {
            const newElement: TextElement = {
                ...(element as TextElement),
                id: crypto.randomUUID(),
                positionStart: element.positionEnd + 0.5,
                positionEnd: element.positionEnd + duration + 0.5
            };
            dispatch(setTextElements([...textElements, newElement]));
        }
        
        toast.success('Element duplicated');
    };

    return (
        <div className="h-full flex flex-col bg-black border-t border-gray-800">
            {/* Timeline Controls */}
            <div className="h-14 bg-black border-b border-gray-800 flex items-center px-4 flex-shrink-0">
                {/* Left section - Edit tools */}
                <div className="flex items-center space-x-2 w-1/3">
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete (Del)"
                        disabled={!activeElement || activeElementIndex === -1}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSplit}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Split (S)"
                        disabled={!canSplit()}
                    >
                        <Scissors className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDuplicate}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Duplicate (D)"
                        disabled={!activeElement || activeElementIndex === -1}
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                </div>

                {/* Center section - Play controls */}
                <div className="flex items-center justify-center space-x-4 w-1/3">
                    <button 
                        onClick={handleSkipBackward}
                        className="text-gray-400 hover:text-white"
                        title="Skip backward 5s"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.5 5.5v9l-7-4.5 7-4.5z" />
                            <path d="M16 5.5v9h-2v-9h2zM4 5.5v9h2v-9H4z" />
                        </svg>
                    </button>
                    <button
                        onClick={handlePlayPause}
                        className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
                    >
                        {isPlaying ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={handleSkipForward}
                        className="text-gray-400 hover:text-white"
                        title="Skip forward 5s"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                            <path d="M4 5.5v9h2v-9H4zm10 0v9h2v-9h-2z" />
                        </svg>
                    </button>
                    
                    <div className="h-6 w-px bg-gray-800 mx-2"></div>
                    
                    {/* Time display */}
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-white font-mono">{formatTime(currentTime)}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right section - Timeline controls */}
                <div className="flex items-center space-x-4">
                    {/* Tracks controls */}
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-300">Tracks</label>
                        <button
                            onClick={() => dispatch(removeRow())}
                            disabled={visibleRows <= 1}
                            className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        >
                            -
                        </button>
                        <span className="text-sm text-gray-400 min-w-[20px] text-center">{visibleRows}</span>
                        <button
                            onClick={() => dispatch(addRow())}
                            disabled={visibleRows >= maxRows}
                            className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        >
                            +
                        </button>
                    </div>
                    
                    <div className="h-6 w-px bg-gray-800"></div>
                    
                    {/* Zoom controls */}
                    <button 
                        onClick={() => dispatch(setTimelineZoom(Math.max(50, timelineZoom - 10)))}
                        className="text-gray-400 hover:text-white p-1"
                        title="Zoom Out"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                    </button>
                    <input
                        type="range"
                        min="50"
                        max="200"
                        value={timelineZoom}
                        onChange={(e) => dispatch(setTimelineZoom(Number(e.target.value)))}
                        className="w-12 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <button 
                        onClick={() => dispatch(setTimelineZoom(Math.min(200, timelineZoom + 10)))}
                        className="text-gray-400 hover:text-white p-1"
                        title="Zoom In"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => dispatch(setTimelineZoom(100))}
                        className="text-gray-400 hover:text-white p-1"
                        title="Reset Zoom (100%)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 bg-black relative overflow-hidden">
                <div className="absolute inset-0">
                    <EnhancedTimelineV2 />
                </div>
            </div>
        </div>
    );
};

export default TimelineSection;