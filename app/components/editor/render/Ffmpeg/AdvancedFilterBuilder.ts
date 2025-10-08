import { MediaFile, TextElement, CaptionTrack, Caption } from "@/app/types";
import { RenderSettings, FilterNode, CHROMAKEY_PRESETS } from "@/app/types/rendering";

/**
 * Advanced filter builder for professional video rendering
 */
export class AdvancedFilterBuilder {
    private filters: string[] = [];
    private overlays: Array<{
        label: string;
        x: number;
        y: number;
        start: string;
        end: string;
        hasAlpha?: boolean;
    }> = [];
    private audioLabels: string[] = [];
    private currentLabel = 0;
    
    constructor(
        private resolution: { width: number; height: number },
        private totalDuration: number,
        private renderSettings: RenderSettings
    ) {
        this.initializeBase();
    }
    
    private initializeBase(): void {
        // Create transparent or colored background based on settings
        if (this.renderSettings.alphaChannel && this.renderSettings.format !== 'mp4') {
            // For transparent output (not MP4), use transparent base with alpha
            this.filters.push(
                `color=c=black@0.0:size=${this.resolution.width}x${this.resolution.height}:d=${this.totalDuration.toFixed(3)}:alpha=1[base]`
            );
        } else {
            // Use specified background color or black for MP4 and non-transparent formats
            const bgColor = this.renderSettings.backgroundColor || 'black';
            this.filters.push(
                `color=c=${bgColor}:size=${this.resolution.width}x${this.resolution.height}:d=${this.totalDuration.toFixed(3)}[base]`
            );
        }
    }
    
    private getNextLabel(): string {
        return `v${this.currentLabel++}`;
    }
    
    /**
     * Adds video/image with advanced processing
     */
    addVisualMedia(media: MediaFile, inputIndex: number): void {
        const { startTime, positionStart, positionEnd } = media;
        const duration = positionEnd - positionStart;
        const visualLabel = this.getNextLabel();
        
        let filterChain: string[] = [];
        
        // Base processing for video/image
        if (media.type === 'video') {
            filterChain.push(`[${inputIndex}:v]`);
            filterChain.push(`trim=start=${startTime.toFixed(3)}:duration=${duration.toFixed(3)}`);
        } else if (media.type === 'image') {
            filterChain.push(`[${inputIndex}:v]`);
        }
        
        // For transparent WebM inputs, preserve alpha channel immediately
        const mimeType = media.mimeType || '';
        const isTransparentInput = mimeType.includes('webm') || mimeType.includes('mov') || mimeType.includes('apng');
        
        if (isTransparentInput && (this.renderSettings.alphaChannel || this.renderSettings.format === 'webm-alpha')) {
            // Preserve alpha channel from transparent input
            filterChain.push(`format=yuva420p`);
        }
        
        // Apply chromakey only if specifically enabled (not for transparent inputs)
        if (this.renderSettings.chromaKey?.enabled && media.chromaKeyEnabled && !isTransparentInput) {
            const { color, similarity, blend } = this.renderSettings.chromaKey;
            filterChain.push(`chromakey=${color}:${similarity}:${blend}`);
        }
        
        // Scale with high-quality options
        const scaleFilter = this.getAdvancedScale(media.width!, media.height!);
        filterChain.push(scaleFilter);
        
        // Apply rotation if needed
        if (media.rotation && media.rotation !== 0) {
            const radians = (media.rotation * Math.PI) / 180;
            filterChain.push(`rotate=${radians}:c=none`);
        }
        
        // Apply effects (blur, sharpen, etc.)
        if (media.effects) {
            filterChain.push(...this.buildEffectFilters(media.effects));
        }
        
        // Apply transitions
        const transitionFilters = this.buildTransitionFilters(media, positionStart, positionEnd);
        if (transitionFilters.length > 0) {
            filterChain.push(...transitionFilters);
        }
        
        // Set timing
        if (media.type === 'video') {
            filterChain.push(`setpts=PTS-STARTPTS+${positionStart.toFixed(3)}/TB`);
        } else {
            filterChain.push(`setpts=PTS+${positionStart.toFixed(3)}/TB`);
        }
        
        // Apply opacity with proper alpha handling
        if (media.opacity !== undefined && media.opacity !== 100) {
            const alpha = Math.min(Math.max(media.opacity / 100, 0), 1);
            // For WebM, ensure we're using the right pixel format
            if (this.renderSettings.format === 'webm-alpha') {
                filterChain.push(`format=yuva420p,colorchannelmixer=aa=${alpha}`);
            } else if (this.renderSettings.alphaChannel) {
                filterChain.push(`format=yuva420p,colorchannelmixer=aa=${alpha}`);
            } else {
                filterChain.push(`format=yuva420p,colorchannelmixer=aa=${alpha}`);
            }
        } else if (this.renderSettings.alphaChannel || this.renderSettings.format === 'webm-alpha') {
            // Ensure alpha channel is preserved for transparent formats
            filterChain.push(`format=yuva420p`);
        }
        
        // Join filter chain
        filterChain.push(`[${visualLabel}]`);
        this.filters.push(filterChain.join(','));
        
        // Store overlay info
        // Debug log for WebM timing
        if (isTransparentInput) {
            console.log(`WebM overlay timing: ${media.fileName} - start: ${positionStart}, end: ${positionEnd}, duration: ${positionEnd - positionStart}`);
        }
        
        this.overlays.push({
            label: visualLabel,
            x: media.x || 0,
            y: media.y || 0,
            start: positionStart.toFixed(3),
            end: positionEnd.toFixed(3),
            hasAlpha: media.opacity !== 100 || this.renderSettings.chromaKey?.enabled || isTransparentInput
        });
    }
    
    /**
     * Adds animated assets (GIF, APNG, WebP)
     */
    addAnimatedAsset(asset: MediaFile, inputIndex: number): void {
        const { positionStart, positionEnd } = asset;
        const duration = positionEnd - positionStart;
        const assetLabel = this.getNextLabel();
        
        let filterChain: string[] = [`[${inputIndex}:v]`];
        
        // Handle animated formats
        if (asset.mimeType?.includes('gif')) {
            // GIF specific handling
            filterChain.push(`scale=${asset.width}:${asset.height}:flags=lanczos`);
            if (asset.loop !== false) {
                filterChain.push(`loop=-1:size=${Math.ceil(duration * 30)}`); // Assume 30fps
            }
        } else if (asset.mimeType?.includes('apng') || asset.mimeType?.includes('webp')) {
            // APNG/WebP handling
            filterChain.push(`scale=${asset.width}:${asset.height}:flags=lanczos`);
        }
        
        // Apply timing
        filterChain.push(`setpts=PTS+${positionStart.toFixed(3)}/TB`);
        
        // Preserve alpha channel for stickers
        filterChain.push(`format=yuva420p`);
        
        if (asset.opacity !== undefined && asset.opacity !== 100) {
            const alpha = asset.opacity / 100;
            filterChain.push(`colorchannelmixer=aa=${alpha}`);
        }
        
        filterChain.push(`[${assetLabel}]`);
        this.filters.push(filterChain.join(','));
        
        this.overlays.push({
            label: assetLabel,
            x: asset.x || 0,
            y: asset.y || 0,
            start: positionStart.toFixed(3),
            end: positionEnd.toFixed(3),
            hasAlpha: true
        });
    }
    
