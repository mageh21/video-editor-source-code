import { MediaFile, ITransition } from '../types';

export interface AdjacentClipPair {
    fromClip: MediaFile;
    toClip: MediaFile;
    existingTransition?: ITransition;
}

/**
 * Finds pairs of adjacent clips that can have transitions applied between them
 */
export const findAdjacentClipPairs = (
    mediaFiles: MediaFile[],
    transitions: Record<string, ITransition>
): AdjacentClipPair[] => {
    // Filter to only video and image clips
    const videoImageClips = mediaFiles.filter(m => m.type === 'video' || m.type === 'image');
    
    // Group clips by row
    const clipsByRow: Record<number, MediaFile[]> = {};
    videoImageClips.forEach(clip => {
        if (!clipsByRow[clip.row]) clipsByRow[clip.row] = [];
        clipsByRow[clip.row].push(clip);
    });
    
    const pairs: AdjacentClipPair[] = [];
    
    Object.values(clipsByRow).forEach(rowClips => {
        // Sort by position
        rowClips.sort((a, b) => a.positionStart - b.positionStart);
        
        // Find adjacent pairs (gap <= 1 second or overlap <= 1 second)
        for (let i = 0; i < rowClips.length - 1; i++) {
            const clip1 = rowClips[i];
            const clip2 = rowClips[i + 1];
            const gap = clip2.positionStart - clip1.positionEnd;
            
            if (gap >= -1.0 && gap <= 1.0) {
                const existingTransition = Object.values(transitions).find(
                    t => t.fromId === clip1.id && t.toId === clip2.id
                );
                
                pairs.push({
                    fromClip: clip1,
                    toClip: clip2,
                    existingTransition
                });
            }
        }
    });
    
    return pairs;
};

/**
 * Generates a unique ID for a transition
 */
export const generateTransitionId = (): string => {
    return crypto.randomUUID();
};

/**
 * Calculates the timing for a transition between two clips
 */
export const calculateTransitionTiming = (
    fromClip: MediaFile,
    toClip: MediaFile,
    transitionDuration: number // in seconds
) => {
    const gap = toClip.positionStart - fromClip.positionEnd;
    
    let transitionStart: number;
    let transitionEnd: number;
    
    if (gap <= 0) {
        // Clips are overlapping or touching
        const overlapStart = Math.max(fromClip.positionStart, toClip.positionStart);
        const overlapEnd = Math.min(fromClip.positionEnd, toClip.positionEnd);
        const overlapCenter = (overlapStart + overlapEnd) / 2;
        
        transitionStart = overlapCenter - transitionDuration / 2;
        transitionEnd = overlapCenter + transitionDuration / 2;
    } else {
        // Clips have a gap
        const gapCenter = fromClip.positionEnd + gap / 2;
        transitionStart = gapCenter - Math.min(gap / 2, transitionDuration / 2);
        transitionEnd = gapCenter + Math.min(gap / 2, transitionDuration / 2);
    }
    
    return {
        start: transitionStart,
        end: transitionEnd,
        duration: transitionEnd - transitionStart
    };
};