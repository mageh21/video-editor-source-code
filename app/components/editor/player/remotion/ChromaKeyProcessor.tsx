import React, { useRef, useCallback } from 'react';
import { OffthreadVideo, useCurrentFrame } from 'remotion';

interface ChromaKeyProcessorProps {
    src: string;
    chromaKeyColor: string;
    similarity: number;
    smoothness: number;
    startFrom?: number;
    endAt?: number;
    playbackRate?: number;
    volume?: number;
    style?: React.CSSProperties;
    transparent?: boolean;
}

export const ChromaKeyProcessor: React.FC<ChromaKeyProcessorProps> = ({
    src,
    chromaKeyColor,
    similarity,
    smoothness,
    startFrom,
    endAt,
    playbackRate = 1,
    volume = 1,
    style,
    transparent
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
        // Handle both 3-digit and 6-digit hex colors
        let fullHex = hex.replace('#', '');
        if (fullHex.length === 3) {
            fullHex = fullHex.split('').map(char => char + char).join('');
        }
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 };
    };
    
    const keyColor = hexToRgb(chromaKeyColor);
    const tolerance = similarity * 255;
    
    const onVideoFrame = useCallback((frame: CanvasImageSource) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        // Get frame dimensions based on type
        let width: number;
        let height: number;
        
        if (frame instanceof HTMLVideoElement) {
            width = frame.videoWidth;
            height = frame.videoHeight;
        } else if (frame instanceof HTMLImageElement) {
            width = frame.width;
            height = frame.height;
        } else {
            console.warn('ChromaKey: Unknown frame type', frame);
            return;
        }
        
        // Check if we have valid dimensions
        if (!width || !height) {
            return;
        }
        
        // Log first frame processing
        if (!canvas.dataset.processed) {
            console.log('ChromaKey: Processing video with settings', {
                keyColor,
                tolerance,
                smoothness,
                frameSize: { width, height },
                frameType: frame.constructor.name
            });
            canvas.dataset.processed = 'true';
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw the video frame
        try {
            ctx.drawImage(frame, 0, 0, width, height);
        } catch (error) {
            console.error('ChromaKey: Error drawing frame', error);
            return;
        }
        
        // Get image data for manipulation - with safety check
        if (canvas.width === 0 || canvas.height === 0) {
            return;
        }
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate color distance
            const distance = Math.sqrt(
                Math.pow(r - keyColor.r, 2) +
                Math.pow(g - keyColor.g, 2) +
                Math.pow(b - keyColor.b, 2)
            );
            
            // If within tolerance, make transparent
            if (distance < tolerance) {
                // Calculate alpha based on distance for smooth edges
                let alpha = distance / tolerance;
                
                // Apply smoothness
                if (smoothness > 0) {
                    // Smooth the alpha transition
                    alpha = Math.pow(alpha, 1 - smoothness);
                }
                
                // Set pixel transparency
                data[i + 3] = Math.floor(alpha * 255);
            }
        }
        
        // Put the processed image back
        ctx.putImageData(imageData, 0, 0);
    }, [keyColor, tolerance, smoothness]);
    
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <OffthreadVideo
                src={src}
                onVideoFrame={onVideoFrame}
                startFrom={startFrom}
                endAt={endAt}
                playbackRate={playbackRate}
                volume={volume}
                muted={volume === 0}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                transparent={transparent}
            />
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: style?.objectFit || 'contain',
                    ...style
                }}
            />
        </div>
    );
};