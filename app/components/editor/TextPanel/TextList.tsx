import React from 'react';
import { Type, Trash2, Copy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { TextElement } from '@/app/types';
import { setTextElements, setSelectedTextIds, setActiveElement } from '@/app/store/slices/projectSlice';

const TextList: React.FC = () => {
    const dispatch = useAppDispatch();
    const { textElements, selectedTextIds } = useAppSelector((state) => state.projectState);

    const handleDelete = (id: string) => {
        dispatch(setTextElements(textElements.filter(text => text.id !== id)));
        if (selectedTextIds.includes(id)) {
            dispatch(setSelectedTextIds(selectedTextIds.filter(sid => sid !== id)));
        }
    };

    const handleDuplicate = (text: TextElement) => {
        const newText: TextElement = {
            ...text,
            id: crypto.randomUUID(),
            x: text.x + 20,
            y: text.y + 20,
            positionStart: text.positionEnd,
            positionEnd: text.positionEnd + (text.positionEnd - text.positionStart)
        };
        dispatch(setTextElements([...textElements, newText]));
    };

    const handleSelect = (text: TextElement) => {
        dispatch(setSelectedTextIds([text.id]));
        dispatch(setActiveElement('text'));
    };

    if (textElements.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-gray-900 rounded-lg p-8">
                    <Type className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm font-medium">No text elements yet</p>
                    <p className="text-gray-500 text-xs mt-2">Click "Add Custom Text" or choose from templates</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Your Text Elements</h3>
                <span className="text-xs text-gray-500">{textElements.length} items</span>
            </div>
            
            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {textElements.map((text, index) => (
                    <div
                        key={text.id}
                        onClick={() => handleSelect(text)}
                        className={`group relative p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedTextIds.includes(text.id)
                                ? 'bg-blue-600 bg-opacity-10 border-blue-600 shadow-lg shadow-blue-600/20'
                                : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                        selectedTextIds.includes(text.id) 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-800 text-gray-400'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium truncate">
                                            {text.text.substring(0, 40)}{text.text.length > 40 ? '...' : ''}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-xs text-gray-500">
                                                {text.positionStart.toFixed(1)}s - {text.positionEnd.toFixed(1)}s
                                            </p>
                                            <span className="text-xs text-gray-600">•</span>
                                            <p className="text-xs text-gray-500">
                                                {text.font || 'Inter'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Preview of text style */}
                                <div className="mt-2 p-2 bg-black rounded overflow-hidden">
                                    <div 
                                        className="text-xs truncate"
                                        style={{
                                            color: text.color,
                                            backgroundColor: text.backgroundColor !== 'transparent' ? text.backgroundColor : undefined,
                                            padding: text.backgroundColor !== 'transparent' ? '2px 4px' : undefined,
                                            borderRadius: '2px',
                                            display: 'inline-block',
                                            maxWidth: '100%'
                                        }}
                                    >
                                        {text.text}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicate(text);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                                    title="Duplicate"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(text.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TextList;