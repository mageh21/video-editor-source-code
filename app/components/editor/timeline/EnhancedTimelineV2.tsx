import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch, getFile } from '@/app/store';
import { 
  setTimelineZoom, 
  setCurrentTime, 
  setIsPlaying,
  setMarkerTrack,
  setEnableSnapping,
  addRow,
  removeRow,
  setMediaFiles,
  setTextElements,
  setActiveElement,
  setActiveElementIndex,
  setSelectedCaptionIds,
  setSelectedTextIds,
  setSelectedMediaIds,
  setInstagramConversations,
  setWhatsAppConversations,
  setSelectedWhatsAppConversationIds
} from '@/app/store/slices/projectSlice';
import { MediaFile, TextElement, Caption, InstagramConversation, WhatsAppConversation } from '@/app/types';
import { CaptionTimelineElement } from './CaptionTimelineElement';
import { TimelineProvider } from '@/app/contexts/timeline-context';
import { AssetLoadingProvider } from '@/app/contexts/asset-loading-context';
import { useTimelineState } from '@/app/hooks/useTimelineState';
import { useTimelineDragAndDrop } from '@/app/hooks/useTimelineDragAndDrop';
import { useTimelineEventHandlers } from '@/app/hooks/useTimelineEventHandlers';
import { useTimelineSnapping } from '@/app/hooks/useTimelineSnapping';
import GhostMarker from './GhostMarker';
import TimelineMarkers from './TimelineMarkers';
import TimelineGapIndicator from './TimelineGapIndicator';
import { TimelineItem } from './TimelineItem';
import { Grip, Loader2 } from 'lucide-react';
import { throttle } from 'lodash';
import toast from 'react-hot-toast';
import { categorizeFile } from '@/app/utils/utils';
import { calculateVideoPosition, shouldUseCustomPositioning } from '@/app/utils/videoPositioning';

const ROW_HEIGHT = 64;
const TIMELINE_MAX_HEIGHT = ROW_HEIGHT * 3; // Show exactly 3 tracks at once
const SNAPPING_CONFIG = {
  enableVerticalSnapping: true,
  thresholdFrames: 5,
};

type TimelineElement = MediaFile | TextElement | InstagramConversation | WhatsAppConversation;

