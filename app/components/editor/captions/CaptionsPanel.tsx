'use client';

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { 
    setShowCaptions, 
    removeCaptionTrack,
    setActiveCaptionTrack,
    addCaption,
    addCaptionTrack,
    setActiveElement,
    setSelectedCaptionIds
} from '@/app/store/slices/projectSlice';
import { CaptionEditor } from './CaptionEditor';
import { CaptionTrack, CaptionStyle } from '@/app/types';
import { parseTranscript, parseSRT, parseVTT, exportToSRT } from '@/app/utils/captionParsers';
import CaptionStyleSection from '../PropertiesSection/CaptionStyleSection';
import { 
    Subtitles,
    Plus,
    Download,
    Eye,
    EyeOff,
    FileText,
    Upload,
    Languages,
    ChevronDown,
    X,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const defaultCaptionStyle: CaptionStyle = {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    outlineColor: '#000000',
    outlineWidth: 2,
    position: 'bottom',
    offsetY: 50,
    opacity: 1,
    maxWidth: 80,
    textAlign: 'center'
};

export const CaptionsPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { 
        captionTracks, 
        activeCaptionTrackId, 
        showCaptions,
        selectedCaptionIds,
        duration,
        activeElement
    } = useAppSelector(state => state.projectState);
    
    const [isCreating, setIsCreating] = useState(false);
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [trackName, setTrackName] = useState('');
    const [language, setLanguage] = useState('en');
    const [transcript, setTranscript] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    
    const handleCreateTrack = () => {
        if (!trackName.trim()) {
            toast.error('Please enter a track name');
            return;
        }

        const newTrack: CaptionTrack = {
            id: crypto.randomUUID(),
            name: trackName,
            language,
            captions: [],
            isActive: true,
            style: defaultCaptionStyle
        };

        dispatch(addCaptionTrack(newTrack));
        setTrackName('');
        setIsCreating(false);
        toast.success('Caption track created');
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            let captions = [];

            if (file.name.endsWith('.srt')) {
                captions = parseSRT(content);
            } else if (file.name.endsWith('.vtt')) {
                captions = parseVTT(content);
            } else {
                toast.error('Unsupported file format. Please use .srt or .vtt');
                return;
            }

            if (captions.length === 0) {
                toast.error('No captions found in file');
                return;
            }

            // Create new track or add to active track
            if (!activeTrack) {
                const newTrack: CaptionTrack = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    language: 'en',
                    captions,
                    isActive: true,
                    style: defaultCaptionStyle
                };
                dispatch(addCaptionTrack(newTrack));
            } else {
                // Add captions to active track
                captions.forEach(caption => {
                    dispatch(addCaption({
                        trackId: activeTrack.id,
                        caption
                    }));
                });
            }

            toast.success(`Imported ${captions.length} captions`);
        } catch (error) {
            toast.error('Failed to import file');
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportTrack = () => {
        if (!activeTrack || activeTrack.captions.length === 0) {
            toast.error('No captions to export');
            return;
        }

        try {
            const srtContent = exportToSRT(activeTrack.captions);
            const blob = new Blob([srtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeTrack.name}.srt`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Captions exported');
        } catch (error) {
            toast.error('Failed to export captions');
        }
    };

    const handleGenerateFromTranscript = () => {
        if (!transcript.trim()) {
            toast.error('Please enter transcript text');
            return;
        }

        if (!activeTrack) {
            toast.error('Please create a caption track first');
            return;
        }

        const captions = parseTranscript(transcript, duration);
        
        captions.forEach(caption => {
            dispatch(addCaption({
                trackId: activeTrack.id,
                caption
            }));
        });

        setTranscript('');
        setShowImportOptions(false);
        toast.success(`Generated ${captions.length} captions`);
    };
    
    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                    <Subtitles className="w-4 h-4" />
                    Caption Style
                </h2>
                
                {/* Track management buttons */}
                <div className="flex gap-2 mb-4">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Track
                        </button>
                    ) : (
                        <div className="flex-1 bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <input
                                type="text"
                                value={trackName}
                                onChange={(e) => setTrackName(e.target.value)}
                                placeholder="Track name (e.g., English)"
                                className="w-full px-2 py-1 text-sm border rounded bg-gray-700 border-gray-600 mb-2 text-white"
                                autoFocus
                            />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded bg-gray-700 border-gray-600 mb-2 text-white"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="ru">Russian</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                                <option value="zh">Chinese</option>
                            </select>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setTrackName('');
                                    }}
                                    className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-700 border-gray-600 text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTrack}
                                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Import options */}
                {activeTrack && (
                    <div>
                        <button
                            onClick={() => setShowImportOptions(!showImportOptions)}
                            className="w-full flex items-center justify-between text-xs font-medium text-gray-300 hover:text-white mb-2"
                        >
                            <span className="flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                Add Captions
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showImportOptions ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showImportOptions && (
                            <div className="space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".srt,.vtt"
                                    onChange={handleImportFile}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full p-2 text-xs border border-gray-600 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-gray-300 hover:text-white"
                                >
                                    <FileText className="w-3 h-3" />
                                    Import SRT/VTT
                                </button>
                                
                                <div className="relative">
                                    <textarea
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        placeholder="Paste transcript here..."
                                        className="w-full p-2 text-xs border border-gray-600 rounded resize-none bg-gray-700 text-white"
                                        rows={2}
                                    />
                                    {transcript && (
                                        <button
                                            onClick={handleGenerateFromTranscript}
                                            className="absolute bottom-1 right-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Generate
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content - Caption Style */}
            <div className="flex-1 overflow-y-auto">
                {activeTrack ? (
                    <CaptionStyleSection />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <div className="text-center max-w-sm">
                            <Subtitles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2 text-white">
                                Create a Caption Track
                            </h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Start by creating a caption track to customize caption styles
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};