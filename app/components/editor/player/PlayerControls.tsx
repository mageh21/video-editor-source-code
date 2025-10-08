"use client"

import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { setIsPlaying, setIsMuted, setCurrentTime } from "@/app/store/slices/projectSlice";
import { useEffect, useRef, useState } from "react";
import { PlayerRef } from "@remotion/player";

interface PlayerControlsProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

export default function PlayerControls({ playerRef }: PlayerControlsProps) {
  const dispatch = useAppDispatch();
  const { isPlaying, isMuted, currentTime, duration } = useAppSelector(state => state.projectState);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const fps = 30;

  useEffect(() => {
    setLocalCurrentTime(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (!playerRef.current) return;

    const interval = setInterval(() => {
      if (isPlaying && playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        const time = frame / fps;
        setLocalCurrentTime(time);
        if (!isDragging.current) {
          dispatch(setCurrentTime(time));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, dispatch, playerRef]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
    dispatch(setIsMuted(!isMuted));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    dispatch(setCurrentTime(newTime));
    playerRef.current.seekTo(Math.round(newTime * fps));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleSeek(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !progressBarRef.current || !playerRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    setLocalCurrentTime(newTime);
    playerRef.current.seekTo(Math.round(newTime * fps));
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dispatch(setCurrentTime(localCurrentTime));
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [localCurrentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (localCurrentTime / duration) * 100 : 0;

  const handleSkipBackward = () => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, currentTime - 5);
    dispatch(setCurrentTime(newTime));
    playerRef.current.seekTo(Math.round(newTime * fps));
  };

  const handleSkipForward = () => {
    if (!playerRef.current) return;
    const newTime = Math.min(duration, currentTime + 5);
    dispatch(setCurrentTime(newTime));
    playerRef.current.seekTo(Math.round(newTime * fps));
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Skip Buttons */}
        <button
          onClick={handleSkipBackward}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Skip backward 5s"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Skip forward 5s"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Time Display */}
        <div className="text-sm text-gray-400 font-mono">
          {formatTime(localCurrentTime)} / {formatTime(duration)}
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-4">
          <div
            ref={progressBarRef}
            className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
            onMouseDown={handleMouseDown}
          >
            <div
              className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
            />
          </div>
        </div>

        {/* Volume Button */}
        <button
          onClick={handleMuteToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}