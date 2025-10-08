'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/app/store';
import { updateCaption } from '@/app/store/slices/projectSlice';
import { Caption, WordHighlight } from '@/app/types';
import { HIGHLIGHT_STYLES, HighlightStyle } from '@/config/themes';
import { 
    Type, 
    Palette, 
    X, 
    RotateCcw 
} from 'lucide-react';

interface WordHighlightEditorProps {
    caption: Caption;
    trackId: string;
}

const WordHighlightEditor: React.FC<WordHighlightEditorProps> = ({ 
    caption, 
    trackId 
}) => {
    const dispatch = useAppDispatch();
    const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    
    const words = caption.text.split(' ');
    const highlightedWords = caption.highlightedWords || [];
    
    const getWordHighlight = (wordIndex: number): WordHighlight | undefined => {
        return highlightedWords.find(hw => hw.wordIndex === wordIndex);
    };
    
    const handleWordClick = (wordIndex: number) => {
        setSelectedWordIndex(wordIndex);
        setShowStyleMenu(true);
    };
    
    const handleApplyHighlight = (style: HighlightStyle) => {
        if (selectedWordIndex === null) return;
        
        const existingHighlights = highlightedWords.filter(hw => hw.wordIndex !== selectedWordIndex);
        const newHighlight: WordHighlight = {
            wordIndex: selectedWordIndex,
            style
        };
        
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: [...existingHighlights, newHighlight]
            }
        }));
        
        setShowStyleMenu(false);
        setSelectedWordIndex(null);
    };
    
    const handleRemoveHighlight = (wordIndex: number) => {
        const updatedHighlights = highlightedWords.filter(hw => hw.wordIndex !== wordIndex);
        
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: updatedHighlights
            }
        }));
    };
    
    const handleClearAllHighlights = () => {
        dispatch(updateCaption({
            trackId,
            captionId: caption.id,
            updates: {
                highlightedWords: []
            }
        }));
    };
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Word Highlighting</span>
                </div>
                {highlightedWords.length > 0 && (
                    <button
                        onClick={handleClearAllHighlights}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                        title="Clear all highlights"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>
            
            {/* Interactive text */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-3">
                    Click on any word to highlight it:
                </p>
                <div className="text-base leading-relaxed">
                    {words.map((word, index) => {
                        const highlight = getWordHighlight(index);
                        const isSelected = selectedWordIndex === index;
                        
                        return (
                            <span key={index} className="relative">
                                <span
                                    onClick={() => handleWordClick(index)}
                                    className={`
                                        cursor-pointer transition-all duration-200 inline-block mr-1
                                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''}
                                        ${!highlight ? 'hover:bg-gray-700 hover:text-white text-gray-300' : ''}
                                    `}
                                    style={highlight ? {
                                        ...HIGHLIGHT_STYLES[highlight.style],
                                        display: 'inline-block'
                                    } : {}}
                                >
                                    {word}
                                    {highlight && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveHighlight(index);
                                            }}
                                            className="ml-1 text-xs opacity-70 hover:opacity-100"
                                            title="Remove highlight"
                                        >
                                            <X className="w-3 h-3 inline" />
                                        </button>
                                    )}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
            
            {/* Style selection menu */}
            {showStyleMenu && selectedWordIndex !== null && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">
                            Choose highlight style for "{words[selectedWordIndex]}"
                        </h4>
                        <button
                            onClick={() => {
                                setShowStyleMenu(false);
                                setSelectedWordIndex(null);
                            }}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(HIGHLIGHT_STYLES).map(([styleName, styleProps]) => (
                            <button
                                key={styleName}
                                onClick={() => handleApplyHighlight(styleName as HighlightStyle)}
                                className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-300 capitalize min-w-[80px]">
                                        {styleName}
                                    </span>
                                    <span 
                                        className="text-sm"
                                        style={styleProps}
                                    >
                                        {words[selectedWordIndex]}
                                    </span>
                                </div>
                                <Type className="w-4 h-4 text-gray-400" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Help text */}
            <div className="text-xs text-gray-500">
                <p>• Click on any word to open the highlight menu</p>
                <p>• Choose "monospace" for code-style highlighting</p>
                <p>• Use different colors for emphasis, success, or warnings</p>
                <p>• Click the × next to highlighted words to remove highlighting</p>
            </div>
        </div>
    );
};

export default WordHighlightEditor;