"use client";

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setCanvasResolution, setAspectRatio } from '@/app/store/slices/projectSlice';
import { Monitor, Smartphone, Square, Tv, ChevronDown } from 'lucide-react';

interface CanvasPreset {
    name: string;
    aspectRatio: string;
    width: number;
    height: number;
    icon: React.ReactNode;
    description: string;
}

const CANVAS_PRESETS: CanvasPreset[] = [
    {
        name: "Landscape (16:9)",
        aspectRatio: "16:9",
        width: 1920,
        height: 1080,
        icon: <Monitor className="w-4 h-4" />,
        description: "YouTube, TV, Desktop"
    },
    {
        name: "Portrait (9:16)",
        aspectRatio: "9:16",
        width: 1080,
        height: 1920,
        icon: <Smartphone className="w-4 h-4" />,
        description: "TikTok, Reels, Stories"
    },
    {
        name: "Square (1:1)",
        aspectRatio: "1:1",
        width: 1080,
        height: 1080,
        icon: <Square className="w-4 h-4" />,
        description: "Instagram Posts"
    },
    {
        name: "Standard (4:3)",
        aspectRatio: "4:3",
        width: 1440,
        height: 1080,
        icon: <Tv className="w-4 h-4" />,
        description: "Classic TV, Presentations"
    }
];

export default function CanvasSizeSelector() {
    const dispatch = useAppDispatch();
    const { resolution, aspectRatio } = useAppSelector((state) => state.projectState);
    const [isOpen, setIsOpen] = useState(false);
    
    const currentPreset = CANVAS_PRESETS.find(p => p.aspectRatio === aspectRatio) || CANVAS_PRESETS[0];

    const handlePresetSelect = (preset: CanvasPreset) => {
        dispatch(setCanvasResolution({ width: preset.width, height: preset.height }));
        dispatch(setAspectRatio(preset.aspectRatio));
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
                <div className="flex items-center gap-2">
                    {currentPreset.icon}
                    <div className="text-left">
                        <div className="text-white font-medium">{currentPreset.aspectRatio}</div>
                        <div className="text-xs text-gray-400">{resolution.width}×{resolution.height}</div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50">
                        {/* Custom Size Option */}
                        <div className="p-3 border-b border-gray-800">
                            <div className="text-xs text-gray-400 mb-2">Custom Size</div>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    value={resolution.width}
                                    onChange={(e) => {
                                        const width = parseInt(e.target.value) || 1920;
                                        dispatch(setCanvasResolution({ width, height: resolution.height }));
                                        dispatch(setAspectRatio('custom'));
                                    }}
                                    className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Width"
                                    min="100"
                                    max="7680"
                                />
                                <span className="text-gray-500">×</span>
                                <input
                                    type="number"
                                    value={resolution.height}
                                    onChange={(e) => {
                                        const height = parseInt(e.target.value) || 1080;
                                        dispatch(setCanvasResolution({ width: resolution.width, height }));
                                        dispatch(setAspectRatio('custom'));
                                    }}
                                    className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Height"
                                    min="100"
                                    max="7680"
                                />
                            </div>
                        </div>

                        <div className="p-2">
                            <div className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1">Presets</div>
                            {CANVAS_PRESETS.map((preset) => (
                                <button
                                    key={preset.aspectRatio}
                                    onClick={() => handlePresetSelect(preset)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                        preset.aspectRatio === aspectRatio 
                                            ? 'bg-blue-600 text-white' 
                                            : 'hover:bg-gray-800 text-gray-300'
                                    }`}
                                >
                                    <div className="mt-1">{preset.icon}</div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{preset.name}</div>
                                        <div className={`text-xs mt-0.5 ${
                                            preset.aspectRatio === aspectRatio ? 'text-blue-200' : 'text-gray-500'
                                        }`}>
                                            {preset.width} × {preset.height} • {preset.description}
                                        </div>
                                    </div>
                                    {preset.aspectRatio === aspectRatio && (
                                        <div className="w-2 h-2 bg-white rounded-full mt-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}