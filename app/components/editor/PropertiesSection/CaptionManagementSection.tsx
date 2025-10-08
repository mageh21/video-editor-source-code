'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { 
    setSelectedCaptionIds,
    setActiveElement,
    setShowCaptions,
    setActiveCaptionTrack,
    removeCaption
} from '@/app/store/slices/projectSlice';
import { 
    Subtitles,
    Eye,
    EyeOff,
    Edit3,
    Trash2,
    FileText,
    Languages
} from 'lucide-react';

const CaptionManagementSection: React.FC = () => {
    const dispatch = useAppDispatch();
    const { 
        captionTracks, 
        activeCaptionTrackId, 
        showCaptions,
        selectedCaptionIds
    } = useAppSelector(state => state.projectState);
    
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    
    if (!activeTrack) {
        return (
            <div className="p-4 text-center text-gray-500">
                <Subtitles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No caption track selected</p>
            </div>
        );
    }

    const handleCaptionSelect = (captionId: string) => {
        dispatch(setSelectedCaptionIds([captionId]));
        dispatch(setActiveElement('caption'));
    };

    const handleDeleteCaption = (captionId: string) => {
        dispatch(removeCaption({ trackId: activeTrack.id, captionId }));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white text-sm font-medium flex items-center gap-2">
                        <Subtitles className="w-4 h-4" />
                        Captions
                    </h2>
                    <button
                        onClick={() => dispatch(setShowCaptions(!showCaptions))}
                        className={`p-1.5 rounded transition-colors ${
                            showCaptions 
                                ? 'bg-blue-900/30 text-blue-400' 
                                : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        }`}
                        title={showCaptions ? 'Hide captions' : 'Show captions'}
                    >
                        {showCaptions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                </div>
                
                {/* Track info */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{activeTrack.name} • {activeTrack.captions.length} captions</span>
                    {captionTracks.length > 1 && (
                        <select
                            value={activeCaptionTrackId}
                            onChange={(e) => dispatch(setActiveCaptionTrack(e.target.value))}
                            className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
                        >
                            {captionTracks.map(track => (
                                <option key={track.id} value={track.id}>
                                    {track.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Caption list */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTrack.captions.length > 0 ? (
                    <div className="space-y-2">
                        {activeTrack.captions.map((caption, index) => {
                            const startSeconds = (caption as any).start ?? caption.startMs / 1000;
                            const endSeconds = (caption as any).end ?? caption.endMs / 1000;
                            const isSelected = selectedCaptionIds.includes(caption.id);
                            
                            return (
                                <div
                                    key={caption.id}
                                    className={`group relative bg-gray-800 rounded-lg p-3 transition-all border ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-900/30' 
                                            : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-gray-400">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {Math.floor(startSeconds / 60)}:{(startSeconds % 60).toFixed(1).padStart(4, '0')} - {Math.floor(endSeconds / 60)}:{(endSeconds % 60).toFixed(1).padStart(4, '0')}
                                                </span>
                                            </div>
                                            <p 
                                                className="text-sm text-gray-200 leading-snug cursor-pointer hover:text-white"
                                                onClick={() => handleCaptionSelect(caption.id)}
                                            >
                                                {caption.text}
                                            </p>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleCaptionSelect(caption.id)}
                                                className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                                                title="Edit caption"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCaption(caption.id)}
                                                className="p-1 hover:bg-red-600 rounded transition-colors text-gray-400 hover:text-white"
                                                title="Delete caption"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400 text-sm">
                            No captions yet. Create them in the Caption Style panel!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaptionManagementSection;