import { MediaFile, TextElement } from "@/app/types";

interface ExportProgress {
    current: number;
    total: number;
    phase: 'preparing' | 'encoding' | 'muxing' | 'complete';
    fps: number;
    eta: number; // seconds
}

export class StreamingExporter {
    private abortController: AbortController | null = null;
    private startTime: number = 0;
    private processedFrames: number = 0;
    
    async exportWithStreaming(
        mediaFiles: MediaFile[],
        textElements: TextElement[],
        resolution: { width: number; height: number },
        duration: number,
        fps: number,
        onProgress: (progress: ExportProgress) => void
    ): Promise<ReadableStream<Uint8Array>> {
        this.abortController = new AbortController();
        this.startTime = performance.now();
        this.processedFrames = 0;
        
        const totalFrames = Math.ceil(duration * fps);
        
        // Create a TransformStream for processing
        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>({
            start(controller) {
                onProgress({
                    current: 0,
                    total: totalFrames,
                    phase: 'preparing',
                    fps: 0,
                    eta: 0
                });
            },
            
            transform: async (chunk, controller) => {
                if (this.abortController?.signal.aborted) {
                    controller.terminate();
                    return;
                }
                
                // Process chunk and pass through
                controller.enqueue(chunk);
                
                // Update progress
                this.processedFrames++;
                const elapsed = (performance.now() - this.startTime) / 1000;
                const currentFps = this.processedFrames / elapsed;
                const remainingFrames = totalFrames - this.processedFrames;
                const eta = remainingFrames / currentFps;
                
                onProgress({
                    current: this.processedFrames,
                    total: totalFrames,
                    phase: 'encoding',
                    fps: Math.round(currentFps),
                    eta: Math.round(eta)
                });
            }
        });
        
        // Start encoding in background
        this.encodeInBackground(
            mediaFiles,
            textElements,
            resolution,
            duration,
            fps,
            writable
        );
        
        return readable;
    }
    
    private async encodeInBackground(
        mediaFiles: MediaFile[],
        textElements: TextElement[],
        resolution: { width: number; height: number },
        duration: number,
        fps: number,
        writable: WritableStream<Uint8Array>
    ) {
        const writer = writable.getWriter();
        
        try {
            // Use OffscreenCanvas for background rendering
            const canvas = new OffscreenCanvas(resolution.width, resolution.height);
            const ctx = canvas.getContext('2d', {
                alpha: false,
                desynchronized: true
            });
            
            if (!ctx) throw new Error('Failed to create canvas context');
            
            const frameTime = 1000 / fps;
            const encoder = await this.createEncoder(resolution, fps);
            
            // Process frames in chunks to avoid blocking
            const CHUNK_SIZE = 30; // Process 30 frames at a time (1 second at 30fps)
            
            for (let i = 0; i < duration * fps; i += CHUNK_SIZE) {
                if (this.abortController?.signal.aborted) break;
                
                const chunkFrames = Math.min(CHUNK_SIZE, duration * fps - i);
                
                // Render and encode chunk
                for (let j = 0; j < chunkFrames; j++) {
                    const frameIndex = i + j;
                    const timestamp = frameIndex / fps;
                    
                    // Render frame
                    await this.renderFrame(ctx, mediaFiles, textElements, timestamp, resolution);
                    
                    // Create VideoFrame from canvas
                    const bitmap = await createImageBitmap(canvas);
                    const frame = new VideoFrame(bitmap, {
                        timestamp: frameIndex * 1_000_000 / fps
                    });
                    
                    // Encode frame
                    encoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
                    frame.close();
                    bitmap.close();
                }
                
                // Yield to avoid blocking UI
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            // Flush encoder
            await encoder.flush();
            
            writer.close();
        } catch (error) {
            writer.abort(error);
            throw error;
        }
    }
    
    private async createEncoder(
        resolution: { width: number; height: number },
        fps: number
    ): Promise<VideoEncoder> {
        const chunks: EncodedVideoChunk[] = [];
        
        const encoder = new VideoEncoder({
            output: (chunk) => {
                chunks.push(chunk);
            },
            error: (e) => {
                console.error('Encoder error:', e);
            }
        });
        
        await encoder.configure({
            codec: 'avc1.42E01E',
            width: resolution.width,
            height: resolution.height,
            bitrate: 10_000_000,
            framerate: fps,
            hardwareAcceleration: 'prefer-hardware',
            latencyMode: 'quality'
        });
        
        return encoder;
    }
    
    private async renderFrame(
        ctx: OffscreenCanvasRenderingContext2D,
        mediaFiles: MediaFile[],
        textElements: TextElement[],
        timestamp: number,
        resolution: { width: number; height: number }
    ) {
        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, resolution.width, resolution.height);
        
        // Sort by z-index
        const sortedMedia = [...mediaFiles].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Render media elements
        for (const media of sortedMedia) {
            if (timestamp >= media.positionStart && timestamp <= media.positionEnd) {
                await this.renderMediaElement(ctx, media, timestamp);
            }
        }
        
        // Render text elements
        for (const text of textElements) {
            if (timestamp >= text.positionStart && timestamp <= text.positionEnd) {
                this.renderTextElement(ctx, text);
            }
        }
    }
    
    private async renderMediaElement(
        ctx: OffscreenCanvasRenderingContext2D,
        media: MediaFile,
        timestamp: number
    ) {
        // This is simplified - real implementation would handle video/image rendering
        if (media.type === 'image' && media.src) {
            const img = new Image();
            img.src = media.src;
            await img.decode();
            
            ctx.save();
            ctx.globalAlpha = (media.opacity || 100) / 100;
            
            if (media.x !== undefined && media.y !== undefined && 
                media.width !== undefined && media.height !== undefined) {
                ctx.drawImage(img, media.x, media.y, media.width, media.height);
            } else {
                ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            
            ctx.restore();
        }
    }
    
    private renderTextElement(
        ctx: OffscreenCanvasRenderingContext2D,
        text: TextElement
    ) {
        ctx.save();
        
        const fontSize = text.fontSize || 24;
        // Use the font directly as it should be the postScriptName
        const fontFamily = text.font || 'Roboto-Bold';
        ctx.font = `${fontSize}px "${fontFamily}", "Inter", system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = text.color || 'white';
        ctx.globalAlpha = (text.opacity || 100) / 100;
        ctx.textAlign = (text.align as CanvasTextAlign) || 'left';
        ctx.textBaseline = 'top';
        
        // Measure text for proper positioning
        const metrics = ctx.measureText(text.text);
        const textHeight = fontSize; // Approximate height using font size
        
        // For text rendering, y represents where the text should appear
        // We use textBaseline='top', so y is the top of the text
        let drawY = text.y;
        
        // Calculate horizontal position based on alignment
        let drawX = text.x;
        if (text.align === 'center' && text.width) {
            drawX = text.x + text.width / 2 - metrics.width / 2;
        } else if (text.align === 'right' && text.width) {
            drawX = text.x + text.width - metrics.width;
        }
        
        if (text.backgroundColor && text.backgroundColor !== 'transparent') {
            // Draw background with padding
            const padding = 12;
            ctx.fillStyle = text.backgroundColor;
            ctx.fillRect(
                drawX - padding,
                drawY - padding,
                metrics.width + padding * 2,
                fontSize + padding * 2
            );
            ctx.fillStyle = text.color || 'white';
        }
        
        // Function to wrap text
        const wrapText = (textStr: string, maxWidth: number) => {
            const words = textStr.split(' ');
            const lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + ' ' + word;
                const testMetrics = ctx.measureText(testLine);
                
                if (testMetrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
            return lines;
        };

        // Wrap text if width is defined
        const lines = text.width ? wrapText(text.text, text.width) : [text.text];
        const lineHeight = fontSize * 1.4; // Match preview line height

        // Draw each line
        lines.forEach((line, index) => {
            const lineY = drawY + (index * lineHeight);
            let lineX = drawX;
            
            // Calculate X position for each line based on alignment
            if (text.align === 'center' && text.width) {
                const lineMetrics = ctx.measureText(line);
                lineX = text.x + (text.width - lineMetrics.width) / 2;
            } else if (text.align === 'right' && text.width) {
                const lineMetrics = ctx.measureText(line);
                lineX = text.x + text.width - lineMetrics.width;
            }
            
            // Draw text stroke if specified (for meme-style text)
            if (text.strokeWidth && text.strokeColor) {
                ctx.strokeStyle = text.strokeColor;
                ctx.lineWidth = text.strokeWidth;
                ctx.strokeText(line, lineX, lineY);
            }
            
            // Draw text
            ctx.fillStyle = text.color || 'white';
            ctx.fillText(line, lineX, lineY);
        });
        
        ctx.restore();
    }
    
    abort() {
        this.abortController?.abort();
    }
}