'use client';
import React from 'react';
import { MediaFile } from '../types';
import { useKeyframeContext } from '../contexts/KeyframeContext';

interface UseKeyframesProps {
  media: MediaFile;
  containerRef: React.RefObject<HTMLDivElement>;
  timelineZoom: number;
}

interface FrameInfo {
  frameNumber: number;
  dataUrl: string;
}

const FPS = 30; // Klippy uses 30 FPS by default

export const useKeyframes = ({
  media,
  containerRef,
  timelineZoom,
}: UseKeyframesProps) => {
  const { getKeyframes, updateKeyframes } = useKeyframeContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [frames, setFrames] = React.useState<FrameInfo[]>([]);
  const extractionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Calculate how many frames we should extract based on zoom and container width
  const calculateFrameCount = React.useCallback(() => {
    if (!containerRef.current) return 10;
    const containerWidth = containerRef.current.clientWidth;
    
    // More frames when zoomed in for better detail
    const baseThumbnailWidth = 80;
    const effectiveWidth = containerWidth / timelineZoom;
    
    let frameCount = Math.ceil(effectiveWidth / baseThumbnailWidth);
    frameCount = Math.min(Math.max(frameCount, 5), 30);
    
    return frameCount;
  }, [containerRef, timelineZoom]);

  // Create video and canvas for frame extraction
  const createVideoAndCanvas = React.useCallback(
    async (dimensions: { width: number; height: number }) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      video.playbackRate = 16;

      const canvas = document.createElement('canvas');
      
      // Optimize canvas size based on aspect ratio
      const aspectRatio = dimensions.width / dimensions.height;
      let targetWidth, targetHeight;
      
      if (aspectRatio > 1) {
        // Landscape video
        targetWidth = 240;
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else {
        // Portrait video
        targetHeight = 240;
        targetWidth = Math.round(targetHeight * aspectRatio);
      }
      
      // Apply zoom scaling for better quality when zoomed in
      const zoomFactor = Math.min(2, Math.max(1, timelineZoom / 100));
      canvas.width = Math.floor(targetWidth * zoomFactor);
      canvas.height = Math.floor(targetHeight * zoomFactor);

      const context = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false,
      });

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      return { video, canvas, context };
    },
    [timelineZoom]
  );

  // Cleanup function
  const cleanup = React.useCallback((video?: HTMLVideoElement) => {
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
      extractionTimeoutRef.current = null;
    }
    if (video) {
      video.src = '';
      video.load();
    }
  }, []);

  // Main extraction logic
  const performExtraction = React.useCallback(async () => {
    if (media.type !== 'video' || !media.src) return;

    let video: HTMLVideoElement | undefined;

    try {
      setIsLoading(true);
      setFrames([]);

      // Check cache first
      const cachedFrames = getKeyframes(media.id);
      if (
        cachedFrames &&
        cachedFrames.frames &&
        cachedFrames.frames.length > 0 &&
        Date.now() - cachedFrames.lastUpdated < 300000 // 5 minutes cache
      ) {
        setFrames(
          cachedFrames.previewFrames.map((frameNumber, index) => ({
            frameNumber,
            dataUrl: cachedFrames.frames[index],
          }))
        );
        setIsLoading(false);
        return;
      }

      // Create temporary video element to get dimensions
      const tempVideo = document.createElement('video');
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.preload = 'metadata';
      tempVideo.src = media.src;

      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const onLoadedMetadata = () => {
            resolve({
              width: tempVideo.videoWidth,
              height: tempVideo.videoHeight,
            });
            cleanup();
          };

          const onError = (e: Event) => {
            reject(new Error('Failed to load video metadata'));
            cleanup();
          };

          const cleanup = () => {
            tempVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
            tempVideo.removeEventListener('error', onError);
            tempVideo.src = '';
            tempVideo.load();
          };

          tempVideo.addEventListener('loadedmetadata', onLoadedMetadata);
          tempVideo.addEventListener('error', onError);

          setTimeout(() => {
            cleanup();
            reject(new Error('Timeout while loading video metadata'));
          }, 10000);
        }
      );

      if (!dimensions.width || !dimensions.height) {
        throw new Error('Could not get video dimensions');
      }

      // Create video and canvas for extraction
      const { video: newVideo, canvas, context } = await createVideoAndCanvas(dimensions);
      video = newVideo;
      video.src = media.src;

      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        const onLoad = () => {
          if (video!.readyState >= 2) {
            cleanup();
            resolve();
          }
        };

        const onError = (e: Event) => {
          cleanup();
          reject(new Error('Video load failed'));
        };

        const cleanup = () => {
          video!.removeEventListener('loadeddata', onLoad);
          video!.removeEventListener('error', onError);
        };

        video!.addEventListener('loadeddata', onLoad);
        video!.addEventListener('error', onError);
      });

      const frameCount = calculateFrameCount();
      const duration = media.endTime - media.startTime;
      const durationInFrames = Math.floor(duration * FPS);
      
      // Calculate frame numbers with even distribution
      const frameNumbers = Array.from({ length: frameCount }, (_, i) => {
        const progress = i / (frameCount - 1);
        const frameNumber = Math.round(progress * (durationInFrames - 1));
        return Math.min(frameNumber, durationInFrames - 1);
      });

      const extractedFrames: FrameInfo[] = [];
      const FRAME_TIMEOUT = 5000;
      const BATCH_SIZE = 5;

      // Extract frames in batches
      for (let i = 0; i < frameNumbers.length; i += BATCH_SIZE) {
        const batchFrameNumbers = frameNumbers.slice(i, i + BATCH_SIZE);

        for (const frameNumber of batchFrameNumbers) {
          try {
            const timeInSeconds = media.startTime + (frameNumber / FPS);

            // Seek to frame
            await new Promise<void>((resolve, reject) => {
              let seekTimeout = setTimeout(() => {
                reject(new Error('Seek timeout'));
              }, FRAME_TIMEOUT);

              const onSeeked = () => {
                clearTimeout(seekTimeout);
                video!.removeEventListener('seeked', onSeeked);
                resolve();
              };

              video!.addEventListener('seeked', onSeeked);
              video!.currentTime = timeInSeconds;
            });

            // Extract frame
            await new Promise<void>((resolve, reject) => {
              const extractFrame = () => {
                try {
                  context.drawImage(video!, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

                  if (!dataUrl.startsWith('data:image')) {
                    throw new Error('Invalid frame data URL');
                  }

                  extractedFrames.push({
                    frameNumber,
                    dataUrl,
                  });
                  setFrames([...extractedFrames]);
                  resolve();
                } catch (error) {
                  reject(error);
                }
              };

              // Small delay to ensure frame is ready
              setTimeout(extractFrame, 50);
            });

          } catch (error) {
            console.warn(`Failed to extract frame ${frameNumber}:`, error);
          }
        }

        // Small delay between batches
        if (i + BATCH_SIZE < frameNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Cache if we got enough frames
      if (extractedFrames.length >= Math.ceil(frameCount * 0.7)) {
        updateKeyframes(media.id, {
          frames: extractedFrames.map(f => f.dataUrl),
          previewFrames: extractedFrames.map(f => f.frameNumber),
          durationInFrames,
          lastUpdated: Date.now(),
        });
      }

    } catch (error) {
      console.error('[Keyframes] Extraction error:', error);
    } finally {
      setIsLoading(false);
      cleanup(video);
    }
  }, [media, calculateFrameCount, getKeyframes, updateKeyframes, cleanup, createVideoAndCanvas]);

  React.useEffect(() => {
    performExtraction();
    return () => cleanup();
  }, [performExtraction, cleanup]);

  return {
    frames: frames.map(f => f.dataUrl),
    previewFrames: frames.map(f => f.frameNumber),
    isLoading,
  };
};