import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Palette, Move, RotateCw, Settings, PaintBucket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setTextElements } from '@/app/store/slices/projectSlice';
import { TextElement } from '@/app/types';
import { FontPicker } from './FontPicker';
import toast from 'react-hot-toast';

interface TextPropertiesSectionProps {
    selectedText: TextElement;
}

const TextPropertiesSection: React.FC<TextPropertiesSectionProps> = ({ selectedText }) => {
    const dispatch = useAppDispatch();
    const { textElements } = useAppSelector((state) => state.projectState);
    const [activeTab, setActiveTab] = useState<'style' | 'animation'>('style');

    const updateTextProperty = (property: keyof TextElement, value: any) => {
        const updatedElements = textElements.map(text =>
            text.id === selectedText.id
                ? { ...text, [property]: value }
                : text
        );
        dispatch(setTextElements(updatedElements));
    };

    const updateTextStyle = (updates: Partial<TextElement>) => {
        const updatedElements = textElements.map(text =>
            text.id === selectedText.id
                ? { ...text, ...updates }
                : text
        );
        dispatch(setTextElements(updatedElements));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Live Preview */}
            <div className="p-4 border-b border-gray-800 bg-gray-900">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Preview</div>
                <div className="bg-black rounded-lg p-6 relative overflow-hidden min-h-[100px] flex items-center justify-center">
                    <div 
                        style={{
                            fontFamily: selectedText.font || 'Inter',
                            fontSize: `${(selectedText.fontSize || 32) * 0.6}px`, // Scale down for preview
                            color: selectedText.color || '#FFFFFF',
                            backgroundColor: selectedText.backgroundColor || 'transparent',
                            padding: selectedText.backgroundColor !== 'transparent' ? '8px 16px' : '0',
                            borderRadius: '4px',
                            textAlign: selectedText.align || 'center',
                            transform: `rotate(${selectedText.rotation || 0}deg)`,
                            opacity: (selectedText.opacity || 100) / 100,
                            display: 'inline-block',
                            maxWidth: '100%',
                            wordBreak: 'break-word'
                        }}
                    >
                        {selectedText.text || 'Text Preview'}
                    </div>
                </div>
            </div>

            {/* Text Editor */}
            <div className="p-4 border-b border-gray-800">
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Edit Text</label>
                    <textarea
                        value={selectedText.text}
                        onChange={(e) => updateTextProperty('text', e.target.value)}
                        placeholder="Enter your text here..."
                        className="w-full min-h-[80px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        rows={3}
                        autoFocus
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'style'
                                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <PaintBucket className="w-4 h-4" />
                        Style
                    </button>
                    <button
                        onClick={() => setActiveTab('animation')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'animation'
                                ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Animation
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'style' && (
                    <div className="p-4 space-y-6">
                        {/* Typography */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Typography</h3>
                            
                            {/* Font Family */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Font</label>
                                <FontPicker
                                    selectedFont={selectedText.font || 'Inter'}
                                    onFontChange={(font) => updateTextProperty('font', font)}
                                />
                            </div>

                            {/* Font Size */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Size</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="120"
                                    value={selectedText.fontSize || 32}
                                    onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>12px</span>
                                    <span className="text-white">{selectedText.fontSize || 32}px</span>
                                    <span>120px</span>
                                </div>
                                {/* Auto-scale warning */}
                                {selectedText.width && (
                                    <div className="text-xs text-yellow-500 mt-1">
                                        ⚠️ Text may be auto-scaled to fit within {selectedText.width}px width
                                    </div>
                                )}
                            </div>
                            
                            {/* Width control */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Container Width</label>
                                <input
                                    type="number"
                                    value={selectedText.width || ''}
                                    onChange={(e) => updateTextProperty('width', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="Auto"
                                    className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                />
                                <div className="text-xs text-gray-500">
                                    Leave empty for no width constraint
                                </div>
                            </div>

                            {/* Text Alignment */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Alignment</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateTextProperty('align', 'left')}
                                        className={`flex-1 p-2 rounded-lg transition-colors ${
                                            selectedText.align === 'left' || !selectedText.align
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        <AlignLeft className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => updateTextProperty('align', 'center')}
                                        className={`flex-1 p-2 rounded-lg transition-colors ${
                                            selectedText.align === 'center'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        <AlignCenter className="w-4 h-4 mx-auto" />
                                    </button>
                                    <button
                                        onClick={() => updateTextProperty('align', 'right')}
                                        className={`flex-1 p-2 rounded-lg transition-colors ${
                                            selectedText.align === 'right'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        <AlignRight className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Colors</h3>
                            
                            {/* Text Color */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Text Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={selectedText.color || '#FFFFFF'}
                                        onChange={(e) => updateTextProperty('color', e.target.value)}
                                        className="w-12 h-8 bg-transparent border border-gray-700 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={selectedText.color || '#FFFFFF'}
                                        onChange={(e) => updateTextProperty('color', e.target.value)}
                                        className="flex-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Background</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={selectedText.backgroundColor === 'transparent' ? '#000000' : selectedText.backgroundColor || '#000000'}
                                        onChange={(e) => updateTextProperty('backgroundColor', e.target.value)}
                                        className="w-12 h-8 bg-transparent border border-gray-700 rounded cursor-pointer"
                                        disabled={selectedText.backgroundColor === 'transparent'}
                                    />
                                    <button
                                        onClick={() => updateTextProperty('backgroundColor', 
                                            selectedText.backgroundColor === 'transparent' ? '#000000' : 'transparent'
                                        )}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            selectedText.backgroundColor === 'transparent'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        Transparent
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transform */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Transform</h3>
                            
                            {/* Position */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">X Position</label>
                                    <input
                                        type="number"
                                        value={selectedText.x}
                                        onChange={(e) => updateTextProperty('x', parseInt(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Y Position</label>
                                    <input
                                        type="number"
                                        value={selectedText.y}
                                        onChange={(e) => updateTextProperty('y', parseInt(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                            </div>

                            {/* Rotation */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Rotation</label>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={selectedText.rotation || 0}
                                    onChange={(e) => updateTextProperty('rotation', parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>-180°</span>
                                    <span className="text-white">{selectedText.rotation || 0}°</span>
                                    <span>180°</span>
                                </div>
                            </div>

                            {/* Opacity */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Opacity</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedText.opacity || 100}
                                    onChange={(e) => updateTextProperty('opacity', parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>0%</span>
                                    <span className="text-white">{selectedText.opacity || 100}%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'animation' && (
                    <div className="p-4 space-y-6">
                        {/* Animation */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Animation</h3>
                            
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Entrance</label>
                                <select
                                    value={selectedText.animation || 'none'}
                                    onChange={(e) => updateTextProperty('animation', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="none">None</option>
                                    <option value="slide-in">Slide In</option>
                                    <option value="zoom">Zoom</option>
                                    <option value="bounce">Bounce</option>
                                </select>
                            </div>

                            {/* Fade In/Out */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Fade In (s)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={selectedText.fadeInDuration || 0}
                                        onChange={(e) => updateTextProperty('fadeInDuration', parseFloat(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Fade Out (s)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={selectedText.fadeOutDuration || 0}
                                        onChange={(e) => updateTextProperty('fadeOutDuration', parseFloat(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Timing */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Timing</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Start Time (s)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={selectedText.positionStart}
                                        onChange={(e) => updateTextProperty('positionStart', parseFloat(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">End Time (s)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={selectedText.positionEnd}
                                        onChange={(e) => updateTextProperty('positionEnd', parseFloat(e.target.value))}
                                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Duration</label>
                                <div className="text-sm text-white">
                                    {(selectedText.positionEnd - selectedText.positionStart).toFixed(1)} seconds
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextPropertiesSection;