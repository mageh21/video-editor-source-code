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
import { FilterChainOptimizer } from "../utils/filterOptimizer";
import { performanceMonitor } from "@/app/utils/performanceMonitor";

interface FileUploaderProps {
    loadFunction: () => Promise<void>;
    loadFfmpeg: boolean;
    ffmpeg: FFmpeg;
    logMessages: string;
}
export default function FfmpegRender({ loadFunction, loadFfmpeg, ffmpeg, logMessages }: FileUploaderProps) {
    const { mediaFiles, projectName, exportSettings, duration, textElements, resolution } = useAppSelector(state => state.projectState);
    const totalDuration = duration;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        if (loaded && videoRef.current && previewUrl) {
            videoRef.current.src = previewUrl;
        }
    }, [loaded, previewUrl]);

    const handleCloseModal = async () => {
        setShowModal(false);
        setIsRendering(false);
        try {
            ffmpeg.terminate();
            await loadFunction();
        } catch (e) {
            console.error("Failed to reset FFmpeg:", e);
        }
    };

    const render = async () => {
        if (mediaFiles.length === 0 && textElements.length === 0) {
            console.log('No media files to render');
            return;
        }
        setShowModal(true);
        setIsRendering(true);

        const renderFunction = async () => {
            const params = extractConfigs(exportSettings);
            performanceMonitor.start('total-render', { 
                mediaFiles: mediaFiles.length, 
                textElements: textElements.length,
                duration: totalDuration 
            });

            let fileMap: Map<string, string> | undefined;
            try {
                const inputs = [];
                
                // Initialize filter chain optimizer
                const filterOptimizer = new FilterChainOptimizer({
                    resolution,
                    totalDuration,
                    fps: 30
                });

                // Sort videos by zIndex ascending (lowest drawn first)
                const sortedMediaFiles = [...mediaFiles].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

                // Pre-load all files in parallel with deduplication
                performanceMonitor.start('file-loading');
                const fileIds = sortedMediaFiles.map(file => file.fileId);
                fileMap = await loadFilesParallel(fileIds, ffmpeg, (loaded, total) => {
                    console.log(`Loading files: ${loaded}/${total}`);
                });
                performanceMonitor.end('file-loading');

                for (let i = 0; i < sortedMediaFiles.length; i++) {

                    // timing
                    const { startTime, positionStart, positionEnd } = sortedMediaFiles[i];
                    const duration = positionEnd - positionStart;

                    // Use the pre-loaded file (with deduplication)
                    const inputFilename = fileMap.get(sortedMediaFiles[i].fileId)!;
                    const ext = inputFilename.split('.').pop()!;

                    if (sortedMediaFiles[i].type === 'image') {
                        inputs.push('-loop', '1', '-t', duration.toFixed(3), '-i', inputFilename);
                    }
                    else {
                        inputs.push('-i', inputFilename);
                    }

                    // Add visual media processing
                    if (sortedMediaFiles[i].type === 'video' || sortedMediaFiles[i].type === 'image') {
                        filterOptimizer.addVisualMedia(i, sortedMediaFiles[i], i);
                    }

                    // Add audio processing
                    if (sortedMediaFiles[i].type === 'audio' || sortedMediaFiles[i].type === 'video') {
                        filterOptimizer.addAudioMedia(i, sortedMediaFiles[i], i);
                    }
                }

                // Apply text overlays
                let outputVideoLabel = 'outv';
                if (textElements.length > 0) {
                    // Load fonts with caching
                    performanceMonitor.start('font-loading');
                    const usedFonts = new Set(textElements.map(t => t.font || 'Arial'));
                    await loadFontsWithCache(Array.from(usedFonts) as string[], ffmpeg);
                    performanceMonitor.end('font-loading');
                    outputVideoLabel = filterOptimizer.addTextElements(textElements, usedFonts as any);
                }

                // Build audio mix
                filterOptimizer.buildAudioMix();

                // Get optimized filter complex
                const complexFilter = filterOptimizer.getFilterComplex();
                
                // Build FFmpeg arguments
                const ffmpegArgs = [
                    ...inputs,
                    '-filter_complex', complexFilter,
                    '-map', `[${outputVideoLabel}]`,
                ];

                if (filterOptimizer.hasAudio()) {
                    ffmpegArgs.push('-map', '[outa]');
                }

                // Add multi-threading support
                const threads = navigator.hardwareConcurrency || 4;
                ffmpegArgs.push('-threads', threads.toString());
                
                // Add optimized encoding parameters
                const encodingParams = FilterChainOptimizer.getOptimalEncodingParams(mediaFiles, exportSettings);
                ffmpegArgs.push(...encodingParams);
                
                // Add export settings
                ffmpegArgs.push(
                    '-crf', params.crf.toString(),
                    '-t', totalDuration.toFixed(3),
                    'output.mp4'
                );

                performanceMonitor.start('ffmpeg-encoding');
                await ffmpeg.exec(ffmpegArgs);
                performanceMonitor.end('ffmpeg-encoding');

            } catch (err) {
                console.error('FFmpeg processing error:', err);
                performanceMonitor.end('total-render');
                throw err;
            } finally {
                // Clean up temporary files to free memory
                const allFiles = fileMap ? Array.from(fileMap.values()) : [];
                if (textElements.length > 0) {
                    const usedFonts = Array.from(new Set(textElements.map(t => t.font || 'Arial')));
                    allFiles.push(...usedFonts.map(f => `font${f}.ttf`));
                }
                await cleanupFFmpegFiles(ffmpeg, allFiles);
            }

            // return the output url
            performanceMonitor.start('output-generation');
            const outputData = await ffmpeg.readFile('output.mp4');
            const outputBlob = new Blob([outputData as Uint8Array], { type: 'video/mp4' });
            const outputUrl = URL.createObjectURL(outputBlob);
            performanceMonitor.end('output-generation');
            performanceMonitor.end('total-render');
            
            // Log performance metrics
            console.log('Render Performance:', performanceMonitor.getMetrics());
            
            return outputUrl;
        };

        // Run the function and handle the result/error
        try {
            const outputUrl = await renderFunction();
            setPreviewUrl(outputUrl);
            setLoaded(true);
            setIsRendering(false);
            toast.success('Video rendered successfully');
        } catch (err) {
            toast.error('Failed to render video');
            console.error("Failed to render video:", err);
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
                                {isRendering ? 'Rendering...' : `${projectName}`}
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
                                <div className="bg-black p-2 h-40 text-sm font-mono rounded">
                                    <div>{logMessages}</div>
                                    <p className="text-xs text-gray-400 italic">The progress bar is experimental in FFmpeg WASM, so it might appear slow or unresponsive even though the actual processing is not.</p>
                                    <FfmpegProgressBar ffmpeg={ffmpeg} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                {previewUrl && (
                                    <video src={previewUrl} controls className="w-full mb-4" />
                                )}
                                <div className="flex justify-between">
                                    <a
                                        href={previewUrl || '#'}
                                        download={`${projectName}.mp4`}
                                        className={`inline-flex items-center p-3 bg-white hover:bg-[#ccc] rounded-lg text-gray-900 font-bold transition-all transform `}
                                    >
                                        <Image
                                            alt='Download'
                                            className="Black"
                                            height={18}
                                            src={'https://www.svgrepo.com/show/501347/save.svg'}
                                            width={18}
                                        />
                                        <span className="ml-2">Save Video</span>
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