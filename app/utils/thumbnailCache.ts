/**
 * Simple in-memory cache for thumbnails to avoid regeneration
 */

interface ThumbnailCacheEntry {
  thumbnail: string;
  frames: string[];
  timestamp: number;
}

class ThumbnailCache {
  private cache = new Map<string, ThumbnailCacheEntry>();
  private maxSize = 50; // Maximum number of cached entries
  private maxAge = 5 * 60 * 1000; // 5 minutes

  generateKey(src: string, width: number, startTime: number, endTime: number): string {
    return `${src}-${width}-${startTime}-${endTime}`;
  }

  get(key: string): ThumbnailCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, thumbnail: string, frames: string[]): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      thumbnail,
      frames,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const thumbnailCache = new ThumbnailCache();