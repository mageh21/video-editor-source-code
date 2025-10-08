"use client"

import { useState, useEffect, useCallback } from 'react';
import { useExport } from '../../hooks/useExport';
import { useAppSelector } from '@/app/store';
import { X, Download, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import CanvasTransparencyRenderer from './render/transparent/CanvasTransparencyRenderer';

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const { projectName, mediaFiles, textElements, instagramConversations, whatsappConversations } = useAppSelector((state) => state.projectState);
  const { exportVideo, downloadExport, isExporting, exportProgress, exportLog, isFFmpegLoaded, loadFFmpeg } = useExport();
  const [exportResult, setExportResult] = useState<{ url: string; filename: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [format, setFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4');
  const [activeTab, setActiveTab] = useState<'standard' | 'transparent'>('standard');
  const [transparentMethod, setTransparentMethod] = useState<'canvas-new'>('canvas-new');
  
  // Check if any content is available for advanced export
  // Now allowing all videos, not just transparent ones
  const hasTransparentContent = 
    (textElements && textElements.length > 0) ||
    (instagramConversations && instagramConversations.length > 0) ||
    (whatsappConversations && whatsappConversations.length > 0) ||
    mediaFiles.some(media => media.type === 'video');

  useEffect(() => {
    if (!isFFmpegLoaded) {
      loadFFmpeg();
    }
  }, [isFFmpegLoaded, loadFFmpeg]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    setExportResult(null);
    
    try {
      const result = await exportVideo({ format });
      if (result) {
        setExportResult(result);
      } else {
        setExportError('Export failed. Please try again.');
      }
    } catch (error) {
      setExportError('An unexpected error occurred during export.');
      console.error('Export error:', error);
    }
  }, [exportVideo, format]);

  const handleDownload = () => {
    if (exportResult) {
      downloadExport(exportResult.url, exportResult.filename);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-auto my-4 sm:my-8 relative max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-0 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Export Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'standard'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Standard Export
          </button>
          <button
            onClick={() => setActiveTab('transparent')}
            disabled={!hasTransparentContent}
            title={!hasTransparentContent ? "Add text elements, WebM/MOV video with transparency, enable chromakey on a video, or add Instagram/WhatsApp conversations to enable advanced export" : "Export with transparency/chromakey/text overlay support"}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'transparent'
                ? 'bg-gray-700 text-white'
                : hasTransparentContent
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Advanced Export
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'standard' ? (
          <>
            {/* Format selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['mp4', 'webm', 'gif'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-2 px-4 rounded-lg border transition-all uppercase text-sm font-medium ${
                      format === fmt
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            {/* Direct Canvas 2.0 Renderer */}
            <CanvasTransparencyRenderer 
              onExportComplete={(blob, filename) => {
                const url = URL.createObjectURL(blob);
                setExportResult({ url, filename });
              }}
              onClose={onClose}
            />
          </div>
        )}

        {/* Export status - only for standard export */}
        {activeTab === 'standard' && (
          <div className="mb-6">
            {!isExporting && !exportResult && !exportError && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Ready to export your video</p>
              <button
                onClick={handleExport}
                disabled={!isFFmpegLoaded}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {!isFFmpegLoaded ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </button>
            </div>
          )}

          {isExporting && (
            <div>
              <div className="flex items-center mb-2">
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                <span className="text-white">Exporting...</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{exportProgress}% complete</p>
              {exportLog && (
                <div className="mt-2 p-2 bg-black rounded text-xs text-gray-400 max-h-32 overflow-y-auto font-mono">
                  {exportLog}
                </div>
              )}
            </div>
          )}

          {exportResult && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-white mb-4">Export completed successfully!</p>
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center mx-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {format.toUpperCase()}
              </button>
            </div>
          )}

          {exportError && (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 mb-4">{exportError}</p>
              <button
                onClick={handleExport}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}