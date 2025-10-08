'use client'
import { useState, useCallback } from "react";
import { useAppSelector } from "@/app/store";
import { toast } from "react-hot-toast";
import { WebCodecsRenderer } from "../webcodecs/WebCodecsRenderer";
import { RenderWorkerPool } from "../workers/RenderWorkerPool";
import { StreamingExporter } from "../streaming/StreamingExporter";
import ProfessionalRenderer from "./ProfessionalRenderer";
import RenderSettingsPanel from "./RenderSettingsPanel";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { RenderSettings } from "@/app/types/rendering";

interface EnhancedRenderProps {
    loadFunction: () => Promise<void>;
    loadFfmpeg: boolean;
    ffmpeg: FFmpeg;
    logMessages: string;
}

export default function EnhancedRender(props: EnhancedRenderProps) {
    const [renderMethod, setRenderMethod] = useState<'auto' | 'ffmpeg' | 'webcodecs'>('ffmpeg');
    const [isChecking, setIsChecking] = useState(false);
    const [webCodecsSupported, setWebCodecsSupported] = useState<boolean | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const { mediaFiles, textElements, exportSettings, resolution, duration } = useAppSelector(state => state.projectState);
    
    // Initialize render settings
    const [renderSettings, setRenderSettings] = useState<RenderSettings>({
        format: 'mp4',
        quality: 'high',
        resolution: exportSettings.resolution,
        fps: 30,
        alphaChannel: false,
        backgroundColor: '#000000'
    });
    
    // Check WebCodecs support
    const checkWebCodecsSupport = useCallback(async () => {
        setIsChecking(true);
        try {
            const renderer = new WebCodecsRenderer();
            const supported = await renderer.isSupported();
            setWebCodecsSupported(supported);
            
            if (supported) {
                toast.success('WebCodecs is supported! Using hardware acceleration.');
            } else {
                toast('WebCodecs not supported, falling back to FFmpeg');
            }
        } catch (error) {
            setWebCodecsSupported(false);
        } finally {
            setIsChecking(false);
        }
    }, []);
    
    // Auto-detect best rendering method
    const detectBestMethod = useCallback(async () => {
        if (webCodecsSupported === null) {
            await checkWebCodecsSupport();
        }
        
        // Choose based on project complexity and support
        const hasLongVideo = mediaFiles.some(f => 
            f.type === 'video' && (f.endTime - f.startTime) > 60
        );
        const hasComplexEffects = textElements.length > 20 || mediaFiles.length > 10;
        
        if (webCodecsSupported && !hasComplexEffects) {
            setRenderMethod('webcodecs');
            return 'webcodecs';
        } else {
            setRenderMethod('ffmpeg');
            return 'ffmpeg';
        }
    }, [webCodecsSupported, mediaFiles, textElements, checkWebCodecsSupport]);
    
    // Enhanced render with method selection
    const renderWithBestMethod = useCallback(async () => {
        const method = renderMethod === 'auto' 
            ? await detectBestMethod() 
            : renderMethod;
            
        if (method === 'webcodecs' && webCodecsSupported) {
            // Use WebCodecs rendering
            return renderWithWebCodecs();
        } else {
            // Fall back to FFmpeg
            // Component will use the existing FFmpeg render
            return null;
        }
    }, [renderMethod, detectBestMethod, webCodecsSupported]);
    
    const renderWithWebCodecs = async () => {
        try {
            toast('Starting hardware-accelerated export...');
            
            // Initialize worker pool
            const workerPool = new RenderWorkerPool();
            
            // Use streaming exporter
            const exporter = new StreamingExporter();
            
            // Use resolution and duration from hook above
            
            const stream = await exporter.exportWithStreaming(
                mediaFiles,
                textElements,
                resolution,
                duration,
                30, // fps
                (progress) => {
                    console.log(`Export progress: ${progress.current}/${progress.total} frames (${progress.fps} FPS)`);
                }
            );
            
            // Create download link for the stream
            const response = new Response(stream);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'video.mp4';
            a.click();
            
            toast.success('Export completed!');
            
            // Cleanup
            workerPool.terminate();
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('WebCodecs export failed:', error);
            toast.error('Hardware acceleration failed, please try FFmpeg export');
        }
    };
    
    return (
        <div className="flex flex-col gap-4">
            {/* Settings Toggle Button */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-all flex items-center justify-between"
            >
                <span>Export Settings</span>
                <span className="text-sm text-gray-400">
                    {renderSettings.format.toUpperCase()} • {renderSettings.quality} quality
                    {renderSettings.alphaChannel && ' • Transparent'}
                </span>
            </button>
            
            {/* Settings Panel */}
            {showSettings && (
                <RenderSettingsPanel
                    settings={renderSettings}
                    onSettingsChange={setRenderSettings}
                />
            )}
            
            {/* Professional Renderer */}
            <ProfessionalRenderer 
                {...props} 
                renderSettings={renderSettings}
            />
            
            {/* Legacy Options (hidden by default) */}
            <details className="text-sm text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300">Legacy Options</summary>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <label>Render Engine:</label>
                        <select
                            value={renderMethod}
                            onChange={(e) => setRenderMethod(e.target.value as any)}
                            className="bg-gray-800 text-white px-2 py-1 rounded"
                        >
                            <option value="ffmpeg">FFmpeg (Recommended)</option>
                            <option value="webcodecs" disabled={webCodecsSupported === false}>
                                WebCodecs {webCodecsSupported === false && '(Not Supported)'}
                            </option>
                        </select>
                    </div>
                    
                    {webCodecsSupported === null && (
                        <button
                            onClick={checkWebCodecsSupport}
                            disabled={isChecking}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            {isChecking ? 'Checking...' : 'Check WebCodecs Support'}
                        </button>
                    )}
                </div>
            </details>
        </div>
    );
}