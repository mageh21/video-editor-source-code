import { useRef, useCallback, useEffect } from 'react';
import { FrameCache } from '@/app/components/editor/render/cache/FrameCache';

interface UseFrameCacheOptions {
    maxFrames?: number;
    enabled?: boolean;
}

export function useFrameCache(options: UseFrameCacheOptions = {}) {
    const { maxFrames = 300, enabled = true } = options;
    const cacheRef = useRef<FrameCache | null>(null);
    
    useEffect(() => {
        if (enabled && !cacheRef.current) {
            cacheRef.current = new FrameCache(maxFrames);
        }
        
        return () => {
            if (cacheRef.current) {
                cacheRef.current.clear();
                cacheRef.current = null;
            }
        };
    }, [enabled, maxFrames]);
    
    const getCachedFrame = useCallback((timestamp: number): ImageData | null => {
        if (!enabled || !cacheRef.current) return null;
        return cacheRef.current.get(timestamp);
    }, [enabled]);
    
    const setCachedFrame = useCallback((timestamp: number, imageData: ImageData, hash: string) => {
        if (!enabled || !cacheRef.current) return;
        cacheRef.current.set(timestamp, imageData, hash);
    }, [enabled]);
    
    const hasCachedFrame = useCallback((timestamp: number): boolean => {
        if (!enabled || !cacheRef.current) return false;
        return cacheRef.current.has(timestamp);
    }, [enabled]);
    
    const needsUpdate = useCallback((timestamp: number, newHash: string): boolean => {
        if (!enabled || !cacheRef.current) return true;
        return cacheRef.current.needsUpdate(timestamp, newHash);
    }, [enabled]);
    
    const clearCache = useCallback(() => {
        if (cacheRef.current) {
            cacheRef.current.clear();
        }
    }, []);
    
    const getCacheStats = useCallback(() => {
        if (!cacheRef.current) {
            return { size: 0, maxSize: 0, hitRate: 0, memoryUsage: 0 };
        }
        return cacheRef.current.getStats();
    }, []);
    
    return {
        getCachedFrame,
        setCachedFrame,
        hasCachedFrame,
        needsUpdate,
        clearCache,
        getCacheStats,
        isEnabled: enabled
    };
}