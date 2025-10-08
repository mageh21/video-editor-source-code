import { Caption } from '../types';
import { parseSrt, parseSrt as parseVtt } from '@remotion/captions';
// Note: @remotion/captions may not export parseVtt directly, using parseSrt for VTT temporarily

// Parse SRT format using Remotion's parser
export function parseSRT(srtContent: string): Caption[] {
    const remotionCaptions = parseSrt({ input: srtContent });

    return (remotionCaptions as any).map(caption => ({
        ...caption,
        id: crypto.randomUUID(),
        // Convert milliseconds to seconds for backwards compatibility
        start: caption.startMs / 1000,
        end: caption.endMs / 1000
    }));
}

// Parse WebVTT format (simplified parser since @remotion/captions may not support VTT)
export function parseVTT(vttContent: string): Caption[] {
    // Remove WEBVTT header
    const content = vttContent.replace(/^WEBVTT\s*\n*/i, '');
    
    // Split into caption blocks
    const blocks = content.split(/\n\n+/);
    const captions: Caption[] = [];
    
    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length < 2) continue;
        
        // Find timing line
        const timingLine = lines.find(line => line.includes('-->'));
        if (!timingLine) continue;
        
        const [startStr, endStr] = timingLine.split('-->');
        const start = parseVTTTime(startStr.trim());
        const end = parseVTTTime(endStr.trim());
        
        // Get text (all lines after timing)
        const textStartIndex = lines.indexOf(timingLine) + 1;
        const text = lines.slice(textStartIndex).join('\n');
        
        if (text) {
            captions.push({
                id: crypto.randomUUID(),
                text,
                startMs: start * 1000,
                endMs: end * 1000,
                timestampMs: null,
                confidence: null
            } as any);
        }
    }
    
    return captions;
}

// Parse VTT time format (00:00.000 or 00:00:00.000)
function parseVTTTime(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        // MM:SS.mmm format
        const [mins, secsAndMillis] = parts;
        const [secs, millis = '0'] = secsAndMillis.split('.');
        return parseInt(mins) * 60 + parseInt(secs) + parseInt(millis) / 1000;
    } else if (parts.length === 3) {
        // HH:MM:SS.mmm format
        const [hours, mins, secsAndMillis] = parts;
        const [secs, millis = '0'] = secsAndMillis.split('.');
        return parseInt(hours) * 3600 + parseInt(mins) * 60 + parseInt(secs) + parseInt(millis) / 1000;
    }
    return 0;
}

// Export to SRT format (manual implementation to avoid missing import)
export function exportToSRT(captions: Caption[]): string {
    return captions.map((caption, index) => {
        const startSeconds = caption.start || (caption.startMs / 1000);
        const endSeconds = caption.end || (caption.endMs / 1000);
        const startTime = formatSRTTime(startSeconds);
        const endTime = formatSRTTime(endSeconds);
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}`;
    }).join('\n\n');
}

// Format time for SRT (00:00:00,000)
function formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

// Export to VTT format
export function exportToVTT(captions: Caption[]): string {
    const header = 'WEBVTT\n\n';
    const body = captions.map((caption) => {
        const startSeconds = caption.start || (caption.startMs / 1000);
        const endSeconds = caption.end || (caption.endMs / 1000);
        const startTime = formatVTTTime(startSeconds);
        const endTime = formatVTTTime(endSeconds);
        return `${startTime} --> ${endTime}\n${caption.text}`;
    }).join('\n\n');
    return header + body;
}

// Helper function for VTT export (Remotion doesn't have built-in VTT serializer)
function formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
}

function pad(num: number, size: number = 2): string {
    return num.toString().padStart(size, '0');
}

// Parse plain text with timestamps
export function parseTranscript(text: string, duration: number): Caption[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const captions: Caption[] = [];
    
    // Create captions with ~3 second chunks or ~10 words
    const wordsPerCaption = 10;
    const captionDuration = 3; // seconds
    
    let currentWords: string[] = [];
    let captionIndex = 0;
    
    words.forEach((word, index) => {
        currentWords.push(word);
        
        if (currentWords.length >= wordsPerCaption || index === words.length - 1) {
            const startTime = captionIndex * captionDuration;
            const endTime = Math.min((captionIndex + 1) * captionDuration, duration);
            
            captions.push({
                id: crypto.randomUUID(),
                text: currentWords.join(' '),
                startMs: startTime * 1000,
                endMs: endTime * 1000,
                timestampMs: null,
                confidence: null,
                // Legacy support
                start: startTime,
                end: endTime
            });
            
            currentWords = [];
            captionIndex++;
        }
    });
    
    return captions;
}

// Auto-generate captions with word-level timing
export function generateWordTimings(text: string, startTime: number, endTime: number): Caption[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const totalDuration = endTime - startTime;
    const averageWordDuration = totalDuration / words.length;
    
    return words.map((word, index) => {
        const wordStart = startTime + (index * averageWordDuration);
        const wordEnd = startTime + ((index + 1) * averageWordDuration);
        
        return {
            id: crypto.randomUUID(),
            text: word,
            startMs: wordStart * 1000,
            endMs: wordEnd * 1000,
            timestampMs: null,
            confidence: null,
            // Legacy support
            start: wordStart,
            end: wordEnd
        };
    });
}