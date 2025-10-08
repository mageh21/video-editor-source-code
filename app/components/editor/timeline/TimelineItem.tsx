import React, { useState, useEffect, useRef } from 'react';
import { MediaFile, TextElement, Caption, InstagramConversation, WhatsAppConversation } from '@/app/types';
import { generateVideoThumbnail, generateImageThumbnail, generateVideoFrames } from '@/app/utils/thumbnailUtils';
import { getWaveformData, WaveformData } from '@/app/utils/waveformUtils';
import { Film, Volume2, Image as ImageIcon, Type, MoreVertical, Scissors, Copy, Trash2, AudioWaveform, Subtitles, MessageCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setMediaFiles, setTextElements, setVisibleRows, setInstagramConversations, setWhatsAppConversations } from '@/app/store/slices/projectSlice';
import { InstagramTimelineElement } from './InstagramTimelineElement';
import toast from 'react-hot-toast';

interface TimelineItemProps {
  item: MediaFile | TextElement | (Caption & { row: number; type: 'caption' }) | InstagramConversation | WhatsAppConversation;
  isMedia: boolean;
  isSelected: boolean;
  isBeingDragged: boolean;
  timelineZoom: number;
  rowIndex: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onResizeEnd: (e: React.MouseEvent) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  isMedia,
  isSelected,
  isBeingDragged,
  timelineZoom,
  rowIndex,
  onMouseDown,
  onResizeStart,
  onResizeEnd,
}) => {
  const dispatch = useAppDispatch();
  const { mediaFiles, textElements, instagramConversations, whatsappConversations, currentTime, visibleRows, maxRows } = useAppSelector(state => state.projectState);
  const [keyframes, setKeyframes] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMedia) return;
    
    const media = item as MediaFile;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const loadThumbnail = async () => {
      if (!media.src) return;
      
      if (media.type === 'video') {
        // Generate multiple keyframes for video
        const duration = media.positionEnd - media.positionStart;
        const pixelWidth = duration * timelineZoom;
        const frameCount = Math.min(Math.max(Math.floor(pixelWidth / 60), 1), 15);
        
        const frames = await generateVideoFrames(
          media.src, 
          frameCount, 
          media.startTime, 
          media.endTime
        );
        
        if (!signal.aborted && frames.length > 0) {
          setKeyframes(frames);
        }
      } else if (media.type === 'image') {
        const thumb = await generateImageThumbnail(media.src, signal);
        if (!signal.aborted && thumb) {
          setThumbnail(thumb);
        }
      } else if (media.type === 'audio') {
        // Generate waveform for audio
        try {
          // Calculate samples per pixel based on timeline width
          const pixelWidth = (media.positionEnd - media.positionStart) * timelineZoom;
          const samplesPerPixel = Math.max(256, Math.floor(4096 / pixelWidth));
          
          const waveform = await getWaveformData(media.src, samplesPerPixel, signal);
          if (!signal.aborted && waveform.peaks.length > 0) {
            setWaveformData(waveform);
          }
        } catch (error) {
          console.warn('Failed to generate waveform:', error);
        }
      }
    };

    loadThumbnail();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [item, isMedia, timelineZoom]);

  const getItemColor = () => {
    if (!isMedia) {
      // Check if it's a conversation
      if ('messages' in item && 'participants' in item) {
        if (item.platform === 'instagram') {
          return 'bg-gradient-to-r from-purple-500 to-pink-500';
        } else if (item.platform === 'whatsapp') {
          return 'bg-gradient-to-r from-green-500 to-green-600';
        }
        return 'bg-gradient-to-r from-purple-500 to-pink-500'; // fallback
      }
      if ('type' in item && item.type === 'caption') {
        return 'bg-yellow-500';
      }
      return 'bg-purple-500';
    }
    const media = item as MediaFile;
    switch (media.type) {
      case 'video': return 'bg-blue-600 dark:bg-blue-800';
      case 'audio': return 'bg-gray-800';
      case 'image': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = () => {
    if (!isMedia) {
      // Check if it's a conversation
      if ('messages' in item && 'participants' in item) {
        return <MessageCircle className="w-3 h-3 mr-1" />;
      }
      if ('type' in item && item.type === 'caption') {
        return <Subtitles className="w-3 h-3 mr-1" />;
      }
      return <Type className="w-3 h-3 mr-1" />;
    }
    const media = item as MediaFile;
    switch (media.type) {
      case 'video': return <Film className="w-3 h-3 mr-1" />;
      case 'audio': return <Volume2 className="w-3 h-3 mr-1" />;
      case 'image': return <ImageIcon className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const getLabel = () => {
    if (isMedia) {
      const media = item as MediaFile;
      return media.fileName;
    } else {
      // Check if it's a conversation
      if ('messages' in item && 'participants' in item) {
        if (item.platform === 'instagram') {
          const conversation = item as InstagramConversation;
          return conversation.chatTitle || 'Instagram DM';
        } else if (item.platform === 'whatsapp') {
          const conversation = item as WhatsAppConversation;
          return conversation.chatTitle || 'WhatsApp Chat';
        }
        return 'Conversation';
      }
      if ('type' in item && item.type === 'caption') {
        return (item as Caption).text;
      }
      const text = item as TextElement;
      return text.text;
    }
  };

  const getLabelBackgroundColor = () => {
    if (!isMedia) {
      // Check if it's a conversation
      if ('messages' in item && 'participants' in item) {
        return 'bg-white/20';
      }
      if ('type' in item && item.type === 'caption') {
        return 'bg-gray-200/30';
      }
      return 'bg-purple-200/30';
    }
    const media = item as MediaFile;
    switch (media.type) {
      case 'video': return 'bg-purple-200/30';
      case 'audio': return 'bg-gray-900/60';
      case 'image': return 'bg-emerald-100/80';
      default: return 'bg-gray-100/80';
    }
  };

  const getLabelTextColor = () => {
    if (!isMedia) {
      // Check if it's a conversation
      if ('messages' in item && 'participants' in item) {
        return 'text-white';
      }
      if ('type' in item && item.type === 'caption') {
        return 'text-gray-100';
      }
      return 'text-white';
    }
    const media = item as MediaFile;
    switch (media.type) {
      case 'video': return 'text-white';
      case 'audio': return 'text-orange-400';
      case 'image': return 'text-emerald-900 dark:text-emerald-100';
      default: return 'text-gray-900';
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate menu position
    const menuHeight = 200; // Approximate height of context menu
    const menuWidth = 180; // Width of context menu
    const padding = 10;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Check if menu would go off screen bottom
    if (window.innerHeight - e.clientY < menuHeight + padding) {
      // Position menu above the cursor
      y = e.clientY - menuHeight;
    }
    
    // Check if menu would go off screen right
    if (window.innerWidth - e.clientX < menuWidth + padding) {
      // Position menu to the left of cursor
      x = e.clientX - menuWidth;
    }
    
    // Ensure menu doesn't go off screen top or left
    x = Math.max(padding, x);
    y = Math.max(padding, y);
    
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  };

  const handleSeparateAudio = () => {
    if (!isMedia || (item as MediaFile).type !== 'video') return;
    
    const videoFile = item as MediaFile;
    
    // Check if video has audio (we'll assume it does for now)
    // In a real implementation, you'd check the actual video file
    
    // Find the row right below the video (or next available row)
    const targetRow = (videoFile.row || 0) + 1;
    
    // Check if we need to increase visible rows
    if (targetRow >= visibleRows && visibleRows < maxRows) {
      dispatch(setVisibleRows(Math.min(targetRow + 1, maxRows)));
    }
    
    // Create a new audio element from the video
    const audioElement: MediaFile = {
      ...videoFile,
      id: crypto.randomUUID(),
      type: 'audio',
      fileName: `${videoFile.fileName} - Audio`,
      row: targetRow,
      // Keep same timing as the video
      positionStart: videoFile.positionStart,
      positionEnd: videoFile.positionEnd,
      startTime: videoFile.startTime,
      endTime: videoFile.endTime,
      // Preserve volume settings
      volume: videoFile.volume !== undefined ? videoFile.volume : 100,
    };
    
    // Update the video to be muted
    const updatedVideo: MediaFile = {
      ...videoFile,
      volume: 0, // Mute the video
    };
    
    // Update the media files
    const updatedMediaFiles = mediaFiles.map(file => 
      file.id === videoFile.id ? updatedVideo : file
    );
    updatedMediaFiles.push(audioElement);
    
    dispatch(setMediaFiles(updatedMediaFiles));
    setShowContextMenu(false);
    toast.success('Audio track separated from video');
  };

  const handleDelete = () => {
    if (isMedia) {
      const filtered = mediaFiles.filter(file => file.id !== item.id);
      dispatch(setMediaFiles(filtered));
    } else if ('messages' in item && 'participants' in item) {
      // Handle conversation deletion based on platform
      if (item.platform === 'instagram') {
        const filtered = instagramConversations.filter(conv => conv.id !== item.id);
        dispatch(setInstagramConversations(filtered));
      } else if (item.platform === 'whatsapp') {
        const filtered = whatsappConversations.filter(conv => conv.id !== item.id);
        dispatch(setWhatsAppConversations(filtered));
      }
    } else {
      const filtered = textElements.filter(text => text.id !== item.id);
      dispatch(setTextElements(filtered));
    }
    setShowContextMenu(false);
    toast.success('Item deleted');
  };

  const handleDuplicate = () => {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      positionStart: (item as any).positionEnd + 0.5,
      positionEnd: (item as any).positionEnd + ((item as any).positionEnd - (item as any).positionStart) + 0.5,
    };
    
    if (isMedia) {
      dispatch(setMediaFiles([...mediaFiles, newItem as MediaFile]));
    } else if ('messages' in item && 'participants' in item) {
      // Handle conversation duplication based on platform
      if (item.platform === 'instagram') {
        dispatch(setInstagramConversations([...instagramConversations, newItem as InstagramConversation]));
      } else if (item.platform === 'whatsapp') {
        dispatch(setWhatsAppConversations([...whatsappConversations, newItem as WhatsAppConversation]));
      }
    } else {
      dispatch(setTextElements([...textElements, newItem as TextElement]));
    }
    setShowContextMenu(false);
    toast.success('Item duplicated');
  };

  const handleSplit = () => {
    if (currentTime <= (item as any).positionStart || currentTime >= (item as any).positionEnd) {
      toast.error('Position playhead within the element to split');
      return;
    }

    const splitRatio = (currentTime - (item as any).positionStart) / ((item as any).positionEnd - (item as any).positionStart);

    const firstPart = {
      ...item,
      id: crypto.randomUUID(),
      positionEnd: currentTime,
    };

    const secondPart = {
      ...item,
      id: crypto.randomUUID(),
      positionStart: currentTime,
    };
    
    // For media files, also split the trim times
    if (isMedia) {
      const media = item as MediaFile;
      const trimDuration = media.endTime - media.startTime;
      (firstPart as MediaFile).endTime = media.startTime + (trimDuration * splitRatio);
      (secondPart as MediaFile).startTime = (firstPart as MediaFile).endTime;
    }
    
    if (isMedia) {
      const updatedFiles = mediaFiles.filter(file => file.id !== item.id);
      updatedFiles.push(firstPart as MediaFile, secondPart as MediaFile);
      dispatch(setMediaFiles(updatedFiles));
    } else if ('messages' in item && 'participants' in item) {
      // Handle conversation split based on platform
      if (item.platform === 'instagram') {
        const updatedConversations = instagramConversations.filter(conv => conv.id !== item.id);
        updatedConversations.push(firstPart as InstagramConversation, secondPart as InstagramConversation);
        dispatch(setInstagramConversations(updatedConversations));
      } else if (item.platform === 'whatsapp') {
        const updatedConversations = whatsappConversations.filter(conv => conv.id !== item.id);
        updatedConversations.push(firstPart as WhatsAppConversation, secondPart as WhatsAppConversation);
        dispatch(setWhatsAppConversations(updatedConversations));
      }
    } else {
      const updatedTexts = textElements.filter(text => text.id !== item.id);
      updatedTexts.push(firstPart as TextElement, secondPart as TextElement);
      dispatch(setTextElements(updatedTexts));
    }
    
    setShowContextMenu(false);
    toast.success('Item split successfully');
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        ref={itemRef}
        className={`relative w-full h-full rounded-md shadow-md cursor-grab group 
          ${getItemColor()} 
          ${isBeingDragged ? 'opacity-50' : ''} 
          ${isSelected ? 'border-2 border-black dark:border-white' : 'border-0'}
          select-none overflow-hidden transition-all`}
        style={{
          position: 'relative',
          // Higher rows (lower track numbers) should have higher z-index in timeline
          // But this is opposite for the player where lower rows should render first
          zIndex: isSelected ? 1000 : isBeingDragged ? 999 : (10 - rowIndex) * 10 + 15,
        }}
        onMouseDown={onMouseDown}
        onContextMenu={handleContextMenu}
      >
      {/* Background content - Keyframes/Waveform/Thumbnail */}
      {isMedia && (
        <>
          {(item as MediaFile).type === 'video' && (
            <>
              {keyframes.length > 0 ? (
                <div className="absolute inset-0 flex">
                  {keyframes.map((frame, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${frame})`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                // Fallback pattern when thumbnails fail to load
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 opacity-50" />
              )}
            </>
          )}
          
          {(item as MediaFile).type === 'audio' && (
            <>
              {waveformData && waveformData.peaks.length > 0 ? (
                <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                  <div className="w-full h-full flex items-center">
                    {/* Render waveform with better visual appearance */}
                    <div className="flex items-center w-full h-full relative">
                      <div className="absolute inset-0 flex items-center" style={{ gap: '1px' }}>
                        {(() => {
                          // Calculate how many bars we can show based on width
                          const barWidth = 2;
                          const barGap = 1;
                          const availableWidth = Math.max(50, ((item as any).positionEnd - (item as any).positionStart) * timelineZoom);
                          const maxBars = Math.floor(availableWidth / (barWidth + barGap));
                          const step = Math.max(1, Math.floor(waveformData.peaks.length / maxBars));
                          
                          return waveformData.peaks.filter((_, index) => index % step === 0).map((peak, index) => (
                            <div
                              key={index}
                              className="flex-shrink-0 flex items-center"
                              style={{ 
                                width: `${barWidth}px`,
                                height: '100%',
                                marginRight: `${barGap}px`
                              }}
                            >
                              <div
                                className="w-full bg-gradient-to-b from-orange-300 to-orange-500 rounded-sm"
                                style={{
                                  height: `${Math.max(15, peak * 85)}%`,
                                  opacity: 0.9,
                                }}
                              />
                            </div>
                          ));
                        })()}
                      </div>
                      {/* Center line */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-orange-600/20" />
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback gradient while waveform is loading
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 opacity-30">
                  <div className="absolute inset-0 flex items-center justify-center text-orange-400/50">
                    <Volume2 className="w-6 h-6" />
                  </div>
                </div>
              )}
            </>
          )}
          
          {(item as MediaFile).type === 'image' && (
            <>
              {thumbnail ? (
                <div className="absolute inset-x-2 inset-y-1 flex items-center">
                  <img
                    src={thumbnail}
                    alt=""
                    className="h-full w-auto object-cover rounded"
                    style={{ maxWidth: '60px' }}
                  />
                </div>
              ) : (
                // Fallback for image
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-30" />
              )}
            </>
          )}
        </>
      )}

      {/* Label overlay */}
      <div className="absolute inset-0 flex items-center z-20">
        <div
          className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 mx-2
            ${isSelected ? 'mx-5' : 'mx-2'} 
            group-hover:mx-5
            transition-all duration-200 ease-in-out
            ${getLabelBackgroundColor()} ${getLabelTextColor()}`}
        >
          <div className="flex items-center">
            {getIcon()}
            <span className="truncate max-w-[100px] font-medium">
              {getLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Resize handles - visible for all media types */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          transition-all duration-200 z-50`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(e);
        }}
        style={{ zIndex: 100 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-4 bg-white/60 rounded-full" />
        </div>
      </div>
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          transition-all duration-200 z-50`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeEnd(e);
        }}
        style={{ zIndex: 100 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-4 bg-white/60 rounded-full" />
        </div>
      </div>
    </div>

    {/* Context Menu */}
    {showContextMenu && (
      <div
        className="fixed z-[1001] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px] max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in duration-150"
        style={{
          left: `${contextMenuPosition.x}px`,
          top: `${contextMenuPosition.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Separate Audio - only for video files */}
        {isMedia && (item as MediaFile).type === 'video' && (
          <>
            <button
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-800 flex items-center space-x-2 text-white"
              onClick={handleSeparateAudio}
            >
              <AudioWaveform className="w-4 h-4" />
              <span>Separate Audio</span>
            </button>
            <div className="h-px bg-gray-700" />
          </>
        )}
        
        <button
          className="w-full px-4 py-2 text-sm text-left hover:bg-gray-800 flex items-center space-x-2 text-white"
          onClick={handleDuplicate}
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate</span>
        </button>
        
        <button
          className="w-full px-4 py-2 text-sm text-left hover:bg-gray-800 flex items-center space-x-2 text-white"
          onClick={handleSplit}
          disabled={currentTime <= (item as any).positionStart || currentTime >= (item as any).positionEnd}
        >
          <Scissors className="w-4 h-4" />
          <span>Split at Playhead</span>
        </button>
        
        <div className="h-px bg-gray-700" />
        
        <button
          className="w-full px-4 py-2 text-sm text-left hover:bg-gray-800 flex items-center space-x-2 text-red-400"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    )}
  </>
  );
};