'use client'
import { useState, useCallback, useRef } from 'react';
import { useAppSelector } from '@/app/store';
import { toast } from 'react-hot-toast';
import { CanvasVideoCompositor } from '../canvas/CanvasVideoCompositor';
import { getFile } from '@/app/store';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';

interface TransparentVideoRendererProps {
  onExportComplete?: (blob: Blob, filename: string) => void;
}

export default function TransparentVideoRenderer({ onExportComplete }: TransparentVideoRendererProps) {
  const { mediaFiles, resolution, duration, projectName } = useAppSelector(state => state.projectState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const compositorRef = useRef<CanvasVideoCompositor | null>(null);
  
  // Find transparent video and background
  const transparentVideo = mediaFiles.find(media => 
    media.type === 'video' && (
      media.mimeType?.includes('webm') || 
      media.mimeType?.includes('mov') || 
      media.fileName?.toLowerCase().includes('transparent')
    )
  );
  
  const backgroundMedia = mediaFiles.find(media => 
    (media.zIndex || 0) < 0 || media.mimeType === 'background/color'
  );
  
  const setupCompositor = useCallback(async () => {
    if (!transparentVideo) return null;
    
    const backgroundColor = '#000000'; // Default black background
    let backgroundImage: HTMLImageElement | HTMLVideoElement | undefined;
    
    // Load background if it's a file
    if (backgroundMedia && backgroundMedia.mimeType !== 'background/color') {
      const bgFile = await getFile(backgroundMedia.fileId);
      const bgUrl = URL.createObjectURL(bgFile);
      
      if (backgroundMedia.type === 'image') {
        backgroundImage = new Image();
        backgroundImage.src = bgUrl;
        await new Promise(resolve => backgroundImage!.onload = resolve);
      } else if (backgroundMedia.type === 'video') {
        backgroundImage = document.createElement('video');
        backgroundImage.src = bgUrl;
        backgroundImage.muted = true;
        await new Promise(resolve => backgroundImage!.onloadeddata = resolve);
      }
    }
    
    const compositor = new CanvasVideoCompositor({
      width: resolution.width,
      height: resolution.height,
      fps: 30,
      duration: duration,
      backgroundColor,
      backgroundImage
    });
    
    compositorRef.current = compositor;
    return compositor;
  }, [transparentVideo, backgroundMedia, resolution, duration]);
  
  const processTransparentVideo = useCallback(async () => {
    if (!transparentVideo) {
      toast.error('No transparent video found');
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Load transparent video
      const videoFile = await getFile(transparentVideo.fileId);
      const videoUrl = URL.createObjectURL(videoFile);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      
      // Setup compositor
      const compositor = await setupCompositor();
      if (!compositor) {
        throw new Error('Failed to setup compositor');
      }
      
      toast.success('Starting transparent video processing...');
      
      // Extract and composite frames
      const frames = await compositor.extractFrames(video, (progressValue) => {
        setProgress(Math.round(progressValue * 80)); // 80% for frame extraction
      });
      
      toast.success(`Extracted ${frames.length} frames. Creating video...`);
      
      // Convert frames to video with audio preservation
      const videoBlob = await compositor.framesToVideo(frames, video, 'video/webm');
      
      setProgress(100);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(videoBlob);
      setPreviewUrl(previewUrl);
      
      // Notify parent component
      onExportComplete?.(videoBlob, `${projectName}_transparent.mp4`);
      
      toast.success('Transparent video with background created successfully!');
      
      // Cleanup
      URL.revokeObjectURL(videoUrl);
      compositor.dispose();
      
    } catch (error) {
      console.error('Transparent video processing failed:', error);
      toast.error('Failed to process transparent video');
    } finally {
      setIsProcessing(false);
    }
  }, [transparentVideo, setupCompositor, projectName, onExportComplete]);
  
  const downloadResult = useCallback(() => {
    if (!previewUrl) return;
    
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${projectName}_transparent.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [previewUrl, projectName]);
  
  const togglePreview = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  const resetPreview = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
  }, []);
  
  if (!transparentVideo) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Transparent Video Renderer</h3>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            No transparent video detected. Upload a WebM or MOV file with alpha channel.
          </p>
          <div className="text-sm text-gray-500">
            <p>• Supported formats: WebM, MOV with alpha</p>
            <p>• Background will be applied automatically</p>
            <p>• Output: MP4 with composited background</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Transparent Video Renderer</h3>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Transparent Video:</span>
          <span className="text-green-400">{transparentVideo.fileName}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-300">Background:</span>
          <span className="text-blue-400">
            {backgroundMedia?.fileName || 'Black'}
          </span>
        </div>
      </div>
      
      {/* Process Button */}
      {!isProcessing && !previewUrl && (
        <button
          onClick={processTransparentVideo}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Process Transparent Video
        </button>
      )}
      
      {/* Progress */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Processing...</span>
            <span className="text-gray-400 text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Preview */}
      {previewUrl && (
        <div className="mt-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-auto"
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
          
          {/* Video Controls */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={togglePreview}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={resetPreview}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={downloadResult}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download MP4
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <p>• This tool composites transparent videos with selected backgrounds</p>
        <p>• Works with WebM, MOV files containing alpha channels</p>
        <p>• Output is standard MP4 compatible with all platforms</p>
        <p>• Processing may take time depending on video length</p>
      </div>
    </div>
  );
}