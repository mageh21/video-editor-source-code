/**
 * Canvas-based video compositor for transparent videos with backgrounds
 * Handles real-time compositing and frame extraction for export
 */

export interface CompositorOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor?: string;
  backgroundImage?: HTMLImageElement | HTMLVideoElement;
}

export interface VideoFrame {
  canvas: HTMLCanvasElement;
  timestamp: number;
}

export class CanvasVideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backgroundCanvas: HTMLCanvasElement;
  private backgroundCtx: CanvasRenderingContext2D;
  
  constructor(private options: CompositorOptions) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Separate canvas for background to avoid redrawing
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = options.width;
    this.backgroundCanvas.height = options.height;
    this.backgroundCtx = this.backgroundCanvas.getContext('2d')!;
    
    this.setupBackground();
  }
  
  private setupBackground() {
    const { backgroundColor, backgroundImage } = this.options;
    
    if (backgroundImage) {
      // Draw background image/video
      this.backgroundCtx.drawImage(
        backgroundImage,
        0, 0,
        this.options.width,
        this.options.height
      );
    } else if (backgroundColor) {
      // Draw solid color background
      this.backgroundCtx.fillStyle = backgroundColor;
      this.backgroundCtx.fillRect(0, 0, this.options.width, this.options.height);
    } else {
      // Default black background
      this.backgroundCtx.fillStyle = '#000000';
      this.backgroundCtx.fillRect(0, 0, this.options.width, this.options.height);
    }
  }
  
  /**
   * Composite a transparent video frame with the background
   */
  compositeFrame(
    transparentVideo: HTMLVideoElement,
    timestamp: number,
    additionalElements: Array<{
      element: HTMLVideoElement | HTMLImageElement;
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
    }> = []
  ): VideoFrame {
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      
      // Draw background first
      this.ctx.drawImage(this.backgroundCanvas, 0, 0);
      
      // Check if video is ready and has a frame
      if (transparentVideo.readyState >= 2 && transparentVideo.videoWidth > 0) {
        // Draw transparent video with alpha preservation
        if (this.hasAlphaChannel(transparentVideo)) {
          this.drawWithAlpha(transparentVideo);
        } else {
          // Draw video normally but scale to fit canvas
          const aspectRatio = transparentVideo.videoWidth / transparentVideo.videoHeight;
          const canvasAspect = this.options.width / this.options.height;
          
          let drawWidth = this.options.width;
          let drawHeight = this.options.height;
          let drawX = 0;
          let drawY = 0;
          
          if (aspectRatio > canvasAspect) {
            // Video is wider
            drawHeight = this.options.width / aspectRatio;
            drawY = (this.options.height - drawHeight) / 2;
          } else {
            // Video is taller
            drawWidth = this.options.height * aspectRatio;
            drawX = (this.options.width - drawWidth) / 2;
          }
          
          this.ctx.drawImage(transparentVideo, drawX, drawY, drawWidth, drawHeight);
        }
        
        // Draw additional elements (other videos, images, text)
        additionalElements.forEach(({ element, x, y, width, height, opacity }) => {
          this.ctx.save();
          this.ctx.globalAlpha = opacity;
          this.ctx.drawImage(element, x, y, width, height);
          this.ctx.restore();
        });
        
      } else {
        console.warn('Video not ready or no dimensions:', {
          readyState: transparentVideo.readyState,
          videoWidth: transparentVideo.videoWidth,
          videoHeight: transparentVideo.videoHeight,
          currentTime: transparentVideo.currentTime
        });
      }
      
      // Clone canvas for frame capture
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = this.options.width;
      frameCanvas.height = this.options.height;
      const frameCtx = frameCanvas.getContext('2d')!;
      frameCtx.drawImage(this.canvas, 0, 0);
      
      return {
        canvas: frameCanvas,
        timestamp
      };
      
    } catch (error) {
      console.error('Frame composition error:', error);
      // Return black frame as fallback
      const errorCanvas = document.createElement('canvas');
      errorCanvas.width = this.options.width;
      errorCanvas.height = this.options.height;
      return {
        canvas: errorCanvas,
        timestamp
      };
    }
  }
  
  /**
   * Extract frames for the entire video duration with proper video handling
   */
  async extractFrames(
    transparentVideo: HTMLVideoElement,
    progressCallback?: (progress: number) => void
  ): Promise<VideoFrame[]> {
    const frames: VideoFrame[] = [];
    const frameInterval = 1 / this.options.fps;
    const totalFrames = Math.ceil(this.options.duration * this.options.fps);
    
    // Ensure video is loaded and ready
    if (transparentVideo.readyState < 2) {
      await new Promise((resolve) => {
        transparentVideo.addEventListener('loadeddata', resolve, { once: true });
      });
    }
    
    return new Promise((resolve, reject) => {
      let currentFrame = 0;
      let isProcessing = false;
      
      const extractFrame = async () => {
        if (isProcessing) return;
        isProcessing = true;
        
        const timestamp = currentFrame * frameInterval;
        
        if (timestamp >= this.options.duration) {
          resolve(frames);
          return;
        }
        
        try {
          // Set video time and wait for seek completion
          transparentVideo.currentTime = timestamp;
          
          // Wait for the video to seek to the correct frame
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              transparentVideo.removeEventListener('seeked', onSeeked);
              // Small delay to ensure frame is rendered
              setTimeout(seekResolve, 50);
            };
            transparentVideo.addEventListener('seeked', onSeeked);
            
            // Fallback timeout in case seeked doesn't fire
            setTimeout(() => {
              transparentVideo.removeEventListener('seeked', onSeeked);
              seekResolve();
            }, 200);
          });
          
          // Composite frame
          const frame = this.compositeFrame(transparentVideo, timestamp);
          frames.push(frame);
          
          currentFrame++;
          progressCallback?.(currentFrame / totalFrames);
          
          isProcessing = false;
          // Process next frame with small delay
          setTimeout(extractFrame, 100);
          
        } catch (error) {
          console.error('Frame extraction error:', error);
          isProcessing = false;
          reject(error);
        }
      };
      
      extractFrame();
    });
  }
  
  /**
   * Check if video has alpha channel (rough detection)
   */
  private hasAlphaChannel(video: HTMLVideoElement): boolean {
    // Check MIME type
    const src = video.currentSrc || video.src;
    return src.includes('.webm') || src.includes('.mov') || 
           video.videoWidth !== video.videoHeight; // Basic heuristic
  }
  
  /**
   * Draw video preserving alpha channel using pixel manipulation
   */
  private drawWithAlpha(video: HTMLVideoElement) {
    // Create temporary canvas for alpha processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Draw video to temp canvas
    tempCtx.drawImage(video, 0, 0);
    
    // Get image data for alpha processing
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // Process alpha channel (detect and preserve transparency)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // If pixel is close to green screen, make it transparent
      if (this.isGreenScreen(r, g, b)) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
      // Preserve existing alpha for already transparent pixels
    }
    
    // Put processed image data back
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw to main canvas
    this.ctx.drawImage(tempCanvas, 0, 0, this.options.width, this.options.height);
  }
  
  /**
   * Detect green screen pixels (customizable threshold)
   */
  private isGreenScreen(r: number, g: number, b: number, threshold = 120): boolean {
    return g > threshold && r < 100 && b < 100;
  }
  
  /**
   * Update background (for dynamic backgrounds)
   */
  updateBackground(backgroundColor?: string, backgroundImage?: HTMLImageElement | HTMLVideoElement) {
    this.options.backgroundColor = backgroundColor;
    this.options.backgroundImage = backgroundImage;
    this.setupBackground();
  }
  
  /**
   * Convert frames to video blob using MediaRecorder with audio support
   */
  async framesToVideo(
    frames: VideoFrame[], 
    originalVideo?: HTMLVideoElement,
    format = 'video/webm'
  ): Promise<Blob> {
    // Use WebM for better MediaRecorder support, will convert to MP4 later if needed
    const videoStream = this.canvas.captureStream(this.options.fps);
    let finalStream = videoStream;
    
    // Add audio track if original video has audio
    // Check if video has audio by trying to get audio tracks from the video element
    const hasAudio = originalVideo && !originalVideo.muted && originalVideo.volume > 0;
    if (hasAudio) {
      try {
        // Create audio context to capture audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(originalVideo);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Combine video and audio streams
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            audioTrack
          ]);
        }
      } catch (error) {
        console.warn('Audio capture failed, proceeding with video only:', error);
      }
    }
    
    // Try different MediaRecorder formats for better compatibility
    const supportedMimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    let mimeType = format;
    for (const type of supportedMimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    const mediaRecorder = new MediaRecorder(finalStream, { 
      mimeType,
      videoBitsPerSecond: 2000000 // 2Mbps for good quality
    });
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        reject(new Error('MediaRecorder failed'));
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Play frames at correct timing
      let frameIndex = 0;
      const startTime = Date.now();
      
      const playFrame = () => {
        if (frameIndex >= frames.length) {
          // Add a small delay before stopping to ensure last frame is captured
          setTimeout(() => mediaRecorder.stop(), 500);
          return;
        }
        
        const frame = frames[frameIndex];
        const expectedTime = frameIndex * (1000 / this.options.fps);
        const currentTime = Date.now() - startTime;
        
        // Draw frame to canvas
        this.ctx.clearRect(0, 0, this.options.width, this.options.height);
        this.ctx.drawImage(frame.canvas, 0, 0);
        
        frameIndex++;
        
        // Schedule next frame to maintain timing
        const nextFrameTime = expectedTime + (1000 / this.options.fps);
        const delay = Math.max(0, nextFrameTime - currentTime);
        setTimeout(playFrame, delay);
      };
      
      // Start playing frames
      playFrame();
    });
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    this.canvas.remove();
    this.backgroundCanvas.remove();
  }
}