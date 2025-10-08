import React from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { updateCaptionTrack } from '@/app/store/slices/projectSlice';
import { CaptionStyle } from '@/app/types';
import { 
    Palette,
    Type,
    AlignCenter,
    AlignLeft,
    AlignJustify,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const FONT_OPTIONS = [
    'Inter',
    'Arial', 
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Playfair Display',
    'Bebas Neue',
    'Impact'
];

const PRESET_STYLES = [
    {
        name: 'YouTube',
        style: {
            fontSize: 32,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            outlineWidth: 0,
            position: 'bottom' as const
        }
    },
    {
        name: 'Netflix',
        style: {
            fontSize: 28,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            outlineWidth: 3,
            outlineColor: '#000000',
            position: 'bottom' as const
        }
    },
    {
        name: 'TikTok',
        style: {
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            outlineWidth: 2,
            outlineColor: '#000000',
            position: 'center' as const
        }
    },
    {
        name: 'Minimal',
        style: {
            fontSize: 20,
            color: '#000000',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            outlineWidth: 0,
            position: 'bottom' as const
        }
    }
];

const CaptionStyleSection: React.FC = () => {
    const dispatch = useAppDispatch();
    const { captionTracks, activeCaptionTrackId } = useAppSelector(state => state.projectState);
    
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    
    if (!activeTrack) {
        return (
            <div className="p-4 text-center text-gray-500">
                <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No caption track selected</p>
            </div>
        );
    }

    const handleUpdateStyle = (updates: Partial<CaptionStyle>) => {
        dispatch(updateCaptionTrack({
            id: activeTrack.id,
            updates: {
                style: {
                    ...activeTrack.style,
                    ...updates
                }
            }
        }));
    };

    const handleApplyPreset = (preset: typeof PRESET_STYLES[0]) => {
        handleUpdateStyle(preset.style);
        toast.success(`Applied ${preset.name} style`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-white text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Caption Style
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    {activeTrack.name} • {activeTrack.captions.length} captions
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Style presets */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-3">
                        Quick Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {PRESET_STYLES.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => handleApplyPreset(preset)}
                                className="p-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Position */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Position
                    </label>
                    <div className="flex gap-2">
                        {['top', 'center', 'bottom'].map(pos => (
                            <button
                                key={pos}
                                onClick={() => handleUpdateStyle({ position: pos as any })}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                                    activeTrack.style.position === pos
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700'
                                }`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Font Family
                    </label>
                    <select
                        value={activeTrack.style.fontFamily}
                        onChange={(e) => handleUpdateStyle({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg"
                    >
                        {FONT_OPTIONS.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                </div>

                {/* Font Size */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Font Size: {activeTrack.style.fontSize}px
                    </label>
                    <input
                        type="range"
                        min="16"
                        max="64"
                        value={activeTrack.style.fontSize}
                        onChange={(e) => handleUpdateStyle({ fontSize: parseInt(e.target.value) })}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>16px</span>
                        <span>64px</span>
                    </div>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Text Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={activeTrack.style.color}
                                onChange={(e) => handleUpdateStyle({ color: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer bg-transparent border border-gray-700"
                            />
                            <input
                                type="text"
                                value={activeTrack.style.color}
                                onChange={(e) => handleUpdateStyle({ color: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Background
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={activeTrack.style.backgroundColor.includes('rgba') 
                                    ? '#000000' 
                                    : activeTrack.style.backgroundColor}
                                onChange={(e) => {
                                    const hex = e.target.value;
                                    const r = parseInt(hex.slice(1, 3), 16);
                                    const g = parseInt(hex.slice(3, 5), 16);
                                    const b = parseInt(hex.slice(5, 7), 16);
                                    handleUpdateStyle({ 
                                        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.8)` 
                                    });
                                }}
                                className="w-12 h-10 rounded cursor-pointer bg-transparent border border-gray-700"
                            />
                            <button
                                onClick={() => handleUpdateStyle({ backgroundColor: 'transparent' })}
                                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
                            >
                                {activeTrack.style.backgroundColor === 'transparent' ? 'Transparent' : 'Clear'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Outline */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Outline Width: {activeTrack.style.outlineWidth}px
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        value={activeTrack.style.outlineWidth}
                        onChange={(e) => handleUpdateStyle({ outlineWidth: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                {activeTrack.style.outlineWidth > 0 && (
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Outline Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={activeTrack.style.outlineColor}
                                onChange={(e) => handleUpdateStyle({ outlineColor: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer bg-transparent border border-gray-700"
                            />
                            <input
                                type="text"
                                value={activeTrack.style.outlineColor}
                                onChange={(e) => handleUpdateStyle({ outlineColor: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded"
                            />
                        </div>
                    </div>
                )}

                {/* Text Alignment */}
                <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        Text Alignment
                    </label>
                    <div className="flex gap-2">
                        {[
                            { value: 'left', icon: AlignLeft },
                            { value: 'center', icon: AlignCenter },
                            { value: 'justify', icon: AlignJustify }
                        ].map(({ value, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => handleUpdateStyle({ textAlign: value as any })}
                                className={`flex-1 p-2 rounded-lg transition-colors ${
                                    activeTrack.style.textAlign === value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-4 h-4 mx-auto" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaptionStyleSection;