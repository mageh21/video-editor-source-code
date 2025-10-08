import React from 'react';
import { MediaFile } from '@/app/types';
import { useKeyframes } from '@/app/hooks/useKeyframes';
import Image from 'next/image';

interface TimelineKeyframesProps {
  media: MediaFile;
  timelineZoom: number;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const TimelineKeyframes: React.FC<TimelineKeyframesProps> = ({
  media,
  timelineZoom,
  onLoadingChange,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 0, height: 0 });
  
  const { frames, previewFrames, isLoading } = useKeyframes({
    media,
    containerRef,
    timelineZoom,
  });

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Update container dimensions on mount and resize
  React.useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    const initialTimeout = setTimeout(updateDimensions, 100);
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);
  
  // Force update when zoom changes
  React.useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  }, [timelineZoom]);

  // Calculate dynamic slot count based on container width and zoom
  const calculateSlotCount = React.useCallback(() => {
    const { width } = containerDimensions;
    
    if (!width || width < 100) {
      return 5; // Default fallback
    }
    
    // Base thumbnail width
    const baseThumbnailWidth = 60;
    
    // When zoomed in, we want more thumbnails
    const effectiveWidth = width * (timelineZoom / 100);
    
    let slots = Math.round(effectiveWidth / baseThumbnailWidth);
    
    // Clamp between reasonable limits
    slots = Math.max(5, Math.min(30, slots));
    
    return slots;
  }, [containerDimensions.width, timelineZoom]);

  const TOTAL_SLOTS = React.useMemo(() => calculateSlotCount(), [calculateSlotCount]);

  // Create display frames with proper distribution across the timeline
  const displayFrames = React.useMemo(() => {
    const slots = [];
    const duration = media.endTime - media.startTime;
    const durationInFrames = Math.floor(duration * 30); // 30 FPS
    
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      // Calculate which frame should be shown at this position
      const frameIndex = Math.floor((i / (TOTAL_SLOTS - 1)) * (frames.length - 1));
      const frame = frames[frameIndex];
      
      // Calculate the time position this thumbnail represents
      const timePosition = (i / (TOTAL_SLOTS - 1)) * durationInFrames;
      const timeInSeconds = timePosition / 30;
      
      slots.push({
        frame: frame || null,
        frameNumber: Math.round(timePosition),
        timeInSeconds: timeInSeconds.toFixed(1),
        index: i
      });
    }
    
    return slots;
  }, [frames, TOTAL_SLOTS, media.endTime, media.startTime]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
    >
      <div className="flex h-full w-full">
        {displayFrames.map((slot) => {
          const isLast = slot.index === TOTAL_SLOTS - 1;
          const imageSource = slot.frame;

          return (
            <div
              key={`${media.id}-${slot.index}-${TOTAL_SLOTS}`}
              className={`relative ${
                !isLast ? "border-r border-gray-600" : ""
              }`}
              style={{ width: `${100 / TOTAL_SLOTS}%` }}
            >
              {imageSource && (
                <div className="relative h-full w-full group">
                  <Image
                    src={imageSource}
                    alt={`Frame at ${slot.timeInSeconds}s`}
                    className="object-cover transition-opacity group-hover:opacity-90"
                    fill
                    sizes={`${Math.max(50, 100 / TOTAL_SLOTS)}px`}
                    priority={slot.index < 3}
                    quality={70}
                    loading={slot.index < 3 ? "eager" : "lazy"}
                    style={{
                      imageRendering: "auto",
                      objectFit: "cover",
                    }}
                  />
                  {/* Show loading indicator */}
                  {isLoading && slot.index === 0 && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Show timestamp on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <span className="text-white text-xs font-mono">
                      {slot.timeInSeconds}s
                    </span>
                  </div>
                </div>
              )}
              {/* Show placeholder when no frame */}
              {!imageSource && (
                <div className="h-full w-full bg-gray-700/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};