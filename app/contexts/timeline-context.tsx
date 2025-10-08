"use client";

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface TimelineContextType {
  visibleRows: number;
  timelineRef: React.RefObject<HTMLDivElement>;
  zoomScale: number;
  handleWheelZoom: (e: WheelEvent) => void;
  setZoomScale: (scale: number) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

interface TimelineProviderProps {
  children: ReactNode;
  visibleRows: number;
  onZoomChange?: (scale: number) => void;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ 
  children, 
  visibleRows,
  onZoomChange 
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomScale, setZoomScaleInternal] = useState(1);

  const setZoomScale = useCallback((scale: number) => {
    setZoomScaleInternal(scale);
    onZoomChange?.(scale);
  }, [onZoomChange]);

  const handleWheelZoom = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomScale(Math.max(0.1, Math.min(5, zoomScale * delta)));
    }
  }, [zoomScale, setZoomScale]);

  return (
    <TimelineContext.Provider 
      value={{ 
        visibleRows, 
        timelineRef, 
        zoomScale, 
        handleWheelZoom,
        setZoomScale
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};