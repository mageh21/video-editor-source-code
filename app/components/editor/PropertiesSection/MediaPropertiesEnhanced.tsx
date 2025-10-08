"use client";

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store';
import { setMediaFiles } from '../../../store/slices/projectSlice';
import { MediaFile } from '../../../types';
import { 
    Settings, Film, Volume2, Image as ImageIcon, 
    Palette, Move3d, Clock, Sparkles, Layers,
    ChevronDown, ChevronUp, Sliders
} from 'lucide-react';
import { TransitionSection } from './TransitionSection';

interface PropertySectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const PropertySection: React.FC<PropertySectionProps> = ({ title, icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <div className="border-b border-gray-800 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function MediaPropertiesEnhanced() {
    const { mediaFiles, activeElementIndex, activeElement } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    
    const mediaFile = activeElement === 'media' && activeElementIndex >= 0 ? mediaFiles[activeElementIndex] : null;
    
    const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
        dispatch(setMediaFiles(mediaFiles.map(media => {
            if (media.id !== id) return media;
            
            const updatedMedia = { ...media, ...updates };
            
            // If playback speed changed, recalculate positionEnd
            if (updates.playbackSpeed && updates.playbackSpeed !== media.playbackSpeed && (media.type === 'video' || media.type === 'audio')) {
                const originalDuration = (media.endTime - media.startTime);
                // Ensure we have valid numbers
                if (isFinite(originalDuration) && originalDuration > 0 && isFinite(updates.playbackSpeed) && updates.playbackSpeed > 0) {
                    const adjustedDuration = originalDuration / updates.playbackSpeed;
                    updatedMedia.positionEnd = updatedMedia.positionStart + adjustedDuration;
                }
            }
            
            return updatedMedia;
        })));
    };

    if (!mediaFile) return null;

    const getMediaIcon = () => {
        switch (mediaFile.type) {
            case 'video': return <Film className="w-4 h-4 text-blue-400" />;
            case 'audio': return <Volume2 className="w-4 h-4 text-orange-400" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
            default: return <Film className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 z-10 p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    {getMediaIcon()}
                    <h2 className="text-white text-lg font-medium">Media Properties</h2>
                </div>
                <p className="text-xs text-gray-400 mt-1">{mediaFile.fileName}</p>
            </div>

            {/* Basic Info */}
            <PropertySection 
                title="Basic Information" 
                icon={<Settings className="w-4 h-4 text-gray-400" />}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="ml-2 text-white capitalize">{mediaFile.type}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Duration:</span>
                            <span className="ml-2 text-white">{(mediaFile.positionEnd - mediaFile.positionStart).toFixed(1)}s</span>
                        </div>
                    </div>
                </div>
            </PropertySection>

            {/* Timeline Position */}
            <PropertySection 
                title="Timeline Position" 
                icon={<Clock className="w-4 h-4 text-gray-400" />}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Start (s)</label>
                            <input
                                type="number"
                                value={mediaFile.positionStart.toFixed(2)}
                                min={0}
                                step={0.1}
                                onChange={(e) => onUpdateMedia(mediaFile.id, {
                                    positionStart: Number(e.target.value),
                                    positionEnd: Number(e.target.value) + (mediaFile.positionEnd - mediaFile.positionStart)
                                })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">End (s)</label>
                            <input
                                type="number"
                                value={mediaFile.positionEnd.toFixed(2)}
                                min={mediaFile.positionStart}
                                step={0.1}
                                onChange={(e) => onUpdateMedia(mediaFile.id, {
                                    positionEnd: Number(e.target.value)
                                })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Trim Controls */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Trim Start (s)</label>
                            <input
                                type="number"
                                value={mediaFile.startTime.toFixed(2)}
                                min={0}
                                step={0.1}
                                onChange={(e) => onUpdateMedia(mediaFile.id, {
                                    startTime: Number(e.target.value)
                                })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Trim End (s)</label>
                            <input
                                type="number"
                                value={mediaFile.endTime.toFixed(2)}
                                min={mediaFile.startTime}
                                step={0.1}
                                onChange={(e) => onUpdateMedia(mediaFile.id, {
                                    endTime: Number(e.target.value)
                                })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Speed Control */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Playback Speed</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0.25"
                                max="4"
                                step="0.25"
                                value={mediaFile.playbackSpeed || 1}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { playbackSpeed: Number(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.playbackSpeed || 1}x</span>
                        </div>
                    </div>
                </div>
            </PropertySection>

            {/* Transform */}
            <PropertySection 
                title="Transform" 
                icon={<Move3d className="w-4 h-4 text-gray-400" />}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">X Position</label>
                            <input
                                type="number"
                                value={mediaFile.x || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { x: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Y Position</label>
                            <input
                                type="number"
                                value={mediaFile.y || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { y: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Width</label>
                            <input
                                type="number"
                                value={mediaFile.width || 1920}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { width: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Height</label>
                            <input
                                type="number"
                                value={mediaFile.height || 1080}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { height: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Rotation */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Rotation (degrees)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={mediaFile.rotation || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { rotation: Number(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.rotation || 0}°</span>
                        </div>
                    </div>
                </div>
            </PropertySection>

            {/* Visual Effects */}
            <PropertySection 
                title="Visual Effects" 
                icon={<Palette className="w-4 h-4 text-gray-400" />}
            >
                <div className="space-y-3">
                    {/* Opacity */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Opacity</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mediaFile.opacity || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { opacity: Number(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.opacity || 100}%</span>
                        </div>
                    </div>

                    {/* Blur */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Blur</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={mediaFile.effects?.blur || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { 
                                    effects: { ...mediaFile.effects, blur: Number(e.target.value) }
                                })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.effects?.blur || 0}</span>
                        </div>
                    </div>

                    {/* Brightness */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Brightness</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={mediaFile.effects?.brightness || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { 
                                    effects: { ...mediaFile.effects, brightness: Number(e.target.value) }
                                })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.effects?.brightness || 100}%</span>
                        </div>
                    </div>

                    {/* Contrast */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Contrast</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={mediaFile.effects?.contrast || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { 
                                    effects: { ...mediaFile.effects, contrast: Number(e.target.value) }
                                })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.effects?.contrast || 100}%</span>
                        </div>
                    </div>

                    {/* Saturation */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Saturation</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={mediaFile.effects?.saturation || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { 
                                    effects: { ...mediaFile.effects, saturation: Number(e.target.value) }
                                })}
                                className="flex-1"
                            />
                            <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.effects?.saturation || 100}%</span>
                        </div>
                    </div>
                </div>
            </PropertySection>

            {/* Transitions */}
            <PropertySection 
                title="Transitions" 
                icon={<Sparkles className="w-4 h-4 text-gray-400" />}
            >
                <TransitionSection mediaFile={mediaFile} onUpdateMedia={onUpdateMedia} />
            </PropertySection>

            {/* Audio Properties (for video/audio) */}
            {(mediaFile.type === 'video' || mediaFile.type === 'audio') && (
                <PropertySection 
                    title="Audio" 
                    icon={<Volume2 className="w-4 h-4 text-gray-400" />}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Volume</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={mediaFile.volume}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, { volume: Number(e.target.value) })}
                                    className="flex-1"
                                />
                                <span className="text-xs text-gray-300 w-12 text-right">{mediaFile.volume}%</span>
                            </div>
                        </div>
                    </div>
                </PropertySection>
            )}

            {/* Advanced */}
            <PropertySection 
                title="Advanced" 
                icon={<Sliders className="w-4 h-4 text-gray-400" />}
                defaultOpen={false}
            >
                <div className="space-y-3">
                    {/* Z-Index */}
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Layer Order (Z-Index)</label>
                        <input
                            type="number"
                            value={mediaFile.zIndex || 0}
                            onChange={(e) => onUpdateMedia(mediaFile.id, { zIndex: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Chroma Key (for video) */}
                    {mediaFile.type === 'video' && (
                        <>
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-gray-300">Enable Chroma Key</label>
                                <button
                                    onClick={() => onUpdateMedia(mediaFile.id, { 
                                        chromaKeyEnabled: !mediaFile.chromaKeyEnabled,
                                        chromaKeyColor: mediaFile.chromaKeyColor || '#00FF00',
                                        chromaKeySimilarity: mediaFile.chromaKeySimilarity || 0.4,
                                        chromaKeySmooth: mediaFile.chromaKeySmooth || 0.1
                                    })}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                                        mediaFile.chromaKeyEnabled ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            mediaFile.chromaKeyEnabled ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            {mediaFile.chromaKeyEnabled && (
                                <div className="mt-3 space-y-3 pl-2">
                                    <div className="p-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs text-blue-400 mb-3">
                                        <p className="font-medium mb-1">ℹ️ Chromakey Preview</p>
                                        <p>The preview shows an approximation of the chromakey effect. For pixel-perfect green screen removal, use &quot;Export&quot; → &quot;Advanced Export&quot;.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">Key Color</label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                value={mediaFile.chromaKeyColor || '#00FF00'}
                                                onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeyColor: e.target.value })}
                                                className="h-8 w-14 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={mediaFile.chromaKeyColor || '#00FF00'}
                                                onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeyColor: e.target.value })}
                                                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">
                                            Similarity: {((mediaFile.chromaKeySimilarity || 0.4) * 100).toFixed(0)}%
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={(mediaFile.chromaKeySimilarity || 0.4) * 100}
                                                onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeySimilarity: Number(e.target.value) / 100 })}
                                                className="flex-1"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Higher = more color removed</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">
                                            Edge Smoothing: {((mediaFile.chromaKeySmooth || 0.1) * 100).toFixed(0)}%
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={(mediaFile.chromaKeySmooth || 0.1) * 100}
                                                onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeySmooth: Number(e.target.value) / 100 })}
                                                className="flex-1"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Softens edges around removed color</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">
                                            Spill Suppression: {((mediaFile.chromaKeySpillSuppress || 0.5) * 100).toFixed(0)}%
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={(mediaFile.chromaKeySpillSuppress || 0.5) * 100}
                                                onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeySpillSuppress: Number(e.target.value) / 100 })}
                                                className="flex-1"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Removes color spill on edges</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Loop (for images/gifs) */}
                    {mediaFile.type === 'image' && (
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-300">Loop Animation</label>
                            <input
                                type="checkbox"
                                checked={mediaFile.loop || false}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { loop: e.target.checked })}
                                className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </PropertySection>
        </div>
    );
}