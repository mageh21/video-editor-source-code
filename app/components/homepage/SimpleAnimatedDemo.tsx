'use client';

import React, { useEffect, useState } from 'react';

const SimpleAnimatedDemo: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const scenes = ['intro', 'timeline', 'features', 'cta'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 3000);

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
          <div className="relative bg-gray-950 h-[400px] flex items-center justify-center overflow-hidden">
            {/* Scene 1: Logo */}
            {currentScene === 0 && (
              <div className="text-center animate-fade-in">
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
                  KLIPPY
                </h1>
                <div className="h-1 w-32 bg-white mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Professional Video Editor</p>
              </div>
            )}

            {/* Scene 2: Timeline */}
            {currentScene === 1 && (
              <div className="w-full px-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-white mb-6">Multi-Track Timeline</h2>
                <div className="space-y-3">
                  <div className="bg-gray-800 h-12 rounded-lg relative overflow-hidden">
                    <div className="absolute left-2 top-2 bottom-2 w-1/3 bg-blue-600 rounded"></div>
                    <div className="absolute left-[40%] top-2 bottom-2 w-1/4 bg-blue-500 rounded"></div>
                  </div>
                  <div className="bg-gray-800 h-12 rounded-lg relative overflow-hidden">
                    <div className="absolute left-2 top-2 bottom-2 w-2/5 bg-green-600 rounded"></div>
                  </div>
                  <div className="bg-gray-800 h-12 rounded-lg relative overflow-hidden">
                    <div className="absolute left-[50%] top-2 bottom-2 w-1/5 bg-purple-600 rounded"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Scene 3: Features */}
            {currentScene === 2 && (
              <div className="animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-white mb-8">Powerful Features</h2>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-white text-sm">Real-time Preview</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="text-3xl mb-2">✂️</div>
                    <p className="text-white text-sm">Precise Editing</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="text-3xl mb-2">🎨</div>
                    <p className="text-white text-sm">Effects & Filters</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="text-3xl mb-2">💾</div>
                    <p className="text-white text-sm">Local Processing</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scene 4: CTA */}
            {currentScene === 3 && (
              <div className="text-center animate-fade-in">
                <h2 className="text-4xl font-bold text-white mb-6">Start Creating Today</h2>
                <div className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold text-xl">
                  It&apos;s Free →
                </div>
                <p className="text-gray-400 mt-6">No downloads. No account. No limits.</p>
              </div>
            )}

            {/* Scene Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {scenes.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentScene === i ? 'bg-white w-8' : 'bg-gray-600 w-2'
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

export default SimpleAnimatedDemo;