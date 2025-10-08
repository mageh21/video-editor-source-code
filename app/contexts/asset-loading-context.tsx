"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AssetLoadingContextType {
  isLoadingAssets: boolean;
  isInitialLoad: boolean;
  handleAssetLoadingChange: (overlayId: string, isLoading: boolean) => void;
  setInitialLoadComplete: () => void;
}

const AssetLoadingContext = createContext<AssetLoadingContextType | undefined>(undefined);

interface AssetLoadingProviderProps {
  children: ReactNode;
}

export const AssetLoadingProvider: React.FC<AssetLoadingProviderProps> = ({ children }) => {
  const [loadingAssets, setLoadingAssets] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleAssetLoadingChange = useCallback((overlayId: string, isLoading: boolean) => {
    setLoadingAssets(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(overlayId);
      } else {
        newSet.delete(overlayId);
      }
      return newSet;
    });
  }, []);

  const setInitialLoadComplete = useCallback(() => {
    setIsInitialLoad(false);
  }, []);

  const isLoadingAssets = loadingAssets.size > 0;

  return (
    <AssetLoadingContext.Provider 
      value={{ 
        isLoadingAssets,
        isInitialLoad,
        handleAssetLoadingChange,
        setInitialLoadComplete
      }}
    >
      {children}
    </AssetLoadingContext.Provider>
  );
};

export const useAssetLoading = () => {
  const context = useContext(AssetLoadingContext);
  if (!context) {
    throw new Error('useAssetLoading must be used within an AssetLoadingProvider');
  }
  return context;
};