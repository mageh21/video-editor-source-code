import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { updateCaption, removeCaption } from '@/app/store/slices/projectSlice';
import { Caption } from '@/app/types';
import { 
    Clock, 
    Type, 
    Trash2,
    ChevronRight,
    Play,
    Pause,
    ChevronDown,
    ChevronUp,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import WordHighlightEditor from './captions/WordHighlightEditor';
import AnimationStyleSelector from './captions/AnimationStyleSelector';
import WordEffectsEditor from './captions/WordEffectsEditor';
import EmojiToggle from './captions/EmojiToggle';
import TypewriterSettingsToggle from './captions/TypewriterSettingsToggle';

interface CaptionPropertiesSectionProps {
    selectedCaption: Caption;
    trackId: string;
}

const CaptionPropertiesSection: React.FC<CaptionPropertiesSectionProps> = ({ 
    selectedCaption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const { currentTime, isPlaying } = useAppSelector(state => state.projectState);
    const [editText, setEditText] = useState(selectedCaption.text);
    const startSeconds = (selectedCaption as any).start ?? (selectedCaption as any).startMs / 1000;
    const endSeconds = (selectedCaption as any).end ?? (selectedCaption as any).endMs / 1000;
    const [editStart, setEditStart] = useState(startSeconds);
    const [editEnd, setEditEnd] = useState(endSeconds);
    const [showHighlightEditor, setShowHighlightEditor] = useState(false);
    const [showAnimationSelector, setShowAnimationSelector] = useState(false);
    const [showEffectsEditor, setShowEffectsEditor] = useState(false);

    // Update state when selectedCaption changes
    useEffect(() => {
        setEditText(selectedCaption.text);
        const newStartSeconds = (selectedCaption as any).start ?? (selectedCaption as any).startMs / 1000;
        const newEndSeconds = (selectedCaption as any).end ?? (selectedCaption as any).endMs / 1000;
        setEditStart(newStartSeconds);
        setEditEnd(newEndSeconds);
    }, [selectedCaption.id, selectedCaption.text, (selectedCaption as any).start, (selectedCaption as any).startMs, (selectedCaption as any).end, (selectedCaption as any).endMs]);

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

    const handleUpdate = () => {
        if (editStart >= editEnd) {
            toast.error('Start time must be before end time');
            return;
        }
        
        dispatch(updateCaption({
            trackId,
            captionId: selectedCaption.id,
            updates: {
                text: editText.trim(),
                startMs: editStart * 1000,
                endMs: editEnd * 1000
            } as any
        }));
        toast.success('Caption updated');
    };

    const handleDelete = () => {
        if (confirm('Delete this caption?')) {
            dispatch(removeCaption({ trackId, captionId: selectedCaption.id }));
            toast.success('Caption deleted');
        }
    };

    const handleExtend = (direction: 'start' | 'end', amount: number) => {
        const updates: any = {};
        if (direction === 'start') {
            const newStart = Math.max(0, startSeconds + amount);
            updates.startMs = newStart * 1000;
            updates.start = newStart;
            setEditStart(newStart);
        } else {
            const newEnd = endSeconds + amount;
            updates.endMs = newEnd * 1000;
            updates.end = newEnd;
            setEditEnd(newEnd);
        }
        
        dispatch(updateCaption({ trackId, captionId: selectedCaption.id, updates }));
    };

    const isActive = currentTime >= startSeconds && currentTime <= endSeconds;

    return (
        <div className="flex flex-col h-full">
            {/* Header with delete button */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white text-sm font-medium flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Caption Properties
                </h2>
                <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-red-900/20 rounded text-red-500 transition-colors"
                    title="Delete caption"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Caption text editor */}
            <div className="p-4 space-y-4">
                {/* Text */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Caption Text
                    </label>
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleUpdate}
                        className="w-full min-h-[80px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                    />
                </div>

                {/* Timing */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Timing
                    </label>
                    
                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Start</label>
                            <input
                                type="text"
                                value={formatTime(editStart)}
                                onChange={(e) => setEditStart(parseTime(e.target.value))}
                                onBlur={handleUpdate}
                                className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">End</label>
                            <input
                                type="text"
                                value={formatTime(editEnd)}
                                onChange={(e) => setEditEnd(parseTime(e.target.value))}
                                onBlur={handleUpdate}
                                className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Duration display */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Duration:</span>
                        <span className="font-mono">{(editEnd - editStart).toFixed(2)}s</span>
                    </div>

                    {/* Quick adjust buttons */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Start</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleExtend('start', -0.1)}
                                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                                >
                                    -0.1s
                                </button>
                                <button
                                    onClick={() => handleExtend('start', 0.1)}
                                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                                >
                                    +0.1s
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">End</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleExtend('end', -0.1)}
                                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                                >
                                    -0.1s
                                </button>
                                <button
                                    onClick={() => handleExtend('end', 0.1)}
                                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                                >
                                    +0.1s
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animation Style Section */}
                <div>
                    <button
                        onClick={() => setShowAnimationSelector(!showAnimationSelector)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">Animation Style</span>
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full capitalize">
                                {selectedCaption.animationStyle || 'default'}
                            </span>
                        </div>
                        {showAnimationSelector ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    
                    {showAnimationSelector && (
                        <div className="mt-3">
                            <AnimationStyleSelector 
                                caption={selectedCaption} 
                                trackId={trackId} 
                            />
                            <TypewriterSettingsToggle
                                caption={selectedCaption} 
                                trackId={trackId} 
                            />
                        </div>
                    )}
                </div>

                {/* Word Highlighting Section */}
                <div>
                    <button
                        onClick={() => setShowHighlightEditor(!showHighlightEditor)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-white">Highlight Words</span>
                            {selectedCaption.highlightedWords && selectedCaption.highlightedWords.length > 0 && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                    {selectedCaption.highlightedWords.length}
                                </span>
                            )}
                        </div>
                        {showHighlightEditor ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    
                    {showHighlightEditor && (
                        <div className="mt-3">
                            <WordHighlightEditor 
                                caption={selectedCaption} 
                                trackId={trackId} 
                            />
                        </div>
                    )}
                </div>

                {/* Word Effects Section */}
                <div>
                    <button
                        onClick={() => setShowEffectsEditor(!showEffectsEditor)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">Word Effects</span>
                            {selectedCaption.wordEffects && selectedCaption.wordEffects.length > 0 && (
                                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                    {selectedCaption.wordEffects.length}
                                </span>
                            )}
                        </div>
                        {showEffectsEditor ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    
                    {showEffectsEditor && (
                        <div className="mt-3">
                            <WordEffectsEditor 
                                caption={selectedCaption} 
                                trackId={trackId} 
                            />
                        </div>
                    )}
                </div>

                {/* Emoji Support */}
                <EmojiToggle 
                    caption={selectedCaption} 
                    trackId={trackId} 
                />

                {/* Status indicator */}
                {isActive && (
                    <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-400">
                            <Play className="w-4 h-4" />
                            <span>Currently playing</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaptionPropertiesSection;