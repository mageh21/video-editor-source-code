/**
 * Thumbnail generation utilities for timeline media elements
 */

/**
 * Generates a thumbnail for video files
 */
export const generateVideoThumbnail = async (
  videoUrl: string,
  seekTime: number = 1,
  abortSignal?: AbortSignal
): Promise<string> => {
  return new Promise((resolve) => {
    if (abortSignal?.aborted) {
      resolve('');
      return;
    }
    
    const video = document.createElement('video');
    // Remove crossOrigin for blob URLs
    if (!videoUrl.startsWith('blob:')) {
      video.crossOrigin = 'anonymous';
    }
    video.preload = 'metadata';

    // Reduced timeout for faster feedback
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve('');
    }, 3000);
    
    // Handle abort signal
    const handleAbort = () => {
      cleanup();
      resolve('');
    };
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', handleAbort);
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', handleAbort);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.pause();
      video.src = '';
    };

    const handleLoadedMetadata = () => {
      if (abortSignal?.aborted) {
        cleanup();
        resolve('');
        return;
      }
      // Ensure seekTime is within valid range
      const validSeekTime = Math.max(0, Math.min(seekTime, video.duration));
      video.currentTime = validSeekTime;
    };

    const handleSeeked = () => {
      if (abortSignal?.aborted) {
        cleanup();
        resolve('');
        return;
      }
      
      try {
        const canvas = document.createElement('canvas');
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        // Smaller canvas for faster processing
        canvas.width = 120;
        canvas.height = canvas.width / aspectRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
          cleanup();
          resolve(thumbnail);
        } else {
          cleanup();
          resolve('');
        }
      } catch (error) {
        cleanup();
        resolve('');
      }
    };

    const handleError = () => {
      console.error('Error loading video for thumbnail');
      cleanup();
      resolve('');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    
    video.src = videoUrl;
  });
};

/**
 * Generates a thumbnail for image files
 */
export const generateImageThumbnail = async (
  imageUrl: string, 
  abortSignal?: AbortSignal
): Promise<string> => {
  return new Promise((resolve) => {
    if (abortSignal?.aborted) {
      resolve('');
      return;
    }
    
    const img = new Image();
    // Remove crossOrigin for blob URLs
    if (!imageUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const timeoutId = setTimeout(() => {
      resolve('');
    }, 3000);
    
    const handleAbort = () => {
      clearTimeout(timeoutId);
      resolve('');
    };
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', handleAbort);
    }

    img.onload = () => {
      clearTimeout(timeoutId);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', handleAbort);
      }
      
      if (abortSignal?.aborted) {
        resolve('');
        return;
      }
      
      try {
        const canvas = document.createElement('canvas');
        const aspectRatio = img.width / img.height;
        canvas.width = 120;
        canvas.height = canvas.width / aspectRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
          resolve(thumbnail);
        } else {
          resolve('');
        }
      } catch (error) {
        resolve('');
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', handleAbort);
      }
      resolve('');
    };

    img.src = imageUrl;
  });
};

/**
 * Generates multiple thumbnails for a video at different timestamps
 */
export const generateVideoFrames = async (
  videoUrl: string,
  frameCount: number = 5,
  startTime: number = 0,
  endTime?: number
): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    // Remove crossOrigin for blob URLs
    if (!videoUrl.startsWith('blob:')) {
      video.crossOrigin = 'anonymous';
    }
    video.preload = 'metadata';
    
    const frames: string[] = [];
    let currentFrame = 0;

    const timeoutId = setTimeout(() => {
      console.warn('Video frames generation timed out');
      video.src = '';
      resolve(frames);
    }, 15000); // Increased timeout for multiple frames

    video.onloadedmetadata = () => {
      const videoDuration = endTime ? endTime : video.duration;
      const effectiveStart = Math.max(0, Math.min(startTime, videoDuration));
      const effectiveEnd = Math.max(effectiveStart, Math.min(videoDuration, endTime || videoDuration));
      const effectiveDuration = effectiveEnd - effectiveStart;
      
      if (effectiveDuration <= 0) {
        clearTimeout(timeoutId);
        video.src = '';
        resolve(frames);
        return;
      }
      
      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          const aspectRatio = video.videoWidth / video.videoHeight;
          canvas.width = 160;
          canvas.height = canvas.width / aspectRatio;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.7));
          }
          
          currentFrame++;
          if (currentFrame < frameCount) {
            // Calculate next seek position within the valid range
            const progress = currentFrame / Math.max(1, frameCount - 1);
            const nextTime = effectiveStart + (progress * effectiveDuration);
            video.currentTime = Math.min(nextTime, videoDuration);
          } else {
            clearTimeout(timeoutId);
            video.src = '';
            resolve(frames);
          }
        } catch (error) {
          console.error('Error capturing frame:', error);
          currentFrame++;
          if (currentFrame < frameCount) {
            const progress = currentFrame / Math.max(1, frameCount - 1);
            const nextTime = effectiveStart + (progress * effectiveDuration);
            video.currentTime = Math.min(nextTime, videoDuration);
          } else {
            clearTimeout(timeoutId);
            video.src = '';
            resolve(frames);
          }
        }
      };

      video.onseeked = captureFrame;
      // Start from the beginning of the specified range
      video.currentTime = effectiveStart;
    };

    video.onerror = (e) => {
      clearTimeout(timeoutId);
      // Silently handle video loading errors (likely invalid blob URLs)
      resolve(frames);
    };

    video.src = videoUrl;
  });
};