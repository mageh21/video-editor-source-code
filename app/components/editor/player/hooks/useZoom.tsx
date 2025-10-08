"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import InfiniteViewer from "@interactify/infinite-viewer";

export default function useZoom(
  containerRef: React.RefObject<HTMLDivElement>,
  viewerRef: React.RefObject<InfiniteViewer>,
  size: { width: number; height: number }
) {
  const [zoom, setZoom] = useState(0.01);
  const currentZoomRef = useRef(0.01);

  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    const viewer = viewerRef.current?.infiniteViewer;
    
    if (!container || !viewer) {
      // If viewer not ready, retry after a short delay
      setTimeout(() => {
        if (containerRef.current && viewerRef.current?.infiniteViewer) {
          fitToContainer();
        }
      }, 100);
      return;
    }

    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    // Only call scrollCenter if the viewer is properly initialized
    try {
      viewer.scrollCenter();
    } catch (e) {
      console.warn('Viewer not ready for scrollCenter');
    }
    
    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height,
    );
    currentZoomRef.current = desiredZoom;
    setZoom(desiredZoom);
  }, [size, containerRef, viewerRef]);

  const handlePinch = useCallback((e: any) => {
    const deltaY = e.inputEvent?.deltaY || 0;
    const changer = deltaY > 0 ? 0.0085 : -0.0085;
    const currentZoom = currentZoomRef.current;
    const newZoom = currentZoom + changer;
    if (newZoom >= 0.001 && newZoom <= 10) {
      currentZoomRef.current = newZoom;
      setZoom(newZoom);
    }
  }, []);

  // Initialize viewer
  useEffect(() => {
    // Fit to container on mount
    const timer = setTimeout(fitToContainer, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [fitToContainer]);

  // Handle resize
  useEffect(() => {
    window.addEventListener("resize", fitToContainer);
    return () => window.removeEventListener("resize", fitToContainer);
  }, [fitToContainer]);

  const setZoomLevel = useCallback((newZoom: number) => {
    const viewer = viewerRef.current?.infiniteViewer;
    if (!viewer) return;
    
    const clampedZoom = Math.max(0.001, Math.min(10, newZoom));
    currentZoomRef.current = clampedZoom;
    setZoom(clampedZoom);
    viewer.setZoom(clampedZoom);
  }, [viewerRef]);

  return {
    zoom,
    handlePinch,
    fitToContainer,
    setZoomLevel
  };
}