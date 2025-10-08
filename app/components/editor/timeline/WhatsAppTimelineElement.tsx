import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, MoreVertical, Volume2, VolumeX, Copy, Trash, Lock, Unlock } from 'lucide-react';
import { WhatsAppConversation } from '@/app/types';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { 
  updateWhatsAppConversation, 
  removeWhatsAppConversation,
  addWhatsAppConversation,
  setActiveElement 
} from '@/app/store/slices/projectSlice';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WhatsAppTimelineElementProps {
  element: WhatsAppConversation;
  timelineZoom: number;
  currentTime: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  pixelsPerSecond: number;
  onPositionChange?: (id: string, startTime: number, endTime: number) => void;
  onDurationChange?: (id: string, duration: number) => void;
  snapToPlayhead?: (time: number) => number;
  row: number;
}

export const WhatsAppTimelineElement: React.FC<WhatsAppTimelineElementProps> = ({
  element,
  timelineZoom,
  currentTime,
  isSelected,
  onSelect,
  pixelsPerSecond,
  onPositionChange,
  onDurationChange,
  snapToPlayhead,
  row
}) => {
  const dispatch = useAppDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalPosition, setOriginalPosition] = useState({ start: 0, end: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const activeElement = useAppSelector(state => state.projectState.activeElement);
  const isActive = (activeElement as any)?.id === element.id && (activeElement as any)?.type === 'whatsapp-conversation';

  const duration = element.positionEnd - element.positionStart;
  const left = element.positionStart * pixelsPerSecond;
  const width = duration * pixelsPerSecond;

  // Check if element is in view
  const isInView = currentTime >= element.positionStart && currentTime <= element.positionEnd;

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
      onSelect(e);
    } else if (action === 'resize-left') {
      setIsResizing('left');
    } else if (action === 'resize-right') {
      setIsResizing('right');
    }
    
    setDragStartX(e.clientX);
    setOriginalPosition({ start: element.positionStart, end: element.positionEnd });

    dispatch(setActiveElement({ id: element.id, type: 'whatsapp-conversation', index: 0 } as any));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isDragging) {
        let newStart = originalPosition.start + deltaTime;
        let newEnd = originalPosition.end + deltaTime;
        
        // Snap to playhead if close
        if (snapToPlayhead) {
          const snapThreshold = 5 / pixelsPerSecond; // 5 pixels
          if (Math.abs(newStart - currentTime) < snapThreshold) {
            const offset = currentTime - newStart;
            newStart = currentTime;
            newEnd += offset;
          } else if (Math.abs(newEnd - currentTime) < snapThreshold) {
            const offset = currentTime - newEnd;
            newStart += offset;
            newEnd = currentTime;
          }
        }
        
        // Prevent negative times
        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        
        if (onPositionChange) {
          onPositionChange(element.id, newStart, newEnd);
        } else {
          dispatch(updateWhatsAppConversation({
            ...element,
            positionStart: newStart,
            positionEnd: newEnd
          }));
        }
      } else if (isResizing) {
        const minDuration = 1; // Minimum 1 second
        
        if (isResizing === 'left') {
          let newStart = originalPosition.start + deltaTime;
          newStart = Math.min(newStart, originalPosition.end - minDuration);
          newStart = Math.max(0, newStart);
          
          // Snap to playhead if close
          if (snapToPlayhead && Math.abs(newStart - currentTime) < 5 / pixelsPerSecond) {
            newStart = currentTime;
          }
          
          dispatch(updateWhatsAppConversation({
            ...element,
            positionStart: newStart
          }));
        } else if (isResizing === 'right') {
          let newEnd = originalPosition.end + deltaTime;
          newEnd = Math.max(newEnd, originalPosition.start + minDuration);
          
          // Snap to playhead if close
          if (snapToPlayhead && Math.abs(newEnd - currentTime) < 5 / pixelsPerSecond) {
            newEnd = currentTime;
          }
          
          dispatch(updateWhatsAppConversation({
            ...element,
            positionEnd: newEnd
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStartX, originalPosition, pixelsPerSecond, element, dispatch, currentTime, snapToPlayhead, onPositionChange]);

  const handleSplit = () => {
    if (currentTime <= element.positionStart || currentTime >= element.positionEnd) return;

    // Create two new conversations
    const firstHalf = {
      ...element,
      id: `whatsapp-${Date.now()}-1`,
      positionEnd: currentTime
    };
    
    const secondHalf = {
      ...element,
      id: `whatsapp-${Date.now()}-2`,
      positionStart: currentTime
    };

    // Remove original and add two new ones
    dispatch(removeWhatsAppConversation(element.id));
    dispatch(addWhatsAppConversation(firstHalf));
    dispatch(addWhatsAppConversation(secondHalf));
  };

  const handleDuplicate = () => {
    const duration = element.positionEnd - element.positionStart;
    const newElement = {
      ...element,
      id: `whatsapp-${Date.now()}`,
      positionStart: element.positionEnd,
      positionEnd: element.positionEnd + duration
    };
    dispatch(addWhatsAppConversation(newElement));
  };

  const handleDelete = () => {
    dispatch(removeWhatsAppConversation(element.id));
  };

  const handleToggleLock = () => {
    dispatch(updateWhatsAppConversation({
      ...element,
      isLocked: !(element as any).isLocked
    } as any));
  };

  return (
    // Tooltip wrapper removed until tooltip component is available
    // <Tooltip>
    //   <TooltipTrigger asChild>
        <div
          ref={elementRef}
          className={cn(
            "absolute h-16 rounded-md transition-all cursor-move group",
            "bg-gradient-to-r from-green-500 to-green-600",
            "border border-green-700",
            isSelected && "ring-2 ring-green-300 ring-offset-1 ring-offset-transparent",
            isActive && "ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900",
            isInView && "shadow-lg shadow-green-500/20",
            (isDragging || isResizing) && "opacity-80",
            (element as any).isLocked && "opacity-60 cursor-not-allowed"
          )}
          style={{
            left: `${left}px`,
            width: `${width}px`,
            minWidth: '50px',
            top: `${row * 72 + 8}px`
          }}
          onMouseDown={(e) => !(element as any).isLocked && handleMouseDown(e, 'drag')}
          onClick={onSelect}
        >
          {/* Left resize handle */}
          {!(element as any).isLocked && (
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-green-300/30"
              onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />
          )}
          
          {/* Right resize handle */}
          {!(element as any).isLocked && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-green-300/30"
              onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />
          )}
          
          {/* Content */}
          <div className="flex items-center justify-between h-full px-3 relative">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-white flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {element.chatTitle || 'WhatsApp Chat'}
                </div>
                <div className="text-xs text-green-100 opacity-80">
                  {element.messages.length} messages
                </div>
              </div>
            </div>
            
            {/* Lock indicator */}
            {(element as any).isLocked && (
              <Lock className="w-3 h-3 text-white/60 ml-1" />
            )}
            
            {/* More options - Commented out until dropdown-menu component is available */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-700/50 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSplit}
                  disabled={currentTime <= element.positionStart || currentTime >= element.positionEnd}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Split at Playhead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleLock}>
                  {element.isLocked ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Lock
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                  disabled={element.isLocked}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
          
          {/* Progress indicator */}
          {isInView && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-green-300"
              style={{
                width: `${((currentTime - element.positionStart) / duration) * 100}%`
              }}
            />
          )}
        </div>
    //   </TooltipTrigger>
    //   <TooltipContent>
    //     <div className="text-xs">
    //       <div className="font-semibold">{element.chatTitle}</div>
    //       <div>{element.messages.length} messages • {element.participants.length} participants</div>
    //       <div>{element.positionStart.toFixed(1)}s - {element.positionEnd.toFixed(1)}s ({duration.toFixed(1)}s)</div>
    //       {element.isBusinessChat && <div className="text-green-400">Business Account</div>}
    //     </div>
    //   </TooltipContent>
    // </Tooltip>
  );
};