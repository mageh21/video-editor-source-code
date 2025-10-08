"use client";

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setMediaFiles } from '@/app/store/slices/projectSlice';

export const ChromaKeyDemo: React.FC = () => {
    const dispatch = useAppDispatch();
    const mediaFiles = useAppSelector(state => state.projectState.mediaFiles);
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
    
    const chromaKeyEnabledMedia = mediaFiles.filter(m => m.chromaKeyEnabled);
    
    const handlePresetApply = (mediaId: string, preset: any) => {
        const updated = mediaFiles.map(m => m.fileId === mediaId ? { ...m, ...preset } : m);
        dispatch(setMediaFiles(updated));
    };
    
    const presets = [
        {
            name: "High Quality Green Screen",
            chromaKeySimilarity: 0.35,
            chromaKeySmooth: 0.15,
            chromaKeySpillSuppress: 0.7,
            chromaKeyColor: '#00FF00'
        },
        {
            name: "Studio Blue Screen",
            chromaKeySimilarity: 0.4,
            chromaKeySmooth: 0.2,
            chromaKeySpillSuppress: 0.6,
            chromaKeyColor: '#0000FF'
        },
        {
            name: "Aggressive Removal",
            chromaKeySimilarity: 0.5,
            chromaKeySmooth: 0.25,
            chromaKeySpillSuppress: 0.8,
            chromaKeyColor: '#00FF00'
        },
        {
            name: "Soft Edge Preservation",
            chromaKeySimilarity: 0.25,
            chromaKeySmooth: 0.3,
            chromaKeySpillSuppress: 0.5,
            chromaKeyColor: '#00FF00'
        }
    ];
    
    if (chromaKeyEnabledMedia.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                No media with chroma key enabled. Enable chroma key in media properties to test.
            </div>
        );
    }
    
    return (
        <div className="bg-gray-800 rounded-lg p-4 m-4">
            <h3 className="text-lg font-semibold text-white mb-4">
                Chroma Key Quality Presets
            </h3>
            
            <div className="space-y-3">
                {chromaKeyEnabledMedia.map(media => (
                    <div key={media.id} className="bg-gray-700 rounded p-3">
                        <p className="text-sm text-gray-300 mb-2">{media.fileName}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => handlePresetApply(media.id, preset)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                            <p>Current Settings:</p>
                            <p>Similarity: {((media.chromaKeySimilarity || 0.4) * 100).toFixed(0)}%</p>
                            <p>Smoothness: {((media.chromaKeySmooth || 0.1) * 100).toFixed(0)}%</p>
                            <p>Spill Suppress: {((media.chromaKeySpillSuppress || 0.5) * 100).toFixed(0)}%</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-300">
                <p className="font-semibold mb-1">Tips for 95-100% accuracy:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Use "High Quality Green Screen" for professional footage</li>
                    <li>Increase Spill Suppression to remove green edges</li>
                    <li>Fine-tune Similarity for your specific lighting</li>
                    <li>Use Smoothness to soften harsh edges</li>
                </ul>
            </div>
        </div>
    );
};