import { MediaFile, TextElement } from '@/app/types';

type TimelineElement = MediaFile | TextElement;

/**
 * Find the next available row for a new timeline element
 * Searches from top (row 0) down to find first available space
 * This ensures new items appear on top (foreground) by default
 */
export function findAvailableRow(
    allElements: TimelineElement[],
    positionStart: number,
    positionEnd: number
): number {
    // Group elements by row
    const rowMap = new Map<number, TimelineElement[]>();
    
    allElements.forEach(element => {
        const row = element.row || 0;
        if (!rowMap.has(row)) {
            rowMap.set(row, []);
        }
        rowMap.get(row)!.push(element);
    });
    
    // Check row 0 first (top track / foreground)
    const row0Elements = rowMap.get(0) || [];
    const hasOverlapRow0 = row0Elements.some(element => {
        return !(positionEnd <= element.positionStart || positionStart >= element.positionEnd);
    });
    
    if (!hasOverlapRow0) {
        return 0; // Place on top track if available
    }
    
    // Find the maximum row number
    const maxRow = Math.max(0, ...Array.from(rowMap.keys()));
    
    // Then check other rows from 1 upward
    for (let row = 1; row <= maxRow + 1; row++) {
        const elementsInRow = rowMap.get(row) || [];
        
        const hasOverlap = elementsInRow.some(element => {
            return !(positionEnd <= element.positionStart || positionStart >= element.positionEnd);
        });
        
        if (!hasOverlap) {
            return row; // Found an empty space
        }
    }
    
    // This should never happen due to maxRow + 1 check above
    return maxRow + 1;
}

/**
 * Check if adding an element to a specific row would cause overlap
 */
export function checkRowOverlap(
    allElements: TimelineElement[],
    row: number,
    positionStart: number,
    positionEnd: number,
    excludeId?: string
): boolean {
    return allElements.some(element => {
        if (excludeId && element.id === excludeId) return false;
        if (element.row !== row) return false;
        
        // Check for time overlap
        return !(positionEnd <= element.positionStart || positionStart >= element.positionEnd);
    });
}