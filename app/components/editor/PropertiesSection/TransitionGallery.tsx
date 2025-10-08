"use client";

import React, { useState } from 'react';
import { MediaFile } from '@/app/types';
import { transitionTemplates } from '@/app/utils/transition-templates';
import { AnimationPreview } from './AnimationPreview';
import { TransitionLivePreview } from './TransitionLivePreview';
import { ChevronDown, ChevronUp, Sparkles, Clock, Gauge } from 'lucide-react';
import './transition-slider.css';

interface TransitionGalleryProps {
  mediaFile: MediaFile;
  onUpdateMedia: (id: string, updates: Partial<MediaFile>) => void;
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 bg-gray-850">
          <div className="grid grid-cols-4 gap-1.5">{children}</div>
        </div>
      )}
    </div>
  );
};

export const TransitionGallery: React.FC<TransitionGalleryProps> = ({
  mediaFile,
  onUpdateMedia,
}) => {
  const [openSections, setOpenSections] = useState({
    entrance: true,
    exit: false,
  });

  const toggleSection = (section: 'entrance' | 'exit') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Create none option
  const noneTransition = {
    name: 'None',
    preview: 'No transition',
    enter: () => ({}),
    exit: () => ({}),
  };

  const transitions = {
    none: noneTransition,
    ...transitionTemplates,
  };

  const handleEntranceSelect = (key: string) => {
    if (key === 'none') {
      onUpdateMedia(mediaFile.id, { entranceTransition: undefined });
    } else {
      onUpdateMedia(mediaFile.id, {
        entranceTransition: {
          type: key,
          duration: mediaFile.entranceTransition?.duration || 0.5,
          speed: mediaFile.entranceTransition?.speed || 1,
        },
      });
    }
  };

  const handleExitSelect = (key: string) => {
    if (key === 'none') {
      onUpdateMedia(mediaFile.id, { exitTransition: undefined });
    } else {
      onUpdateMedia(mediaFile.id, {
        exitTransition: {
          type: key,
          duration: mediaFile.exitTransition?.duration || 0.5,
          speed: mediaFile.exitTransition?.speed || 1,
        },
      });
    }
  };

  // Calculate media duration for preview
  const mediaDuration = mediaFile.positionEnd - mediaFile.positionStart;

  return (
    <div className="space-y-4">
      {/* Live Preview */}
      {(mediaFile.entranceTransition || mediaFile.exitTransition) && (
        <TransitionLivePreview
          entranceTransition={mediaFile.entranceTransition}
          exitTransition={mediaFile.exitTransition}
          mediaDuration={mediaDuration}
        />
      )}

      {/* Entrance Transitions */}
      <div>
        <CollapsibleSection
          title="Entrance Animation"
          count={Object.keys(transitions).length}
          isOpen={openSections.entrance}
          onToggle={() => toggleSection('entrance')}
        >
          {Object.entries(transitions).map(([key, transition]) => (
            <AnimationPreview
              key={`entrance-${key}`}
              animationKey={key}
              animation={transition}
              isSelected={
                key === 'none'
                  ? !mediaFile.entranceTransition
                  : mediaFile.entranceTransition?.type === key
              }
              onClick={() => handleEntranceSelect(key)}
            />
          ))}
        </CollapsibleSection>

        {/* Entrance Controls */}
        {mediaFile.entranceTransition && (
          <div className="mt-3 space-y-3 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Entrance Settings</span>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Duration ({mediaFile.entranceTransition.duration}s)
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={mediaFile.entranceTransition.duration}
                onChange={(e) =>
                  onUpdateMedia(mediaFile.id, {
                    entranceTransition: {
                      ...mediaFile.entranceTransition!,
                      duration: Number(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Speed ({(mediaFile.entranceTransition.speed || 1).toFixed(1)}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={mediaFile.entranceTransition.speed || 1}
                onChange={(e) =>
                  onUpdateMedia(mediaFile.id, {
                    entranceTransition: {
                      ...mediaFile.entranceTransition!,
                      speed: Number(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Transitions */}
      <div>
        <CollapsibleSection
          title="Exit Animation"
          count={Object.keys(transitions).length}
          isOpen={openSections.exit}
          onToggle={() => toggleSection('exit')}
        >
          {Object.entries(transitions).map(([key, transition]) => (
            <AnimationPreview
              key={`exit-${key}`}
              animationKey={key}
              animation={transition}
              isSelected={
                key === 'none'
                  ? !mediaFile.exitTransition
                  : mediaFile.exitTransition?.type === key
              }
              onClick={() => handleExitSelect(key)}
            />
          ))}
        </CollapsibleSection>

        {/* Exit Controls */}
        {mediaFile.exitTransition && (
          <div className="mt-3 space-y-3 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Exit Settings</span>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Duration ({mediaFile.exitTransition.duration}s)
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={mediaFile.exitTransition.duration}
                onChange={(e) =>
                  onUpdateMedia(mediaFile.id, {
                    exitTransition: {
                      ...mediaFile.exitTransition!,
                      duration: Number(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Speed ({(mediaFile.exitTransition.speed || 1).toFixed(1)}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={mediaFile.exitTransition.speed || 1}
                onChange={(e) =>
                  onUpdateMedia(mediaFile.id, {
                    exitTransition: {
                      ...mediaFile.exitTransition!,
                      speed: Number(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            onUpdateMedia(mediaFile.id, {
              entranceTransition: undefined,
              exitTransition: undefined,
            });
          }}
          className="flex-1 px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => {
            const fadeConfig = { type: 'fade', duration: 0.5, speed: 1 };
            onUpdateMedia(mediaFile.id, {
              entranceTransition: fadeConfig,
              exitTransition: fadeConfig,
            });
          }}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Apply Fade Both
        </button>
      </div>
    </div>
  );
};