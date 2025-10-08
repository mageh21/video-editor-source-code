import { getFile } from "@/app/store";
import { mimeToExt } from "@/app/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";

interface FileCache {
    fileId: string;
    filename: string;
    data: Uint8Array;
}

/**
 * Loads files from IndexedDB in parallel and deduplicates them
 */
export async function loadFilesParallel(
    fileIds: string[],
    ffmpeg: FFmpeg,
    onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, string>> {
    const fileMap = new Map<string, string>(); // fileId -> filename mapping
    const uniqueFileIds = Array.from(new Set(fileIds)); // Remove duplicates
    
    // Load all unique files in parallel
    const loadPromises = uniqueFileIds.map(async (fileId, index) => {
        try {
            const fileData = await getFile(fileId);
            const buffer = await fileData.arrayBuffer();
            const ext = mimeToExt[fileData.type as keyof typeof mimeToExt] || fileData.type.split('/')[1];
            const filename = `input_${fileId}.${ext}`;
            
            // Write to FFmpeg
            await ffmpeg.writeFile(filename, new Uint8Array(buffer));
            
            // Update progress
            if (onProgress) {
                onProgress(index + 1, uniqueFileIds.length);
            }
            
            return { fileId, filename };
        } catch (error) {
            console.error(`Failed to load file ${fileId}:`, error);
            throw error;
        }
    });
    
    // Wait for all files to load
    const results = await Promise.all(loadPromises);
    
    // Build the mapping
    results.forEach(({ fileId, filename }) => {
        fileMap.set(fileId, filename);
    });
    
    return fileMap;
}

/**
 * Cleans up FFmpeg files to free memory
 */
export async function cleanupFFmpegFiles(
    ffmpeg: FFmpeg,
    filenames: string[]
): Promise<void> {
    const deletePromises = filenames.map(async (filename) => {
        try {
            await ffmpeg.deleteFile(filename);
        } catch (error) {
            // File might already be deleted, ignore error
            console.debug(`Could not delete ${filename}:`, error);
        }
    });
    
    await Promise.all(deletePromises);
}

/**
 * Pre-loads and caches multiple files with memory management
 */
export async function preloadFilesWithCache(
    fileIds: string[],
    maxCacheSize: number = 500 * 1024 * 1024 // 500MB default
): Promise<FileCache[]> {
    const cache: FileCache[] = [];
    let currentCacheSize = 0;
    
    const uniqueIds = Array.from(new Set(fileIds));
    for (const fileId of uniqueIds) {
        try {
            const fileData = await getFile(fileId);
            const buffer = await fileData.arrayBuffer();
            const data = new Uint8Array(buffer);
            
            // Check if adding this file would exceed cache limit
            if (currentCacheSize + data.byteLength > maxCacheSize && cache.length > 0) {
                console.warn(`Cache limit reached, skipping preload of file ${fileId}`);
                break;
            }
            
            const ext = mimeToExt[fileData.type as keyof typeof mimeToExt] || fileData.type.split('/')[1];
            const filename = `input_${fileId}.${ext}`;
            
            cache.push({ fileId, filename, data });
            currentCacheSize += data.byteLength;
        } catch (error) {
            console.error(`Failed to preload file ${fileId}:`, error);
        }
    }
    
    return cache;
}