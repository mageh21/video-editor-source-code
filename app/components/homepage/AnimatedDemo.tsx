'use client';

import React, { useEffect, useState } from 'react';

const AnimatedDemo: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  // Cycle through scenes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % 4);
    }, 3000); // Change scene every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Animate playhead
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayheadPosition((prev) => (prev + 1) % 100);
    }, 30);

    return () => clearInterval(interval);
  }, []);

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
            <span className="ml-4 text-sm text-gray-500">Klippy Editor - Live Demo</span>
          </div>
          
          {/* Demo Content */}
          <div className="relative bg-black h-[400px] overflow-hidden">
            {/* Scene 1: Logo Animation */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentScene === 0 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="text-center animate-fade-in">
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter animate-scale-in">
                  KLIPPY
                </h1>
                <div className="h-1 w-32 bg-white mx-auto mt-4 animate-width-expand"></div>
                <p className="text-gray-400 mt-4 animate-fade-in-delayed">Professional Video Editor</p>
              </div>
            </div>

            {/* Scene 2: Timeline Demo */}
            <div className={`absolute inset-0 p-8 transition-opacity duration-1000 ${currentScene === 1 ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-3xl font-bold text-white mb-6 animate-slide-down">Multi-Track Timeline</h2>
              <div className="space-y-4">
                {/* Video Track */}
                <div className="animate-slide-right" style={{ animationDelay: '0.1s' }}>
                  <p className="text-gray-400 text-sm mb-2">Video Track</p>
                  <div className="h-16 bg-gray-800 rounded-lg relative overflow-hidden">
                    <div className="absolute left-4 top-2 bottom-2 w-1/3 bg-gradient-to-r from-blue-600 to-blue-500 rounded animate-track-expand"></div>
                    <div className="absolute left-[40%] top-2 bottom-2 w-1/4 bg-gradient-to-r from-blue-600 to-blue-500 rounded animate-track-expand-delayed"></div>
                  </div>
                </div>
                {/* Audio Track */}
                <div className="animate-slide-right" style={{ animationDelay: '0.2s' }}>
                  <p className="text-gray-400 text-sm mb-2">Audio Track</p>
                  <div className="h-16 bg-gray-800 rounded-lg relative overflow-hidden">
                    <div className="absolute left-4 top-2 bottom-2 w-2/5 bg-gradient-to-r from-green-600 to-green-500 rounded animate-track-expand"></div>
                  </div>
                </div>
                {/* Text Track */}
                <div className="animate-slide-right" style={{ animationDelay: '0.3s' }}>
                  <p className="text-gray-400 text-sm mb-2">Text Track</p>
                  <div className="h-16 bg-gray-800 rounded-lg relative overflow-hidden">
                    <div className="absolute left-[50%] top-2 bottom-2 w-1/5 bg-gradient-to-r from-purple-600 to-purple-500 rounded animate-track-expand-delayed"></div>
                  </div>
                </div>
                {/* Playhead */}
                <div 
                  className="absolute top-24 bottom-8 w-0.5 bg-red-500 transition-all duration-100 ease-linear"
                  style={{ left: `${10 + playheadPosition * 0.7}%` }}
                >
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-red-500"></div>
                </div>
              </div>
            </div>

            {/* Scene 3: Features */}
            <div className={`absolute inset-0 p-8 transition-opacity duration-1000 ${currentScene === 2 ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-3xl font-bold text-white mb-8 text-center animate-fade-in">Powerful Features</h2>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-gray-800 p-6 rounded-lg text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-white">Real-time Preview</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <div className="text-4xl mb-2">✂️</div>
                  <p className="text-white">Precise Editing</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-white">Effects & Filters</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-white">Any Device</p>
                </div>
              </div>
            </div>

            {/* Scene 4: CTA */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentScene === 3 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-6 animate-slide-down">Start Creating Today</h2>
                <div className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold text-xl animate-pulse-slow">
                  It&apos;s Free →
                </div>
                <p className="text-gray-400 mt-6 animate-fade-in-delayed">No downloads. No account. No limits.</p>
              </div>
            </div>

            {/* Scene Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentScene === i ? 'bg-white w-8' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Caption */}
          <div className="bg-gray-900 px-4 py-3 text-center">
            <p className="text-sm text-gray-400">
              Watch how Klippy makes video editing simple and powerful
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDemo;