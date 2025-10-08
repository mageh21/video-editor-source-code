'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface KeyframeData {
  frames: string[];
  previewFrames: number[];
  durationInFrames: number;
  lastUpdated: number;
}

interface KeyframeContextType {
  getKeyframes: (overlayId: string) => KeyframeData | undefined;
  updateKeyframes: (overlayId: string, data: KeyframeData) => void;
  clearKeyframes: (overlayId: string) => void;
  clearAllKeyframes: () => void;
}

const KeyframeContext = createContext<KeyframeContextType | undefined>(undefined);

export const KeyframeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [keyframeCache, setKeyframeCache] = useState<Map<string, KeyframeData>>(new Map());

  const getKeyframes = useCallback((overlayId: string): KeyframeData | undefined => {
    return keyframeCache.get(overlayId);
  }, [keyframeCache]);

  const updateKeyframes = useCallback((overlayId: string, data: KeyframeData) => {
    setKeyframeCache(prev => {
      const newCache = new Map(prev);
      newCache.set(overlayId, data);
      return newCache;
    });
  }, []);

  const clearKeyframes = useCallback((overlayId: string) => {
    setKeyframeCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(overlayId);
      return newCache;
    });
  }, []);

  const clearAllKeyframes = useCallback(() => {
    setKeyframeCache(new Map());
  }, []);

  return (
    <KeyframeContext.Provider
      value={{
        getKeyframes,
        updateKeyframes,
        clearKeyframes,
        clearAllKeyframes,
      }}
    >
      {children}
    </KeyframeContext.Provider>
  );
};

export const useKeyframeContext = () => {
  const context = useContext(KeyframeContext);
  if (!context) {
    throw new Error('useKeyframeContext must be used within a KeyframeProvider');
  }
  return context;
};