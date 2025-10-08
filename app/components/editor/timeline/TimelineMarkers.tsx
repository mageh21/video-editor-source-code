import React from 'react';

interface TimelineMarkersProps {
  durationInFrames: number;
  handleTimelineClick: (frame: number) => void;
  zoomScale: number;
  fps?: number;
}

const TimelineMarkers: React.FC<TimelineMarkersProps> = ({ 
  durationInFrames, 
  handleTimelineClick, 
  zoomScale,
  fps = 30 
}) => {
  const durationInSeconds = durationInFrames / fps;
  const pixelsPerSecond = 100 * zoomScale / durationInSeconds;
  
  // Calculate marker interval based on zoom level
  let interval = 1; // seconds
  if (pixelsPerSecond < 20) interval = 5;
  else if (pixelsPerSecond < 40) interval = 2;
  else if (pixelsPerSecond > 200) interval = 0.5;
  else if (pixelsPerSecond > 400) interval = 0.25;

  const markers = [];
  for (let time = 0; time <= durationInSeconds; time += interval) {
    const frame = time * fps;
    const position = (frame / durationInFrames) * 100;
    
    markers.push(
      <div
        key={time}
        className="absolute flex flex-col items-center cursor-pointer hover:opacity-80"
        style={{ left: `${position}%` }}
        onClick={() => handleTimelineClick(frame)}
      >
        <div className="h-2 w-px bg-gray-600" />
        <span className="text-[10px] text-gray-400 select-none mt-0.5">
          {formatTime(time)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-800 border-b border-gray-700">
      {markers}
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(secs % 1 === 0 ? 0 : 1).padStart(2, '0')}`;
};

export default TimelineMarkers;