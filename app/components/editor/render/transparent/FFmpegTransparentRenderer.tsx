'use client'
import { useState, useCallback } from 'react';
import { useAppSelector } from '@/app/store';
import { useExport } from '@/app/hooks/useExport';
import { toast } from 'react-hot-toast';
import { Download, Play, RotateCcw } from 'lucide-react';

interface FFmpegTransparentRendererProps {
  onExportComplete?: (blob: Blob, filename: string) => void;
}

export default function FFmpegTransparentRenderer({ onExportComplete }: FFmpegTransparentRendererProps) {
  const { mediaFiles, projectName } = useAppSelector(state => state.projectState);
  const { exportVideo, downloadExport, isExporting, exportProgress } = useExport();
  const [exportResult, setExportResult] = useState<{ url: string; filename: string } | null>(null);
  
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
  
  const processWithFFmpeg = useCallback(async () => {
    try {
      toast.success('Processing with FFmpeg + background compositing...');
      
      // Use WebM format to preserve transparency
      const result = await exportVideo({ format: 'webm' });
      
      if (result) {
        setExportResult(result);
        onExportComplete?.(result.blob, result.filename);
        toast.success('Video exported with background!');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('FFmpeg export failed:', error);
      toast.error('Export failed');
    }
  }, [exportVideo, onExportComplete]);
  
  const handleDownload = useCallback(() => {
    if (exportResult) {
      downloadExport(exportResult.url, exportResult.filename);
    }
  }, [exportResult, downloadExport]);
  
  if (!transparentVideo) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">FFmpeg Transparent Renderer</h3>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            No transparent video detected.
          </p>
          <div className="text-sm text-gray-500">
            <p>• Upload a video file (any format)</p>
            <p>• Background will be applied automatically</p>
            <p>• Uses existing FFmpeg compositing</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">FFmpeg Background Renderer</h3>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Video:</span>
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
      {!isExporting && !exportResult && (
        <button
          onClick={processWithFFmpeg}
          className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Render with FFmpeg + Background
        </button>
      )}
      
      {/* Progress */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Rendering...</span>
            <span className="text-gray-400 text-sm">{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Result */}
      {exportResult && (
        <div className="mt-4">
          <div className="bg-green-800/30 border border-green-600 rounded-lg p-4 text-center">
            <p className="text-green-400 mb-3">✅ Video rendered successfully!</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors mx-auto"
            >
              <Download className="w-4 h-4" />
              Download WebM
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <p>• Uses existing FFmpeg system with background compositing</p>
        <p>• Works with any video format (not just transparent)</p>
        <p>• Background is applied using filter_complex</p>
        <p>• More reliable than Canvas-based approach</p>
      </div>
    </div>
  );
}