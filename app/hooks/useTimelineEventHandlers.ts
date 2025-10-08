import { useCallback } from 'react';

interface UseTimelineEventHandlersProps {
  handleDrag: (clientX: number, clientY: number) => void;
  handleDragEnd: () => void;
  isDragging: boolean;
  timelineRef: React.RefObject<HTMLDivElement>;
  setGhostMarkerPosition: (position: number | null) => void;
}

export const useTimelineEventHandlers = ({
  handleDrag,
  handleDragEnd,
  isDragging,
  timelineRef,
  setGhostMarkerPosition,
}: UseTimelineEventHandlersProps) => {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
        handleDrag(e.clientX, e.clientY);
      } else if (timelineRef.current) {
        // Update ghost marker position when hovering
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.scrollLeft;
        const relativeX = e.clientX - rect.left + scrollLeft;
        setGhostMarkerPosition(relativeX);
      }
    },
    [isDragging, handleDrag, timelineRef, setGhostMarkerPosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        handleDrag(touch.clientX, touch.clientY);
      }
    },
    [isDragging, handleDrag]
  );

  const handleTimelineMouseLeave = useCallback(() => {
    if (!isDragging) {
      setGhostMarkerPosition(null);
    }
  }, [isDragging, setGhostMarkerPosition]);

  return {
    handleMouseMove,
    handleTouchMove,
    handleTimelineMouseLeave,
  };
};