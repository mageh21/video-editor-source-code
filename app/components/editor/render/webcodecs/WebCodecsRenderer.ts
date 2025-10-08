interface EncoderConfig {
    width: number;
    height: number;
    framerate: number;
    bitrate: number;
    codec: string;
}

export class WebCodecsRenderer {
    private encoder: VideoEncoder | null = null;
    private muxer: any; // Would use mp4-muxer library
    private frameCount = 0;
    
    async isSupported(): Promise<boolean> {
        if (!('VideoEncoder' in window)) return false;
        
        try {
            const config = {
                codec: 'avc1.42E01E',
                width: 1920,
                height: 1080,
                bitrate: 5_000_000,
                framerate: 30
            };
            
            const support = await VideoEncoder.isConfigSupported(config);
            return support.supported || false;
        } catch {
            return false;
        }
    }
    
    async initialize(config: EncoderConfig, outputCallback: (chunk: EncodedVideoChunk) => void) {
        this.encoder = new VideoEncoder({
            output: (chunk, metadata) => {
                outputCallback(chunk);
                this.frameCount++;
            },
            error: (error) => {
                console.error('Encoder error:', error);
            }
        });
        
        await this.encoder.configure({
            codec: config.codec || 'avc1.42E01E',
            width: config.width,
            height: config.height,
            bitrate: config.bitrate,
            framerate: config.framerate,
            hardwareAcceleration: 'prefer-hardware',
            latencyMode: 'quality',
            scalabilityMode: 'L1T1'
        });
    }
    
    async encodeFrame(frame: VideoFrame) {
        if (!this.encoder) throw new Error('Encoder not initialized');
        
        this.encoder.encode(frame, { keyFrame: this.frameCount % 30 === 0 });
        frame.close(); // Important: release frame memory
    }
    
    async finish() {
        if (!this.encoder) return;
        
        await this.encoder.flush();
        this.encoder.close();
        this.encoder = null;
    }
    
    // Create VideoFrame from canvas
    async createFrameFromCanvas(canvas: HTMLCanvasElement, timestamp: number): Promise<VideoFrame> {
        const bitmap = await createImageBitmap(canvas);
        return new VideoFrame(bitmap, {
            timestamp: timestamp * 1_000_000, // Convert to microseconds
        });
    }
    
    // Decode video file using WebCodecs
    async decodeVideoFile(file: File): Promise<VideoFrame[]> {
        const frames: VideoFrame[] = [];
        
        const decoder = new VideoDecoder({
            output: (frame) => {
                frames.push(frame);
            },
            error: (e) => console.error('Decoder error:', e)
        });
        
        // Would need to demux the file first to get encoded chunks
        // This is simplified - real implementation would use mp4box.js or similar
        
        return frames;
    }
}