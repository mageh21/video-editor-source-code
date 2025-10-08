/// <reference lib="webworker" />

import { WorkerTask, WorkerResult } from './RenderWorkerPool';

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerTask>) => {
    const { id, type, data } = event.data;
    
    try {
        let result: any;
        
        switch (type) {
            case 'decode':
                result = await decodeVideoSegment(data);
                break;
                
            case 'encode':
                result = await encodeVideoSegment(data);
                break;
                
            case 'effect':
                result = await applyEffect(data);
                break;
                
            case 'composite':
                result = await compositeFrames(data);
                break;
                
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
        
        // Send result back to main thread
        const response: WorkerResult = {
            id,
            result
        };
        
        self.postMessage(response);
    } catch (error) {
        // Send error back to main thread
        const response: WorkerResult = {
            id,
            result: null,
            error: error as Error
        };
        
        self.postMessage(response);
    }
});

async function decodeVideoSegment(data: {
    start: number;
    end: number;
    fileData: ArrayBuffer;
}): Promise<VideoFrame[]> {
    const frames: VideoFrame[] = [];
    
    // Create decoder
    const decoder = new VideoDecoder({
        output: (frame) => {
            frames.push(frame);
        },
        error: (e) => {
            console.error('Decoder error:', e);
        }
    });
    
    // Configure decoder (simplified - real implementation would detect codec)
    await decoder.configure({
        codec: 'avc1.42E01E',
        codedWidth: 1920,
        codedHeight: 1080,
        hardwareAcceleration: 'prefer-hardware'
    });
    
    // In real implementation, would demux the video file
    // and feed chunks to the decoder
    
    return frames;
}

async function encodeVideoSegment(data: {
    frames: VideoFrame[];
    config: VideoEncoderConfig;
}): Promise<ArrayBuffer> {
    const chunks: EncodedVideoChunk[] = [];
    
    const encoder = new VideoEncoder({
        output: (chunk) => {
            chunks.push(chunk);
        },
        error: (e) => {
            console.error('Encoder error:', e);
        }
    });
    
    await encoder.configure(data.config);
    
    // Encode frames
    for (const frame of data.frames) {
        encoder.encode(frame);
        frame.close();
    }
    
    await encoder.flush();
    encoder.close();
    
    // Combine chunks into single ArrayBuffer
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const result = new ArrayBuffer(totalSize);
    const view = new Uint8Array(result);
    
    let offset = 0;
    for (const chunk of chunks) {
        chunk.copyTo(view.subarray(offset, offset + chunk.byteLength));
        offset += chunk.byteLength;
    }
    
    return result;
}

async function applyEffect(data: {
    frame: VideoFrame;
    effect: string;
    params: any;
}): Promise<VideoFrame> {
    const { frame, effect, params } = data;
    
    // Create canvas for processing
    const canvas = new OffscreenCanvas(frame.displayWidth, frame.displayHeight);
    const ctx = canvas.getContext('2d')!;
    
    // Draw frame to canvas
    ctx.drawImage(frame, 0, 0);
    
    // Get image data for manipulation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Apply effect based on type
    switch (effect) {
        case 'brightness':
            applyBrightness(pixels, params.value);
            break;
            
        case 'contrast':
            applyContrast(pixels, params.value);
            break;
            
        case 'blur':
            await applyBlur(imageData, params.radius);
            break;
            
        case 'saturation':
            applySaturation(pixels, params.value);
            break;
    }
    
    // Put modified image data back
    ctx.putImageData(imageData, 0, 0);
    
    // Create new VideoFrame from canvas
    const bitmap = await createImageBitmap(canvas);
    const newFrame = new VideoFrame(bitmap, {
        timestamp: frame.timestamp,
        duration: frame.duration || undefined
    });
    
    // Clean up
    frame.close();
    bitmap.close();
    
    return newFrame;
}

async function compositeFrames(data: {
    layers: Array<{
        frame: VideoFrame;
        x: number;
        y: number;
        opacity: number;
    }>;
    outputSize: { width: number; height: number };
}): Promise<VideoFrame> {
    const { layers, outputSize } = data;
    
    // Create output canvas
    const canvas = new OffscreenCanvas(outputSize.width, outputSize.height);
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Composite layers
    for (const layer of layers) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.frame, layer.x, layer.y);
        ctx.restore();
        
        // Clean up input frame
        layer.frame.close();
    }
    
    // Create output frame
    const bitmap = await createImageBitmap(canvas);
    const outputFrame = new VideoFrame(bitmap, {
        timestamp: layers[0]?.frame.timestamp || 0
    });
    
    bitmap.close();
    
    return outputFrame;
}

// Effect implementations
function applyBrightness(pixels: Uint8ClampedArray, value: number) {
    const adjustment = value * 255;
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = Math.min(255, Math.max(0, pixels[i] + adjustment));
        pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + adjustment));
        pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + adjustment));
    }
}

function applyContrast(pixels: Uint8ClampedArray, value: number) {
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = Math.min(255, Math.max(0, factor * (pixels[i] - 128) + 128));
        pixels[i + 1] = Math.min(255, Math.max(0, factor * (pixels[i + 1] - 128) + 128));
        pixels[i + 2] = Math.min(255, Math.max(0, factor * (pixels[i + 2] - 128) + 128));
    }
}

function applySaturation(pixels: Uint8ClampedArray, value: number) {
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        pixels[i] = Math.min(255, Math.max(0, gray + value * (r - gray)));
        pixels[i + 1] = Math.min(255, Math.max(0, gray + value * (g - gray)));
        pixels[i + 2] = Math.min(255, Math.max(0, gray + value * (b - gray)));
    }
}

async function applyBlur(imageData: ImageData, radius: number) {
    // Simple box blur implementation
    // In production, would use more sophisticated algorithm
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        const idx = (ny * width + nx) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        a += data[idx + 3];
                        count++;
                    }
                }
            }
            
            const idx = (y * width + x) * 4;
            output[idx] = r / count;
            output[idx + 1] = g / count;
            output[idx + 2] = b / count;
            output[idx + 3] = a / count;
        }
    }
    
    // Copy result back
    data.set(output);
}

// Export for TypeScript
export {};