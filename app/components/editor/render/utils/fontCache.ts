import { FFmpeg } from "@ffmpeg/ffmpeg";
import { loadAllFontsForFFmpeg } from "@/app/utils/fontManager";

interface CachedFont {
    name: string;
    data: Uint8Array;
    timestamp: number;
}

const FONT_CACHE_KEY = 'clip-js-font-cache';
const FONT_CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Loads fonts with caching support using IndexedDB
 * Now delegates to the new font manager for better font support
 */
export async function loadFontsWithCache(
    fonts: string[],
    ffmpeg: FFmpeg
): Promise<void> {
    // Use the new font manager which supports Google Fonts and custom uploads
    const fontSet = new Set(fonts);
    await loadAllFontsForFFmpeg(fontSet, ffmpeg);
}

/**
 * Opens the font cache database
 */
async function openFontDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(FONT_CACHE_KEY, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('fonts')) {
                db.createObjectStore('fonts', { keyPath: 'name' });
            }
        };
    });
}

/**
 * Gets a cached font from IndexedDB
 */
async function getCachedFont(
    db: IDBDatabase,
    fontName: string
): Promise<CachedFont | null> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['fonts'], 'readonly');
        const store = transaction.objectStore('fonts');
        const request = store.get(fontName);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Caches font data in IndexedDB
 */
async function cacheFontData(
    db: IDBDatabase,
    fontName: string,
    data: Uint8Array
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['fonts'], 'readwrite');
        const store = transaction.objectStore('fonts');
        const request = store.put({
            name: fontName,
            data: data,
            timestamp: Date.now()
        });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Clears expired fonts from cache
 */
export async function clearExpiredFonts(): Promise<void> {
    try {
        const db = await openFontDatabase();
        const transaction = db.transaction(['fonts'], 'readwrite');
        const store = transaction.objectStore('fonts');
        const request = store.getAllKeys();
        
        request.onsuccess = async () => {
            const keys = request.result;
            const now = Date.now();
            
            for (const key of keys) {
                const font = await getCachedFont(db, key as string);
                if (font && now - font.timestamp > FONT_CACHE_EXPIRY) {
                    store.delete(key);
                }
            }
        };
    } catch (error) {
        console.error('Failed to clear expired fonts:', error);
    }
}