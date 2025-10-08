'use client'
import { useState } from 'react';
import { useAppSelector } from '@/app/store';
import { RenderSettings, FORMAT_CONFIGS, CHROMAKEY_PRESETS } from '@/app/types/rendering';
import { HelpCircle } from 'lucide-react';

interface RenderSettingsPanelProps {
    settings: RenderSettings;
    onSettingsChange: (settings: RenderSettings) => void;
}

export default function RenderSettingsPanel({ settings, onSettingsChange }: RenderSettingsPanelProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { exportSettings } = useAppSelector(state => state.projectState);

    const updateSetting = <K extends keyof RenderSettings>(key: K, value: RenderSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const formatSupportsAlpha = (format: RenderSettings['format']) => {
        return FORMAT_CONFIGS[format].supportAlpha;
    };

    return (
        <div className="space-y-4 p-4 bg-darkSurfacePrimary rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Export Settings</h3>
            
            {/* Format Selection */}
            <div>
                <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                    Format
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                </label>
                <select
                    value={settings.format}
                    onChange={(e) => updateSetting('format', e.target.value as RenderSettings['format'])}
                    className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <optgroup label="Standard Formats">
                        <option value="mp4">MP4 (H.264)</option>
                    </optgroup>
                    <optgroup label="Transparent Video">
                        <option value="webm-alpha">WebM with Alpha</option>
                        <option value="mov-alpha">MOV with Alpha (QuickTime)</option>
                        <option value="prores">ProRes 4444 (Professional)</option>
                    </optgroup>
                    <optgroup label="Animated Images">
                        <option value="gif">GIF</option>
                        <option value="apng">APNG (Animated PNG)</option>
                        <option value="webp">WebP Animation</option>
                    </optgroup>
                </select>
            </div>

            {/* Quality Settings */}
            <div>
                <label className="text-sm font-medium text-white mb-2 block">Quality</label>
                <select
                    value={settings.quality}
                    onChange={(e) => updateSetting('quality', e.target.value as RenderSettings['quality'])}
                    className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="low">Low (Fast)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                    {settings.format !== 'gif' && <option value="lossless">Lossless</option>}
                </select>
            </div>

            {/* Resolution */}
            <div>
                <label className="text-sm font-medium text-white mb-2 block">Resolution</label>
                <select
                    value={settings.resolution}
                    onChange={(e) => updateSetting('resolution', e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="480p">480p</option>
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K (Ultra HD)</option>
                </select>
            </div>

            {/* FPS (not for images) */}
            {!['gif', 'apng', 'webp'].includes(settings.format) && (
                <div>
                    <label className="text-sm font-medium text-white mb-2 block">Frame Rate</label>
                    <select
                        value={settings.fps}
                        onChange={(e) => updateSetting('fps', parseInt(e.target.value))}
                        className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="24">24 FPS</option>
                        <option value="30">30 FPS</option>
                        <option value="60">60 FPS</option>
                    </select>
                </div>
            )}

            {/* Alpha Channel Option */}
            {formatSupportsAlpha(settings.format) && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="alphaChannel"
                        checked={settings.alphaChannel || false}
                        onChange={(e) => updateSetting('alphaChannel', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="alphaChannel" className="text-sm font-medium text-white">
                        Preserve Transparency
                    </label>
                </div>
            )}

            {/* Background Color (when no alpha) */}
            {!settings.alphaChannel && (
                <div>
                    <label className="text-sm font-medium text-white mb-2 block">Background Color</label>
                    <input
                        type="color"
                        value={settings.backgroundColor || '#000000'}
                        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                        className="w-full h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                    />
                </div>
            )}

            {/* Advanced Settings Toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-400 hover:text-blue-300"
            >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                    {/* Chromakey Settings */}
                    <div>
                        <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                checked={settings.chromaKey?.enabled || false}
                                onChange={(e) => updateSetting('chromaKey', {
                                    ...settings.chromaKey,
                                    enabled: e.target.checked,
                                    color: settings.chromaKey?.color || CHROMAKEY_PRESETS.greenScreen.color,
                                    similarity: settings.chromaKey?.similarity || CHROMAKEY_PRESETS.greenScreen.similarity,
                                    blend: settings.chromaKey?.blend || CHROMAKEY_PRESETS.greenScreen.blend
                                })}
                                className="w-4 h-4"
                            />
                            Enable Chromakey (Green Screen Removal)
                        </label>
                        
                        {settings.chromaKey?.enabled && (
                            <div className="ml-6 space-y-2">
                                <select
                                    value={settings.chromaKey.color}
                                    onChange={(e) => {
                                        const preset = Object.values(CHROMAKEY_PRESETS).find(p => p.color === e.target.value);
                                        updateSetting('chromaKey', {
                                            ...settings.chromaKey!,
                                            ...preset || { color: e.target.value }
                                        });
                                    }}
                                    className="w-full p-1 bg-gray-800 border border-gray-600 text-white rounded text-sm"
                                >
                                    <option value={CHROMAKEY_PRESETS.greenScreen.color}>Green Screen</option>
                                    <option value={CHROMAKEY_PRESETS.blueScreen.color}>Blue Screen</option>
                                    <option value={CHROMAKEY_PRESETS.whiteScreen.color}>White Screen</option>
                                    <option value={CHROMAKEY_PRESETS.blackScreen.color}>Black Screen</option>
                                </select>
                                
                                <div>
                                    <label className="text-xs text-gray-400">Similarity: {settings.chromaKey.similarity}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={settings.chromaKey.similarity}
                                        onChange={(e) => updateSetting('chromaKey', {
                                            ...settings.chromaKey!,
                                            similarity: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hardware Acceleration */}
                    <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                            Hardware Acceleration
                        </label>
                        <select
                            value={settings.hwAccel || 'none'}
                            onChange={(e) => updateSetting('hwAccel', e.target.value as RenderSettings['hwAccel'])}
                            className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">None</option>
                            <option value="auto">Auto Detect</option>
                            <option value="cuda">NVIDIA CUDA</option>
                            <option value="videotoolbox">Apple VideoToolbox</option>
                            <option value="qsv">Intel Quick Sync</option>
                        </select>
                    </div>

                    {/* Custom Bitrate */}
                    {!['gif', 'apng', 'webp'].includes(settings.format) && (
                        <div>
                            <label className="text-sm font-medium text-white mb-2 block">
                                Custom Bitrate (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., 5M, 10M"
                                value={settings.bitrate || ''}
                                onChange={(e) => updateSetting('bitrate', e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}