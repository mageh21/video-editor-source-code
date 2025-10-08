"use client"

import { useEffect } from 'react';
import { useExport } from '../../hooks/useExport';
import { X, Loader2 } from 'lucide-react';

interface ExportProgressOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ExportProgressOverlay({ isVisible, onClose }: ExportProgressOverlayProps) {
  const { isExporting, exportProgress, exportLog } = useExport();

  // Auto-hide when export completes
  useEffect(() => {
    if (!isExporting && exportProgress === 100 && isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isExporting, exportProgress, isVisible, onClose]);

  if (!isVisible || !isExporting) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 min-w-[400px] border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Exporting Video</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors opacity-50"
            disabled={true}
            title="Cannot cancel during export"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${exportProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {exportProgress < 20 && "Loading media files..."}
              {exportProgress >= 20 && exportProgress < 40 && "Processing video tracks..."}
              {exportProgress >= 40 && exportProgress < 60 && "Processing audio tracks..."}
              {exportProgress >= 60 && exportProgress < 80 && "Applying effects and text..."}
              {exportProgress >= 80 && exportProgress < 100 && "Finalizing export..."}
              {exportProgress === 100 && "Export complete!"}
            </span>
            <span className="text-white font-medium">{exportProgress}%</span>
          </div>

          {/* Log Preview */}
          {exportLog && (
            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono max-h-20 overflow-y-auto">
                {exportLog.split('\n').slice(-3).join('\n')}
              </pre>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Please keep this window open while exporting
        </p>
      </div>
    </div>
  );
}