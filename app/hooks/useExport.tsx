"use client"

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useAppSelector } from "@/app/store";
import { getFile } from "@/app/store";
import { extractConfigs } from "@/app/utils/extractConfigs";
import { mimeToExt } from "@/app/types";
import { toast } from "react-hot-toast";

export type ExportFormat = 'mp4' | 'webm' | 'gif';

export interface ExportOptions {
  format: ExportFormat;
  quality?: 'high' | 'medium' | 'low';
  resolution?: '1080p' | '720p' | '480p';
}

export function useExport() {
  const { mediaFiles, projectName, exportSettings, duration, textElements, resolution } = useAppSelector(state => state.projectState);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLog, setExportLog] = useState('');
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (isFFmpegLoaded || typeof window === 'undefined') return;
    
    setIsFFmpegLoaded(false);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("log", ({ message }) => {
      setExportLog(message);
    });

    ffmpeg.on("progress", ({ progress }) => {
      setExportProgress(Math.round(progress * 100));
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      setIsFFmpegLoaded(true);
      toast.success('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Failed to load FFmpeg');
    }
  }, [isFFmpegLoaded]);

  // Check available codecs and attempt WebM export
  const exportSimpleWebM = async (ffmpeg: FFmpeg) => {
    try {
      // First check what codecs are available
      await ffmpeg.exec(['-codecs']);
      
      // Check specifically for VP9
      const codecsOutput = await ffmpeg.readFile('codecs.txt').catch(() => null);
      
      toast.error('WebM/VP9 codec not available in this FFmpeg build. Use MP4 instead.');
      return null;
      
    } catch (error) {
      console.error('WebM codec check failed:', error);
      toast.error('WebM export not supported in this FFmpeg build');
      return null;
    }
  };

  const exportVideo = useCallback(async (options: ExportOptions = { format: 'mp4' }) => {
    if (typeof window === 'undefined') return null;
    
    if (!isFFmpegLoaded) {
      await loadFFmpeg();
      if (!isFFmpegLoaded) return null;
    }

    if (mediaFiles.length === 0 && textElements.length === 0) {
      toast.error('No content to export');
      return null;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportLog('Starting export...');

    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        toast.error('FFmpeg not initialized');
        return null;
      }


      // Standard export for other formats
      const params = extractConfigs(exportSettings);
      const totalDuration = duration;

      // Create filters and inputs arrays
      const filters = [];
      const overlays = [];
      const inputs = [];
      const audioDelays = [];

      // Sort media files by z-index first, then by row (lower = background, higher = foreground)
      const allMediaFiles = [...mediaFiles].sort((a, b) => {
        const zDiff = (a.zIndex || 0) - (b.zIndex || 0);
        if (zDiff !== 0) return zDiff;
        // If same z-index, sort by row (higher row = on top)
        return (a.row || 0) - (b.row || 0);
      });
      
      // Debug logging for export order
      console.log('Export - Media files sorted by z-index and row:', allMediaFiles.map(m => ({
        id: m.id,
        fileName: m.fileName,
        zIndex: m.zIndex || 0,
        row: m.row || 0,
        opacity: m.opacity || 100,
        type: m.type,
        hasPosition: !!(m.x !== undefined || m.y !== undefined || m.width !== undefined || m.height !== undefined)
      })));
      
      // Standard background for other formats
      const backgroundMedia = allMediaFiles.find(media => (media.zIndex || 0) < 0);
      if (backgroundMedia && backgroundMedia.mimeType === 'background/color') {
        const bgColor = 'black';
        filters.push(`color=c=${bgColor}:size=${resolution.width}x${resolution.height}:d=${totalDuration.toFixed(3)}:rate=30[base]`);
      } else {
        filters.push(`color=c=black:size=${resolution.width}x${resolution.height}:d=${totalDuration.toFixed(3)}:rate=30[base]`);
      }
      
      // Filter out background colors for processing
      const sortedMediaFiles = allMediaFiles.filter(media => media.mimeType !== 'background/color');

      // Process each media file
      for (let i = 0; i < sortedMediaFiles.length; i++) {
        const media = sortedMediaFiles[i];
        const { startTime, positionStart, positionEnd } = media;
        const mediaDuration = positionEnd - positionStart;

        // Get file data and write to FFmpeg
        const fileData = await getFile(media.fileId);
        const buffer = await fileData.arrayBuffer();
        const fileType = fileData.type || media.mimeType || media.fileName?.split('.').pop() || 'video/mp4';
        
        // Safe extension extraction
        let ext = 'mp4'; // default
        if (fileType && typeof fileType === 'string') {
            ext = mimeToExt[fileType as keyof typeof mimeToExt] || 
                  (fileType.includes('/') ? fileType.split('/')[1] : 'mp4');
        }
        await ffmpeg.writeFile(`input${i}.${ext}`, new Uint8Array(buffer));

        // Add to inputs
        if (media.type === 'image') {
          inputs.push('-loop', '1', '-t', mediaDuration.toFixed(3), '-i', `input${i}.${ext}`);
        } else {
          // For WebM files, ensure we read with alpha
          const isWebM = ext === 'webm' || media.fileName?.toLowerCase().endsWith('.webm');
          if (isWebM) {
            inputs.push('-f', 'webm', '-i', `input${i}.${ext}`);
          } else {
            inputs.push('-i', `input${i}.${ext}`);
          }
        }

        const visualLabel = `visual${i}`;
        const audioLabel = `audio${i}`;

        // Process video/image
        if (media.type === 'video') {
          // Check if this is a transparent video (WebM with transparency)
          const isTransparentVideo = ext === 'webm' || media.fileName?.toLowerCase().endsWith('.webm');
          
          // If media has custom dimensions, use those; otherwise check if we should preserve aspect ratio
          let scaleParams;
          if (media.width && media.height) {
            // Custom dimensions set by user
            scaleParams = `${media.width}:${media.height}`;
          } else if (isTransparentVideo || i > 0) {
            // For transparent videos or overlay videos, preserve original size
            scaleParams = 'iw:ih';
          } else {
            // For background videos, scale to canvas
            scaleParams = `${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
          }
          
          // Process video with proper scaling
          // For WebM, ensure we're reading with alpha channel
          if (isTransparentVideo) {
            // WORKAROUND: Since FFmpeg has issues with WebM overlay timing,
            // we recommend using the Advanced Export (Canvas renderer) for transparent videos
            console.warn('Transparent WebM detected. For best results, use Advanced Export tab.');
            
            // Still process it but with simpler approach
            filters.push(
              `[${i}:v]trim=start=${startTime.toFixed(3)}:duration=${mediaDuration.toFixed(3)},scale=${scaleParams},format=yuva420p,setpts=PTS-STARTPTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`
            );
          } else {
            filters.push(
              `[${i}:v]trim=start=${startTime.toFixed(3)}:duration=${mediaDuration.toFixed(3)},scale=${scaleParams},setpts=PTS-STARTPTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`
            );
          }
        }
        
        if (media.type === 'image') {
          // If media has custom dimensions, scale to those; otherwise scale to canvas size
          const scaleParams = media.width && media.height 
            ? `${media.width}:${media.height}` 
            : `${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
          
          filters.push(
            `[${i}:v]scale=${scaleParams},setpts=PTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`
          );
        }

        // Apply opacity and prepare for overlay
        if (media.type === 'video' || media.type === 'image') {
          const alpha = Math.min(Math.max((media.opacity || 100) / 100, 0), 1);
          const isTransparentVideo = ext === 'webm' || media.fileName?.toLowerCase().endsWith('.webm');
          
          let overlayLabel = visualLabel;
          
          // Apply opacity if needed
          if (alpha < 1) {
            filters.push(`[${visualLabel}]format=yuva420p,colorchannelmixer=aa=${alpha}[${visualLabel}_alpha]`);
            overlayLabel = `${visualLabel}_alpha`;
          }
          
          overlays.push({
            label: overlayLabel,
            x: media.x ?? 0,
            y: media.y ?? 0,
            start: positionStart.toFixed(3),
            end: positionEnd.toFixed(3),
            isTransparent: isTransparentVideo
          });
        }

        // Process audio
        if (media.type === 'audio' || media.type === 'video') {
          const delayMs = Math.round(positionStart * 1000);
          const volume = media.volume !== undefined ? media.volume / 100 : 1;
          filters.push(
            `[${i}:a]atrim=start=${startTime.toFixed(3)}:duration=${mediaDuration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[${audioLabel}]`
          );
          audioDelays.push(`[${audioLabel}]`);
        }
      }

      // Apply overlays
      let lastLabel = 'base';
      if (overlays.length > 0) {
        for (let i = 0; i < overlays.length; i++) {
          const { label, start, end, x, y, isTransparent } = overlays[i];
          const nextLabel = i === overlays.length - 1 && textElements.length === 0 ? 'outv' : `tmp${i}`;
          
          // Use standard overlay with timing for all videos
          filters.push(
            `[${lastLabel}][${label}]overlay=${x}:${y}:enable='between(t\\,${start}\\,${end})'[${nextLabel}]`
          );
          lastLabel = nextLabel;
        }
      }

      // Process text elements
      if (textElements.length > 0) {
        // Import font loading functions
        const { getFontByFamily, loadFontForFFmpeg } = await import('@/app/utils/enhanced-font-loader');
        const { loadFontForFFmpeg: loadFontLegacy } = await import('@/app/utils/fontManager');
        
        // Extract unique fonts from text elements
        const uniqueFonts = new Set<string>();
        textElements.forEach(text => {
          if (text.font) {
            uniqueFonts.add(text.font);
          }
        });
        
        // Load each font
        for (const fontName of uniqueFonts) {
          try {
            const fontData = getFontByFamily(fontName);
            if (fontData) {
              // Use enhanced font loader for fonts in our data
              await loadFontForFFmpeg(fontData, ffmpeg);
            } else {
              // Fallback to legacy font loader for custom fonts
              await loadFontLegacy(fontName, ffmpeg);
            }
          } catch (error) {
            console.warn(`Failed to load font ${fontName}:`, error);
          }
        }

        // Apply text overlays
        for (let i = 0; i < textElements.length; i++) {
          const text = textElements[i];
          const label = i === textElements.length - 1 ? 'outv' : `text${i}`;
          const escapedText = (text.text || '').replace(/:/g, '\\:').replace(/'/g, "\\\\'");
          const alpha = Math.min(Math.max((text.opacity ?? 100) / 100, 0), 1);
          const textColor = text.color || 'white';
          const color = (textColor && textColor.includes('@')) ? textColor : `${textColor}@${alpha}`;
          // Use safe font name for file path
          const safeFontName = (text.font || 'Inter').replace(/[^a-zA-Z0-9]/g, '');
          filters.push(
            `[${lastLabel}]drawtext=fontfile=font${safeFontName}.ttf:text='${escapedText}':x=${text.x}:y=${text.y}:fontsize=${text.fontSize || 24}:fontcolor=${color}:enable='between(t\\,${text.positionStart}\\,${text.positionEnd})'[${label}]`
          );
          lastLabel = label;
        }
      }

      // Ensure we have an output video label
      if (lastLabel !== 'outv') {
        if (overlays.length === 0 && textElements.length === 0) {
          // If no overlays or text, copy base to outv
          filters.push(`[${lastLabel}]copy[outv]`);
        }
      }

      // Mix audio tracks
      if (audioDelays.length > 0) {
        const audioMix = audioDelays.join('');
        filters.push(`${audioMix}amix=inputs=${audioDelays.length}:normalize=0[outa]`);
      }

      // Build FFmpeg arguments
      const complexFilter = filters.join('; ');
      const outputFileName = `output.${options.format}`;
      
      const ffmpegArgs = [
        ...inputs,
        '-filter_complex', complexFilter,
        '-map', '[outv]',
      ];

      if (audioDelays.length > 0) {
        ffmpegArgs.push('-map', '[outa]');
      }

      // Format-specific encoding
      switch (options.format) {
        case 'mp4':
          ffmpegArgs.push(
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', params.preset,
            '-crf', params.crf.toString(),
            '-pix_fmt', 'yuv420p',
            '-s', `${resolution.width}x${resolution.height}`,
            '-aspect', `${resolution.width}:${resolution.height}`
          );
          break;
        case 'webm':
          // Try VP8 which is more widely supported in FFmpeg WASM builds
          ffmpegArgs.push(
            '-c:v', 'libvpx',
            '-c:a', 'libvorbis',
            '-b:v', '1M',
            '-pix_fmt', 'yuv420p', // Standard format, alpha might not be supported
            '-s', `${resolution.width}x${resolution.height}`
          );
          break;
        case 'gif':
          // Remove audio for GIF
          ffmpegArgs.splice(ffmpegArgs.indexOf('-map'), 2);
          ffmpegArgs.push('-vf', `fps=10,scale=${resolution.width}:${resolution.height}:flags=lanczos`);
          break;
      }

      ffmpegArgs.push('-t', totalDuration.toFixed(3), outputFileName);

      // Debug log the complete FFmpeg command
      console.log('=== FFmpeg Export Debug ===');
      console.log('Export format:', options.format);
      console.log('Media files:', sortedMediaFiles.map(m => ({
        fileName: m.fileName,
        type: m.type,
        mimeType: m.mimeType,
        hasAlpha: m.fileName?.toLowerCase().endsWith('.webm') || m.mimeType?.includes('webm')
      })));
      console.log('FFmpeg inputs:', inputs);
      console.log('FFmpeg command:', ffmpegArgs.join(' '));
      console.log('Complex filter:', complexFilter);
      console.log('=========================');

      // Execute FFmpeg
      await ffmpeg.exec(ffmpegArgs);

      // Get output file
      const outputData = await ffmpeg.readFile(outputFileName);
      const mimeType = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        gif: 'image/gif'
      }[options.format];
      
      const outputBlob = new Blob([outputData as Uint8Array], { type: mimeType });
      const outputUrl = URL.createObjectURL(outputBlob);

      setIsExporting(false);
      setExportProgress(100);
      toast.success(`${options.format.toUpperCase()} exported successfully!`);

      return {
        url: outputUrl,
        blob: outputBlob,
        filename: `${projectName}.${options.format}`
      };

    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
      setIsExporting(false);
      return null;
    }
  }, [isFFmpegLoaded, mediaFiles, textElements, duration, projectName, exportSettings, resolution, loadFFmpeg]);

  const downloadExport = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    exportVideo,
    downloadExport,
    loadFFmpeg,
    isFFmpegLoaded,
    isExporting,
    exportProgress,
    exportLog
  };
}