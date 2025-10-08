"use client";

import { useAppSelector } from '../../../store';
import { setActiveElement, setMediaFiles, setTextElements } from '../../../store/slices/projectSlice';
import { MediaFile } from '../../../types';
import { useAppDispatch } from '../../../store';

export default function MediaProperties() {
    const { mediaFiles, activeElementIndex, activeElement } = useAppSelector((state) => state.projectState);
    
    // Make sure we're looking at a media element and get the correct file
    const mediaFile = activeElement === 'media' && activeElementIndex >= 0 ? mediaFiles[activeElementIndex] : null;
    const dispatch = useAppDispatch();
    
    // Debug logging to see what's happening with selection
    // console.log('MediaProperties - activeElement:', activeElement, 'activeElementIndex:', activeElementIndex);
    // console.log('MediaProperties - mediaFile:', mediaFile ? { id: mediaFile.id, volume: mediaFile.volume } : 'null');
    const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
        console.log('MediaProperties - Updating media:', id, 'with updates:', updates);
        dispatch(setMediaFiles(mediaFiles.map(media =>
            media.id === id ? { ...media, ...updates } : media
        )));
    };

    if (!mediaFile) return null;

    return (
        <div className="space-y-6">
            {/* Timing Position */}
            <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Timing Position</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Start (s)</label>
                        <input
                            type="number"
                            readOnly={true}
                            value={mediaFile.positionStart}
                            min={0}
                            onChange={(e) => onUpdateMedia(mediaFile.id, {
                                positionStart: Number(e.target.value),
                                positionEnd: Number(e.target.value) + (mediaFile.positionEnd - mediaFile.positionStart)
                            })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">End (s)</label>
                        <input
                            type="number"
                            readOnly={true}
                            value={mediaFile.positionEnd}
                            min={mediaFile.positionStart}
                            onChange={(e) => onUpdateMedia(mediaFile.id, {
                                positionEnd: Number(e.target.value)
                            })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
            {/* Visual Properties */}
            <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Visual Properties</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">X Position</label>
                        <input
                            type="number"
                            step="10"
                            value={mediaFile.x || 0}
                            onChange={(e) => onUpdateMedia(mediaFile.id, { x: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Y Position</label>
                        <input
                            type="number"
                            step="10"
                            value={mediaFile.y || 0}
                            onChange={(e) => onUpdateMedia(mediaFile.id, { y: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Width</label>
                        <input
                            type="number"
                            step="10"
                            value={mediaFile.width || 100}
                            onChange={(e) => onUpdateMedia(mediaFile.id, { width: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Height</label>
                        <input
                            type="number"
                            step="10"
                            value={mediaFile.height || 100}
                            onChange={(e) => onUpdateMedia(mediaFile.id, { height: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Opacity</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mediaFile.opacity}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { opacity: Number(e.target.value) })}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-300 w-8">{mediaFile.opacity}%</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Chromakey Properties */}
            {mediaFile.type === "video" && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-white text-sm">Chromakey (Green Screen)</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-300">Enable Chromakey</label>
                            <button
                                onClick={() => onUpdateMedia(mediaFile.id, { 
                                    chromaKeyEnabled: !mediaFile.chromaKeyEnabled,
                                    chromaKeyColor: mediaFile.chromaKeyColor || '#00FF00',
                                    chromaKeySimilarity: mediaFile.chromaKeySimilarity || 0.4,
                                    chromaKeySmooth: mediaFile.chromaKeySmooth || 0.1
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    mediaFile.chromaKeyEnabled ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        mediaFile.chromaKeyEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        
                        {mediaFile.chromaKeyEnabled && (
                            <>
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">Key Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={mediaFile.chromaKeyColor || '#00FF00'}
                                            onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeyColor: e.target.value })}
                                            className="h-8 w-16 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={mediaFile.chromaKeyColor || '#00FF00'}
                                            onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeyColor: e.target.value })}
                                            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 text-white text-xs rounded-md"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">
                                        Similarity: {((mediaFile.chromaKeySimilarity || 0.4) * 100).toFixed(0)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={(mediaFile.chromaKeySimilarity || 0.4) * 100}
                                        onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeySimilarity: Number(e.target.value) / 100 })}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Higher = more color removed</p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">
                                        Edge Smoothing: {((mediaFile.chromaKeySmooth || 0.1) * 100).toFixed(0)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={(mediaFile.chromaKeySmooth || 0.1) * 100}
                                        onChange={(e) => onUpdateMedia(mediaFile.id, { chromaKeySmooth: Number(e.target.value) / 100 })}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Softens edges around removed color</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Audio Properties */}
            {(mediaFile.type === "video" || mediaFile.type === "audio") && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-white text-sm">Audio Properties</h4>
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">Volume</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={mediaFile.volume}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { volume: Number(e.target.value) })}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-300 w-8">{mediaFile.volume}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}