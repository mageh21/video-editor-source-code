// Advanced chroma key processor for canvas rendering
// Matches the quality of the preview implementation

export class ChromaKeyCanvasProcessor {
    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;

    constructor() {
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d')!;
    }

    // Convert hex to normalized RGB
    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        let fullHex = hex.replace('#', '');
        if (fullHex.length === 3) {
            fullHex = fullHex.split('').map(char => char + char).join('');
        }
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 1, b: 0 };
    }

    // Convert RGB to YCbCr (similar to YUV but more suitable for digital)
    private rgbToYCbCr(r: number, g: number, b: number): { y: number; cb: number; cr: number } {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = -0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 0.5 * r - 0.418688 * g - 0.081312 * b;
        return { y, cb, cr };
    }

    // Apply Gaussian blur for edge smoothing
    private applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
        const { width, height, data } = imageData;
        const output = new ImageData(new Uint8ClampedArray(data), width, height);
        
        // Simple box blur approximation of Gaussian
        for (let channel = 0; channel < 4; channel++) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                const idx = (ny * width + nx) * 4 + channel;
                                sum += data[idx];
                                count++;
                            }
                        }
                    }
                    
                    const idx = (y * width + x) * 4 + channel;
                    output.data[idx] = sum / count;
                }
            }
        }
        
        return output;
    }

    // Main processing function
    process(
        sourceCanvas: HTMLCanvasElement,
        keyColor: string,
        similarity: number,
        smoothness: number,
        spillSuppress: number = 0.5
    ): HTMLCanvasElement {
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        
        console.log('ChromaKeyCanvasProcessor.process called:', {
            width,
            height,
            keyColor,
            similarity,
            smoothness,
            spillSuppress
        });
        
        // Set up temp canvas
        this.tempCanvas.width = width;
        this.tempCanvas.height = height;
        
        // Copy source to temp
        this.tempCtx.drawImage(sourceCanvas, 0, 0);
        
        // Get image data
        const imageData = this.tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Convert key color
        const keyRgb = this.hexToRgb(keyColor);
        const keyYCbCr = this.rgbToYCbCr(keyRgb.r, keyRgb.g, keyRgb.b);
        
        // Create alpha mask
        const alphaMask = new Float32Array(width * height);
        
        // First pass: Calculate alpha values
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx] / 255;
                const g = data[idx + 1] / 255;
                const b = data[idx + 2] / 255;
                
                // Convert to YCbCr
                const pixelYCbCr = this.rgbToYCbCr(r, g, b);
                
                // Calculate chroma difference (ignore luminance)
                const cbDiff = pixelYCbCr.cb - keyYCbCr.cb;
                const crDiff = pixelYCbCr.cr - keyYCbCr.cr;
                const chromaDist = Math.sqrt(cbDiff * cbDiff + crDiff * crDiff);
                
                // Calculate base alpha
                let alpha = 1.0;
                const threshold = similarity * 0.5;
                
                if (chromaDist < threshold) {
                    alpha = chromaDist / threshold;
                    // Apply smoothness curve
                    if (smoothness > 0) {
                        alpha = Math.pow(alpha, 1 - smoothness * 0.8);
                    }
                }
                
                alphaMask[y * width + x] = alpha;
            }
        }
        
        // Apply edge refinement
        if (smoothness > 0) {
            // Edge detection and refinement
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const current = alphaMask[idx];
                    
                    // Check if we're on an edge
                    const neighbors = [
                        alphaMask[(y - 1) * width + x],
                        alphaMask[(y + 1) * width + x],
                        alphaMask[y * width + (x - 1)],
                        alphaMask[y * width + (x + 1)]
                    ];
                    
                    const minNeighbor = Math.min(...neighbors);
                    const maxNeighbor = Math.max(...neighbors);
                    
                    // If we're on an edge (high variance in neighbors)
                    if (maxNeighbor - minNeighbor > 0.3) {
                        // Smooth the transition
                        alphaMask[idx] = (current + minNeighbor + maxNeighbor) / 3;
                    }
                }
            }
        }
        
        // Second pass: Apply alpha and despill
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = alphaMask[y * width + x];
                
                // Apply despill for semi-transparent pixels
                if (alpha > 0.1 && alpha < 0.9 && spillSuppress > 0) {
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    
                    // Detect and remove green spill
                    if (keyRgb.g > keyRgb.r && keyRgb.g > keyRgb.b) {
                        const maxRB = Math.max(r, b);
                        const greenExcess = g - maxRB;
                        
                        if (greenExcess > 0) {
                            // Calculate spill amount based on alpha
                            const spillFactor = (1 - alpha) * spillSuppress;
                            
                            // Remove green spill
                            data[idx + 1] = maxRB + greenExcess * (1 - spillFactor);
                            
                            // Add complementary color to neutralize green cast
                            const compensation = greenExcess * spillFactor * 0.3;
                            data[idx] = Math.min(255, r + compensation);     // Add red
                            data[idx + 2] = Math.min(255, b + compensation); // Add blue
                        }
                    }
                    // Detect and remove blue spill
                    else if (keyRgb.b > keyRgb.r && keyRgb.b > keyRgb.g) {
                        const maxRG = Math.max(r, g);
                        const blueExcess = b - maxRG;
                        
                        if (blueExcess > 0) {
                            const spillFactor = (1 - alpha) * spillSuppress;
                            
                            // Remove blue spill
                            data[idx + 2] = maxRG + blueExcess * (1 - spillFactor);
                            
                            // Add complementary color
                            const compensation = blueExcess * spillFactor * 0.3;
                            data[idx] = Math.min(255, r + compensation);     // Add red
                            data[idx + 1] = Math.min(255, g + compensation); // Add green
                        }
                    }
                }
                
                // Set final alpha
                data[idx + 3] = Math.floor(alpha * 255);
            }
        }
        
        // Put processed image back
        this.tempCtx.putImageData(imageData, 0, 0);
        
        return this.tempCanvas;
    }
}