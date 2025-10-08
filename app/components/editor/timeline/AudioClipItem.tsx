import React from 'react';
import { MediaFile } from '@/app/types';
import { useWaveformProcessor } from '@/app/hooks/useWaveformProcessor';
import { WaveformBars } from './WaveformVisualizer';
import Image from 'next/image';

interface AudioClipItemProps {
  clip: MediaFile;
  isActive: boolean;
  timelineZoom: number;
}

export const AudioClipItem: React.FC<AudioClipItemProps> = ({ clip, isActive, timelineZoom }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const waveformData = useWaveformProcessor({ media: clip, containerRef });

  return (
    <div
      ref={containerRef}
      className={`absolute border border-gray-500 border-opacity-50 rounded-md top-2 h-12 rounded bg-[#27272A] text-white text-sm flex items-center justify-center cursor-pointer overflow-hidden ${
        isActive ? 'bg-[#3F3F46] border-blue-500' : ''
      }`}
      style={{
        left: `${clip.positionStart * timelineZoom}px`,
        width: `${(clip.positionEnd - clip.positionStart) * timelineZoom}px`,
        zIndex: clip.zIndex,
      }}
    >
      {/* Waveform visualization background */}
      {waveformData && (
        <div className="absolute inset-0 opacity-50">
          <WaveformBars peaks={waveformData.peaks} className="h-full" />
        </div>
      )}
      
      {/* Audio info overlay */}
      <div className="absolute inset-0 flex items-center px-2 z-10">
        <Image
          alt="Audio"
          className="h-7 w-7 min-w-6 mr-2 flex-shrink-0 drop-shadow-lg"
          height={30}
          width={30}
          src="https://www.svgrepo.com/show/532708/music.svg"
        />
        <span className="truncate text-xs font-medium drop-shadow-lg">{clip.fileName}</span>
      </div>
    </div>
  );
};