import React, { useState } from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption, WordHighlight } from '@/app/types';
import { Type, X, Plus } from 'lucide-react';
import { HIGHLIGHT_STYLES } from '@/config/themes';
import toast from 'react-hot-toast';

interface WordHighlightEditorProps {
    caption: Caption;
    trackId: string;
}

const WordHighlightEditor: React.FC<WordHighlightEditorProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const words = caption.text.split(' ');
    const [selectedWords, setSelectedWords] = useState<number[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<keyof typeof HIGHLIGHT_STYLES>('default');

    const currentHighlights = caption.highlightedWords || [];

    const handleWordClick = (index: number) => {
        if (selectedWords.includes(index)) {
            setSelectedWords(selectedWords.filter(i => i !== index));
        } else {
            setSelectedWords([...selectedWords, index]);
        }
    };

    const handleAddHighlight = () => {
        if (selectedWords.length === 0) {
            toast.error('Please select words to highlight');
            return;
        }

        const newHighlights: WordHighlight[] = [
            ...currentHighlights.filter(h => !selectedWords.includes(h.wordIndex)),
            ...selectedWords.map(index => ({
                wordIndex: index,
                style: selectedStyle
            }))
        ];

        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: newHighlights
            }
        }));

        setSelectedWords([]);
        toast.success('Highlights updated');
    };

    const handleRemoveHighlight = (wordIndex: number) => {
        const newHighlights = currentHighlights.filter(h => h.wordIndex !== wordIndex);
        
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: newHighlights
            }
        }));
        
        toast.success('Highlight removed');
    };

    const handleClearAll = () => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: []
            }
        }));
        
        toast.success('All highlights cleared');
    };

    return (
        <div className="space-y-3">
            {/* Word selection */}
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Click words to highlight
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-lg">
                    {words.map((word, index) => {
                        const existingHighlight = currentHighlights.find(h => h.wordIndex === index);
                        const isSelected = selectedWords.includes(index);
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleWordClick(index)}
                                className={`
                                    px-2 py-1 rounded text-sm transition-all
                                    ${existingHighlight 
                                        ? 'ring-2 ring-offset-2 ring-offset-gray-800' 
                                        : ''
                                    }
                                    ${isSelected 
                                        ? 'bg-blue-600 text-white' 
                                        : existingHighlight
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }
                                `}
                                style={existingHighlight ? {
                                    backgroundColor: HIGHLIGHT_STYLES[existingHighlight.style].backgroundColor,
                                    color: HIGHLIGHT_STYLES[existingHighlight.style].color,
                                    fontWeight: HIGHLIGHT_STYLES[existingHighlight.style].fontWeight
                                } as any : undefined}
                            >
                                {word}
                                {existingHighlight && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveHighlight(index);
                                        }}
                                        className="ml-1 hover:text-red-400"
                                    >
                                        <X className="w-3 h-3 inline" />
                                    </button>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Style selection */}
            {selectedWords.length > 0 && (
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Choose highlight style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(HIGHLIGHT_STYLES).map(([key, style]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedStyle(key as keyof typeof HIGHLIGHT_STYLES)}
                                className={`
                                    p-2 rounded-lg border transition-all text-sm
                                    ${selectedStyle === key 
                                        ? 'border-blue-500' 
                                        : 'border-gray-700 hover:border-gray-600'
                                    }
                                `}
                                style={{
                                    backgroundColor: style.backgroundColor,
                                    color: style.color,
                                    fontWeight: style.fontWeight as any
                                }}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
                {selectedWords.length > 0 && (
                    <button
                        onClick={handleAddHighlight}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Apply Highlight
                    </button>
                )}
                
                {currentHighlights.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
                <p>Highlighted words will stand out with special styling during playback. Great for emphasizing key points!</p>
            </div>
        </div>
    );
};

export default WordHighlightEditor;