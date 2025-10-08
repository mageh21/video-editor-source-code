'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/app/store';
import { getFile } from '@/app/store';
import { toast } from 'react-hot-toast';
import { Download, Play, Pause, SkipBack, SkipForward, Loader2, X } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { loadFontForBrowser } from '@/app/utils/fontManager';
import { getFontFamilyWithFallbacks } from '@/app/utils/remotion-font-loader';
import { renderCaption } from '@/app/utils/canvasCaptionRenderer';
import { renderInstagramConversation } from '@/app/utils/canvasInstagramRenderer';
import { renderWhatsAppConversation } from '@/app/utils/canvasWhatsAppRenderer';
import { getTransitionStyles } from '@/app/utils/transition-utils';
import { ChromaKeyCanvasProcessor } from './ChromaKeyCanvasProcessor';
import { ProfessionalChromaKey } from './ProfessionalChromaKey';
import type { MediaFile, TextElement, InstagramConversation, WhatsAppConversation } from '@/app/types';

// Add type for window.webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface CanvasTransparencyRendererProps {
  onExportComplete?: (blob: Blob, filename: string) => void;
  onClose?: () => void;
}

interface ExportSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  fps: number;
  codec: string;
  chunkSize?: number; // For memory optimization
}

const QUALITY_PRESETS = {
  low: { bitrate: 2000000, label: 'Low (2 Mbps)' },
  medium: { bitrate: 8000000, label: 'Medium (8 Mbps)' },
  high: { bitrate: 20000000, label: 'High (20 Mbps)' },
  ultra: { bitrate: 40000000, label: 'Ultra (40 Mbps)' }
};

const SOCIAL_MEDIA_PRESETS = {
  instagram_feed: { 
    name: 'Instagram Feed', 
    width: 1080, 
    height: 1080, 
    fps: 30, 
    bitrate: 5000000,
    maxDuration: 60 
  },
  instagram_story: { 
    name: 'Instagram Story/Reels', 
    width: 1080, 
    height: 1920, 
    fps: 30, 
    bitrate: 5000000,
    maxDuration: 90 
  },
  tiktok: { 
    name: 'TikTok', 
    width: 1080, 
    height: 1920, 
    fps: 30, 
    bitrate: 6000000,
    maxDuration: 180 
  },
  youtube_shorts: { 
    name: 'YouTube Shorts', 
    width: 1080, 
    height: 1920, 
    fps: 30, 
    bitrate: 8000000,
    maxDuration: 60 
  },
  twitter: { 
    name: 'Twitter/X', 
    width: 1280, 
    height: 720, 
    fps: 30, 
    bitrate: 5000000,
    maxDuration: 140 
  },
  linkedin: { 
    name: 'LinkedIn', 
    width: 1920, 
    height: 1080, 
    fps: 30, 
    bitrate: 10000000,
    maxDuration: 600 
  }
};

// Format time in MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format time with hours if needed
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

// Helper function to apply transition styles to canvas context
const applyTransitionToCanvas = (
  ctx: CanvasRenderingContext2D,
  transitionStyles: any,
  drawFunction: () => void
) => {
  ctx.save();
  
  // Apply opacity
  if (transitionStyles.opacity !== undefined) {
    ctx.globalAlpha *= transitionStyles.opacity;
  }
  
  // Apply transform
  if (transitionStyles.transform) {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Move to center for transforms
    ctx.translate(centerX, centerY);
    
    // Parse and apply transform
    const transform = transitionStyles.transform;
    
    // Handle translateX
    const translateXMatch = transform.match(/translateX\(([^)]+)\)/);
    if (translateXMatch) {
      const value = translateXMatch[1];
      if (value.includes('%')) {
        const percent = parseFloat(value) / 100;
        ctx.translate(canvas.width * percent, 0);
      } else {
        ctx.translate(parseFloat(value), 0);
      }
    }
    
    // Handle translateY
    const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
    if (translateYMatch) {
      const value = translateYMatch[1];
      if (value.includes('%')) {
        const percent = parseFloat(value) / 100;
        ctx.translate(0, canvas.height * percent);
      } else {
        ctx.translate(0, parseFloat(value));
      }
    }
    
    // Handle scale
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      const scale = parseFloat(scaleMatch[1]);
      ctx.scale(scale, scale);
    }
    
    // Handle rotate
    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      const degrees = parseFloat(rotateMatch[1]);
      ctx.rotate((degrees * Math.PI) / 180);
    }
    
    // Move back from center
    ctx.translate(-centerX, -centerY);
  }
  
  // Apply filter effects
  if (transitionStyles.filter) {
    ctx.filter = transitionStyles.filter;
  }
  
  // Execute the drawing function
  drawFunction();
  
  ctx.restore();
};

