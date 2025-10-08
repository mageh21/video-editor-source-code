"use client";

import React, { useState } from 'react';
import { MediaFile } from '@/app/types';
import { getAvailableTransitions } from '@/app/utils/transition-utils';
import { TransitionGallery } from './TransitionGallery';
import { Sparkles, Grid3X3, List } from 'lucide-react';

interface TransitionSectionProps {
    mediaFile: MediaFile;
    onUpdateMedia: (id: string, updates: Partial<MediaFile>) => void;
}

export const TransitionSection: React.FC<TransitionSectionProps> = ({ mediaFile, onUpdateMedia }) => {
    const [viewMode, setViewMode] = useState<'dropdown' | 'gallery'>('gallery');
    const transitions = getAvailableTransitions();
    
    return (
        <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Transitions
                </h4>
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('dropdown')}
                        className={`p-1.5 rounded ${
                            viewMode === 'dropdown'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                        } transition-colors`}
                        title="List View"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setViewMode('gallery')}
                        className={`p-1.5 rounded ${
                            viewMode === 'gallery'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-700 text-gray-400 hover:text-gray-300'
                        } transition-colors`}
                        title="Gallery View"
                    >
                        <Grid3X3 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'gallery' ? (
                <TransitionGallery mediaFile={mediaFile} onUpdateMedia={onUpdateMedia} />
            ) : (
                <>
                    {/* Entrance Transition */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Entrance Transition
                        </h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Type</label>
                        <select
                            value={mediaFile.entranceTransition?.type || 'none'}
                            onChange={(e) => {
                                const type = e.target.value;
                                if (type === 'none') {
                                    onUpdateMedia(mediaFile.id, { entranceTransition: undefined });
                                } else {
                                    onUpdateMedia(mediaFile.id, {
                                        entranceTransition: {
                                            type,
                                            duration: mediaFile.entranceTransition?.duration || 0.5,
                                            speed: mediaFile.entranceTransition?.speed || 1
                                        }
                                    });
                                }
                            }}
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {transitions.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {mediaFile.entranceTransition && mediaFile.entranceTransition.type !== 'none' && (
                        <>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={mediaFile.entranceTransition.duration}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        entranceTransition: {
                                            ...mediaFile.entranceTransition!,
                                            duration: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Speed</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={mediaFile.entranceTransition.speed || 1}
                                        onChange={(e) => onUpdateMedia(mediaFile.id, {
                                            entranceTransition: {
                                                ...mediaFile.entranceTransition!,
                                                speed: Number(e.target.value)
                                            }
                                        })}
                                        className="flex-1"
                                    />
                                    <span className="text-xs text-gray-300 w-12 text-right">
                                        {(mediaFile.entranceTransition.speed || 1).toFixed(1)}x
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Exit Transition */}
            <div className="pt-3 border-t border-gray-700">
                <h4 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Exit Transition
                </h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Type</label>
                        <select
                            value={mediaFile.exitTransition?.type || 'none'}
                            onChange={(e) => {
                                const type = e.target.value;
                                if (type === 'none') {
                                    onUpdateMedia(mediaFile.id, { exitTransition: undefined });
                                } else {
                                    onUpdateMedia(mediaFile.id, {
                                        exitTransition: {
                                            type,
                                            duration: mediaFile.exitTransition?.duration || 0.5,
                                            speed: mediaFile.exitTransition?.speed || 1
                                        }
                                    });
                                }
                            }}
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {transitions.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {mediaFile.exitTransition && mediaFile.exitTransition.type !== 'none' && (
                        <>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={mediaFile.exitTransition.duration}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        exitTransition: {
                                            ...mediaFile.exitTransition!,
                                            duration: Number(e.target.value)
                                        }
                                    })}
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Speed</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={mediaFile.exitTransition.speed || 1}
                                        onChange={(e) => onUpdateMedia(mediaFile.id, {
                                            exitTransition: {
                                                ...mediaFile.exitTransition!,
                                                speed: Number(e.target.value)
                                            }
                                        })}
                                        className="flex-1"
                                    />
                                    <span className="text-xs text-gray-300 w-12 text-right">
                                        {(mediaFile.exitTransition.speed || 1).toFixed(1)}x
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
                    {/* Legacy Fade In/Out - Keep for compatibility */}
                    <div className="pt-3 border-t border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-300 mb-3">Legacy Fade Effects</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Fade In (s)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    step="0.1"
                                    value={mediaFile.fadeIn || 0}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, { fadeIn: Number(e.target.value) })}
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Fade Out (s)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    step="0.1"
                                    value={mediaFile.fadeOut || 0}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, { fadeOut: Number(e.target.value) })}
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};