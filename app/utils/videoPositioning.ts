import { MediaFile } from '@/app/types';

interface VideoPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Calculate smart positioning for videos to prevent overlap
 * For videos on the same row that overlap in time, arrange them in a grid
 */
export function calculateVideoPosition(
    row: number,
    existingMedia: MediaFile[],
    positionStart: number,
    positionEnd: number,
    canvasWidth: number,
    canvasHeight: number
): VideoPosition {
    // Find overlapping videos on the same row
    const overlappingVideos = existingMedia.filter(media => 
        media.row === row &&
        media.type === 'video' &&
        // Check if time ranges overlap
        !(media.positionEnd <= positionStart || media.positionStart >= positionEnd)
    );

    // If no overlapping videos, use full canvas
    if (overlappingVideos.length === 0) {
        return {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight
        };
    }

    // Calculate grid layout based on number of overlapping videos (+1 for the new video)
    const totalVideos = overlappingVideos.length + 1;
    
    // Determine grid layout
    let cols = 1;
    let rows = 1;
    
    if (totalVideos <= 2) {
        cols = 2;
        rows = 1;
    } else if (totalVideos <= 4) {
        cols = 2;
        rows = 2;
    } else if (totalVideos <= 6) {
        cols = 3;
        rows = 2;
    } else {
        cols = 3;
        rows = Math.ceil(totalVideos / 3);
    }

    // Find the next available position in the grid
    const occupiedPositions = new Set<string>();
    overlappingVideos.forEach(video => {
        if (video.x !== undefined && video.y !== undefined) {
            // Calculate which grid position this video occupies
            const gridCol = Math.floor((video.x / canvasWidth) * cols);
            const gridRow = Math.floor((video.y / canvasHeight) * rows);
            occupiedPositions.add(`${gridCol},${gridRow}`);
        }
    });

    // Find first unoccupied position
    let gridX = 0;
    let gridY = 0;
    let positionFound = false;

    for (let r = 0; r < rows && !positionFound; r++) {
        for (let c = 0; c < cols && !positionFound; c++) {
            if (!occupiedPositions.has(`${c},${r}`)) {
                gridX = c;
                gridY = r;
                positionFound = true;
            }
        }
    }

    // Calculate actual pixel positions with some padding
    const padding = 10;
    const videoWidth = (canvasWidth - (cols + 1) * padding) / cols;
    const videoHeight = (canvasHeight - (rows + 1) * padding) / rows;
    
    return {
        x: padding + gridX * (videoWidth + padding),
        y: padding + gridY * (videoHeight + padding),
        width: videoWidth,
        height: videoHeight
    };
}

/**
 * Check if media should use custom positioning
 * Returns true if there are ANY overlapping videos (regardless of row)
 */
export function shouldUseCustomPositioning(
    row: number,
    existingMedia: MediaFile[],
    positionStart: number,
    positionEnd: number
): boolean {
    // Check for ANY overlapping videos, not just on the same row
    const overlappingVideos = existingMedia.filter(media => 
        media.type === 'video' &&
        !(media.positionEnd <= positionStart || media.positionStart >= positionEnd)
    );

    // If there are overlapping videos, use custom positioning
    return overlappingVideos.length > 0;
}