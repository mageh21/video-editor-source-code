"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useExport, type ExportOptions } from '../hooks/useExport';
import { useAppSelector } from '../store';
import { toast } from 'react-hot-toast';

interface ExportContextType {
  startExport: (format: 'mp4' | 'webm' | 'gif') => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
  showProgress: boolean;
  hideProgress: () => void;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const { mediaFiles, textElements } = useAppSelector((state) => state.projectState);
  const { exportVideo, downloadExport, isExporting, exportProgress, isFFmpegLoaded, loadFFmpeg } = useExport();
  const [showProgress, setShowProgress] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<{ url: string; filename: string } | null>(null);

  const startExport = useCallback(async (format: 'mp4' | 'webm' | 'gif') => {
    if (mediaFiles.length === 0 && textElements.length === 0) {
      toast.error('No content to export. Please add media or text first.');
      return;
    }

    // Show progress overlay
    setShowProgress(true);

    // Load FFmpeg if needed
    if (!isFFmpegLoaded) {
      await loadFFmpeg();
    }

    try {
      const result = await exportVideo({ format });
      if (result) {
        setLastExportResult(result);
        // Auto-download when complete
        downloadExport(result.url, result.filename);
        toast.success(`${format.toUpperCase()} exported successfully!`);
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
      } else {
        toast.error('Export failed. Please try again.');
        setShowProgress(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An unexpected error occurred during export.');
      setShowProgress(false);
    }
  }, [mediaFiles, textElements, exportVideo, downloadExport, isFFmpegLoaded, loadFFmpeg]);

  const hideProgress = useCallback(() => {
    if (!isExporting) {
      setShowProgress(false);
    }
  }, [isExporting]);

  return (
    <ExportContext.Provider value={{
      startExport,
      isExporting,
      exportProgress,
      showProgress,
      hideProgress,
    }}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExportContext() {
  const context = useContext(ExportContext);
  if (context === undefined) {
    throw new Error('useExportContext must be used within an ExportProvider');
  }
  return context;
}