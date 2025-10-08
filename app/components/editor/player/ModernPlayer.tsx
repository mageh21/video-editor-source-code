"use client"

import { PreviewPlayer } from "./remotion/Player";
import { useAppSelector } from "@/app/store";
import { Maximize2, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

export default function ModernPlayer() {
  const { mediaFiles, isPlaying, isMuted } = useAppSelector((state) => state.projectState);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const hasContent = mediaFiles && mediaFiles.length > 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full h-full relative group">
      {/* Main Player Container */}
      <div className="w-full h-full relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Remotion Player */}
        <PreviewPlayer />
        
        {/* Custom Overlay Controls (when content is present) */}
        {hasContent && (
          <>
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Center Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </div>

            {/* Bottom Gradient for Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Custom Status Indicators */}
      {hasContent && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center space-x-1 px-2 py-1 bg-black/50 rounded-lg">
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-red-400" />
            ) : (
              <Volume2 className="w-3 h-3 text-green-400" />
            )}
            <span className="text-xs text-white">
              {isMuted ? 'Muted' : 'Audio'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}