export default function CanvasTransparencyRenderer({ onExportComplete, onClose }: CanvasTransparencyRendererProps) {
  const projectState = useAppSelector(state => state.projectState);
  const { mediaFiles, textElements, instagramConversations, whatsappConversations, resolution, duration, projectName, showCaptions, activeCaptionTrackId, captionTracks } = projectState;
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [webmBlob, setWebmBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  
  // Progress tracking
  const [exportStartTime, setExportStartTime] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [processedFrames, setProcessedFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Map<string, MediaElementAudioSourceNode>>(new Map());
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const blankCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const instagramCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const instagramImageCacheRef = useRef<Map<string, Map<string, HTMLImageElement>>>(new Map());
  const whatsappCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const whatsappImageCacheRef = useRef<Map<string, Map<string, HTMLImageElement>>>(new Map());
  
  // Preview controls state
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Export settings state
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    quality: 'ultra',
    bitrate: QUALITY_PRESETS.ultra.bitrate,
    fps: 30,
    codec: 'vp9'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // Batch export state
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [batchExportQueue, setBatchExportQueue] = useState<Array<{
    id: string;
    name: string;
    settings: ExportSettings;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: { url: string; blob: Blob };
    error?: string;
  }>>([]);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const batchExportAbortRef = useRef(false);
  const chromaKeyProcessorRef = useRef<ChromaKeyCanvasProcessor | null>(null);
  const professionalChromaKeyRef = useRef<ProfessionalChromaKey | null>(null);
  
  // Initialize chroma key processors
  useEffect(() => {
    if (!chromaKeyProcessorRef.current) {
      chromaKeyProcessorRef.current = new ChromaKeyCanvasProcessor();
    }
    if (!professionalChromaKeyRef.current) {
      professionalChromaKeyRef.current = new ProfessionalChromaKey();
    }
  }, []);

  // Sort media by row and then by z-index
  const sortedMedia = [...mediaFiles].sort((a, b) => {
    // Sort by row - higher row numbers render first (background)
    // Row 0 is top track and renders last (foreground)
    if (a.row !== b.row) {
      return (b.row || 0) - (a.row || 0); // Higher rows first (background)
    }
    // Then sort by zIndex within the same row
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  // Sort text elements by row and then by z-index
  const sortedTextElements = [...textElements].sort((a, b) => {
    if (a.row !== b.row) {
      return (b.row || 0) - (a.row || 0); // Higher rows first (background)
    }
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  // Sort Instagram conversations by row and then by z-index
  const sortedInstagramConversations = [...instagramConversations].sort((a, b) => {
    if (a.row !== b.row) {
      return (b.row || 0) - (a.row || 0); // Higher rows first (background)
    }
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  // Sort WhatsApp conversations by row and then by z-index
  const sortedWhatsAppConversations = [...whatsappConversations].sort((a, b) => {
    if (a.row !== b.row) {
      return (b.row || 0) - (a.row || 0); // Higher rows first (background)
    }
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  // Combine all elements for proper layering
  type RenderableElement = (MediaFile & { elementType: 'media' }) | 
                          (TextElement & { elementType: 'text' }) | 
                          (InstagramConversation & { elementType: 'instagram' }) |
                          (WhatsAppConversation & { elementType: 'whatsapp' });
  
  const allElements: RenderableElement[] = [
    ...sortedMedia.map(m => ({ ...m, elementType: 'media' as const })),
    ...sortedTextElements.map(t => ({ ...t, elementType: 'text' as const })),
    ...sortedInstagramConversations.map(i => ({ ...i, elementType: 'instagram' as const })),
    ...sortedWhatsAppConversations.map(w => ({ ...w, elementType: 'whatsapp' as const }))
  ];
  
  // Sort all elements together by row and z-index
  const sortedElements = allElements.sort((a, b) => {
    // Calculate effective z-index based on row position
    const aZIndex = a.zIndex !== undefined ? a.zIndex : (1000 - (a.row || 0) * 10);
    const bZIndex = b.zIndex !== undefined ? b.zIndex : (1000 - (b.row || 0) * 10);
    return aZIndex - bZIndex; // Lower z-index renders first
  });
  
  console.log('Instagram conversations in canvas renderer:', {
    count: instagramConversations.length,
    conversations: instagramConversations.map(c => ({
      id: c.id,
      messagesCount: c.messages.length,
      positionStart: c.positionStart,
      positionEnd: c.positionEnd,
      row: c.row
    }))
  });
  
  console.log('WhatsApp conversations in canvas renderer:', {
    count: whatsappConversations.length,
    conversations: whatsappConversations.map(c => ({
      id: c.id,
      messagesCount: c.messages.length,
      positionStart: c.positionStart,
      positionEnd: c.positionEnd,
      row: c.row
    }))
  });

  // Load fonts when component mounts using CSS-based approach
  useEffect(() => {
    const loadFonts = async () => {
      // Get all unique font families used in text elements
      const usedFonts = new Set<string>();
      
      textElements.forEach(t => {
        // Use fontFamily if available (CSS name), otherwise fall back to font (postScriptName)
        const fontToUse = t.fontFamily || t.font;
        if (fontToUse && fontToUse !== 'Inter') {
          usedFonts.add(fontToUse);
        }
      });
      
      // Add caption fonts if captions are enabled
      if (showCaptions && activeCaptionTrackId) {
        const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
        if (activeTrack && activeTrack.style.fontFamily) {
          usedFonts.add(activeTrack.style.fontFamily);
        }
      }
      
      // console.log(`🎨 Canvas: Loading ${usedFonts.size} fonts for rendering:`, Array.from(usedFonts));
      
      // Load fonts via CSS (same approach as FloatingFontPicker)
      const loadPromises = Array.from(usedFonts).map(async (fontFamily) => {
        try {
          // console.log(`🔄 Canvas: Loading font via CSS: ${fontFamily}`);
          
          // Check if already loaded
          const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
          if (existingLink) {
            // console.log(`✅ Canvas: Font "${fontFamily}" already loaded via CSS`);
            return;
          }
          
          // Create Google Fonts CSS URL
          const encodedFamily = fontFamily.replace(/\s+/g, '+');
          const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
          
          // Create and append CSS link
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = cssUrl;
          document.head.appendChild(link);
          
          // Wait for font to load with timeout
          await new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
            setTimeout(reject, 3000); // 3 second timeout for canvas rendering
          });
          
          // console.log(`✅ Canvas: Font "${fontFamily}" loaded successfully via CSS`);
        } catch (error) {
          console.warn(`⚠️ Canvas: Font loading timeout for "${fontFamily}", using fallback`);
        }
      });
      
      await Promise.allSettled(loadPromises);
      setFontsLoaded(true);
      // console.log(`✅ Canvas: All fonts loaded and ready for rendering`);
    };
    
    loadFonts();
  }, [textElements, showCaptions, activeCaptionTrackId, captionTracks]);

  // Advanced chromakey removal function using the ProfessionalChromaKey
  const applyChromaKey = useCallback((
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    keyColor: string,
    similarity: number,
    smooth: number,
    spillSuppress: number = 0.5
  ) => {
    // Use professional chroma key for better quality
    if (!professionalChromaKeyRef.current) return;
    
    console.log('Using ProfessionalChromaKey for maximum quality');
    
    // Process using the professional chroma key processor
    const processedCanvas = professionalChromaKeyRef.current.process(
      sourceCanvas,
      keyColor,
      similarity,
      smooth,
      spillSuppress
    );
    
    // Copy processed result to target canvas
    const ctx = targetCanvas.getContext('2d', { alpha: true });
    if (ctx) {
      // If source and target are the same canvas
      if (sourceCanvas === targetCanvas) {
        // Save current dimensions
        const width = targetCanvas.width;
        const height = targetCanvas.height;
        
        // Clear and redraw
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(processedCanvas, 0, 0);
      } else {
        // Different canvases
        targetCanvas.width = processedCanvas.width;
        targetCanvas.height = processedCanvas.height;
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(processedCanvas, 0, 0);
      }
    }
  }, []);

  const renderFrame = useCallback(async (currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set composite operation for proper alpha blending
    ctx.globalCompositeOperation = 'source-over';
    
    // Canvas size logged once during initialization

    // Draw background (black or colored)
    const bgMedia = sortedMedia.find(m => m.mimeType === 'background/color');
    if (bgMedia) {
      // Background media type doesn't have backgroundColor property
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // For chroma key or transparent videos, use white background for better visibility
      const hasChromaKeyMedia = sortedMedia.some(m => m.chromaKeyEnabled);
      ctx.fillStyle = hasChromaKeyMedia ? '#FFFFFF' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Debug log the sorted elements
    if (currentTime === 0) {
      console.log('Sorted elements for rendering:', sortedElements.map(e => ({
        type: e.elementType,
        id: e.id,
        zIndex: e.zIndex !== undefined ? e.zIndex : (1000 - (e.row || 0) * 10),
        row: e.row,
        positionStart: e.positionStart,
        positionEnd: e.positionEnd
      })));
    }
    
    // Draw all elements in proper z-index order
    for (const element of sortedElements) {
      // Check if element is visible at current time
      if (currentTime < element.positionStart || currentTime > element.positionEnd) continue;

      if (element.elementType === 'media') {
        const media = element;
        if (media.mimeType === 'background/color') continue;

      const opacity = (media.opacity || 100) / 100;
      ctx.globalAlpha = opacity;

      // Calculate transition styles for this media element
      const transitionStyles = getTransitionStyles(
        currentTime,
        media.positionStart,
        media.positionEnd,
        media.entranceTransition,
        media.exitTransition
      );

      if (media.type === 'video') {
        // Get video element (should already exist from processVideo)
        const video = videoElementsRef.current.get(media.id);
        if (!video) continue;

        // For transparent videos, use a different rendering approach
        const isTransparentVideo = media.mimeType?.includes('webm') || media.fileName?.toLowerCase().endsWith('.webm');
        
        if (isTransparentVideo || media.chromaKeyEnabled) {
          const videoDuration = media.endTime - media.startTime;
          const timeInVideo = currentTime - media.positionStart;
          
          // Skip if video should not be visible
          if (timeInVideo > videoDuration) {
            continue;
          }
          
          // Get or create a canvas for this video
          let videoCanvas = videoCanvasesRef.current.get(media.id);
          if (!videoCanvas) {
            videoCanvas = document.createElement('canvas');
            // Check if custom positioning is set (matching Remotion logic)
            const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                    (media.y !== undefined && media.y !== 0) || 
                                    (media.width !== undefined) || 
                                    (media.height !== undefined);
            
            videoCanvas.width = hasCustomPosition && media.width ? media.width : resolution.width;
            videoCanvas.height = hasCustomPosition && media.height ? media.height : resolution.height;
            videoCanvasesRef.current.set(media.id, videoCanvas);
          }
          
          // Draw video to its own canvas
          const videoCtx = videoCanvas.getContext('2d', { alpha: true });
          if (videoCtx && !video.paused && !video.ended && video.readyState >= 2) {
            // Clear the video canvas first
            videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
            
            // Draw the current frame
            try {
              videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
              
              // Apply chromakey if enabled
              if (media.chromaKeyEnabled) {
                console.log(`Applying chroma key to ${media.fileName}`, {
                  color: media.chromaKeyColor || '#00FF00',
                  similarity: media.chromaKeySimilarity || 0.4,
                  smooth: media.chromaKeySmooth || 0.1,
                  spillSuppress: media.chromaKeySpillSuppress || 0.5
                });
                applyChromaKey(
                  videoCanvas,
                  videoCanvas,
                  media.chromaKeyColor || '#00FF00',
                  media.chromaKeySimilarity || 0.4,
                  media.chromaKeySmooth || 0.1,
                  media.chromaKeySpillSuppress || 0.5
                );
              }
            } catch (e) {
              // Video frame not ready
              console.warn('Video frame not ready:', e);
            }
          } else {
            // Clear the canvas if video is not playing
            videoCtx?.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
          }
          
          // Draw the video canvas to main canvas
          // Check if custom positioning is set (matching Remotion logic)
          const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                  (media.y !== undefined && media.y !== 0) || 
                                  (media.width !== undefined) || 
                                  (media.height !== undefined);
          
          const x = hasCustomPosition ? (media.x || 0) : 0;
          const y = hasCustomPosition ? (media.y || 0) : 0;
          const width = hasCustomPosition ? (media.width || canvas.width) : canvas.width;
          const height = hasCustomPosition ? (media.height || canvas.height) : canvas.height;
          
          // Apply transitions when drawing
          applyTransitionToCanvas(ctx, transitionStyles, () => {
            // Ensure proper alpha compositing for chroma keyed videos
            const prevComposite = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(videoCanvas, x, y, width, height);
            ctx.globalCompositeOperation = prevComposite;
          });
        } else {
          // Non-transparent videos - check if chromakey is needed
          if (media.chromaKeyEnabled) {
            // Create temporary canvas for chromakey processing
            const tempCanvas = document.createElement('canvas');
            // Check if custom positioning is set (matching Remotion logic)
            const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                    (media.y !== undefined && media.y !== 0) || 
                                    (media.width !== undefined) || 
                                    (media.height !== undefined);
            
            tempCanvas.width = hasCustomPosition && media.width ? media.width : canvas.width;
            tempCanvas.height = hasCustomPosition && media.height ? media.height : canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { alpha: true });
            
            if (tempCtx) {
              try {
                // Draw video to temp canvas
                tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Apply chromakey directly to temp canvas
                applyChromaKey(
                  tempCanvas,
                  tempCanvas,
                  media.chromaKeyColor || '#00FF00',
                  media.chromaKeySimilarity || 0.4,
                  media.chromaKeySmooth || 0.1,
                  media.chromaKeySpillSuppress || 0.5
                );
                
                // Draw processed video to main canvas
                // Check if custom positioning is set (matching Remotion logic)
                const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                        (media.y !== undefined && media.y !== 0) || 
                                        (media.width !== undefined) || 
                                        (media.height !== undefined);
                
                const x = hasCustomPosition ? (media.x || 0) : 0;
                const y = hasCustomPosition ? (media.y || 0) : 0;
                const width = hasCustomPosition ? (media.width || canvas.width) : canvas.width;
                const height = hasCustomPosition ? (media.height || canvas.height) : canvas.height;
                
                // Apply transitions when drawing
                applyTransitionToCanvas(ctx, transitionStyles, () => {
                  // Ensure proper alpha compositing for chroma keyed videos
                  const prevComposite = ctx.globalCompositeOperation;
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.drawImage(tempCanvas, x, y, width, height);
                  ctx.globalCompositeOperation = prevComposite;
                });
              } catch (e) {
                console.warn('Failed to draw video frame:', media.id, e);
              }
            }
          } else {
            // Direct rendering without chromakey
            // Check if custom positioning is set (matching Remotion logic)
            const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                    (media.y !== undefined && media.y !== 0) || 
                                    (media.width !== undefined) || 
                                    (media.height !== undefined);
            
            const x = hasCustomPosition ? (media.x || 0) : 0;
            const y = hasCustomPosition ? (media.y || 0) : 0;
            const width = hasCustomPosition ? (media.width || canvas.width) : canvas.width;
            const height = hasCustomPosition ? (media.height || canvas.height) : canvas.height;

            try {
              // Apply transitions when drawing
              applyTransitionToCanvas(ctx, transitionStyles, () => {
                ctx.drawImage(video, x, y, width, height);
              });
            } catch (e) {
              console.warn('Failed to draw video frame:', media.id, e);
            }
          }
        }
      } else if (media.type === 'image') {
        // Handle images
        let img = document.getElementById(`img-${media.id}`) as HTMLImageElement;
        if (!img) {
          img = new Image();
          img.id = `img-${media.id}`;
          img.crossOrigin = 'anonymous';
          
          // Use the src if available, otherwise create from file
          if (media.src) {
            img.src = media.src;
          } else {
            const file = await getFile(media.fileId);
            img.src = URL.createObjectURL(file);
          }
          await new Promise(resolve => img.onload = resolve);
        }

        // Check if custom positioning is set (matching Remotion logic)
        const hasCustomPosition = (media.x !== undefined && media.x !== 0) || 
                                (media.y !== undefined && media.y !== 0) || 
                                (media.width !== undefined) || 
                                (media.height !== undefined);
        
        const x = hasCustomPosition ? (media.x || 0) : 0;
        const y = hasCustomPosition ? (media.y || 0) : 0;
        const width = hasCustomPosition ? (media.width || canvas.width) : canvas.width;
        const height = hasCustomPosition ? (media.height || canvas.height) : canvas.height;

        // Apply transitions when drawing
        applyTransitionToCanvas(ctx, transitionStyles, () => {
          ctx.drawImage(img, x, y, width, height);
        });
      }
      } else if (element.elementType === 'text') {
        const text = element;
      // Very explicit time check
      const isAfterStart = currentTime >= text.positionStart;
      const isBeforeEnd = currentTime <= text.positionEnd;
      const shouldRender = isAfterStart && isBeforeEnd;
      
      // Debug logging for canvas renderer
      if (shouldRender) {
        const yPos = text.y || 0;
        const textHeight = (text.fontSize || 32) * 1.4;
        const bottomY = yPos + textHeight;
        console.log('Canvas Text Render:', {
          text: text.text.substring(0, 30) + '...',
          x: text.x || 0,
          y: yPos,
          bottomY: bottomY,
          width: text.width,
          height: text.height,
          fontSize: text.fontSize || 24,
          align: text.align,
          currentTime: currentTime,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          isFullyVisible: yPos >= 0 && bottomY <= canvas.height ? 'YES' : 'PARTIAL/NO',
          visibilityIssue: yPos < 0 ? 'TOP_CUTOFF' : bottomY > canvas.height ? 'BOTTOM_CUTOFF' : 'NONE'
        });
      }
      
      if (!shouldRender) {
        continue;
      }
      
      if (shouldRender) {
        ctx.save();
        
        // Calculate animation values
        const relativeTime = currentTime - text.positionStart;
        const elementDuration = text.positionEnd - text.positionStart;
        
        // Animation parameters
        let animationTransform = '';
        let animationOpacity = 1;
        let translateX = 0;
        let translateY = 0;
        let scale = 1;
        let rotateAnimation = 0;
        
        // Apply enter animation
        const inDuration = (text.animationInDuration || 0.5);
        if (text.animationIn && text.animationIn !== 'none' && relativeTime < inDuration) {
          const progress = Math.min(1, relativeTime / inDuration);
          
          switch (text.animationIn) {
            case 'fade':
              animationOpacity = progress;
              break;
            case 'slide-left':
              translateX = -100 * (1 - progress);
              break;
            case 'slide-right':
              translateX = 100 * (1 - progress);
              break;
            case 'slide-up':
              translateY = 100 * (1 - progress);
              break;
            case 'slide-down':
              translateY = -100 * (1 - progress);
              break;
            case 'zoom-in':
              scale = progress;
              break;
            case 'zoom-out':
              scale = 2 - progress;
              break;
            case 'bounce':
              // Simple bounce effect
              scale = 1 + Math.sin(progress * Math.PI) * 0.3;
              break;
            case 'flip':
              rotateAnimation = 180 * (1 - progress);
              break;
            case 'rotate':
              rotateAnimation = 360 * (1 - progress);
              break;
          }
        }
        
        // Apply exit animation
        const outDuration = (text.animationOutDuration || 0.5);
        const outStartTime = elementDuration - outDuration;
        if (text.animationOut && text.animationOut !== 'none' && relativeTime >= outStartTime) {
          const outProgress = Math.min(1, (relativeTime - outStartTime) / outDuration);
          
          switch (text.animationOut) {
            case 'fade':
              animationOpacity = 1 - outProgress;
              break;
            case 'slide-left':
              translateX = -100 * outProgress;
              break;
            case 'slide-right':
              translateX = 100 * outProgress;
              break;
            case 'slide-up':
              translateY = -100 * outProgress;
              break;
            case 'slide-down':
              translateY = 100 * outProgress;
              break;
            case 'zoom-in':
              scale = 1 + outProgress;
              break;
            case 'zoom-out':
              scale = 1 - outProgress;
              break;
            case 'bounce':
              scale = 1 + (1 - Math.cos(outProgress * Math.PI)) * 0.3;
              break;
            case 'flip':
              rotateAnimation = -180 * outProgress;
              break;
            case 'rotate':
              rotateAnimation = -360 * outProgress;
              break;
          }
        }
        
        // Apply loop animation
        if (text.animationLoop && text.animationLoop !== 'none') {
          const loopSpeed = text.animationLoopSpeed || 1;
          const loopProgress = (relativeTime * loopSpeed) % 2;
          
          switch (text.animationLoop) {
            case 'pulse':
              scale *= 1 + Math.sin(loopProgress * Math.PI) * 0.1;
              break;
            case 'wiggle':
              rotateAnimation += Math.sin(loopProgress * Math.PI * 2) * 5;
              break;
            case 'float':
              translateY += Math.sin(loopProgress * Math.PI) * 10;
              break;
            case 'spin':
              rotateAnimation += (loopProgress * 180);
              break;
            case 'blink':
              animationOpacity *= Math.sin(loopProgress * Math.PI * 2) > 0 ? 1 : 0.3;
              break;
            case 'shake':
              translateX += Math.sin(loopProgress * Math.PI * 10) * 2;
              break;
          }
        }
        
        // Apply all transformations
        const centerX = text.x + (text.width || 0) / 2;
        const centerY = text.y + (text.height || 0) / 2;
        
        // Apply animation transforms
        ctx.translate(centerX, centerY);
        
        // Apply scale
        if (scale !== 1) {
          ctx.scale(scale, scale);
        }
        
        // Apply rotation (including animation rotation)
        const totalRotation = (text.rotation || 0) + rotateAnimation;
        if (totalRotation !== 0) {
          ctx.rotate((totalRotation * Math.PI) / 180);
        }
        
        // Apply translation for animations
        const pixelTranslateX = (translateX / 100) * (text.width || 200);
        const pixelTranslateY = (translateY / 100) * (text.height || 100);
        ctx.translate(pixelTranslateX + -centerX, pixelTranslateY + -centerY);
        
        // Set text properties
        let fontSize = text.fontSize || 32;
        
        // Use fontFamily if available (CSS name), otherwise fall back to font (postScriptName)
        const fontFamily = text.fontFamily || text.font || 'Roboto';
        
        // Create proper font fallback chain
        const fontFallbacks = `"${fontFamily}", "Inter", system-ui, -apple-system, sans-serif`;
        
        console.log(`🖼️ Canvas rendering text "${text.text.substring(0, 20)}..." with font: ${fontFamily}`);
        
        // Apply opacity (combine element opacity with animation opacity)
        ctx.globalAlpha = ((text.opacity || 100) / 100) * animationOpacity;
        
        // Use the text element's coordinates directly
        const textX = text.x !== undefined ? text.x : resolution.width / 2;
        const textY = text.y !== undefined ? text.y : resolution.height / 2;
        
        // Set initial font to measure text with proper weight and style
        const fontWeight = text.fontWeight || 400; // Use text element's font weight or default to 400
        const fontStyle = text.italic ? 'italic' : 'normal';
        
        // CSS font shorthand: [font-style] [font-weight] [font-size] [font-family]
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFallbacks}`;
        // Don't set textAlign here - we'll handle it manually for consistency
        ctx.textAlign = 'left'; // Always use left alignment and calculate position manually
        ctx.textBaseline = 'top';
        
        console.log(`🖼️ Canvas: Set font "${fontFallbacks}" with weight ${fontWeight}, style ${fontStyle}, size ${fontSize}px`);
        
        let drawX = textX;
        
        // Calculate vertical position - center text vertically within its height
        // Canvas fillText uses baseline, so we need to adjust
        const textMetrics = ctx.measureText(text.text);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        
        // For text rendering, y represents where the text should appear
        // We use textBaseline='top', so y is the top of the text
        let drawY = textY;
        
        // Check if we need to adjust for padding (matching preview behavior)
        let textPaddingX = 0;
        let textPaddingY = 0;
        
        // Function to wrap text (defined early to use in background calculation)
        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines: string[] = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);
          return lines;
        };
        
        // Draw background if set (enhanced for better alignment)
        if (text.backgroundColor && text.backgroundColor !== 'transparent') {
          const paddingY = 12;
          const paddingX = 20; // Match preview: '12px 20px'
          
          // Adjust text position to account for padding (matching preview)
          textPaddingX = paddingX;
          textPaddingY = paddingY;
          
          // Apply text transformation for background calculation too
          const transformTextForBg = (text: string, transform?: string): string => {
            if (!transform || transform === 'none') return text;
            
            switch (transform) {
              case 'uppercase':
                return text.toUpperCase();
              case 'lowercase':
                return text.toLowerCase();
              case 'capitalize':
                return text.replace(/\b\w/g, char => char.toUpperCase());
              default:
                return text;
            }
          };
          
          const transformedTextForBg = transformTextForBg(text.text, text.textTransform);
          
          // For background, we need to consider text wrapping
          const wrapWidth = text.width ? (text.width - paddingX * 2) : undefined;
          const lines = wrapWidth ? wrapText(transformedTextForBg, wrapWidth) : [transformedTextForBg];
          const lineHeight = fontSize * 1.4;
          
          // Calculate background dimensions based on all lines
          let maxLineWidth = 0;
          lines.forEach(line => {
            const lineMetrics = ctx.measureText(line);
            maxLineWidth = Math.max(maxLineWidth, lineMetrics.width);
          });
          
          const bgWidth = text.width ? text.width : (maxLineWidth + paddingX * 2);
          const bgHeight = (lines.length * lineHeight) + (paddingY * 2);
          
          // Background positioning based on text alignment
          let bgX = drawX;
          if (text.align === 'center' && text.width) {
            bgX = drawX; // Keep container position for centered text
          } else if (text.align === 'right' && text.width) {
            bgX = drawX; // Keep container position for right-aligned text
          }
          
          const bgY = drawY;
          
          // Draw background with different shapes
          ctx.fillStyle = text.backgroundColor;
          
          const drawBackgroundShape = (shape: string = 'rounded') => {
            ctx.beginPath();
            
            switch (shape) {
              case 'rectangle':
                ctx.rect(bgX, bgY, bgWidth, bgHeight);
                break;
                
              case 'rounded':
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8);
                break;
                
              case 'pill':
                const pillRadius = Math.min(bgHeight / 2, bgWidth / 4);
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight, pillRadius);
                break;
                
              case 'bubble':
                const bubbleRadius = Math.min(bgHeight / 3, 16);
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight, bubbleRadius);
                break;
                
              case 'marker':
                // Marker style with slanted edges
                const markerSlant = 8;
                ctx.moveTo(bgX + markerSlant, bgY);
                ctx.lineTo(bgX + bgWidth, bgY);
                ctx.lineTo(bgX + bgWidth - markerSlant, bgY + bgHeight);
                ctx.lineTo(bgX, bgY + bgHeight);
                ctx.closePath();
                break;
                
              case 'underline':
                // Only draw underline at bottom
                const underlineHeight = Math.max(4, bgHeight * 0.2);
                ctx.rect(bgX, bgY + bgHeight - underlineHeight, bgWidth, underlineHeight);
                break;
                
              case 'speech':
                // Speech bubble with tail
                const speechRadius = 12;
                const tailSize = 8;
                
                // Main bubble (without tail for now - simplified)
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight - tailSize, speechRadius);
                
                // Add small tail (triangle)
                const tailX = bgX + bgWidth * 0.2;
                ctx.moveTo(tailX, bgY + bgHeight - tailSize);
                ctx.lineTo(tailX + tailSize, bgY + bgHeight);
                ctx.lineTo(tailX + tailSize * 2, bgY + bgHeight - tailSize);
                break;
                
              default:
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8);
                break;
            }
            
            ctx.fill();
          };
          
          drawBackgroundShape(text.backgroundShape || 'rounded');
          console.log(`🎨 Canvas: Background shape "${text.backgroundShape || 'rounded'}" applied`);
          
          console.log(`🎨 Canvas: Drew background for "${text.text.substring(0, 20)}..." - ${bgWidth}x${bgHeight} at (${bgX},${bgY})`);
        }
        

        // Apply text transformation before wrapping
        const transformText = (text: string, transform?: string): string => {
          if (!transform || transform === 'none') return text;
          
          switch (transform) {
            case 'uppercase':
              return text.toUpperCase();
            case 'lowercase':
              return text.toLowerCase();
            case 'capitalize':
              return text.replace(/\b\w/g, char => char.toUpperCase());
            default:
              return text;
          }
        };
        
        const transformedText = transformText(text.text, text.textTransform);
        
        // Wrap text if width is defined
        // When wrapping, account for padding to match preview behavior
        const wrapWidth = text.width ? (text.width - textPaddingX * 2) : undefined;
        const lines = wrapWidth ? wrapText(transformedText, wrapWidth) : [transformedText];
        
        console.log(`🖼️ Canvas: Applied text transform "${text.textTransform || 'none'}" to "${text.text}" → "${transformedText}"`);
        const lineHeight = fontSize * 1.4; // Match preview line height

        // Draw each line
        lines.forEach((line, index) => {
          const lineY = drawY + textPaddingY + (index * lineHeight);
          let lineX = drawX + textPaddingX;
          
          // Calculate X position for each line based on alignment
          if (text.align === 'center' && text.width) {
            const lineMetrics = ctx.measureText(line);
            // When centering, we need to consider the effective width (minus padding)
            const effectiveWidth = text.width - (textPaddingX * 2);
            lineX = textX + textPaddingX + (effectiveWidth - lineMetrics.width) / 2;
          } else if (text.align === 'right' && text.width) {
            const lineMetrics = ctx.measureText(line);
            lineX = textX + text.width - lineMetrics.width - textPaddingX;
          }
          
          // Draw text stroke if specified (for meme-style text)
          if (text.strokeWidth && text.strokeColor) {
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = text.strokeWidth;
            ctx.strokeText(line, lineX, lineY);
          }
          
          // Draw text with proper color
          ctx.fillStyle = text.color || '#FFFFFF';
          ctx.fillText(line, lineX, lineY);
          
          // Draw underline if specified
          if (text.underline) {
            const lineMetrics = ctx.measureText(line);
            const underlineY = lineY + fontSize + 2; // Position underline slightly below text
            const underlineThickness = Math.max(1, fontSize / 20); // Scale thickness with font size
            
            ctx.strokeStyle = text.color || '#FFFFFF';
            ctx.lineWidth = underlineThickness;
            ctx.beginPath();
            ctx.moveTo(lineX, underlineY);
            ctx.lineTo(lineX + lineMetrics.width, underlineY);
            ctx.stroke();
          }
        });
        
        ctx.restore();
      }
      } else if (element.elementType === 'instagram') {
        const conversation = element;
      // Check if conversation is visible at current time
      if (currentTime < conversation.positionStart || currentTime > conversation.positionEnd) {
        console.log(`Skipping conversation ${conversation.id}: outside time range`, {
          currentTime,
          start: conversation.positionStart,
          end: conversation.positionEnd
        });
        continue;
      }

      console.log(`Rendering conversation ${conversation.id} at time ${currentTime}`);

      // Get or create an off-screen canvas for the Instagram conversation
      let conversationCanvas = instagramCanvasesRef.current.get(conversation.id);
      if (!conversationCanvas) {
        conversationCanvas = document.createElement('canvas');
        // Use higher resolution based on quality setting for ultra-quality rendering
        const pixelRatio = exportSettings.quality === 'ultra' ? 3 : 2;
        conversationCanvas.width = 360 * pixelRatio;
        conversationCanvas.height = 640 * pixelRatio;
        conversationCanvas.style.width = '360px';
        conversationCanvas.style.height = '640px';
        
        // Scale the context to match the pixel ratio
        const convCtx = conversationCanvas.getContext('2d');
        if (convCtx) {
          convCtx.scale(pixelRatio, pixelRatio);
          
          // Enable maximum quality settings
          convCtx.imageSmoothingEnabled = true;
          convCtx.imageSmoothingQuality = 'high';
          if ('filter' in convCtx) {
            // Add slight sharpening filter for crisper text
            (convCtx as any).filter = 'contrast(1.02) saturate(1.02)';
          }
        }
        
        instagramCanvasesRef.current.set(conversation.id, conversationCanvas);
      }
      const conversationCtx = conversationCanvas.getContext('2d');
      
      if (conversationCtx) {
        // Calculate relative time within the conversation
        const conversationRelativeTime = currentTime - conversation.positionStart;
        const conversationDuration = conversation.positionEnd - conversation.positionStart;
        
        console.log(`Conversation timing:`, {
          globalCurrentTime: currentTime,
          conversationStart: conversation.positionStart,
          conversationRelativeTime,
          conversationDuration
        });
        
        // Get or create image cache for this conversation
        let imageCache = instagramImageCacheRef.current.get(conversation.id);
        if (!imageCache) {
          imageCache = new Map();
          instagramImageCacheRef.current.set(conversation.id, imageCache);
        }
        
        // Render the Instagram conversation to the off-screen canvas
        renderInstagramConversation(conversationCtx, conversation, conversationRelativeTime, imageCache);
        
        // Apply opacity - fix for conversations created with opacity: 1 instead of 100
        let opacity = conversation.opacity !== undefined ? conversation.opacity : 100;
        if (opacity <= 1) {
          console.warn(`Fixing low opacity value: ${opacity} -> 100`);
          opacity = 100;
        }
        ctx.globalAlpha = opacity / 100;
        
        // Calculate scaling to fit 9:16 aspect ratio
        // Instagram conversation is 360x640 (9:16 ratio)
        // Canvas is resolution.width x resolution.height
        
        // Calculate scale factor to fit the canvas while maintaining aspect ratio
        const scaleX = resolution.width / 360;
        const scaleY = resolution.height / 640;
        const scale = Math.min(scaleX, scaleY); // Use the smaller scale to fit within bounds
        
        // Calculate scaled dimensions
        const scaledWidth = 360 * scale;
        const scaledHeight = 640 * scale;
        
        // Center the conversation if no position is set
        const x = conversation.x !== undefined ? conversation.x : (resolution.width - scaledWidth) / 2;
        const y = conversation.y !== undefined ? conversation.y : (resolution.height - scaledHeight) / 2;
        
        console.log(`Drawing conversation with scale ${scale}:`, {
          originalSize: { width: 360, height: 640 },
          scaledSize: { width: scaledWidth, height: scaledHeight },
          position: { x, y },
          canvasSize: { width: resolution.width, height: resolution.height }
        });
        
        try {
          // Draw the scaled Instagram conversation
          ctx.drawImage(conversationCanvas, x, y, scaledWidth, scaledHeight);
          console.log('Successfully drew conversation canvas');
        } catch (error) {
          console.error('Error drawing conversation canvas:', error);
          
          // Fallback: draw a placeholder if Instagram rendering fails
          ctx.save();
          ctx.fillStyle = 'rgba(228, 64, 95, 0.1)'; // Instagram brand color with transparency
          ctx.fillRect(x, y, scaledWidth, scaledHeight);
          
          // Draw error message
          ctx.fillStyle = '#E4405F';
          ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Instagram Content', x + scaledWidth / 2, y + scaledHeight / 2 - 10);
          ctx.fillText('Rendering Error', x + scaledWidth / 2, y + scaledHeight / 2 + 10);
          ctx.restore();
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
      } else {
        console.error('Failed to get 2D context for conversation canvas');
      }
      } else if (element.elementType === 'whatsapp') {
        const conversation = element;
      // Check if conversation is visible at current time
      if (currentTime < conversation.positionStart || currentTime > conversation.positionEnd) {
        console.log(`Skipping WhatsApp conversation ${conversation.id}: outside time range`, {
          currentTime,
          start: conversation.positionStart,
          end: conversation.positionEnd
        });
        continue;
      }

      console.log(`Rendering WhatsApp conversation ${conversation.id} at time ${currentTime}`);

      // Get or create an off-screen canvas for the WhatsApp conversation
      let conversationCanvas = whatsappCanvasesRef.current.get(conversation.id);
      if (!conversationCanvas) {
        conversationCanvas = document.createElement('canvas');
        // Use higher resolution based on quality setting for ultra-quality rendering
        const pixelRatio = exportSettings.quality === 'ultra' ? 3 : 2;
        conversationCanvas.width = 360 * pixelRatio;
        conversationCanvas.height = 640 * pixelRatio;
        conversationCanvas.style.width = '360px';
        conversationCanvas.style.height = '640px';
        
        // Scale the context to match the pixel ratio
        const convCtx = conversationCanvas.getContext('2d');
        if (convCtx) {
          convCtx.scale(pixelRatio, pixelRatio);
          
          // Enable maximum quality settings
          convCtx.imageSmoothingEnabled = true;
          convCtx.imageSmoothingQuality = 'high';
          if ('filter' in convCtx) {
            // Add slight sharpening filter for crisper text
            (convCtx as any).filter = 'contrast(1.02) saturate(1.02)';
          }
        }
        
        whatsappCanvasesRef.current.set(conversation.id, conversationCanvas);
      }
      const conversationCtx = conversationCanvas.getContext('2d');
      
      if (conversationCtx) {
        // Calculate relative time within the conversation
        const conversationRelativeTime = currentTime - conversation.positionStart;
        const conversationDuration = conversation.positionEnd - conversation.positionStart;
        
        console.log(`WhatsApp Conversation timing:`, {
          globalCurrentTime: currentTime,
          conversationStart: conversation.positionStart,
          conversationRelativeTime,
          conversationDuration
        });
        
        // Get or create image cache for this conversation
        let imageCache = whatsappImageCacheRef.current.get(conversation.id);
        if (!imageCache) {
          imageCache = new Map();
          whatsappImageCacheRef.current.set(conversation.id, imageCache);
        }
        
        // Render the WhatsApp conversation to the off-screen canvas
        renderWhatsAppConversation(conversationCtx, conversation, conversationRelativeTime, imageCache);
        
        // Apply opacity - fix for conversations created with opacity: 1 instead of 100
        let opacity = conversation.opacity !== undefined ? conversation.opacity : 100;
        if (opacity <= 1) {
          console.warn(`Fixing low opacity value: ${opacity} -> 100`);
          opacity = 100;
        }
        ctx.globalAlpha = opacity / 100;
        
        // Calculate scaling to fit 9:16 aspect ratio
        // WhatsApp conversation is 360x640 (9:16 ratio)
        // Canvas is resolution.width x resolution.height
        
        // Calculate scale factor to fit the canvas while maintaining aspect ratio
        const scaleX = resolution.width / 360;
        const scaleY = resolution.height / 640;
        const scale = Math.min(scaleX, scaleY); // Use the smaller scale to fit within bounds
        
        // Calculate scaled dimensions
        const scaledWidth = 360 * scale;
        const scaledHeight = 640 * scale;
        
        // Center the conversation on the canvas
        const x = (resolution.width - scaledWidth) / 2;
        const y = (resolution.height - scaledHeight) / 2;
        
        console.log('WhatsApp conversation rendering details:', {
          originalSize: { width: 360, height: 640 },
          canvasSize: { width: resolution.width, height: resolution.height },
          scale,
          scaledSize: { width: scaledWidth, height: scaledHeight },
          position: { x, y }
        });
        
        try {
          // Draw the scaled WhatsApp conversation
          ctx.drawImage(conversationCanvas, x, y, scaledWidth, scaledHeight);
          console.log('Successfully drew WhatsApp conversation canvas');
        } catch (error) {
          console.error('Error drawing WhatsApp conversation canvas:', error);
          
          // Fallback: draw a placeholder if WhatsApp rendering fails
          ctx.save();
          ctx.fillStyle = 'rgba(0, 168, 132, 0.1)'; // WhatsApp brand color with transparency
          ctx.fillRect(x, y, scaledWidth, scaledHeight);
          
          // Draw error message
          ctx.fillStyle = '#00A884';
          ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('WhatsApp Content', x + scaledWidth / 2, y + scaledHeight / 2 - 10);
          ctx.fillText('Rendering Error', x + scaledWidth / 2, y + scaledHeight / 2 + 10);
          ctx.restore();
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
      } else {
        console.error('Failed to get 2D context for WhatsApp conversation canvas');
      }
      }
    } // End of sortedElements loop

    // Render captions if enabled
    if (showCaptions && activeCaptionTrackId) {
      const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
      if (activeTrack && activeTrack.captions.length > 0) {
        // Find the caption that should be displayed at the current time
        const currentCaption = activeTrack.captions.find(caption => {
          const startTime = (caption as any).start ?? caption.startMs / 1000;
          const endTime = (caption as any).end ?? caption.endMs / 1000;
          return currentTime >= startTime && currentTime <= endTime;
        });

        if (currentCaption) {
          // Use the advanced caption renderer
          renderCaption(
            ctx,
            currentCaption,
            activeTrack.style,
            currentTime,
            canvas.width,
            canvas.height
          );
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [sortedElements, sortedMedia, applyChromaKey, resolution, textElements, showCaptions, activeCaptionTrackId, captionTracks]);

  const animate = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = now;
    
    const newTime = currentPreviewTime + deltaTime;
    
    if (newTime >= duration) {
      setIsPlaying(false);
      setCurrentPreviewTime(duration);
      return;
    }
    
    setCurrentPreviewTime(newTime);
    renderFrame(newTime);
    animationRef.current = requestAnimationFrame(animate);
  }, [duration, renderFrame, currentPreviewTime]);

  const togglePreview = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      // Reset to beginning if at end
      if (currentPreviewTime >= duration) {
        setCurrentPreviewTime(0);
      }
      setIsPlaying(true);
      lastFrameTimeRef.current = Date.now();
      animate();
    }
  }, [isPlaying, animate, currentPreviewTime, duration]);
  
  // Seek to specific time
  const seekToTime = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(duration, time));
    setCurrentPreviewTime(clampedTime);
    renderFrame(clampedTime);
  }, [duration, renderFrame]);
  
  // Handle seek bar input
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setIsSeeking(true);
    seekToTime(time);
  }, [seekToTime]);
  
  // Handle seek end
  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
    if (isPlaying) {
      lastFrameTimeRef.current = Date.now();
    }
  }, [isPlaying]);

  // Add to batch export queue
  const addToBatchQueue = useCallback((name: string, settings: ExportSettings) => {
    const id = Date.now().toString();
    setBatchExportQueue(prev => [...prev, {
      id,
      name,
      settings,
      status: 'pending'
    }]);
  }, []);
  
  // Process batch export
  const processBatchExport = useCallback(async () => {
    setIsBatchExporting(true);
    batchExportAbortRef.current = false;
    
    for (const item of batchExportQueue) {
      if (batchExportAbortRef.current) break;
      if (item.status !== 'pending') continue;
      
      try {
        // Update status to processing
        setBatchExportQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'processing' as const } : i
        ));
        
        // Process video with item settings
        const prevSettings = exportSettings;
        setExportSettings(item.settings);
        
        // We need to process the video with these settings
        // Since processVideo is complex, we'll create a simplified version for batch
        const blob = await processSingleExport(item.settings);
        
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBatchExportQueue(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              status: 'completed' as const,
              result: { url, blob },
              progress: 100
            } : i
          ));
        }
        
        // Restore previous settings
        setExportSettings(prevSettings);
        
      } catch (error) {
        setBatchExportQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'failed' as const,
            error: (error as Error).message
          } : i
        ));
      }
    }
    
    setIsBatchExporting(false);
    toast.success('Batch export completed!');
  }, [batchExportQueue, exportSettings]);
  
  // Preload Instagram conversation images
  const preloadInstagramImages = useCallback(async () => {
    // console.log('Preloading Instagram conversation images...');
    const loadPromises: Promise<void>[] = [];
    
    for (const conversation of instagramConversations) {
      let imageCache = instagramImageCacheRef.current.get(conversation.id);
      if (!imageCache) {
        imageCache = new Map();
        instagramImageCacheRef.current.set(conversation.id, imageCache);
      }
      
      // Preload participant avatars
      for (const participant of conversation.participants) {
        if (participant.avatar) {
          const src = participant.avatar;
          if (!imageCache.has(src)) {
            const promise = new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                imageCache!.set(src, img);
                // console.log(`Loaded Instagram avatar: ${src}`);
                resolve();
              };
              img.onerror = (error) => {
                console.error(`Failed to load Instagram avatar: ${src}`, error);
                resolve(); // Resolve anyway to not block export
              };
              img.src = src;
            });
            loadPromises.push(promise);
          }
        }
      }
      
      // Preload message images
      for (const message of conversation.messages) {
        if (message.messageType === 'image' && message.media?.src) {
          const src = message.media.src;
          if (!imageCache.has(src)) {
            const promise = new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                imageCache!.set(src, img);
                // console.log(`Loaded Instagram image: ${src}`);
                resolve();
              };
              img.onerror = (error) => {
                console.error(`Failed to load Instagram image: ${src}`, error);
                resolve(); // Resolve anyway to not block export
              };
              img.src = src;
            });
            loadPromises.push(promise);
          }
        }
      }
    }
    
    await Promise.all(loadPromises);
    // console.log(`Preloaded ${loadPromises.length} Instagram images`);
  }, [instagramConversations]);
  
  // Preload WhatsApp conversation images
  const preloadWhatsAppImages = useCallback(async () => {
    const loadPromises: Promise<void>[] = [];
    
    for (const conversation of whatsappConversations) {
      let imageCache = whatsappImageCacheRef.current.get(conversation.id);
      if (!imageCache) {
        imageCache = new Map();
        whatsappImageCacheRef.current.set(conversation.id, imageCache);
      }
      
      // Preload participant avatars
      for (const participant of conversation.participants) {
        if (participant.avatar) {
          const src = participant.avatar;
          if (!imageCache.has(src)) {
            const promise = new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                imageCache.set(src, img);
                resolve();
              };
              img.onerror = () => {
                console.warn(`Failed to load WhatsApp participant avatar: ${src}`);
                resolve();
              };
              img.crossOrigin = 'anonymous';
              img.src = src;
            });
            loadPromises.push(promise);
          }
        }
      }
      
      // Preload message media
      for (const message of conversation.messages) {
        if ((message.media as any)?.src) {
          const src = (message.media as any).src;
          if (!imageCache.has(src)) {
            const promise = new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                imageCache.set(src, img);
                resolve();
              };
              img.onerror = () => {
                console.warn(`Failed to load WhatsApp message media: ${src}`);
                resolve();
              };
              img.crossOrigin = 'anonymous';
              img.src = src;
            });
            loadPromises.push(promise);
          }
        }
      }
    }
    
    await Promise.all(loadPromises);
  }, [whatsappConversations]);
  
  // Simplified export function for batch processing
  const processSingleExport = useCallback(async (settings: ExportSettings): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const chunks: Blob[] = [];
    
    try {
      // Configure MediaRecorder with quality settings
      const canvasStream = canvas.captureStream(settings.fps);
      const mimeType = settings.codec === 'vp9' 
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm;codecs=vp8,opus';
        
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: settings.bitrate
      });
      
      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        
        mediaRecorder.onerror = reject;
        
        // Start recording
        mediaRecorder.start(100);
        
        // Simple render loop for batch export
        const startTime = performance.now();
        const renderBatchFrame = () => {
          const elapsed = performance.now() - startTime;
          const currentTime = elapsed / 1000;
          
          if (currentTime >= duration || batchExportAbortRef.current) {
            mediaRecorder.stop();
            return;
          }
          
          renderFrame(currentTime).then(() => {
            requestAnimationFrame(renderBatchFrame);
          });
        };
        
        renderBatchFrame();
      });
      
    } catch (error) {
      console.error('Batch export failed:', error);
      return null;
    }
  }, [duration, renderFrame]);

  // Convert WebM to MP4 using FFmpeg
  const convertToMp4 = useCallback(async () => {
    if (!webmBlob) {
      toast.error('No WebM file to convert');
      return;
    }

    setIsConverting(true);
    setCurrentStage('Converting to MP4...');
    setProgress(0);
    
    try {
      // Load FFmpeg
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(progress * 100);
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      // Write WebM file
      const webmData = new Uint8Array(await webmBlob.arrayBuffer());
      await ffmpeg.writeFile('input.webm', webmData);

      // Convert to MP4 - transparency will be composited on black background
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      // Read the output
      const mp4Data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([mp4Data], { type: 'video/mp4' });
      const mp4Url = URL.createObjectURL(mp4Blob);
      
      setMp4Url(mp4Url);
      toast.success('Converted to MP4 successfully!');
      
    } catch (error) {
      console.error('MP4 conversion failed:', error);
      toast.error('Failed to convert to MP4');
    } finally {
      setIsConverting(false);
    }
  }, [webmBlob]);

  const processVideo = useCallback(async () => {
    if (!canvasRef.current) return;
    
    // Wait for fonts to load
    if (!fontsLoaded) {
      toast.error('Fonts are still loading. Please wait...');
      return;
    }
    
    // Check if duration is valid
    if (!duration || duration <= 0) {
      toast.error('Invalid duration. Please check your timeline.');
      return;
    }
    
    
    console.log('Starting video processing:', {
      duration,
      fps: exportSettings.fps,
      mediaCount: sortedMedia.length,
      textCount: sortedTextElements.length,
      instagramCount: instagramConversations.length,
      whatsappCount: whatsappConversations.length
    });
    
    setIsProcessing(true);
    setProgress(0);
    setExportStartTime(Date.now());
    setCurrentStage('Preparing media files...');
    
    // Calculate total frames
    const totalFramesToProcess = Math.ceil(duration * exportSettings.fps);
    setTotalFrames(totalFramesToProcess);
    setProcessedFrames(0);

    try {
      const canvas = canvasRef.current;
      
      // Pre-load all video elements
      setCurrentStage('Loading media files...');
      toast('Loading media files...', { icon: 'ℹ️' });
      
      // Preload Instagram conversation images
      await preloadInstagramImages();
      await preloadWhatsAppImages();
      
      for (const media of sortedMedia) {
        if (media.type === 'video' && !videoElementsRef.current.has(media.id)) {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          
          // Use the src if available, otherwise create from file
          if (media.src) {
            video.src = media.src;
          } else {
            const file = await getFile(media.fileId);
            video.src = URL.createObjectURL(file);
          }
          
          // Wait for video to be ready
          await new Promise((resolve, reject) => {
            video.onloadeddata = resolve;
            video.onerror = reject;
            video.load();
          });
          
          // If video should be visible at time 0, seek to its start time
          if (media.positionStart === 0) {
            video.currentTime = media.startTime;
            // Wait for seek to complete
            await new Promise(resolve => {
              video.onseeked = resolve;
              if (video.readyState >= 2) {
                resolve(null);
              }
            });
          }
          
          videoElementsRef.current.set(media.id, video);
        }
      }

      // Set up audio context for audio mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Create audio sources for videos/audio that need sound
      const audioSources: { media: typeof sortedMedia[0], source: MediaElementAudioSourceNode, gainNode: GainNode }[] = [];
      
      for (const media of sortedMedia) {
        if ((media.type === 'video' || media.type === 'audio') && media.volume > 0) {
          let element: HTMLMediaElement;
          
          if (media.type === 'video') {
            // Create a separate video element for audio
            const audioVideo = document.createElement('video');
            audioVideo.crossOrigin = 'anonymous';
            // Use the src if available, otherwise create from file
            if (media.src) {
              audioVideo.src = media.src;
            } else {
              const file = await getFile(media.fileId);
              audioVideo.src = URL.createObjectURL(file);
            }
            await audioVideo.load();
            element = audioVideo;
          } else {
            // Create audio element
            const audio = document.createElement('audio');
            audio.crossOrigin = 'anonymous';
            // Use the src if available, otherwise create from file
            if (media.src) {
              audio.src = media.src;
            } else {
              const file = await getFile(media.fileId);
              audio.src = URL.createObjectURL(file);
            }
            await audio.load();
            element = audio;
          }
          
          const source = audioContext.createMediaElementSource(element);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = (media.volume || 100) / 100;
          
          source.connect(gainNode);
          gainNode.connect(audioDestination);
          
          audioSources.push({ media, source, gainNode });
          audioSourcesRef.current.set(media.id, source);
        }
      }

      // Combine video and audio streams
      const canvasStream = canvas.captureStream(exportSettings.fps);
      const videoTrack = canvasStream.getVideoTracks()[0];
      
      // Only add audio track if we have audio sources
      const combinedStream = new MediaStream();
      if (videoTrack) {
        combinedStream.addTrack(videoTrack);
      }
      
      // Add audio track only if there are audio sources
      if (audioSources.length > 0) {
        const audioTrack = audioDestination.stream.getAudioTracks()[0];
        if (audioTrack) {
          combinedStream.addTrack(audioTrack);
        }
      }
      
      // Verify canvas stream is valid
      if (!videoTrack) {
        throw new Error('Failed to capture video track from canvas');
      }
      
      console.log('Canvas stream created:', {
        hasVideoTrack: !!videoTrack,
        hasAudioTrack: audioSources.length > 0,
        fps: exportSettings.fps,
        resolution: { width: canvas.width, height: canvas.height }
      });
      
      // Configure MediaRecorder with quality settings
      const mimeType = exportSettings.codec === 'vp9' 
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm;codecs=vp8,opus';
        
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: exportSettings.bitrate
      });

      const chunks: Blob[] = [];
      let totalSize = 0;
      const MAX_MEMORY = 500 * 1024 * 1024; // 500MB max in memory
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          totalSize += e.data.size;
          
          // Log memory usage
          if (totalSize > MAX_MEMORY) {
            console.warn(`High memory usage: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio/video elements
        audioSources.forEach(({ source }) => {
          try {
            (source.mediaElement as HTMLMediaElement).pause();
          } catch (e) {}
        });
        
        console.log('MediaRecorder stopped:', {
          chunksCount: chunks.length,
          totalSize: totalSize,
          hasData: chunks.length > 0 && totalSize > 0
        });
        
        if (chunks.length === 0 || totalSize === 0) {
          console.error('No data captured during recording');
          toast.error('Failed to capture video data. Please try again.');
          return;
        }
        
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('Created blob:', {
          size: blob.size,
          type: blob.type
        });
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setWebmBlob(blob);
        onExportComplete?.(blob, `${projectName}_transparent.webm`);
        toast.success('Video exported successfully with audio!');
        
        // Cleanup for memory optimization
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(() => {
            // Ignore errors if already closed
          });
        }
        audioContextRef.current = null;
        
        // Clear video elements to free memory
        videoElementsRef.current.forEach((video, id) => {
          video.pause();
          video.src = '';
          video.load();
          URL.revokeObjectURL(video.src);
        });
        videoElementsRef.current.clear();
        
        // Clear video canvases
        videoCanvasesRef.current.forEach((canvas) => {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        });
        videoCanvasesRef.current.clear();
        
        // Clear Instagram canvases
        instagramCanvasesRef.current.forEach((canvas) => {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        });
        instagramCanvasesRef.current.clear();
        
        // Clear WhatsApp canvases
        whatsappCanvasesRef.current.forEach((canvas) => {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        });
        whatsappCanvasesRef.current.clear();
        
        // Force garbage collection hint
        if (window.gc) {
          window.gc();
        }
      };

      // Prepare videos - set initial time and playback rate
      const videoStates = new Map<string, { startedAt: number, isPlaying: boolean }>();
      
      for (const media of sortedMedia) {
        if (media.type === 'video') {
          const video = videoElementsRef.current.get(media.id);
          if (video) {
            video.currentTime = media.startTime;
            video.playbackRate = media.playbackSpeed || 1;
            videoStates.set(media.id, { startedAt: -1, isPlaying: false });
          }
        }
      }
      
      // Prepare audio elements
      audioSources.forEach(({ media, source }) => {
        const element = source.mediaElement as HTMLMediaElement;
        element.currentTime = media.startTime;
        element.playbackRate = media.playbackSpeed || 1;
      });
      
      // Render first frame before starting recording
      await renderFrame(0);
      
      // Verify canvas has content
      const testImageData = canvas.getContext('2d')?.getImageData(0, 0, 1, 1);
      console.log('Canvas has content:', {
        hasImageData: !!testImageData,
        pixelData: testImageData?.data
      });
      
      // Start recording
      const startTime = performance.now();
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(100); // Capture data every 100ms
      console.log('MediaRecorder state after start:', mediaRecorder.state);
      
      // Media control function - only starts/stops, doesn't seek
      const updateMediaPlayback = (currentTime: number) => {
        // Handle videos
        videoElementsRef.current.forEach((video, id) => {
          const media = sortedMedia.find(m => m.id === id);
          if (!media) return;
          
          const state = videoStates.get(id)!;
          const shouldPlay = currentTime >= media.positionStart && currentTime <= media.positionEnd;
          
          if (shouldPlay && !state.isPlaying) {
            // Starting playback
            const mediaProgress = (currentTime - media.positionStart) / (media.positionEnd - media.positionStart);
            const targetTime = media.startTime + (media.endTime - media.startTime) * mediaProgress;
            video.currentTime = targetTime;
            video.play().catch(() => {});
            state.isPlaying = true;
            state.startedAt = currentTime;
          } else if (!shouldPlay && state.isPlaying) {
            // Stopping playback
            video.pause();
            state.isPlaying = false;
          }
        });
        
        // Handle audio elements similarly
        audioSources.forEach(({ media, source }, index) => {
          const element = source.mediaElement as HTMLMediaElement;
          const shouldPlay = currentTime >= media.positionStart && currentTime <= media.positionEnd;
          
          if (shouldPlay && element.paused) {
            const mediaProgress = (currentTime - media.positionStart) / (media.positionEnd - media.positionStart);
            const targetTime = media.startTime + (media.endTime - media.startTime) * mediaProgress;
            element.currentTime = targetTime;
            element.play().catch(() => {});
          } else if (!shouldPlay && !element.paused) {
            element.pause();
          }
        });
      };

      // Render loop with better timing
      const fps = exportSettings.fps;
      const frameInterval = 1000 / fps;
      let frameCount = 0;
      
      setCurrentStage('Rendering video...');
      
      const renderLoop = async () => {
        const elapsed = performance.now() - startTime;
        const currentTime = elapsed / 1000;
        
        // Log first few frames and important milestones
        if (frameCount < 5 || frameCount % 30 === 0) {
          console.log(`Rendering frame ${frameCount} at time ${currentTime.toFixed(2)}s`);
        }
        
        if (currentTime >= duration) {
          console.log('Render loop complete:', {
            frameCount,
            duration,
            finalTime: currentTime
          });
          
          // Stop all media
          videoElementsRef.current.forEach(video => video.pause());
          audioSources.forEach(({ source }) => {
            (source.mediaElement as HTMLMediaElement).pause();
          });
          
          setCurrentStage('Finalizing export...');
          
          // Ensure mediaRecorder is in recording state before stopping
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          } else {
            console.error('MediaRecorder not in recording state:', mediaRecorder.state);
          }
          
          setIsProcessing(false);
          setProgress(100);
          setEstimatedTimeRemaining(0);
          return;
        }
        
        // Update media playback states
        updateMediaPlayback(currentTime);
        
        // Render current frame
        try {
          await renderFrame(currentTime);
          frameCount++;
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
          setProcessedFrames(frameCount);
          
          // Calculate time remaining
          const elapsedTime = (Date.now() - exportStartTime) / 1000;
          const avgTimePerFrame = elapsedTime / frameCount;
          const remainingFrames = totalFramesToProcess - frameCount;
          const estimatedRemaining = remainingFrames * avgTimePerFrame;
          setEstimatedTimeRemaining(estimatedRemaining);
          
          // Verify MediaRecorder is still recording
          if (frameCount % 30 === 0 && mediaRecorder.state !== 'recording') {
            console.error('MediaRecorder stopped unexpectedly at frame', frameCount);
            return;
          }
          
          // Schedule next frame
          requestAnimationFrame(() => renderLoop());
        } catch (error) {
          console.error('Error rendering frame:', error);
          mediaRecorder.stop();
        }
      };
      
      // Start the render loop immediately
      // First update media playback for time 0
      updateMediaPlayback(0);
      
      // Give videos a moment to load their first frame (only if there are videos)
      if (sortedMedia.filter(m => m.type === 'video').length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Give Instagram conversations time to initialize their canvases (if there are any)
      if (instagramConversations.length > 0) {
        console.log('Initializing Instagram canvases before export...');
        
        // Pre-initialize Instagram canvases by rendering the first frame
        for (const conversation of instagramConversations) {
          if (0 >= conversation.positionStart && 0 <= conversation.positionEnd) {
            // Get or create canvas for this conversation
            let conversationCanvas = instagramCanvasesRef.current.get(conversation.id);
            if (!conversationCanvas) {
              conversationCanvas = document.createElement('canvas');
              const pixelRatio = exportSettings.quality === 'ultra' ? 3 : 2;
              conversationCanvas.width = 360 * pixelRatio;
              conversationCanvas.height = 640 * pixelRatio;
              conversationCanvas.style.width = '360px';
              conversationCanvas.style.height = '640px';
              
              const convCtx = conversationCanvas.getContext('2d');
              if (convCtx) {
                convCtx.scale(pixelRatio, pixelRatio);
                convCtx.imageSmoothingEnabled = true;
                convCtx.imageSmoothingQuality = 'high';
              }
              instagramCanvasesRef.current.set(conversation.id, conversationCanvas);
            }
            
            // Pre-render the first frame if conversation is visible at time 0
            const conversationCtx = conversationCanvas.getContext('2d');
            if (conversationCtx) {
              let imageCache = instagramImageCacheRef.current.get(conversation.id);
              if (!imageCache) {
                imageCache = new Map();
                instagramImageCacheRef.current.set(conversation.id, imageCache);
              }
              renderInstagramConversation(conversationCtx, conversation, 0, imageCache);
            }
          }
        }
        
        // Add a small delay to ensure Instagram canvases are fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Instagram canvases initialized');
      }
      
      // Give WhatsApp conversations time to initialize their canvases (if there are any)
      if (whatsappConversations.length > 0) {
        console.log('Initializing WhatsApp canvases before export...');
        
        // Pre-initialize WhatsApp canvases by rendering the first frame
        for (const conversation of whatsappConversations) {
          if (0 >= conversation.positionStart && 0 <= conversation.positionEnd) {
            // Get or create canvas for this conversation
            let conversationCanvas = whatsappCanvasesRef.current.get(conversation.id);
            if (!conversationCanvas) {
              conversationCanvas = document.createElement('canvas');
              const pixelRatio = exportSettings.quality === 'ultra' ? 3 : 2;
              conversationCanvas.width = 360 * pixelRatio;
              conversationCanvas.height = 640 * pixelRatio;
              conversationCanvas.style.width = '360px';
              conversationCanvas.style.height = '640px';
              
              const convCtx = conversationCanvas.getContext('2d');
              if (convCtx) {
                convCtx.scale(pixelRatio, pixelRatio);
                convCtx.imageSmoothingEnabled = true;
                convCtx.imageSmoothingQuality = 'high';
              }
              
              whatsappCanvasesRef.current.set(conversation.id, conversationCanvas);
            }
            
            const conversationCtx = conversationCanvas.getContext('2d');
            if (conversationCtx) {
              let imageCache = whatsappImageCacheRef.current.get(conversation.id);
              if (!imageCache) {
                imageCache = new Map();
                whatsappImageCacheRef.current.set(conversation.id, imageCache);
              }
              
              // Render the first frame
              renderWhatsAppConversation(conversationCtx, conversation, 0, imageCache);
            }
          }
        }
        
        // Add a small delay to ensure WhatsApp canvases are fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('WhatsApp canvases initialized');
      }
      
      // Start rendering
      console.log('Starting render loop with conversations...');
      renderLoop();

    } catch (error) {
      console.error('Canvas export failed:', error);
      toast.error('Export failed: ' + (error as Error).message);
      setIsProcessing(false);
      
      // Cleanup on error
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors if already closed
        });
        audioContextRef.current = null;
      }
    }
  }, [duration, projectName, renderFrame, onExportComplete, sortedMedia, exportSettings.fps, exportStartTime, totalFrames, preloadInstagramImages, preloadWhatsAppImages]);

  // Initialize canvas and create blank transparent canvas
  useEffect(() => {
    // Don't render preview frames during export processing
    if (canvasRef.current && !isPlaying && !isProcessing) {
      renderFrame(currentPreviewTime);
    }
    
    // Create a blank transparent canvas for WebM videos
    if (!blankCanvasRef.current) {
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = resolution.width;
      blankCanvas.height = resolution.height;
      const blankCtx = blankCanvas.getContext('2d');
      if (blankCtx) {
        blankCtx.clearRect(0, 0, blankCanvas.width, blankCanvas.height);
      }
      blankCanvasRef.current = blankCanvas;
    }
  }, [renderFrame, isPlaying, resolution, currentPreviewTime, isProcessing]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if canvas renderer is visible and not processing
      if (previewUrl || isProcessing) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePreview();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekToTime(Math.max(0, currentPreviewTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekToTime(Math.min(duration, currentPreviewTime + 5));
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePreview, seekToTime, currentPreviewTime, duration, previewUrl, isProcessing]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up video elements
      videoElementsRef.current.forEach(video => {
        video.pause();
        video.src = '';
      });
      videoElementsRef.current.clear();
      
      // Clean up video canvases
      videoCanvasesRef.current.clear();
      
      // Clean up Instagram canvases
      instagramCanvasesRef.current.clear();
      
      // Clean up WhatsApp canvases
      whatsappCanvasesRef.current.clear();
      
      // Clean up audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors if already closed
        });
        audioContextRef.current = null;
      }
      
      // Clean up blob URLs
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (mp4Url) {
        URL.revokeObjectURL(mp4Url);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm sm:text-md font-semibold text-white mb-2">Canvas Transparency Renderer</h3>
        
        {/* Export Settings */}
        <div className="mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Export Settings
          </button>
          
          {showSettings && (
            <div className="mt-3 space-y-3 p-2 sm:p-3 bg-gray-700 rounded-lg">
              {/* Quality Preset */}
              <div>
                <label className="text-xs text-gray-300 block mb-1">Quality Preset</label>
                <select
                  value={exportSettings.quality}
                  onChange={(e) => {
                    const quality = e.target.value as ExportSettings['quality'];
                    setExportSettings({
                      ...exportSettings,
                      quality,
                      bitrate: QUALITY_PRESETS[quality].bitrate
                    });
                  }}
                  className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm"
                >
                  {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Custom Bitrate */}
              <div>
                <label className="text-xs text-gray-300 block mb-1">
                  Custom Bitrate: {(exportSettings.bitrate / 1000000).toFixed(1)} Mbps
                </label>
                <input
                  type="range"
                  min="500000"
                  max="50000000"
                  step="500000"
                  value={exportSettings.bitrate}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    bitrate: parseInt(e.target.value),
                    quality: 'high' // Reset to custom when manually adjusted
                  })}
                  className="w-full"
                />
              </div>
              
              {/* Frame Rate */}
              <div>
                <label className="text-xs text-gray-300 block mb-1">Frame Rate</label>
                <select
                  value={exportSettings.fps}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    fps: parseInt(e.target.value)
                  })}
                  className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  <option value="24">24 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </select>
              </div>
              
              {/* Codec */}
              <div>
                <label className="text-xs text-gray-300 block mb-1">Codec</label>
                <select
                  value={exportSettings.codec}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    codec: e.target.value
                  })}
                  className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  <option value="vp9">VP9 (Better quality)</option>
                  <option value="vp8">VP8 (Better compatibility)</option>
                </select>
              </div>
              
              {/* Estimated file size */}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
                Estimated file size: ~{((exportSettings.bitrate / 8 / 1024 / 1024) * duration).toFixed(1)} MB
              </div>
            </div>
          )}
        </div>
        
        {/* Social Media Presets */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Quick Export Presets</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(SOCIAL_MEDIA_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPreset(key);
                  setExportSettings({
                    ...exportSettings,
                    fps: preset.fps,
                    bitrate: preset.bitrate
                  });
                  
                  // Show warning if video is longer than max duration
                  if (duration > preset.maxDuration) {
                    toast.error(`${preset.name} allows max ${preset.maxDuration}s. Your video is ${Math.round(duration)}s.`, {
                      duration: 5000
                    });
                  }
                }}
                className={`p-2 text-xs rounded-lg transition-colors ${
                  selectedPreset === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-[10px] opacity-70 mt-1">
                  {preset.width}×{preset.height} • {preset.fps}fps
                </div>
              </button>
            ))}
          </div>
          {selectedPreset && (
            <div className="mt-2 p-2 bg-blue-900/20 rounded text-xs text-blue-400">
              <p>⚠️ Note: This will export at {SOCIAL_MEDIA_PRESETS[selectedPreset as keyof typeof SOCIAL_MEDIA_PRESETS].width}×{SOCIAL_MEDIA_PRESETS[selectedPreset as keyof typeof SOCIAL_MEDIA_PRESETS].height} resolution.</p>
              <p>Current canvas: {resolution.width}×{resolution.height}</p>
            </div>
          )}
        </div>
        
        {/* Batch Export */}
        <div className="mb-4">
          <button
            onClick={() => setShowBatchExport(!showBatchExport)}
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showBatchExport ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Batch Export
          </button>
          
          {showBatchExport && (
            <div className="mt-3 space-y-3 p-2 sm:p-3 bg-gray-700 rounded-lg">
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => {
                    // Add common quality presets to batch
                    addToBatchQueue('Low Quality', { ...exportSettings, quality: 'low', bitrate: QUALITY_PRESETS.low.bitrate });
                    addToBatchQueue('Medium Quality', { ...exportSettings, quality: 'medium', bitrate: QUALITY_PRESETS.medium.bitrate });
                    addToBatchQueue('High Quality', { ...exportSettings, quality: 'high', bitrate: QUALITY_PRESETS.high.bitrate });
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                >
                  Add All Qualities
                </button>
                <button
                  onClick={() => {
                    // Add social media presets
                    Object.entries(SOCIAL_MEDIA_PRESETS).forEach(([key, preset]) => {
                      addToBatchQueue(preset.name, {
                        ...exportSettings,
                        fps: preset.fps,
                        bitrate: preset.bitrate
                      });
                    });
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                >
                  Add Social Media
                </button>
                <button
                  onClick={() => {
                    // Add current settings
                    addToBatchQueue(`Custom (${exportSettings.quality})`, exportSettings);
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                >
                  Add Current
                </button>
              </div>
              
              {/* Batch queue */}
              {batchExportQueue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-300">Export Queue ({batchExportQueue.length})</p>
                    <button
                      onClick={() => setBatchExportQueue([])}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {batchExportQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs">
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && <div className="w-3 h-3 bg-gray-500 rounded-full" />}
                        {item.status === 'processing' && <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />}
                        {item.status === 'completed' && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                        {item.status === 'failed' && <div className="w-3 h-3 bg-red-500 rounded-full" />}
                        
                        <span className="text-white">{item.name}</span>
                        <span className="text-gray-500">
                          {(item.settings.bitrate / 1000000).toFixed(1)}Mbps • {item.settings.fps}fps
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' && item.result && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.result!.url;
                              link.download = `${projectName}_${item.name.replace(/\s+/g, '_')}.webm`;
                              link.click();
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                        {item.status === 'pending' && (
                          <button
                            onClick={() => setBatchExportQueue(prev => prev.filter(i => i.id !== item.id))}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Batch export button */}
                  <button
                    onClick={processBatchExport}
                    disabled={isBatchExporting || batchExportQueue.every(i => i.status !== 'pending')}
                    className="w-full mt-3 p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isBatchExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Batch...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Start Batch Export
                      </>
                    )}
                  </button>
                  
                  {isBatchExporting && (
                    <button
                      onClick={() => {
                        batchExportAbortRef.current = true;
                        setIsBatchExporting(false);
                      }}
                      className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel Batch
                    </button>
                  )}
                </div>
              )}
              
              {batchExportQueue.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No exports in queue. Add presets or custom settings above.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Canvas Preview - Only show before processing */}
        {!previewUrl && (
          <div className="mb-4">
            <div className="relative bg-checkerboard rounded-lg overflow-hidden mb-2">
              <canvas
                ref={canvasRef}
                width={resolution.width}
                height={resolution.height}
                className="w-full h-auto"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
              
              {/* Play/Pause button overlay */}
              <button
                onClick={togglePreview}
                className="absolute bottom-2 left-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              {/* Time display */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                {formatTime(currentPreviewTime)} / {formatTime(duration)}
              </div>
            </div>
            
            {/* Preview Controls */}
            <div className="space-y-2">
              {/* Seek Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.01"
                  value={currentPreviewTime}
                  onChange={handleSeek}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(currentPreviewTime / duration) * 100}%, #374151 ${(currentPreviewTime / duration) * 100}%, #374151 100%)`
                  }}
                />
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => seekToTime(0)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  title="Go to start"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button
                  onClick={togglePreview}
                  className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => seekToTime(duration)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  title="Go to end"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        {!isProcessing && !previewUrl && (
          <button
            onClick={processVideo}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Render with Canvas (Preserves Transparency)
          </button>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="mb-4 space-y-3">
            {/* Stage indicator */}
            <div className="flex items-center mb-2">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-500" />
              <span className="text-white font-medium">{currentStage}</span>
            </div>
            
            {/* Progress bar */}
            <div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2 relative overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated stripes */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Progress details */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>{progress.toFixed(1)}% complete</span>
                <span>{processedFrames} / {totalFrames} frames</span>
              </div>
            </div>
            
            {/* Time estimates */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-700 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Elapsed Time</p>
                <p className="text-sm text-white font-medium">
                  {exportStartTime > 0 ? formatDuration((Date.now() - exportStartTime) / 1000) : '0s'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                <p className="text-sm text-white font-medium">
                  {estimatedTimeRemaining > 0 ? `~${formatDuration(estimatedTimeRemaining)}` : 'Calculating...'}
                </p>
              </div>
            </div>
            
            {/* Technical details */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Resolution: {resolution.width}×{resolution.height}</p>
              <p>• Frame Rate: {exportSettings.fps} FPS</p>
              <p>• Bitrate: {(exportSettings.bitrate / 1000000).toFixed(1)} Mbps</p>
              <p>• Codec: {exportSettings.codec.toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {previewUrl && (
          <div className="space-y-3">
            <video 
              src={previewUrl} 
              controls 
              className="w-full rounded-lg bg-checkerboard mb-3"
              style={{ maxHeight: '200px' }}
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewUrl;
                    link.download = `${projectName}_transparent.webm`;
                    link.click();
                    
                    // Show success message
                    toast.success('WebM downloaded successfully!');
                  }}
                  className="flex-1 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download WebM
                </button>
                <button
                  onClick={convertToMp4}
                  disabled={isConverting || !webmBlob}
                  className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Converting... {progress > 0 && `${Math.round(progress)}%`}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Convert to MP4
                    </>
                  )}
                </button>
              </div>
              
              {/* MP4 Download button (appears after conversion) */}
              {mp4Url && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = mp4Url;
                    link.download = `${projectName}_composited.mp4`;
                    link.click();
                    toast.success('MP4 downloaded successfully!');
                  }}
                  className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download MP4 (No Transparency)
                </button>
              )}
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!previewUrl && (
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Uses Canvas API for high-quality rendering</p>
          <p>• Exports as WebM with VP9 codec</p>
          <p>• Full video and audio support with proper sync</p>
        </div>
      )}

    </div>
  );
}