const EnhancedTimelineV2: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    mediaFiles,
    textElements,
    instagramConversations,
    whatsappConversations,
    selectedMediaIds,
    selectedTextIds,
    selectedWhatsAppConversationIds,
    captionTracks,
    activeCaptionTrackId,
    selectedCaptionIds,
    currentTime,
    timelineZoom,
    duration,
    isPlaying,
    visibleRows,
    maxRows,
    enableMarkerTracking,
    enableSnapping,
    activeElement,
    activeElementIndex,
    fps,
    resolution,
  } = useAppSelector(state => state.projectState);

  const durationInFrames = duration * fps;
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const rowHandlesRef = React.useRef<HTMLDivElement>(null);
  const timelineMarkersRef = React.useRef<HTMLDivElement>(null);
  
  // Combine media files, text elements, Instagram conversations, and captions into overlays
  const overlays: TimelineElement[] = useMemo(() => {
    const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
    const captionElements = activeTrack ? activeTrack.captions.map(caption => ({
      ...caption,
      id: caption.id,
      positionStart: (caption as any).start ?? caption.startMs / 1000,
      positionEnd: (caption as any).end ?? caption.endMs / 1000,
      row: visibleRows - 1, // Put captions on bottom row
      type: 'caption' as const
    })) : [];
    return [...mediaFiles, ...textElements, ...instagramConversations, ...whatsappConversations, ...captionElements] as any;
  }, [mediaFiles, textElements, instagramConversations, whatsappConversations, captionTracks, activeCaptionTrackId, visibleRows]);

  // Timeline state management
  const {
    isDragging,
    draggedItem,
    ghostElement,
    ghostMarkerPosition,
    livePushOffsets,
    dragInfo,
    handleDragStart: timelineStateHandleDragStart,
    updateGhostElement,
    resetDragState,
    setGhostMarkerPosition,
  } = useTimelineState(durationInFrames, visibleRows, timelineRef);

  // Overlay change handler
  const handleOverlayChange = useCallback((updatedOverlay: TimelineElement) => {
    // Check if it's a MediaFile by looking for the 'type' property that exists in MediaFile but not TextElement
    const isMediaFile = 'type' in updatedOverlay && (updatedOverlay.type === 'video' || updatedOverlay.type === 'audio' || updatedOverlay.type === 'image');
    
    // Check if it's an Instagram conversation
    const isInstagramConversation = 'messages' in updatedOverlay && 'participants' in updatedOverlay && updatedOverlay.platform === 'instagram';
    
    // Check if it's a WhatsApp conversation
    const isWhatsAppConversation = 'messages' in updatedOverlay && 'participants' in updatedOverlay && updatedOverlay.platform === 'whatsapp';
    
    if (isMediaFile) {
      const updatedFiles = mediaFiles.map(file =>
        file.id === updatedOverlay.id ? updatedOverlay as MediaFile : file
      );
      dispatch(setMediaFiles(updatedFiles));
    } else if (isInstagramConversation) {
      const updatedConversations = instagramConversations.map(conv =>
        conv.id === updatedOverlay.id ? updatedOverlay as InstagramConversation : conv
      );
      dispatch(setInstagramConversations(updatedConversations));
    } else if (isWhatsAppConversation) {
      const updatedConversations = whatsappConversations.map(conv =>
        conv.id === updatedOverlay.id ? updatedOverlay as WhatsAppConversation : conv
      );
      dispatch(setWhatsAppConversations(updatedConversations));
    } else {
      const updatedTexts = textElements.map(text =>
        text.id === updatedOverlay.id ? updatedOverlay as TextElement : text
      );
      dispatch(setTextElements(updatedTexts));
    }
  }, [mediaFiles, textElements, instagramConversations, whatsappConversations, dispatch]);

  // Drag and drop handling
  const { handleDragStart, handleDrag, handleDragEnd } = useTimelineDragAndDrop({
    overlays: overlays as any,
    durationInFrames,
    onOverlayChange: handleOverlayChange,
    updateGhostElement,
    resetDragState,
    timelineRef,
    dragInfo,
    maxRows: visibleRows,
    fps,
  });

  // Event handlers
  const { handleMouseMove, handleTouchMove, handleTimelineMouseLeave } =
    useTimelineEventHandlers({
      handleDrag,
      handleDragEnd,
      isDragging,
      timelineRef,
      setGhostMarkerPosition,
    });

  // Snapping functionality
  const { alignmentLines, snappedGhostElement } = useTimelineSnapping({
    isDragging,
    ghostElement,
    draggedItem,
    dragInfo,
    overlays: overlays as any,
    durationInFrames,
    visibleRows,
    snapThreshold: enableSnapping ? SNAPPING_CONFIG.thresholdFrames : 0,
  });

  // Row dragging state
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);
  const [isDraggingRow, setIsDraggingRow] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Timeline click handler
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging) return;

    // Only handle background clicks (not clicks on timeline items)
    const target = e.target as HTMLElement;
    const isBackgroundClick = target === e.currentTarget || 
                              target.closest('.timeline-background') ||
                              !target.closest('[data-timeline-item]');

    dispatch(setIsPlaying(false));
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollOffset = timelineRef.current.scrollLeft;
    const offsetX = e.clientX - rect.left + scrollOffset;
    // The timeline container is scaled, so we need the actual scaled width
    const actualTimelineWidth = timelineRef.current.scrollWidth;
    // Ensure duration is valid to prevent NaN
    const safeDuration = isFinite(duration) && duration > 0 ? duration : 30;
    const seconds = (offsetX / actualTimelineWidth) * safeDuration;
    const clampedTime = Math.max(0, Math.min(safeDuration, seconds));
    dispatch(setCurrentTime(clampedTime));

    // Clear selections when clicking on empty timeline areas
    if (isBackgroundClick) {
      // Clear new selection system
      dispatch(setSelectedMediaIds([]));
      dispatch(setSelectedTextIds([]));
      dispatch(setSelectedCaptionIds([]));
      dispatch(setSelectedWhatsAppConversationIds([]));
      dispatch(setActiveElement(null));
      
      // Clear old selection system
      dispatch(setActiveElementIndex(-1));
    }
  }, [dispatch, duration, timelineZoom, isDragging]);

  // Row reordering
  const handleReorderRows = useCallback((fromIndex: number, toIndex: number) => {
    const updatedOverlays = overlays.map(overlay => {
      if (overlay.row === fromIndex) {
        return { ...overlay, row: toIndex };
      }
      if (overlay.row === toIndex) {
        return { ...overlay, row: fromIndex };
      }
      return overlay;
    });

    // Update media files, text elements, Instagram conversations, and WhatsApp conversations separately
    const updatedMedia = updatedOverlays.filter(o => 'type' in o && (o.type === 'video' || o.type === 'audio' || o.type === 'image')) as MediaFile[];
    const updatedText = updatedOverlays.filter(o => !('type' in o) || (o.type === 'unknown' && !('messages' in o))) as TextElement[];
    const updatedInstagram = updatedOverlays.filter(o => 'messages' in o && 'participants' in o && o.platform === 'instagram') as InstagramConversation[];
    const updatedWhatsApp = updatedOverlays.filter(o => 'messages' in o && 'participants' in o && o.platform === 'whatsapp') as WhatsAppConversation[];
    
    dispatch(setMediaFiles(updatedMedia));
    dispatch(setTextElements(updatedText));
    dispatch(setInstagramConversations(updatedInstagram));
    dispatch(setWhatsAppConversations(updatedWhatsApp));
  }, [overlays, dispatch]);

  // Row drag handlers
  const handleRowDragStart = useCallback((e: React.DragEvent, rowIndex: number) => {
    setDraggedRowIndex(rowIndex);
    setIsDraggingRow(true);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    if (draggedRowIndex === null) return;
    setDragOverRowIndex(rowIndex);
  }, [draggedRowIndex]);

  const handleRowDrop = useCallback((targetIndex: number) => {
    if (draggedRowIndex === null) return;
    handleReorderRows(draggedRowIndex, targetIndex);
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
    setIsDraggingRow(false);
  }, [draggedRowIndex, handleReorderRows]);

  const handleRowDragEnd = useCallback(() => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
    setIsDraggingRow(false);
  }, []);

  // Gap removal handler
  const handleRemoveGap = useCallback((rowIndex: number, gapStart: number, gapEnd: number) => {
    const overlaysToShift = overlays
      .filter(overlay => overlay.row === rowIndex && overlay.positionStart >= gapEnd)
      .sort((a, b) => a.positionStart - b.positionStart);

    if (overlaysToShift.length === 0) return;

    const firstOverlayAfterGap = overlaysToShift[0];
    const gapSize = firstOverlayAfterGap.positionStart - gapStart;

    if (gapSize <= 0) return;

    overlaysToShift.forEach(overlay => {
      const updated = {
        ...overlay,
        positionStart: overlay.positionStart - gapSize,
        positionEnd: overlay.positionEnd - gapSize,
      };
      handleOverlayChange(updated);
    });
  }, [overlays, handleOverlayChange]);

  // Find gaps in row
  const findGapsInRow = useCallback((rowItems: TimelineElement[]) => {
    if (rowItems.length === 0) return [];

    const timePoints = rowItems
      .flatMap(item => [
        { time: item.positionStart, type: 'start' },
        { time: item.positionEnd, type: 'end' },
      ])
      .sort((a, b) => a.time - b.time);

    const gaps: { start: number; end: number }[] = [];

    if (timePoints.length > 0 && timePoints[0].time > 0) {
      gaps.push({ start: 0, end: timePoints[0].time });
    }

    for (let i = 0; i < timePoints.length - 1; i++) {
      const currentPoint = timePoints[i];
      const nextPoint = timePoints[i + 1];

      if (
        currentPoint.type === 'end' &&
        nextPoint.type === 'start' &&
        nextPoint.time > currentPoint.time
      ) {
        gaps.push({ start: currentPoint.time, end: nextPoint.time });
      }
    }

    return gaps;
  }, []);

  // Combined drag start handler
  const combinedHandleDragStart = useCallback((
    overlay: TimelineElement,
    clientX: number,
    clientY: number,
    action: 'move' | 'resize-start' | 'resize-end'
  ) => {
    timelineStateHandleDragStart(overlay as any, clientX, clientY, action);
    handleDragStart(overlay as any, clientX, clientY, action);
  }, [timelineStateHandleDragStart, handleDragStart]);

  // Handle external media drop from assets panel
  const handleExternalMediaDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const mediaFileId = e.dataTransfer.getData('mediaFileId');
    if (!mediaFileId || !timelineRef.current) return;

    try {
      // Get drop position
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollOffset = timelineRef.current.scrollLeft;
      const offsetX = e.clientX - rect.left + scrollOffset;
      const actualTimelineWidth = timelineRef.current.scrollWidth;
      // Ensure duration is valid and non-zero to prevent division issues
      const safeDuration = isFinite(duration) && duration > 0 ? duration : 30;
      const dropTimeInSeconds = (offsetX / actualTimelineWidth) * safeDuration;
      
      // Get media info from drag data
      const durationStr = e.dataTransfer.getData('duration');
      const fileName = e.dataTransfer.getData('fileName');
      const fileType = e.dataTransfer.getData('fileType');
      const mediaDuration = parseFloat(durationStr) || 30;
      
      // Load the file
      const file = await getFile(mediaFileId);
      if (!file) {
        toast.error('Failed to load media file');
        return;
      }
      const mediaId = crypto.randomUUID();
      const mediaType = categorizeFile(fileType);
      
      // Calculate positioning for videos to prevent overlap
      let videoPosition = {};
      if (mediaType === 'video' && shouldUseCustomPositioning(
        rowIndex,
        mediaFiles,
        Math.max(0, dropTimeInSeconds),
        Math.max(0, dropTimeInSeconds) + mediaDuration
      )) {
        videoPosition = calculateVideoPosition(
          rowIndex,
          mediaFiles,
          Math.max(0, dropTimeInSeconds),
          Math.max(0, dropTimeInSeconds) + mediaDuration,
          resolution.width,
          resolution.height
        );
      }
      
      // Create new media object
      const newMedia: MediaFile = {
        id: mediaId,
        fileName: fileName,
        fileId: mediaFileId,
        startTime: 0,
        endTime: mediaDuration,
        src: URL.createObjectURL(file),
        positionStart: Math.max(0, dropTimeInSeconds),
        positionEnd: Math.max(0, dropTimeInSeconds) + mediaDuration,
        includeInMerge: true,
        row: rowIndex,
        rotation: 0,
        opacity: 100,
        playbackSpeed: 1,
        volume: 100,
        type: mediaType,
        zIndex: mediaFiles.filter(m => m.row === rowIndex).length,
        ...videoPosition // Apply calculated position if needed
      };

      // Add to media files
      dispatch(setMediaFiles([...mediaFiles, newMedia]));
      toast.success('Media added to timeline');
    } catch (error) {
      console.error('Error dropping media:', error);
      toast.error('Failed to add media to timeline');
    }
  }, [timelineRef, timelineZoom, duration, mediaFiles, dispatch]);

  // Synchronize scrolling between timeline, row handles, and markers
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rowHandlesRef.current && timelineRef.current) {
      rowHandlesRef.current.scrollTop = timelineRef.current.scrollTop;
    }
    if (timelineMarkersRef.current && timelineRef.current) {
      timelineMarkersRef.current.scrollLeft = timelineRef.current.scrollLeft;
    }
  }, []);

  const handleRowHandlesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (timelineRef.current && rowHandlesRef.current) {
      timelineRef.current.scrollTop = rowHandlesRef.current.scrollTop;
    }
  }, []);

  return (
    <TimelineProvider visibleRows={visibleRows} onZoomChange={(scale) => dispatch(setTimelineZoom(scale * 100))}>
      <AssetLoadingProvider>
        <div className="flex w-full flex-col">

          {/* Timeline Content */}
          <div className="flex relative" style={{ maxHeight: `${TIMELINE_MAX_HEIGHT}px`, overflow: 'hidden' }}>
            {/* Row Drag Handles */}
            <div 
              ref={rowHandlesRef}
              className="w-7 flex-shrink-0 border-l border-r border-gray-700 bg-black custom-scrollbar" 
              style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: `${TIMELINE_MAX_HEIGHT}px` }}
              onScroll={handleRowHandlesScroll}
            >
              <div className="h-6 bg-black border-b border-gray-700 sticky top-0 z-10" />
              <div
                className="flex flex-col"
                style={{ height: `${visibleRows * ROW_HEIGHT}px` }}
              >
                {Array.from({ length: visibleRows }).map((_, rowIndex) => (
                  <div
                    key={`drag-${rowIndex}`}
                    className={`flex items-center justify-center transition-all duration-200 
                      ${dragOverRowIndex === rowIndex ? 'bg-blue-900/20 border-2 border-dashed border-blue-500' : ''}
                      ${draggedRowIndex === rowIndex ? 'opacity-50' : ''}
                      ${isDraggingRow ? 'cursor-grabbing' : 'hover:bg-gray-900'}`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                    onDrop={() => handleRowDrop(rowIndex)}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded-md 
                        hover:bg-gray-700 active:scale-95 ${isDraggingRow ? 'cursor-grabbing' : 'cursor-grab'}`}
                      draggable
                      onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                      onDragEnd={handleRowDragEnd}
                    >
                      <Grip className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 flex flex-col bg-black">
              {/* Timeline Markers - Fixed Header */}
              <div 
                ref={timelineMarkersRef}
                className="h-6 overflow-x-auto overflow-y-hidden hide-scrollbar" 
              >
                <div style={{ width: `${100 * (timelineZoom / 100)}%`, minWidth: '100%' }}>
                  <TimelineMarkers
                    durationInFrames={durationInFrames}
                    handleTimelineClick={(frame) => dispatch(setCurrentTime(frame / fps))}
                    zoomScale={timelineZoom / 100}
                    fps={fps}
                  />
                </div>
              </div>
              
              {/* Timeline Content - Scrollable */}
              <div
                ref={timelineRef}
                className="flex-1 custom-scrollbar"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseUp={handleDragEnd}
                onTouchEnd={handleDragEnd}
                onMouseLeave={handleTimelineMouseLeave}
                onClick={handleTimelineClick}
                onScroll={handleTimelineScroll}
                style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: `${TIMELINE_MAX_HEIGHT}px` }}
              >
                <div className="relative" style={{ width: `${100 * (timelineZoom / 100)}%`, minWidth: '100%' }}>

                {/* Current Time Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-50 shadow-lg"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* Ghost Marker */}
                <GhostMarker
                  position={ghostMarkerPosition}
                  isDragging={isDragging}
                  isContextMenuOpen={isContextMenuOpen}
                />

                {/* Timeline Grid */}
                <div className="relative" style={{ height: `${visibleRows * ROW_HEIGHT}px` }}>
                  {/* Alignment Lines */}
                  {isDragging && enableSnapping && alignmentLines.map((frame, index) => (
                    <div
                      key={`align-${frame}-${index}`}
                      className="absolute top-0 bottom-0 w-px border-r border-dashed border-yellow-400 z-40 pointer-events-none"
                      style={{ left: `${(frame / durationInFrames) * 100}%` }}
                    />
                  ))}

                  {/* Rows */}
                  {Array.from({ length: visibleRows }).map((_, rowIndex) => {
                    const rowItems = overlays.filter(overlay => overlay.row === rowIndex);
                    const gaps = findGapsInRow(rowItems);

                    return (
                      <div
                        key={rowIndex}
                        className={`absolute w-full ${rowIndex < visibleRows - 1 ? 'border-b border-gray-700' : ''} 
                          ${dragOverRowIndex === rowIndex ? 'bg-blue-900/20' : 'bg-black/50'}`}
                        style={{
                          top: `${rowIndex * ROW_HEIGHT}px`,
                          height: `${ROW_HEIGHT}px`,
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => handleExternalMediaDrop(e, rowIndex)}
                      >
                        {/* Timeline Items */}
                        {rowItems.map((item) => {
                          const isMedia = 'type' in item && (item.type === 'video' || item.type === 'audio' || item.type === 'image');
                          const isCaption = 'type' in item && (item as any).type === 'caption';
                          const isInstagram = 'messages' in item && 'participants' in item && item.platform === 'instagram';
                          const itemWidth = ((item.positionEnd - item.positionStart) / duration) * 100;
                          const itemLeft = (item.positionStart / duration) * 100;
                          const isWhatsApp = 'messages' in item && 'participants' in item && item.platform === 'whatsapp';
                          const isSelected = (
                            // Old system (activeElement + index)
                            (activeElement === 'media' && isMedia && mediaFiles[activeElementIndex]?.id === item.id) ||
                            (activeElement === 'text' && !isMedia && !isCaption && !isInstagram && !isWhatsApp && textElements[activeElementIndex]?.id === item.id) ||
                            (activeElement === 'caption' && isCaption && selectedCaptionIds.includes(item.id)) ||
                            ((activeElement as any) === 'instagram' && isInstagram && instagramConversations[activeElementIndex]?.id === item.id) ||
                            ((activeElement as any) === 'whatsapp' && isWhatsApp && whatsappConversations[activeElementIndex]?.id === item.id) ||
                            // New system (selectedIds arrays) - for canvas sync
                            (isMedia && selectedMediaIds.includes(item.id)) ||
                            (!isMedia && !isCaption && !isInstagram && !isWhatsApp && selectedTextIds.includes(item.id)) ||
                            (isWhatsApp && selectedWhatsAppConversationIds.includes(item.id))
                          );
                          const isBeingDragged = draggedItem?.id === item.id;

                          return (
                            <div
                              key={item.id}
                              data-timeline-item
                              style={{
                                position: 'absolute',
                                left: `${itemLeft}%`,
                                width: `${itemWidth}%`,
                                top: '4px',
                                bottom: '4px',
                                height: 'calc(100% - 8px)',
                              }}
                            >
                              <TimelineItem
                                item={item}
                                isMedia={isMedia}
                                isSelected={isSelected}
                                isBeingDragged={isBeingDragged}
                                timelineZoom={timelineZoom}
                                rowIndex={rowIndex}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  if ('type' in item && (item as any).type === 'caption') {
                                    dispatch(setActiveElement('caption'));
                                    dispatch(setSelectedCaptionIds([item.id]));
                                  } else if ('messages' in item && 'participants' in item) {
                                    // Handle conversation selection based on platform
                                    if (item.platform === 'instagram') {
                                      dispatch(setActiveElement('instagram' as any));
                                      const index = instagramConversations.findIndex(c => c.id === item.id);
                                      dispatch(setActiveElementIndex(index));
                                    } else if (item.platform === 'whatsapp') {
                                      dispatch(setActiveElement('whatsapp' as any));
                                      const index = whatsappConversations.findIndex(c => c.id === item.id);
                                      dispatch(setActiveElementIndex(index));
                                      dispatch(setSelectedWhatsAppConversationIds([item.id]));
                                    }
                                  } else {
                                    dispatch(setActiveElement(isMedia ? 'media' : 'text'));
                                    const index = isMedia 
                                      ? mediaFiles.findIndex(m => m.id === item.id)
                                      : textElements.findIndex(t => t.id === item.id);
                                    dispatch(setActiveElementIndex(index));
                                    
                                    // IMPORTANT: Set the new selection arrays for PropertiesPanel
                                    if (isMedia) {
                                      dispatch(setSelectedMediaIds([item.id]));
                                      dispatch(setSelectedTextIds([]));
                                    } else {
                                      dispatch(setSelectedTextIds([item.id]));
                                      dispatch(setSelectedMediaIds([]));
                                    }
                                  }
                                  combinedHandleDragStart(item, e.clientX, e.clientY, 'move');
                                }}
                                onResizeStart={(e) => {
                                  e.stopPropagation();
                                  combinedHandleDragStart(item, e.clientX, e.clientY, 'resize-start');
                                }}
                                onResizeEnd={(e) => {
                                  e.stopPropagation();
                                  combinedHandleDragStart(item, e.clientX, e.clientY, 'resize-end');
                                }}
                              />
                            </div>
                          );
                        })}

                        {/* Gap Indicators */}
                        {!isDragging && gaps.map((gap, gapIndex) => (
                          <TimelineGapIndicator
                            key={`gap-${rowIndex}-${gapIndex}`}
                            gap={gap}
                            rowIndex={rowIndex}
                            totalDuration={duration}
                            onRemoveGap={handleRemoveGap}
                          />
                        ))}

                        {/* Ghost Element */}
                        {isDragging && snappedGhostElement && (
                          (() => {
                            const ghostRow = Math.round(snappedGhostElement.top / (100 / visibleRows));
                            return ghostRow === rowIndex ? (
                              <div
                                className="absolute inset-y-1 rounded-md border-2 border-blue-500 bg-blue-500/20 pointer-events-none z-50"
                                style={{
                                  left: `${snappedGhostElement.left}%`,
                                  width: `${Math.max(snappedGhostElement.width, 1)}%`,
                                }}
                              />
                            ) : null;
                          })()
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </AssetLoadingProvider>
    </TimelineProvider>
  );
};

export default EnhancedTimelineV2;