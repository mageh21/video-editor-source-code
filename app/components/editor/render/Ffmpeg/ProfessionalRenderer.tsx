'use client'
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useRef, useState } from "react";
import { getFile, useAppSelector } from "@/app/store";
import { Heart } from "lucide-react";
import Image from "next/image";
import { extractConfigs } from "@/app/utils/extractConfigs";
import { mimeToExt } from "@/app/types";
import { toast } from "react-hot-toast";
import FfmpegProgressBar from "./ProgressBar";
import { loadFilesParallel, cleanupFFmpegFiles } from "../utils/fileLoader";
import { loadFontsWithCache } from "../utils/fontCache";
import { performanceMonitor } from "@/app/utils/performanceMonitor";
import { AdvancedFilterBuilder } from "./AdvancedFilterBuilder";
import { RenderSettings, FORMAT_CONFIGS, QUALITY_PRESETS } from "@/app/types/rendering";
import { WebMCompatibilityHandler } from "./WebMCompatibilityHandler";

interface ProfessionalRendererProps {
    loadFunction: () => Promise<void>;
    loadFfmpeg: boolean;
    ffmpeg: FFmpeg;
    logMessages: string;
    renderSettings: RenderSettings;
}

export default function ProfessionalRenderer({ 
    loadFunction, 
    loadFfmpeg, 
    ffmpeg, 
    logMessages,
    renderSettings 
}: ProfessionalRendererProps) {
    const { mediaFiles, projectName, duration, textElements, resolution, showCaptions, activeCaptionTrackId, captionTracks } = useAppSelector(state => state.projectState);
    const totalDuration = duration;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);

    useEffect(() => {
        if (loaded && videoRef.current && previewUrl) {
            videoRef.current.src = previewUrl;
        }
    }, [loaded, previewUrl]);

    const handleCloseModal = async () => {
        setShowModal(false);
        setIsRendering(false);
        setRenderProgress(0);
        try {
            ffmpeg.terminate();
            await loadFunction();
        } catch (e) {
            console.error("Failed to reset FFmpeg:", e);
        }
    };

    const render = async () => {
        if (mediaFiles.length === 0 && textElements.length === 0) {
            toast.error('No media files to render');
            return;
        }
        setShowModal(true);
        setIsRendering(true);
        setRenderProgress(0);

        const renderFunction = async () => {
            const formatConfig = FORMAT_CONFIGS[renderSettings.format];
            const qualityPreset = QUALITY_PRESETS[renderSettings.quality];
            
            performanceMonitor.start('total-render', { 
                mediaFiles: mediaFiles.length, 
                textElements: textElements.length,
                duration: totalDuration,
                format: renderSettings.format
            });

            let fileMap: Map<string, string> | undefined;
            let tempFiles: string[] = [];
            try {
                let inputs = [];
                
                // Sort media by zIndex first
                const sortedMediaFiles = [...mediaFiles].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
                
                // Auto-enable alpha channel if transparent input is detected
                const hasTransparentInput = sortedMediaFiles.some(media => {
                    const mimeType = media.mimeType || '';
                    return mimeType.includes('webm') || mimeType.includes('mov') || mimeType.includes('apng');
                });
                
                if (hasTransparentInput && renderSettings.format === 'webm-alpha') {
                    renderSettings.alphaChannel = true;
                }
                
                // Validate WebM export if applicable
                if (renderSettings.format === 'webm-alpha') {
                    const validation = WebMCompatibilityHandler.validateWebMExport(mediaFiles);
                    if (!validation.valid) {
                        throw new Error('No valid media files for WebM export');
                    }
                    if (validation.warnings.length > 0) {
                        console.warn('WebM export warnings:', validation.warnings);
                    }
                }
                
                // Initialize advanced filter builder
                const filterBuilder = new AdvancedFilterBuilder(
                    resolution,
                    totalDuration,
                    renderSettings
                );

                // Media files already sorted above

                // Pre-load all files in parallel
                performanceMonitor.start('file-loading');
                const fileIds = sortedMediaFiles.map(file => file.fileId);
                fileMap = await loadFilesParallel(fileIds, ffmpeg, (loaded, total) => {
                    setRenderProgress((loaded / total) * 20); // 20% for file loading
                });
                performanceMonitor.end('file-loading');

                // Process media files
                for (let i = 0; i < sortedMediaFiles.length; i++) {
                    const media = sortedMediaFiles[i];
                    const inputFilename = fileMap.get(media.fileId)!;
                    
                    // Add input based on type
                    const mimeType = media.mimeType || '';
                    
                    if (media.type === 'image' && !mimeType.includes('gif')) {
                        const duration = media.positionEnd - media.positionStart;
                        inputs.push('-loop', '1', '-t', duration.toFixed(3), '-i', inputFilename);
                    } else if (mimeType.includes('gif')) {
                        // Special handling for GIFs
                        inputs.push('-ignore_loop', '0', '-i', inputFilename);
                    } else {
                        inputs.push('-i', inputFilename);
                    }

                    // Add to filter builder
                    if (mimeType.includes('gif') || mimeType.includes('apng') || mimeType.includes('webp')) {
                        filterBuilder.addAnimatedAsset(media, i);
                    } else if (media.type === 'video' || media.type === 'image') {
                        filterBuilder.addVisualMedia(media, i);
                    }

                    // Add audio processing
                    if (media.type === 'audio' || media.type === 'video') {
                        filterBuilder.addAudioMedia(media, i);
                    }
                }

                // Apply text overlays
                let outputVideoLabel = 'outv';
                if (textElements.length > 0) {
                    performanceMonitor.start('font-loading');
                    const usedFonts = new Set(textElements.map(t => t.font || 'Arial'));
                    
                    // Add caption fonts if captions are enabled
                    if (showCaptions && activeCaptionTrackId) {
                        const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
                        if (activeTrack) {
                            usedFonts.add(activeTrack.style.fontFamily);
                        }
                    }
                    
                    console.log('Loading fonts for FFmpeg:', Array.from(usedFonts));

                    try {
                        await loadFontsWithCache(Array.from(usedFonts) as string[], ffmpeg);
                        console.log('Fonts loaded successfully');
                        
                        // List all files in FFmpeg to verify fonts are loaded
                        try {
                            const files = await ffmpeg.listDir('/');
                            console.log('FFmpeg files:', files);
                        } catch (e) {
                            console.log('Could not list FFmpeg files');
                        }
                    } catch (error) {
                        console.error('Failed to load fonts:', error);
                        toast.error('Some fonts could not be loaded. Using fallback fonts.');
                    }
                    
                    performanceMonitor.end('font-loading');
                    outputVideoLabel = filterBuilder.addTextElements(textElements, usedFonts as any);
                }
                
                // Apply captions if enabled
                if (showCaptions && activeCaptionTrackId && captionTracks.length > 0) {
                    // Load caption fonts if not already loaded
                    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
                    if (activeTrack && activeTrack.captions.length > 0) {
                        const captionFonts = new Set([activeTrack.style.fontFamily]);
                        
                        // Load font if not already loaded with text elements
                        if (textElements.length === 0) {
                            performanceMonitor.start('caption-font-loading');
                            try {
                                await loadFontsWithCache(Array.from(captionFonts), ffmpeg);
                                console.log('Caption fonts loaded successfully');
                            } catch (error) {
                                console.error('Failed to load caption fonts:', error);
                                toast.error('Some caption fonts could not be loaded. Using fallback fonts.');
                            }
                            performanceMonitor.end('caption-font-loading');
                        }
                        
                        outputVideoLabel = filterBuilder.addCaptions(captionTracks, activeCaptionTrackId, showCaptions, captionFonts);
                    }
                }

                // Build audio mix
                filterBuilder.buildAudioMix();

                // Get optimized filter complex
                let complexFilter = filterBuilder.getFilterComplex();
                
                // Pre-process for WebM if needed
                if (renderSettings.format === 'webm-alpha') {
                    const { processedInputs, tempFiles: webmTempFiles } = await WebMCompatibilityHandler.preprocessForWebM(
                        ffmpeg,
                        inputs,
                        sortedMediaFiles
                    );
                    inputs = processedInputs;
                    tempFiles.push(...webmTempFiles);
                    
                    // Adjust filter complex for WebM safety
                    complexFilter = WebMCompatibilityHandler.buildSafeFilterComplex(
                        complexFilter,
                        renderSettings.alphaChannel || false
                    );
                }
                
                // Build FFmpeg arguments
                const ffmpegArgs = [
                    ...inputs,
                    '-filter_complex', complexFilter,
                    '-map', `[${outputVideoLabel}]`,
                ];

                if (filterBuilder.hasAudio()) {
                    ffmpegArgs.push('-map', '[outa]');
                }

                // Add format-specific arguments
                if (renderSettings.format === 'webm-alpha') {
                    // Use optimized WebM parameters
                    const webmParams = WebMCompatibilityHandler.getOptimizedWebMParams(renderSettings.quality);
                    ffmpegArgs.push(...webmParams);
                    
                    // Add quality-specific bitrate
                    const webmQuality = {
                        low: '1M',
                        medium: '2M',
                        high: '4M',
                        ultra: '8M',
                        lossless: '0'
                    };
                    if (renderSettings.quality !== 'lossless') {
                        ffmpegArgs.push('-b:v', webmQuality[renderSettings.quality]);
                    }
                } else {
                    ffmpegArgs.push(...formatConfig.ffmpegArgs);
                }

                // Add quality settings for non-WebM formats
                if (renderSettings.format !== 'webm-alpha' && renderSettings.format !== 'gif' && renderSettings.format !== 'apng') {
                    ffmpegArgs.push('-crf', qualityPreset.crf.toString());
                    if (renderSettings.bitrate) {
                        ffmpegArgs.push('-b:v', renderSettings.bitrate);
                    }
                }

                // Add multi-threading
                const threads = navigator.hardwareConcurrency || 4;
                ffmpegArgs.push('-threads', threads.toString());

                // Add hardware acceleration params
                const hwParams = AdvancedFilterBuilder.getOptimalEncodingParams(
                    renderSettings.format,
                    renderSettings.quality,
                    renderSettings.hwAccel
                );
                ffmpegArgs.push(...hwParams);

                // Special handling for GIF
                if (renderSettings.format === 'gif') {
                    // Generate palette for better quality
                    const paletteArgs = [
                        ...inputs,
                        '-filter_complex',
                        `${complexFilter};[outv]palettegen=reserve_transparent=on:stats_mode=single[palette]`,
                        '-f', 'null', '-'
                    ];
                    
                    await ffmpeg.exec(paletteArgs);
                    
                    // Use palette for final render
                    ffmpegArgs[ffmpegArgs.indexOf('-filter_complex') + 1] = 
                        `${complexFilter};[outv]split[a][b];[a]palettegen=reserve_transparent=on[p];[b][p]paletteuse=alpha_threshold=128`;
                }

                // Set duration and output
                ffmpegArgs.push(
                    '-t', totalDuration.toFixed(3),
                    `output.${formatConfig.extension}`
                );

                // Execute rendering
                performanceMonitor.start('ffmpeg-encoding');
                
                // Progress tracking
                ffmpeg.on('progress', ({ progress }) => {
                    setRenderProgress(20 + (progress * 80)); // 20-100%
                });
                
                await ffmpeg.exec(ffmpegArgs);
                performanceMonitor.end('ffmpeg-encoding');

            } catch (err) {
                console.error('FFmpeg processing error:', err);
                performanceMonitor.end('total-render');
                throw err;
            } finally {
                // Clean up temporary files
                const allFiles = fileMap ? Array.from(fileMap.values()) : [];
                if (textElements.length > 0) {
                    const usedFonts = Array.from(new Set(textElements.map(t => t.font || 'Arial')));
                    allFiles.push(...usedFonts.map(f => `font${f}.ttf`));
                }
                await cleanupFFmpegFiles(ffmpeg, allFiles);
                
                // Clean up WebM temp files if any
                if (tempFiles.length > 0) {
                    await WebMCompatibilityHandler.cleanupTempFiles(ffmpeg, tempFiles);
                }
            }

            // Generate output
            performanceMonitor.start('output-generation');
            const outputFile = `output.${formatConfig.extension}`;
            const outputData = await ffmpeg.readFile(outputFile);
            const mimeType = renderSettings.format === 'gif' ? 'image/gif' : 
                           renderSettings.format === 'apng' ? 'image/apng' :
                           renderSettings.format === 'webp' ? 'image/webp' :
                           renderSettings.format.includes('webm') ? 'video/webm' :
                           'video/mp4';
            
            const outputBlob = new Blob([outputData as Uint8Array], { type: mimeType });
            const outputUrl = URL.createObjectURL(outputBlob);
            performanceMonitor.end('output-generation');
            performanceMonitor.end('total-render');
            
            // Log performance metrics
            console.log('Render Performance:', performanceMonitor.getMetrics());
            
            return { url: outputUrl, filename: `${projectName}.${formatConfig.extension}` };
        };

        // Run the render function
        try {
            const result = await renderFunction();
            setPreviewUrl(result.url);
            setLoaded(true);
            setIsRendering(false);
            toast.success(`${renderSettings.format.toUpperCase()} rendered successfully!`);
        } catch (err) {
            toast.error('Failed to render video');
            console.error("Failed to render video:", err);
            setIsRendering(false);
        }
    };

    return (
        <>
            {/* Render Button */}
            <button
                onClick={() => render()}
                className={`inline-flex items-center p-3 bg-white hover:bg-[#ccc] rounded-lg disabled:opacity-50 text-gray-900 font-bold transition-all transform`}
                disabled={(!loadFfmpeg || isRendering || (mediaFiles.length === 0 && textElements.length === 0))}
            >
                {(!loadFfmpeg || isRendering) && <span className="animate-spin mr-2">
                    <svg
                        viewBox="0 0 1024 1024"
                        focusable="false"
                        data-icon="loading"
                        width="1em"
                        height="1em"
                    >
                        <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                    </svg>
                </span>}
                <p>{loadFfmpeg ? (isRendering ? 'Rendering...' : 'Render') : 'Loading FFmpeg...'}</p>
            </button>

            {/* Render Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-black rounded-xl shadow-lg p-6 max-w-xl w-full">
                        {/* Title and close button */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {isRendering ? `Rendering ${renderSettings.format.toUpperCase()}...` : `${projectName}`}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-white text-4xl font-bold hover:text-red-400"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {isRendering ? (
                            <div>
                                <div className="mb-4">
                                    <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-full transition-all duration-300"
                                            style={{ width: `${renderProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">{Math.round(renderProgress)}% complete</p>
                                </div>
                                <div className="bg-black p-2 h-40 text-sm font-mono rounded overflow-y-auto">
                                    <div>{logMessages}</div>
                                    <p className="text-xs text-gray-400 italic mt-2">
                                        Rendering with {renderSettings.format} format, {renderSettings.quality} quality
                                        {renderSettings.alphaChannel && ' with transparency'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {previewUrl && (
                                    <div className="mb-4">
                                        {renderSettings.format === 'gif' || renderSettings.format === 'apng' || renderSettings.format === 'webp' ? (
                                            <img src={previewUrl} alt="Preview" className="w-full rounded" />
                                        ) : (
                                            <video src={previewUrl} controls className="w-full rounded" />
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <a
                                        href={previewUrl || '#'}
                                        download={`${projectName}.${FORMAT_CONFIGS[renderSettings.format].extension}`}
                                        className={`inline-flex items-center p-3 bg-white hover:bg-[#ccc] rounded-lg text-gray-900 font-bold transition-all transform`}
                                    >
                                        <Image
                                            alt='Download'
                                            className="Black"
                                            height={18}
                                            src={'https://www.svgrepo.com/show/501347/save.svg'}
                                            width={18}
                                        />
                                        <span className="ml-2">Save {renderSettings.format.toUpperCase()}</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}