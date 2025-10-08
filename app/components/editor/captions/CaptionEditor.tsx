'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { 
    updateCaption, 
    removeCaption, 
    addCaption,
    setSelectedCaptionIds,
    setCurrentTime,
    setActiveElement
} from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { 
    Play, 
    Pause, 
    Trash2, 
    Plus, 
    ChevronLeft, 
    ChevronRight, 
    Edit3, 
    Scissors,
    Clock,
    Type,
    MoreVertical,
    Copy,
    Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CaptionEditorProps {
    trackId: string;
    caption: Caption;
    isSelected: boolean;
    index: number;
    totalCaptions: number;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
    trackId,
    caption,
    isSelected,
    index,
    totalCaptions
}) => {
    const dispatch = useAppDispatch();
    const { currentTime, duration, isPlaying } = useAppSelector(state => state.projectState);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(caption.text);
    const startSeconds = (caption as any).start ?? caption.startMs / 1000;
    const endSeconds = (caption as any).end ?? caption.endMs / 1000;
    const [editStart, setEditStart] = useState(startSeconds);
    const [editEnd, setEditEnd] = useState(endSeconds);
    const [showMenu, setShowMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
    };

    const parseTime = (timeStr: string): number => {
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        const [mins, secsAndMillis] = parts;
        const [secs, millis = '0'] = secsAndMillis.split('.');
        return parseInt(mins) * 60 + parseInt(secs) + parseInt(millis) / 100;
    };

    const handleSave = () => {
        if (editStart >= editEnd) {
            toast.error('Start time must be before end time');
            return;
        }
        
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                text: editText.trim(),
                startMs: editStart * 1000,
                endMs: editEnd * 1000
            } as any
        }));
        setIsEditing(false);
        toast.success('Caption updated');
    };

    const handleDelete = () => {
        dispatch(removeCaption({ trackId, captionId: caption.id }));
        toast.success('Caption deleted');
    };

    const handleSelect = () => {
        dispatch(setSelectedCaptionIds([caption.id]));
        dispatch(setActiveElement('caption'));
    };

    const handlePlayCaption = () => {
        dispatch(setCurrentTime(startSeconds));
        if (!isPlaying) {
            // You might need to implement a play action
        }
    };

    const handleDuplicate = () => {
        const newCaption: any = {
            id: crypto.randomUUID(),
            text: caption.text,
            startMs: endSeconds * 1000,
            endMs: (endSeconds + (endSeconds - startSeconds)) * 1000,
            timestampMs: null,
            confidence: null,
            speaker: caption.speaker
        };

        dispatch(addCaption({ trackId, caption: newCaption }));
        toast.success('Caption duplicated');
    };

    const handleSplit = () => {
        const midPoint = (startSeconds + endSeconds) / 2;
        const words = caption.text.split(' ');
        const midIndex = Math.floor(words.length / 2);
        const firstHalf = words.slice(0, midIndex).join(' ');
        const secondHalf = words.slice(midIndex).join(' ');

        // Update current caption
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                text: firstHalf,
                endMs: midPoint * 1000
            } as any
        }));

        // Add new caption for second half
        dispatch(addCaption({
            trackId,
            caption: {
                id: crypto.randomUUID(),
                text: secondHalf,
                startMs: midPoint * 1000,
                endMs: endSeconds * 1000,
                timestampMs: null,
                confidence: null,
                speaker: caption.speaker
            } as any
        }));

        toast.success('Caption split');
        setShowMenu(false);
    };

    const handleExtend = (direction: 'start' | 'end', amount: number) => {
        const updates: any = {};
        if (direction === 'start') {
            const newStart = Math.max(0, startSeconds + amount);
            updates.startMs = newStart * 1000;
            updates.start = newStart;
        } else {
            const newEnd = Math.min(duration, endSeconds + amount);
            updates.endMs = newEnd * 1000;
            updates.end = newEnd;
        }
        
        dispatch(updateCaption({ trackId, captionId: caption.id, updates }));
    };

    const isActive = currentTime >= startSeconds && currentTime <= endSeconds;
    const progress = isActive ? ((currentTime - startSeconds) / (endSeconds - startSeconds)) * 100 : 0;

    return (
        <div 
            className={`
                group relative rounded-xl transition-all duration-200 cursor-pointer
                ${isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg scale-[1.02]' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : 'border border-gray-200 dark:border-gray-700'}
            `}
            onClick={handleSelect}
        >
            {/* Progress bar for active caption */}
            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {!isEditing ? (
                <div className="p-2">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    #{index + 1} of {totalCaptions}
                                </span>
                                {caption.speaker && (
                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                        {caption.speaker}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayCaption();
                                    }}
                                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Clock className="w-3 h-3" />
                                    <span className="font-mono">{formatTime(startSeconds)}</span>
                                </button>
                                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                                <span className="font-mono text-gray-600 dark:text-gray-400">
                                    {formatTime(endSeconds)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                    ({(endSeconds - startSeconds).toFixed(1)}s)
                                </span>
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Edit caption"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                
                                {showMenu && (
                                    <div className="absolute right-0 top-6 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicate();
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-2 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSplit();
                                            }}
                                            className="w-full px-2 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <Scissors className="w-3.5 h-3.5" />
                                            Split in half
                                        </button>
                                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-2 py-1.5 text-left text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Caption text */}
                    <p className="text-sm leading-snug mb-2">
                        {caption.text}
                    </p>

                    {/* Quick timing adjustments */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExtend('start', -0.1);
                            }}
                            className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Start 0.1s earlier"
                        >
                            -0.1s
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExtend('start', 0.1);
                            }}
                            className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Start 0.1s later"
                        >
                            +0.1s
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExtend('end', -0.1);
                            }}
                            className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="End 0.1s earlier"
                        >
                            -0.1s
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExtend('end', 0.1);
                            }}
                            className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="End 0.1s later"
                        >
                            +0.1s
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-2" onClick={e => e.stopPropagation()}>
                    {/* Edit mode */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Start time</label>
                                <input
                                    type="text"
                                    value={formatTime(editStart)}
                                    onChange={(e) => setEditStart(parseTime(e.target.value))}
                                    className="w-full px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 font-mono"
                                    placeholder="00:00.00"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">End time</label>
                                <input
                                    type="text"
                                    value={formatTime(editEnd)}
                                    onChange={(e) => setEditEnd(parseTime(e.target.value))}
                                    className="w-full px-2 py-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 font-mono"
                                    placeholder="00:00.00"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Caption text</label>
                            <textarea
                                ref={textareaRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border rounded resize-none dark:bg-gray-700 dark:border-gray-600"
                                rows={2}
                                placeholder="Enter caption text..."
                            />
                        </div>
                        
                        <div className="flex justify-end gap-1">
                            <button
                                onClick={() => {
                                    setEditText(caption.text);
                                    setEditStart(startSeconds);
                                    setEditEnd(endSeconds);
                                    setIsEditing(false);
                                }}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};