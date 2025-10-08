"use client";

import React, { useState, useEffect } from 'react';
// import { TransitionConfig } from '@/app/types';
import { transitionTemplates } from '@/app/utils/transition-templates';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TransitionLivePreviewProps {
  entranceTransition?: any;
  exitTransition?: any;
  mediaDuration: number;
}

export const TransitionLivePreview: React.FC<TransitionLivePreviewProps> = ({
  entranceTransition,
  exitTransition,
  mediaDuration,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'entrance' | 'middle' | 'exit'>('entrance');

  useEffect(() => {
    if (!isPlaying) return;

    const startTime = Date.now();
    const totalDuration = mediaDuration * 1000; // Convert to ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const normalizedProgress = elapsed / totalDuration;
      
      if (normalizedProgress >= 1) {
        setIsPlaying(false);
        setProgress(0);
        setPhase('entrance');
        return;
      }
      
      setProgress(normalizedProgress);
      
      // Determine phase
      const entranceDuration = (entranceTransition?.duration || 0) * (entranceTransition?.speed || 1);
      const exitDuration = (exitTransition?.duration || 0) * (exitTransition?.speed || 1);
      const entranceEnd = entranceDuration / mediaDuration;
      const exitStart = 1 - (exitDuration / mediaDuration);
      
      if (normalizedProgress < entranceEnd) {
        setPhase('entrance');
      } else if (normalizedProgress > exitStart) {
        setPhase('exit');
      } else {
        setPhase('middle');
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [isPlaying, entranceTransition, exitTransition, mediaDuration]);

  const getPreviewStyle = (): React.CSSProperties => {
    let styles: React.CSSProperties = {};
    
    if (phase === 'entrance' && entranceTransition && entranceTransition.type !== 'none') {
      const template = transitionTemplates[entranceTransition.type];
      if (template) {
        const entranceDuration = entranceTransition.duration * (entranceTransition.speed || 1);
        const entranceProgress = Math.min(progress / (entranceDuration / mediaDuration), 1);
        styles = template.enter(entranceProgress);
      }
    } else if (phase === 'exit' && exitTransition && exitTransition.type !== 'none') {
      const template = transitionTemplates[exitTransition.type];
      if (template) {
        const exitDuration = exitTransition.duration * (exitTransition.speed || 1);
        const exitStart = 1 - (exitDuration / mediaDuration);
        const exitProgress = (progress - exitStart) / (exitDuration / mediaDuration);
        styles = template.exit(Math.max(0, Math.min(1, exitProgress)));
      }
    }
    
    return styles;
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Live Preview</span>
          <div className="flex gap-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setProgress(0);
                setPhase('entrance');
              }}
              className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {/* Preview Area */}
        <div className="relative h-32 bg-gray-900 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
              style={getPreviewStyle()}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          
          {/* Phase Indicators */}
          <div className="absolute top-2 left-2 right-2 flex justify-between text-[10px] text-gray-500">
            <span className={phase === 'entrance' ? 'text-blue-400' : ''}>
              {entranceTransition?.type || 'No'} In
            </span>
            <span className={phase === 'exit' ? 'text-blue-400' : ''}>
              {exitTransition?.type || 'No'} Out
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};