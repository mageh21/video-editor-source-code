'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import DemoVideo from './DemoVideo';

const DemoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
      <div className="relative bg-gray-900 rounded-lg p-1">
        <div className="bg-black rounded-lg overflow-hidden">
          {/* Browser Frame */}
          <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="ml-4 text-sm text-gray-500">Klippy Editor - Demo</span>
          </div>
          
          {/* Video Player */}
          <div className="relative bg-black">
            <Player
              component={DemoVideo}
              durationInFrames={360} // 12 seconds at 30fps
              compositionWidth={1280}
              compositionHeight={720}
              fps={30}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '400px',
              }}
              controls={false}
              loop
              autoPlay={isPlaying}
              clickToPlay={false}
            />
            
            {/* Custom Play/Pause Overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 group/play"
            >
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity duration-300">
                {isPlaying ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          </div>
          
          {/* Caption */}
          <div className="bg-gray-900 px-4 py-3 text-center">
            <p className="text-sm text-gray-400">
              See Klippy in action - Timeline editing, effects, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPlayer;