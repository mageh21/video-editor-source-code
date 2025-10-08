'use client';

import React, { useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { 
    addCaptionTrack, 
    addCaption,
    updateCaptionTrack,
    removeCaptionTrack,
    setActiveCaptionTrack,
    setShowCaptions
} from '@/app/store/slices/projectSlice';
import { CaptionTrack, CaptionStyle } from '@/app/types';
import { parseTranscript, parseSRT, parseVTT, exportToSRT } from '@/app/utils/captionParsers';
import { 
    FileText, 
    Upload, 
    Mic, 
    X, 
    Plus, 
    Download, 
    Languages,
    Type,
    Palette,
    AlignCenter,
    AlignLeft,
    AlignJustify,
    Eye,
    EyeOff,
    Settings,
    ChevronDown,
    Sparkles,
    Save
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

export const TranscriptEditor: React.FC = () => {
    const dispatch = useAppDispatch();
    const { duration, captionTracks, activeCaptionTrackId, showCaptions } = useAppSelector(state => state.projectState);
    const [isCreating, setIsCreating] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [trackName, setTrackName] = useState('');
    const [language, setLanguage] = useState('en');
    const [showStyleSettings, setShowStyleSettings] = useState(false);
    const [showImportOptions, setShowImportOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDeleteTrack = (trackId: string) => {
        if (confirm('Are you sure you want to delete this caption track?')) {
            dispatch(removeCaptionTrack(trackId));
            toast.success('Caption track deleted');
        }
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
        toast.success(`Generated ${captions.length} captions`);
    };

    const handleUpdateStyle = (updates: Partial<CaptionStyle>) => {
        if (!activeTrack) return;

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
        if (!activeTrack) return;
        
        handleUpdateStyle(preset.style);
        toast.success(`Applied ${preset.name} style`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Captions
                    </h3>
                    <div className="flex items-center gap-2">
                        {activeTrack && (
                            <button
                                onClick={handleExportTrack}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Export captions"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => dispatch(setShowCaptions(!showCaptions))}
                            className={`p-2 rounded-lg transition-colors ${
                                showCaptions 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            title={showCaptions ? 'Hide captions' : 'Show captions'}
                        >
                            {showCaptions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {/* Caption Tracks */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Caption Tracks
                        </h4>
                        
                        <div className="space-y-2">
                            {captionTracks.map(track => (
                                <div
                                    key={track.id}
                                    className={`
                                        p-3 rounded-lg border cursor-pointer transition-all
                                        ${track.id === activeCaptionTrackId 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }
                                    `}
                                    onClick={() => dispatch(setActiveCaptionTrack(track.id))}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h5 className="font-medium flex items-center gap-2">
                                                {track.name}
                                                {track.id === activeCaptionTrackId && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                            </h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {track.language} • {track.captions.length} captions
                                                {track.captions.length > 0 && (
                                                    <span className="ml-2">
                                                        • {Math.round(track.captions.reduce((acc, c) =>
                                                            acc + (((c as any).end ?? c.endMs / 1000) - ((c as any).start ?? c.startMs / 1000)), 0
                                                        ))}s total
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTrack(track.id);
                                            }}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Create new track */}
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full mt-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">New Caption Track</span>
                            </button>
                        ) : (
                            <div className="mt-3 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={trackName}
                                        onChange={(e) => setTrackName(e.target.value)}
                                        placeholder="Track name (e.g., English, Spanish)"
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                        autoFocus
                                    />
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
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
                                        <option value="ar">Arabic</option>
                                        <option value="hi">Hindi</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setIsCreating(false);
                                                setTrackName('');
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateTrack}
                                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Create
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Import options */}
                    {activeTrack && (
                        <div>
                            <button
                                onClick={() => setShowImportOptions(!showImportOptions)}
                                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                                <span className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Add Captions
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showImportOptions ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showImportOptions && (
                                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    {/* Import from file */}
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".srt,.vtt"
                                            onChange={handleImportFile}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full p-3 border rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 bg-white dark:bg-gray-800"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Import SRT/VTT File</span>
                                        </button>
                                    </div>

                                    {/* Generate from AI */}
                                    <button
                                        onClick={() => {/* TODO: Implement AI generation */}}
                                        className="w-full p-3 border rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 bg-white dark:bg-gray-800 opacity-50 cursor-not-allowed"
                                        disabled
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Generate with AI (Coming Soon)</span>
                                    </button>

                                    {/* Manual transcript */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                                        <label className="text-sm font-medium block mb-2">Manual Transcript</label>
                                        <textarea
                                            value={transcript}
                                            onChange={(e) => setTranscript(e.target.value)}
                                            placeholder="Paste your transcript here. Each line will become a caption."
                                            className="w-full px-3 py-2 border rounded-lg resize-none dark:bg-gray-700 dark:border-gray-600 text-sm"
                                            rows={4}
                                        />
                                        <button
                                            onClick={handleGenerateFromTranscript}
                                            disabled={!transcript.trim()}
                                            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            Generate Captions
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Style settings */}
                    {activeTrack && (
                        <div>
                            <button
                                onClick={() => setShowStyleSettings(!showStyleSettings)}
                                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                                <span className="flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Caption Style
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showStyleSettings ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showStyleSettings && (
                                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    {/* Style presets */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Quick Presets</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PRESET_STYLES.map(preset => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => handleApplyPreset(preset)}
                                                    className="p-2 text-sm border rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="border-gray-200 dark:border-gray-700" />

                                    {/* Position */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Position</label>
                                        <div className="flex gap-2">
                                            {['top', 'center', 'bottom'].map(pos => (
                                                <button
                                                    key={pos}
                                                    onClick={() => handleUpdateStyle({ position: pos as any })}
                                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                                                        activeTrack.style.position === pos
                                                            ? 'bg-blue-500 text-white'
                                                            : 'border hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {pos}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Font */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Font Family</label>
                                        <select
                                            value={activeTrack.style.fontFamily}
                                            onChange={(e) => handleUpdateStyle({ fontFamily: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        >
                                            {FONT_OPTIONS.map(font => (
                                                <option key={font} value={font}>{font}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Font Size */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
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
                                    </div>

                                    {/* Colors */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Text Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={activeTrack.style.color}
                                                    onChange={(e) => handleUpdateStyle({ color: e.target.value })}
                                                    className="w-12 h-10 rounded cursor-pointer border"
                                                />
                                                <input
                                                    type="text"
                                                    value={activeTrack.style.color}
                                                    onChange={(e) => handleUpdateStyle({ color: e.target.value })}
                                                    className="flex-1 px-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Background</label>
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
                                                    className="w-12 h-10 rounded cursor-pointer border"
                                                />
                                                <button
                                                    onClick={() => handleUpdateStyle({ backgroundColor: 'transparent' })}
                                                    className="flex-1 px-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    {activeTrack.style.backgroundColor === 'transparent' ? 'None' : 'Clear'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outline */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
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
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Outline Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={activeTrack.style.outlineColor}
                                                    onChange={(e) => handleUpdateStyle({ outlineColor: e.target.value })}
                                                    className="w-12 h-10 rounded cursor-pointer border"
                                                />
                                                <input
                                                    type="text"
                                                    value={activeTrack.style.outlineColor}
                                                    onChange={(e) => handleUpdateStyle({ outlineColor: e.target.value })}
                                                    className="flex-1 px-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Alignment */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Text Alignment</label>
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
                                                            ? 'bg-blue-500 text-white'
                                                            : 'border hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4 mx-auto" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};