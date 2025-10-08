import React from 'react';
import { Type, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { TextElement } from '@/app/types';
import { setTextElements, setVisibleRows, setSelectedTextIds, setActiveElement } from '@/app/store/slices/projectSlice';
import { findAvailableRow } from '@/app/utils/timelineUtils';
import TextTemplates from './TextTemplates';
import TextList from './TextList';

const TextPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { textElements, mediaFiles, currentTime, duration, visibleRows, maxRows, resolution } = useAppSelector((state) => state.projectState);
    const [activeTab, setActiveTab] = React.useState<'templates' | 'custom'>('templates');

    const addCustomText = () => {
        const positionStart = currentTime || 0;
        const positionEnd = Math.min(positionStart + 5, duration);
        
        // Find the next available row
        const allElements = [...mediaFiles, ...textElements];
        const row = findAvailableRow(allElements, positionStart, positionEnd);

        // Ensure we have enough visible rows
        if (row >= visibleRows && visibleRows < maxRows) {
            dispatch(setVisibleRows(Math.min(row + 1, maxRows)));
        }

        // Use percentage of screen width for better scaling
        const defaultWidth = Math.round(resolution.width * 0.5); // 50% of screen width
        const x = (resolution.width - defaultWidth) / 2; // Center horizontally
        const y = resolution.height / 2 - 50; // Center vertically

        const newText: TextElement = {
            id: crypto.randomUUID(),
            text: 'Your Text Here',
            row,
            positionStart,
            positionEnd,
            x,
            y,
            width: defaultWidth,
            height: 100,
            font: 'Inter',
            fontSize: 48,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            align: 'center',
            opacity: 100,
            rotation: 0,
            animation: 'none'
        };

        dispatch(setTextElements([...textElements, newText]));
        dispatch(setSelectedTextIds([newText.id]));
        dispatch(setActiveElement('text'));
    };

    return (
        <div className="w-80 bg-black border-r border-gray-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 bg-gray-950 border-b border-gray-800">
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Text Elements
                </h2>
                
                {/* Add Custom Text Button - Always visible */}
                <button
                    onClick={addCustomText}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] font-medium mb-4"
                >
                    <Plus className="w-5 h-5" />
                    Add Custom Text
                </button>
                
                {/* Tabs */}
                <div className="flex bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-all rounded-md ${
                            activeTab === 'templates'
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-all rounded-md ${
                            activeTab === 'custom'
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Your Texts
                        {textElements.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded-full">
                                {textElements.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'templates' && (
                    <TextTemplates />
                )}
                
                {activeTab === 'custom' && (
                    <div className="p-4">
                        {/* Text List */}
                        <TextList />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextPanel;