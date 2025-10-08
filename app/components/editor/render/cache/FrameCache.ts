interface CachedFrame {
    timestamp: number;
    data: ImageData;
    hash: string;
}

export class FrameCache {
    private cache = new Map<number, CachedFrame>();
    private maxCacheSize: number;
    private lru: number[] = [];
    
    constructor(maxFrames: number = 300) { // ~10 seconds at 30fps
        this.maxCacheSize = maxFrames;
    }
    
    set(timestamp: number, imageData: ImageData, hash: string) {
        // Check if we need to evict
        if (this.cache.size >= this.maxCacheSize && !this.cache.has(timestamp)) {
            const oldest = this.lru.shift();
            if (oldest !== undefined) {
                this.cache.delete(oldest);
            }
        }
        
        this.cache.set(timestamp, { timestamp, data: imageData, hash });
        
        // Update LRU
        const index = this.lru.indexOf(timestamp);
        if (index > -1) {
            this.lru.splice(index, 1);
        }
        this.lru.push(timestamp);
    }
    
    get(timestamp: number): ImageData | null {
        const frame = this.cache.get(timestamp);
        if (!frame) return null;
        
        // Update LRU
        const index = this.lru.indexOf(timestamp);
        if (index > -1) {
            this.lru.splice(index, 1);
            this.lru.push(timestamp);
        }
        
        return frame.data;
    }
    
    has(timestamp: number): boolean {
        return this.cache.has(timestamp);
    }
    
    // Check if frame content has changed
    needsUpdate(timestamp: number, newHash: string): boolean {
        const frame = this.cache.get(timestamp);
        return !frame || frame.hash !== newHash;
    }
    
    clear() {
        this.cache.clear();
        this.lru = [];
    }
    
    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.calculateHitRate(),
            memoryUsage: this.calculateMemoryUsage()
        };
    }
    
    private calculateHitRate(): number {
        // Would track hits/misses in production
        return 0;
    }
    
    private calculateMemoryUsage(): number {
        let bytes = 0;
        this.cache.forEach(frame => {
            bytes += frame.data.data.byteLength;
        });
        return bytes;
    }
}

// Persistent frame cache using IndexedDB for longer videos
export class PersistentFrameCache {
    private dbName = 'clip-js-frame-cache';
    private db: IDBDatabase | null = null;
    
    async initialize() {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('frames')) {
                    const store = db.createObjectStore('frames', { keyPath: 'key' });
                    store.createIndex('projectId', 'projectId');
                    store.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }
    
    async storeFrame(projectId: string, timestamp: number, imageData: ImageData) {
        if (!this.db) await this.initialize();
        
        const key = `${projectId}-${timestamp}`;
        const transaction = this.db!.transaction(['frames'], 'readwrite');
        const store = transaction.objectStore('frames');
        
        // Convert ImageData to ArrayBuffer for storage
        const data = {
            key,
            projectId,
            timestamp,
            width: imageData.width,
            height: imageData.height,
            data: imageData.data.buffer
        };
        
        await store.put(data);
    }
    
    async getFrame(projectId: string, timestamp: number): Promise<ImageData | null> {
        if (!this.db) await this.initialize();
        
        const key = `${projectId}-${timestamp}`;
        const transaction = this.db!.transaction(['frames'], 'readonly');
        const store = transaction.objectStore('frames');
        const request = store.get(key);
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                
                const imageData = new ImageData(
                    new Uint8ClampedArray(result.data),
                    result.width,
                    result.height
                );
                resolve(imageData);
            };
            request.onerror = () => resolve(null);
        });
    }
    
    async clearProject(projectId: string) {
        if (!this.db) await this.initialize();
        
        const transaction = this.db!.transaction(['frames'], 'readwrite');
        const store = transaction.objectStore('frames');
        const index = store.index('projectId');
        const request = index.openCursor(IDBKeyRange.only(projectId));
        
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
    }
}