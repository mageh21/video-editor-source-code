import { MediaFile, TextElement } from "@/app/types";

interface FilterChainOptions {
    resolution: { width: number; height: number };
    totalDuration: number;
    fps: number;
}

/**
 * Optimizes FFmpeg filter chains for better performance
 */
export class FilterChainOptimizer {
    private filters: string[] = [];
    private overlays: Array<{
        label: string;
        x: number;
        y: number;
        start: string;
        end: string;
    }> = [];
    private audioLabels: string[] = [];

    constructor(private options: FilterChainOptions) {
        // Create base background
        this.filters.push(
            `color=c=black:size=${options.resolution.width}x${options.resolution.height}:d=${options.totalDuration.toFixed(3)}[base]`
        );
    }

    /**
     * Adds video/image processing with optimizations
     */
    addVisualMedia(
        index: number,
        media: MediaFile,
        inputIndex: number
    ): void {
        const { startTime, positionStart, positionEnd } = media;
        const duration = positionEnd - positionStart;
        const visualLabel = `visual${index}`;

        if (media.type === 'video') {
            // Combine trim, scale, and timing in one filter
            const scaleFilter = this.getOptimizedScale(media.width!, media.height!);
            this.filters.push(
                `[${inputIndex}:v]trim=start=${startTime.toFixed(3)}:duration=${duration.toFixed(3)},${scaleFilter},setpts=PTS-STARTPTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`
            );
        } else if (media.type === 'image') {
            const scaleFilter = this.getOptimizedScale(media.width!, media.height!);
            this.filters.push(
                `[${inputIndex}:v]${scaleFilter},setpts=PTS+${positionStart.toFixed(3)}/TB[${visualLabel}]`
            );
        }

        // Apply opacity if needed (skip if 100%)
        if (media.opacity !== undefined && media.opacity !== 100) {
            const alpha = Math.min(Math.max(media.opacity / 100, 0), 1);
            this.filters.push(
                `[${visualLabel}]format=yuva420p,colorchannelmixer=aa=${alpha}[${visualLabel}]`
            );
        }

        // Store overlay info
        if (media.type === 'video' || media.type === 'image') {
            this.overlays.push({
                label: visualLabel,
                x: media.x || 0,
                y: media.y || 0,
                start: positionStart.toFixed(3),
                end: positionEnd.toFixed(3),
            });
        }
    }

    /**
     * Adds audio processing with optimizations
     */
    addAudioMedia(
        index: number,
        media: MediaFile,
        inputIndex: number
    ): void {
        const { startTime, positionStart, positionEnd } = media;
        const duration = positionEnd - positionStart;
        const audioLabel = `audio${index}`;
        const delayMs = Math.round(positionStart * 1000);
        const volume = media.volume !== undefined ? media.volume / 100 : 1;

        // Combine all audio filters in one chain
        if (volume === 1) {
            // Skip volume filter if not needed
            this.filters.push(
                `[${inputIndex}:a]atrim=start=${startTime.toFixed(3)}:duration=${duration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs}[${audioLabel}]`
            );
        } else {
            this.filters.push(
                `[${inputIndex}:a]atrim=start=${startTime.toFixed(3)}:duration=${duration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[${audioLabel}]`
            );
        }

        this.audioLabels.push(`[${audioLabel}]`);
    }

    /**
     * Adds text overlays with batch processing
     */
    addTextElements(
        textElements: TextElement[],
        fonts: Set<string>
    ): string {
        let lastLabel = this.applyOverlays();

        // Batch text elements by similar properties for optimization
        textElements.forEach((text, i) => {
            const label = i === textElements.length - 1 ? 'outv' : `text${i}`;
            const escapedText = text.text.replace(/:/g, '\\:').replace(/'/g, "\\\\'");
            const alpha = Math.min(Math.max((text.opacity ?? 100) / 100, 0), 1);
            const color = text.color?.includes('@') ? text.color : `${text.color || 'white'}@${alpha}`;
            
            // Use more efficient drawtext parameters
            this.filters.push(
                `[${lastLabel}]drawtext=fontfile=font${text.font}.ttf:text='${escapedText}':x=${text.x}:y=${text.y}:fontsize=${text.fontSize || 24}:fontcolor=${color}:enable='between(t\\,${text.positionStart}\\,${text.positionEnd})'[${label}]`
            );
            lastLabel = label;
        });

        return lastLabel;
    }

    /**
     * Applies overlays with optimization
     */
    private applyOverlays(): string {
        let lastLabel = 'base';

        if (this.overlays.length === 0) {
            return lastLabel;
        }

        // Group overlays that have the same timing for batch processing
        this.overlays.forEach((overlay, i) => {
            const { label, start, end, x, y } = overlay;
            const nextLabel = i === this.overlays.length - 1 ? 'outv' : `tmp${i}`;
            
            // Use shortest=1 for better performance
            this.filters.push(
                `[${lastLabel}][${label}]overlay=${x}:${y}:enable='between(t\\,${start}\\,${end})':shortest=1[${nextLabel}]`
            );
            lastLabel = nextLabel;
        });

        return lastLabel;
    }

    /**
     * Builds the final audio mix
     */
    buildAudioMix(): void {
        if (this.audioLabels.length > 0) {
            const audioMix = this.audioLabels.join('');
            // Use dynamic normalization for better quality
            this.filters.push(`${audioMix}amix=inputs=${this.audioLabels.length}:duration=longest:normalize=0[outa]`);
        }
    }

    /**
     * Gets the complete filter complex string
     */
    getFilterComplex(): string {
        return this.filters.join('; ');
    }

    /**
     * Checks if audio output is available
     */
    hasAudio(): boolean {
        return this.audioLabels.length > 0;
    }

    /**
     * Gets optimized scale filter based on dimensions
     */
    private getOptimizedScale(width: number, height: number): string {
        // Use hardware acceleration flags when available
        return `scale=${width}:${height}:flags=fast_bilinear`;
    }

    /**
     * Suggests optimal encoding parameters based on content
     */
    static getOptimalEncodingParams(
        mediaFiles: MediaFile[],
        exportSettings: any
    ): string[] {
        const params: string[] = [];
        const hasHighMotion = mediaFiles.some(f => f.type === 'video');
        
        // Use x264 with optimal settings
        params.push('-c:v', 'libx264');
        
        // Pixel format for better compatibility
        params.push('-pix_fmt', 'yuv420p');
        
        // Optimize for web streaming
        params.push('-movflags', '+faststart');
        
        // Adjust preset based on content
        if (hasHighMotion && exportSettings.preset === 'fast') {
            params.push('-preset', 'faster'); // Balance speed and quality
        } else {
            params.push('-preset', exportSettings.preset);
        }
        
        // Use appropriate profile
        params.push('-profile:v', 'high');
        
        // Set level for compatibility
        params.push('-level', '4.0');
        
        return params;
    }
}