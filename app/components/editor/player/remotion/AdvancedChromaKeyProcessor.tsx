import React, { useRef, useCallback, useEffect } from 'react';
import { OffthreadVideo } from 'remotion';

interface AdvancedChromaKeyProcessorProps {
    src: string;
    chromaKeyColor: string;
    similarity: number;
    smoothness: number;
    spillSuppress?: number;
    startFrom?: number;
    endAt?: number;
    playbackRate?: number;
    volume?: number;
    style?: React.CSSProperties;
    transparent?: boolean;
}

export const AdvancedChromaKeyProcessor: React.FC<AdvancedChromaKeyProcessorProps> = ({
    src,
    chromaKeyColor,
    similarity,
    smoothness,
    spillSuppress = 0.5,
    startFrom,
    endAt,
    playbackRate = 1,
    volume = 1,
    style,
    transparent
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
    const shaderProgramRef = useRef<WebGLProgram | null>(null);
    const glRef = useRef<WebGL2RenderingContext | null>(null);
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
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
    };
    
    // WebGL2 shader for advanced chroma keying
    const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }`;
    
    const fragmentShaderSource = `#version 300 es
    precision highp float;
    
    uniform sampler2D u_image;
    uniform vec3 u_keyColor;
    uniform float u_similarity;
    uniform float u_smoothness;
    uniform float u_spillRange;
    
    in vec2 v_texCoord;
    out vec4 fragColor;
    
    // Convert RGB to YUV color space
    vec3 rgb2yuv(vec3 rgb) {
        float y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        float u = -0.14713 * rgb.r - 0.28886 * rgb.g + 0.436 * rgb.b;
        float v = 0.615 * rgb.r - 0.51499 * rgb.g - 0.10001 * rgb.b;
        return vec3(y, u, v);
    }
    
    // Convert YUV back to RGB
    vec3 yuv2rgb(vec3 yuv) {
        float r = yuv.x + 1.13983 * yuv.z;
        float g = yuv.x - 0.39465 * yuv.y - 0.58060 * yuv.z;
        float b = yuv.x + 2.03211 * yuv.y;
        return vec3(r, g, b);
    }
    
    // Calculate chroma difference in YUV space
    float chromaDifference(vec3 yuv1, vec3 yuv2) {
        vec2 uv1 = yuv1.yz;
        vec2 uv2 = yuv2.yz;
        return length(uv1 - uv2);
    }
    
    // Edge detection for better masking
    float getEdgeStrength(vec2 coord) {
        vec2 texelSize = 1.0 / vec2(textureSize(u_image, 0));
        
        vec3 tl = texture(u_image, coord + vec2(-texelSize.x, -texelSize.y)).rgb;
        vec3 tm = texture(u_image, coord + vec2(0.0, -texelSize.y)).rgb;
        vec3 tr = texture(u_image, coord + vec2(texelSize.x, -texelSize.y)).rgb;
        vec3 ml = texture(u_image, coord + vec2(-texelSize.x, 0.0)).rgb;
        vec3 mm = texture(u_image, coord).rgb;
        vec3 mr = texture(u_image, coord + vec2(texelSize.x, 0.0)).rgb;
        vec3 bl = texture(u_image, coord + vec2(-texelSize.x, texelSize.y)).rgb;
        vec3 bm = texture(u_image, coord + vec2(0.0, texelSize.y)).rgb;
        vec3 br = texture(u_image, coord + vec2(texelSize.x, texelSize.y)).rgb;
        
        vec3 gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
        vec3 gy = -tl - 2.0 * tm - tr + bl + 2.0 * bm + br;
        
        return length(gx) + length(gy);
    }
    
    void main() {
        vec4 color = texture(u_image, v_texCoord);
        vec3 rgb = color.rgb;
        
        // Convert to YUV for better chroma comparison
        vec3 yuv = rgb2yuv(rgb);
        vec3 keyYuv = rgb2yuv(u_keyColor);
        
        // Calculate chroma difference
        float diff = chromaDifference(yuv, keyYuv);
        
        // Get edge strength for better masking
        float edge = getEdgeStrength(v_texCoord);
        
        // Calculate base alpha
        float alpha = smoothstep(u_similarity - u_smoothness, u_similarity + u_smoothness, diff);
        
        // Enhance alpha based on edge detection
        alpha = mix(alpha, 1.0, edge * 0.5);
        
        // Despill - remove key color contamination
        if (alpha > 0.0 && alpha < 1.0) {
            // Calculate spill suppression
            float spillSuppression = 1.0 - smoothstep(u_similarity, u_similarity + u_spillRange, diff);
            
            // Reduce the key color channel
            if (u_keyColor.g > u_keyColor.r && u_keyColor.g > u_keyColor.b) {
                // Green screen - reduce green channel
                float greenReduction = rgb.g - max(rgb.r, rgb.b);
                rgb.g -= greenReduction * spillSuppression * 0.5;
            } else if (u_keyColor.b > u_keyColor.r && u_keyColor.b > u_keyColor.g) {
                // Blue screen - reduce blue channel
                float blueReduction = rgb.b - max(rgb.r, rgb.g);
                rgb.b -= blueReduction * spillSuppression * 0.5;
            }
            
            // Color correction to compensate for despill
            vec3 correctedYuv = rgb2yuv(rgb);
            correctedYuv.x *= 1.0 + spillSuppression * 0.1; // Slight brightness boost
            rgb = yuv2rgb(correctedYuv);
        }
        
        // Apply refined alpha
        fragColor = vec4(rgb, alpha);
    }`;
    
    // Initialize WebGL2 context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const gl = canvas.getContext('webgl2', { 
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });
        
        if (!gl) {
            console.error('WebGL2 not supported, falling back to canvas 2D');
            return;
        }
        
        glRef.current = gl;
        
        // Create shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        
        // Create program
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
            return;
        }
        
        shaderProgramRef.current = program;
        
        // Set up geometry
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);
        
        const texCoords = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0,
        ]);
        
        // Create buffers
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        // Set up attributes
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Clean up shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
    }, []);
    
    const onVideoFrame = useCallback((frame: CanvasImageSource) => {
        const canvas = canvasRef.current;
        const gl = glRef.current;
        const program = shaderProgramRef.current;
        
        if (!canvas || !gl || !program) {
            // Fallback to 2D canvas if WebGL not available
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;
            
            // Enhanced 2D implementation with better edge detection
            let width: number;
            let height: number;
            
            if (frame instanceof HTMLVideoElement) {
                width = frame.videoWidth;
                height = frame.videoHeight;
            } else if (frame instanceof HTMLImageElement) {
                width = frame.width;
                height = frame.height;
            } else {
                return;
            }
            
            if (!width || !height) return;
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(frame, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            const keyColor = hexToRgb(chromaKeyColor);
            const tolerance = similarity * 255;
            const spillRange = spillSuppress * 0.4;
            
            // Process pixels with enhanced algorithm
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;
                    
                    // Convert to YUV for better color comparison
                    const y_luma = 0.299 * r + 0.587 * g + 0.114 * b;
                    const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
                    const v = 0.615 * r - 0.51499 * g - 0.10001 * b;
                    
                    const key_y = 0.299 * keyColor.r + 0.587 * keyColor.g + 0.114 * keyColor.b;
                    const key_u = -0.14713 * keyColor.r - 0.28886 * keyColor.g + 0.436 * keyColor.b;
                    const key_v = 0.615 * keyColor.r - 0.51499 * keyColor.g - 0.10001 * keyColor.b;
                    
                    // Calculate chroma difference
                    const chromaDiff = Math.sqrt(Math.pow(u - key_u, 2) + Math.pow(v - key_v, 2));
                    
                    // Calculate alpha with smoothing
                    let alpha = 1.0;
                    const normalizedDiff = chromaDiff * 255;
                    
                    if (normalizedDiff < tolerance) {
                        alpha = normalizedDiff / tolerance;
                        if (smoothness > 0) {
                            alpha = Math.pow(alpha, 1 - smoothness);
                        }
                        
                        // Despill for semi-transparent pixels
                        if (alpha > 0 && alpha < 1) {
                            const spillSuppress = 1 - alpha;
                            
                            // Reduce green channel for green screen
                            if (keyColor.g > keyColor.r && keyColor.g > keyColor.b) {
                                const greenExcess = g - Math.max(r, b);
                                if (greenExcess > 0) {
                                    data[i + 1] -= greenExcess * spillSuppress * 127;
                                }
                            }
                        }
                    }
                    
                    data[i + 3] = Math.floor(alpha * 255);
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            return;
        }
        
        // WebGL rendering
        let width: number;
        let height: number;
        
        if (frame instanceof HTMLVideoElement) {
            width = frame.videoWidth;
            height = frame.videoHeight;
        } else if (frame instanceof HTMLImageElement) {
            width = frame.width;
            height = frame.height;
        } else {
            return;
        }
        
        if (!width || !height) return;
        
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        
        // Create texture from video frame
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Use shader program
        gl.useProgram(program);
        
        // Set uniforms
        const keyColor = hexToRgb(chromaKeyColor);
        gl.uniform3f(gl.getUniformLocation(program, 'u_keyColor'), keyColor.r, keyColor.g, keyColor.b);
        gl.uniform1f(gl.getUniformLocation(program, 'u_similarity'), similarity);
        gl.uniform1f(gl.getUniformLocation(program, 'u_smoothness'), smoothness);
        gl.uniform1f(gl.getUniformLocation(program, 'u_spillRange'), spillSuppress * 0.4);
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Clear and draw
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Clean up
        gl.deleteTexture(texture);
        
    }, [chromaKeyColor, similarity, smoothness, spillSuppress]);
    
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