    /**
     * Adds text with advanced styling
     */
    addTextElements(textElements: TextElement[], fonts: Set<string>): string {
        let lastLabel = this.applyOverlays();
        
        textElements.forEach((text, i) => {
            const label = i === textElements.length - 1 ? 'outv' : this.getNextLabel();
            const escapedText = text.text.replace(/:/g, '\\:').replace(/'/g, "\\\\'");
            
            let textFilter = `[${lastLabel}]drawtext=`;
            const params: string[] = [];
            
            // Font settings - handle postScriptName safely
            const fontPostScriptName = text.font || 'Roboto-Bold';
            // For FFmpeg, we need to map postScriptName back to family name
            const fontFamily = text.fontFamily || fontPostScriptName.split('-')[0] || 'Roboto';
            const safeFontName = fontFamily.replace(/[^a-zA-Z0-9]/g, '');
            const fontPath = `font${safeFontName}.ttf`;
            console.log(`Using font path: ${fontPath} for text: "${text.text}"`);
            
            params.push(`fontfile=${fontPath}`);
            params.push(`text='${escapedText}'`);
            params.push(`x=${text.x}`);
            params.push(`y=${text.y}`);
            params.push(`fontsize=${text.fontSize || 24}`);
            
            // Color with alpha
            const alpha = Math.min(Math.max((text.opacity ?? 100) / 100, 0), 1);
            const color = text.color?.includes('@') ? text.color : `${text.color || 'white'}@${alpha}`;
            params.push(`fontcolor=${color}`);
            
            // Text effects
            if (text.strokeWidth && text.strokeWidth > 0) {
                params.push(`borderw=${text.strokeWidth}`);
                params.push(`bordercolor=${text.strokeColor || 'black'}`);
            }
            
            if (text.shadowX || text.shadowY) {
                params.push(`shadowx=${text.shadowX || 2}`);
                params.push(`shadowy=${text.shadowY || 2}`);
                params.push(`shadowcolor=${text.shadowColor || 'black@0.5'}`);
            }
            
            // Background box
            if (text.backgroundColor && text.backgroundColor !== 'transparent') {
                params.push(`box=1`);
                params.push(`boxcolor=${text.backgroundColor}`);
                params.push(`boxborderw=${text.backgroundPadding || 5}`);
            }
            
            // Timing
            params.push(`enable='between(t,${text.positionStart},${text.positionEnd})'`);
            
            // Animation support
            if (text.animation) {
                params.push(...this.buildTextAnimation(text.animation));
            }
            
            textFilter += params.join(':') + `[${label}]`;
            this.filters.push(textFilter);
            lastLabel = label;
        });
        
        return lastLabel;
    }
    
    /**
     * Adds captions with styling
     */
    addCaptions(captionTracks: CaptionTrack[], activeCaptionTrackId: string | null, showCaptions: boolean, fonts: Set<string>): string {
        let lastLabel = this.applyOverlays();
        
        if (!showCaptions || !activeCaptionTrackId) {
            return lastLabel;
        }
        
        const activeTrack = captionTracks.find(track => track.id === activeCaptionTrackId);
        if (!activeTrack || activeTrack.captions.length === 0) {
            return lastLabel;
        }
        
        // Sort captions by start time
        const sortedCaptions = [...activeTrack.captions].sort((a, b) => {
            const aStart = (a as any).start ?? (a as any).startMs / 1000;
            const bStart = (b as any).start ?? (b as any).startMs / 1000;
            return aStart - bStart;
        });
        
        // Create a filter for each caption
        sortedCaptions.forEach((caption, i) => {
            const label = i === sortedCaptions.length - 1 ? 'outv' : this.getNextLabel();
            const escapedText = caption.text.replace(/:/g, '\\:').replace(/'/g, "\\\\'");
            
            const startSeconds = (caption as any).start ?? (caption as any).startMs / 1000;
            const endSeconds = (caption as any).end ?? (caption as any).endMs / 1000;
            
            let captionFilter = `[${lastLabel}]drawtext=`;
            const params: string[] = [];
            
            // Font settings
            const safeFontName = activeTrack.style.fontFamily.replace(/[^a-zA-Z0-9]/g, '');
            const fontPath = `font${safeFontName}.ttf`;
            params.push(`fontfile=${fontPath}`);
            params.push(`text='${escapedText}'`);
            params.push(`fontsize=${activeTrack.style.fontSize}`);
            params.push(`fontcolor=${activeTrack.style.color}`);
            
            // Position calculation based on style
            let yPosition = 0;
            if (activeTrack.style.position === 'top') {
                yPosition = activeTrack.style.offsetY;
            } else if (activeTrack.style.position === 'center') {
                yPosition = this.resolution.height / 2;
            } else { // bottom
                yPosition = this.resolution.height - activeTrack.style.offsetY;
            }
            
            // Center horizontally with max width constraint
            const maxWidth = (this.resolution.width * activeTrack.style.maxWidth) / 100;
            params.push(`x=(w-text_w)/2`);
            params.push(`y=${yPosition}`);
            
            // Background box if specified
            if (activeTrack.style.backgroundColor && activeTrack.style.backgroundColor !== 'transparent') {
                params.push(`box=1`);
                params.push(`boxcolor=${activeTrack.style.backgroundColor}`);
                params.push(`boxborderw=10`);
            }
            
            // Outline/stroke if specified
            if (activeTrack.style.outlineWidth > 0) {
                params.push(`borderw=${activeTrack.style.outlineWidth}`);
                params.push(`bordercolor=${activeTrack.style.outlineColor}`);
            }
            
            // Enable timing
            params.push(`enable='between(t,${startSeconds.toFixed(3)},${endSeconds.toFixed(3)})'`);
            
            captionFilter += params.join(':') + `[${label}]`;
            this.filters.push(captionFilter);
            lastLabel = label;
        });
        
        return lastLabel;
    }
    
    /**
     * Builds text animation parameters
     */
    private buildTextAnimation(animation: any): string[] {
        const params: string[] = [];
        
        switch (animation.type) {
            case 'typewriter':
                params.push(`text_shaping=1`);
                // Implement typewriter effect with expression
                break;
            case 'fade':
                // Implement fade animation
                break;
            case 'slide':
                // Implement slide animation
                params.push(`x='if(lt(t,${animation.duration}),${animation.startX}+(${animation.endX}-${animation.startX})*t/${animation.duration},${animation.endX})'`);
                break;
        }
        
        return params;
    }
    
    /**
     * Applies overlays with advanced blending
     */
    private applyOverlays(): string {
        let lastLabel = 'base';
        
        if (this.overlays.length === 0) {
            return lastLabel;
        }
        
        // Sort by z-index if available
        this.overlays.forEach((overlay, i) => {
            const { label, start, end, x, y, hasAlpha } = overlay;
            const nextLabel = i === this.overlays.length - 1 ? 'outv' : this.getNextLabel();
            
            let overlayFilter = `[${lastLabel}][${label}]overlay=${x}:${y}`;
            
            // Enable timing - use proper escaping for ffmpeg
            overlayFilter += `:enable='between(t,${start},${end})'`;
            
            // Use appropriate format for alpha blending
            if (hasAlpha || (this.renderSettings.alphaChannel && this.renderSettings.format !== 'mp4')) {
                // For transparent formats, use proper alpha blending
                overlayFilter += `:format=auto:alpha=straight`;
            } else {
                // For MP4, ensure proper alpha blending with background
                overlayFilter += `:format=auto:alpha=premultiplied`;
            }
            
            overlayFilter += `[${nextLabel}]`;
            this.filters.push(overlayFilter);
            lastLabel = nextLabel;
        });
        
        return lastLabel;
    }
    
    /**
     * Gets optimized scale filter with quality options
     */
    private getAdvancedScale(width: number, height: number): string {
        const quality = this.renderSettings.quality;
        
        const scaleFlags = {
            low: 'fast_bilinear',
            medium: 'bilinear',
            high: 'bicubic',
            ultra: 'lanczos',
            lossless: 'lanczos'
        };
        
        return `scale=${width}:${height}:flags=${scaleFlags[quality] || 'bicubic'}`;
    }
    
    /**
     * Builds effect filters
     */
    private buildEffectFilters(effects: any): string[] {
        const filters: string[] = [];
        
        if (effects.blur) {
            filters.push(`boxblur=${effects.blur}:${effects.blur}`);
        }
        
        if (effects.brightness) {
            filters.push(`eq=brightness=${effects.brightness}`);
        }
        
        if (effects.contrast) {
            filters.push(`eq=contrast=${effects.contrast}`);
        }
        
        if (effects.saturation) {
            filters.push(`eq=saturation=${effects.saturation}`);
        }
        
        return filters;
    }
    
    /**
     * Builds transition filters for entrance and exit
     */
    private buildTransitionFilters(media: MediaFile, positionStart: number, positionEnd: number): string[] {
        const filters: string[] = [];
        
        // Legacy fade in/out support
        if (media.fadeIn && media.fadeIn > 0) {
            filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${media.fadeIn.toFixed(3)}`);
        }
        
        if (media.fadeOut && media.fadeOut > 0) {
            const fadeOutStart = positionEnd - media.fadeOut;
            filters.push(`fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${media.fadeOut.toFixed(3)}`);
        }
        
        // New transition system
        // Note: FFmpeg doesn't support all the fancy transitions we have in the browser
        // We'll implement the most common ones that FFmpeg can handle
        
        // Entrance transition
        if (media.entranceTransition && media.entranceTransition.type !== 'none') {
            const duration = media.entranceTransition.duration * (media.entranceTransition.speed || 1);
            
            switch (media.entranceTransition.type) {
                case 'fade':
                case 'dissolve':
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'wipeLeft':
                case 'wipeRight':
                case 'wipeUp':
                case 'wipeDown':
                case 'slideLeft':
                case 'slideRight':
                case 'slideUp':
                case 'slideDown':
                    // FFmpeg has limited wipe support, use fade with directional hint
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'zoomBlur':
                case 'pixelate':
                    // Add blur effect that decreases
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    if (media.entranceTransition.type === 'pixelate') {
                        // Could add pixelate filter here if needed
                    }
                    break;
                case 'scale':
                case 'bounce':
                case 'elastic':
                case 'spin':
                case 'spiral':
                case 'heartbeat':
                    // Scale-based transitions, FFmpeg can simulate with zoompan
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'flipX':
                case 'flipY':
                case 'rotate':
                case 'doorway':
                    // Rotation-based transitions
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'circleReveal':
                case 'diamondReveal':
                case 'iris':
                case 'curtain':
                    // Shape-based reveals - FFmpeg doesn't support complex masks easily
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                default:
                    // Default to fade for any other transitions
                    filters.push(`fade=t=in:st=${positionStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
            }
        }
        
        // Exit transition
        if (media.exitTransition && media.exitTransition.type !== 'none') {
            const duration = media.exitTransition.duration * (media.exitTransition.speed || 1);
            const exitStart = positionEnd - duration;
            
            switch (media.exitTransition.type) {
                case 'fade':
                case 'dissolve':
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'wipeLeft':
                case 'wipeRight':
                case 'wipeUp':
                case 'wipeDown':
                case 'slideLeft':
                case 'slideRight':
                case 'slideUp':
                case 'slideDown':
                    // FFmpeg has limited wipe support, use fade
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'zoomBlur':
                case 'pixelate':
                    // Add blur effect that increases
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'scale':
                case 'bounce':
                case 'elastic':
                case 'spin':
                case 'spiral':
                case 'heartbeat':
                case 'squeeze':
                case 'unfold':
                    // Scale-based transitions
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'flipX':
                case 'flipY':
                case 'rotate':
                case 'doorway':
                    // Rotation-based transitions
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'circleReveal':
                case 'diamondReveal':
                case 'iris':
                case 'curtain':
                    // Shape-based reveals
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                case 'tv':
                    // TV turn off effect - can add brightness fade
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
                default:
                    // Default to fade for any other transitions
                    filters.push(`fade=t=out:st=${exitStart.toFixed(3)}:d=${duration.toFixed(3)}`);
                    break;
            }
        }
        
        return filters;
    }
    
    /**
     * Adds audio processing
     */
    addAudioMedia(media: MediaFile, inputIndex: number): void {
        const { startTime, positionStart, positionEnd } = media;
        const duration = positionEnd - positionStart;
        const audioLabel = `a${this.audioLabels.length}`;
        const delayMs = Math.round(positionStart * 1000);
        const volume = media.volume !== undefined ? media.volume / 100 : 1;
        
        let audioFilter = `[${inputIndex}:a]`;
        const filters: string[] = [];
        
        // Trim
        filters.push(`atrim=start=${startTime.toFixed(3)}:duration=${duration.toFixed(3)}`);
        filters.push(`asetpts=PTS-STARTPTS`);
        
        // Delay
        filters.push(`adelay=${delayMs}|${delayMs}`);
        
        // Volume
        if (volume !== 1) {
            filters.push(`volume=${volume}`);
        }
        
        // Fade in/out
        if (media.fadeIn) {
            filters.push(`afade=t=in:st=${positionStart}:d=${media.fadeIn}`);
        }
        
        if (media.fadeOut) {
            filters.push(`afade=t=out:st=${positionEnd - media.fadeOut}:d=${media.fadeOut}`);
        }
        
        audioFilter += filters.join(',') + `[${audioLabel}]`;
        this.filters.push(audioFilter);
        this.audioLabels.push(`[${audioLabel}]`);
    }
    
    /**
     * Builds the final audio mix
     */
    buildAudioMix(): void {
        if (this.audioLabels.length > 0) {
            const audioMix = this.audioLabels.join('');
            this.filters.push(`${audioMix}amix=inputs=${this.audioLabels.length}:duration=longest:normalize=0[outa]`);
        }
    }
    
    /**
     * Gets the complete filter complex
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
     * Gets optimal encoding parameters based on format and content
     */
    static getOptimalEncodingParams(
        format: RenderSettings['format'],
        quality: RenderSettings['quality'],
        hwAccel: RenderSettings['hwAccel']
    ): string[] {
        const params: string[] = [];
        
        // Hardware acceleration
        if (hwAccel && hwAccel !== 'none') {
            switch (hwAccel) {
                case 'cuda':
                    params.push('-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda');
                    break;
                case 'videotoolbox':
                    params.push('-hwaccel', 'videotoolbox');
                    break;
                case 'qsv':
                    params.push('-hwaccel', 'qsv');
                    break;
            }
        }
        
        return params;
    }
}