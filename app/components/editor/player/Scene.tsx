"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import InfiniteViewer from "@interactify/infinite-viewer";
import { InteractivePreview } from "./InteractivePreview";
import Board from "./scene/Board";
import SceneEmpty from "./scene/SceneEmpty";
import useZoom from "./hooks/useZoom";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { setMediaFiles, setFilesID } from "@/app/store/slices/projectSlice";
import { storeFile } from "@/app/store";
import { categorizeFile } from "@/app/utils/utils";
import { getMediaDuration } from "@/app/utils/mediaUtils";
import { useTimelinePositioning } from "@/app/hooks/useTimelinePositioning";
import toast from 'react-hot-toast';
import { PlayerRef } from "@remotion/player";
import { Maximize2, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
import CanvasSizeSelector from "../CanvasSizeSelector";
import "./scene/scene.css";

interface SceneProps {
  playerRef?: React.RefObject<PlayerRef>;
}

export default function Scene({ playerRef: externalPlayerRef }: SceneProps) {
  const viewerRef = useRef<InfiniteViewer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<PlayerRef>(null);
  const playerRef = externalPlayerRef || internalPlayerRef;
  const [isViewerReady, setIsViewerReady] = useState(false);
  
  const { resolution, mediaFiles, filesID, textElements, instagramConversations, whatsappConversations } = useAppSelector((state) => state.projectState);
  const { currentTime, isPlaying } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();
  const { findNextAvailablePosition } = useTimelinePositioning();
  
  const size = resolution;
  const hasContent = (mediaFiles && mediaFiles.length > 0) || 
                    (textElements && textElements.length > 0) || 
                    (instagramConversations && instagramConversations.length > 0) ||
                    (whatsappConversations && whatsappConversations.length > 0);
  
  const { zoom, handlePinch, fitToContainer, setZoomLevel } = useZoom(containerRef, viewerRef, size);

  // Initialize viewer when component mounts
  useEffect(() => {
    const checkViewer = () => {
      if (viewerRef.current?.infiniteViewer) {
        setIsViewerReady(true);
      } else {
        setTimeout(checkViewer, 100);
      }
    };
    checkViewer();
  }, []);
  
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.1, 10);
    setZoomLevel(newZoom);
  }, [zoom, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.9, 0.001);
    setZoomLevel(newZoom);
  }, [zoom, setZoomLevel]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleDrop = async (files: File[]) => {
    const updatedFiles = [...(filesID || [])];
    const updatedMedia = [...mediaFiles];
    
    for (const file of files) {
      const fileType = categorizeFile(file.type);
      if (!fileType) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }
      
      const fileId = crypto.randomUUID();
      const mediaId = crypto.randomUUID();
      
      // Store file
      await storeFile(file, fileId);
      updatedFiles.push(fileId);
      
      // Get the actual duration of the media file
      const duration = await getMediaDuration(file);
      // Use smart positioning to find the best position
      const position = findNextAvailablePosition(duration);
      
      // Add to media files with row property
      updatedMedia.push({
        id: mediaId,
        fileName: file.name,
        fileId: fileId,
        startTime: 0,
        endTime: duration,
        // For new media, original bounds are the same as current bounds
        originalStartTime: 0,
        originalEndTime: duration,
        src: URL.createObjectURL(file),
        positionStart: position.from,
        positionEnd: position.from + duration,
        includeInMerge: true,
        rotation: 0,
        opacity: 100,
        playbackSpeed: 1,
        volume: 100,
        type: fileType,
        zIndex: 0,
        row: position.row,
        // Set default position and size for selection system
        x: 0,
        y: 0,
        width: resolution.width,
        height: resolution.height,
      });
    }
    
    dispatch(setFilesID(updatedFiles));
    dispatch(setMediaFiles(updatedMedia));
    toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''}`);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        flex: 1,
        backgroundColor: "#121213"
      }}
    >
      {!hasContent && <SceneEmpty />}
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        
        <div className="px-3 py-2 bg-gray-800 rounded-lg shadow-lg">
          <span className="text-white text-sm font-medium">
            {Math.round(zoom * 10000) / 100}%
          </span>
        </div>
        
        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        
        <button
          onClick={fitToContainer}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          title="Fit to Screen"
        >
          <Minimize2 className="w-4 h-4 text-white" />
        </button>
        
        <div className="w-px h-6 bg-gray-600" />
        
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Canvas Size Selector */}
      <div className="absolute bottom-4 right-4 z-30">
        <CanvasSizeSelector />
      </div>
      
      <InfiniteViewer
        ref={viewerRef}
        className="player-container"
        style={{
          width: "100%",
          height: "100%",
        }}
        displayHorizontalScroll={false}
        displayVerticalScroll={false}
        zoom={zoom}
        usePinch={true}
        pinchThreshold={50}
        onPinch={handlePinch}
        margin={0}
        threshold={0}
        rangeX={[-Infinity, Infinity]}
        rangeY={[-Infinity, Infinity]}
      >
        <Board size={size} onDrop={handleDrop}>
          <InteractivePreview playerRef={playerRef} zoom={zoom} />
        </Board>
      </InfiniteViewer>
    </div>
  );
}