export class WebGLCompositor {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private shaderProgram: WebGLProgram | null = null;
    private textures = new Map<string, WebGLTexture>();
    private frameBuffers = new Map<string, WebGLFramebuffer>();
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            depth: false,
            desynchronized: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
        });
        
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;
        this.initializeShaders();
    }
    
    private initializeShaders() {
        const vertexShader = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            out vec2 v_texCoord;
            uniform mat3 u_transform;
            
            void main() {
                vec3 position = u_transform * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
        
        const fragmentShader = `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            out vec4 outColor;
            
            uniform sampler2D u_texture;
            uniform float u_opacity;
            uniform vec4 u_colorMatrix;
            uniform vec4 u_colorOffset;
            
            void main() {
                vec4 color = texture(u_texture, v_texCoord);
                
                // Apply color matrix for effects
                color = vec4(
                    dot(color, u_colorMatrix),
                    color.g,
                    color.b,
                    color.a
                ) + u_colorOffset;
                
                // Apply opacity
                color.a *= u_opacity;
                
                outColor = color;
            }
        `;
        
        this.shaderProgram = this.createShaderProgram(vertexShader, fragmentShader);
    }
    
    private createShaderProgram(vsSource: string, fsSource: string): WebGLProgram {
        const gl = this.gl;
        
        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);
        
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Shader program failed to link');
        }
        
        return program;
    }
    
    private loadShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${info}`);
        }
        
        return shader;
    }
    
    // Create texture from video element
    createVideoTexture(video: HTMLVideoElement, id: string): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        
        // Use linear filtering for better quality
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        this.textures.set(id, texture);
        return texture;
    }
    
    // Update existing texture with new video frame
    updateVideoTexture(video: HTMLVideoElement, id: string) {
        const texture = this.textures.get(id);
        if (!texture) return;
        
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }
    
    // Composite multiple layers
    compositeLayers(layers: Array<{
        textureId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        opacity: number;
        zIndex: number;
    }>) {
        const gl = this.gl;
        
        // Clear canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Sort by z-index
        layers.sort((a, b) => a.zIndex - b.zIndex);
        
        // Render each layer
        layers.forEach(layer => {
            const texture = this.textures.get(layer.textureId);
            if (!texture) return;
            
            this.renderTexture(texture, layer);
        });
    }
    
    private renderTexture(texture: WebGLTexture, config: {
        x: number;
        y: number;
        width: number;
        height: number;
        opacity: number;
    }) {
        const gl = this.gl;
        const program = this.shaderProgram!;
        
        gl.useProgram(program);
        
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
        
        // Set attributes
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        const transformLoc = gl.getUniformLocation(program, 'u_transform');
        const transform = this.createTransformMatrix(config);
        gl.uniformMatrix3fv(transformLoc, false, transform);
        
        const opacityLoc = gl.getUniformLocation(program, 'u_opacity');
        gl.uniform1f(opacityLoc, config.opacity);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const textureLoc = gl.getUniformLocation(program, 'u_texture');
        gl.uniform1i(textureLoc, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    private createTransformMatrix(config: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Float32Array {
        // Convert from pixel coordinates to clip space (-1 to 1)
        const scaleX = (config.width / this.canvas.width) * 2;
        const scaleY = (config.height / this.canvas.height) * 2;
        const translateX = (config.x / this.canvas.width) * 2 - 1 + scaleX / 2;
        const translateY = 1 - (config.y / this.canvas.height) * 2 - scaleY / 2;
        
        return new Float32Array([
            scaleX, 0, 0,
            0, scaleY, 0,
            translateX, translateY, 1
        ]);
    }
    
    // Read pixels for export
    async readPixels(): Promise<ImageData> {
        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // Flip vertically (WebGL coordinates are upside down)
        const imageData = new ImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIndex = (y * width + x) * 4;
                const dstIndex = ((height - y - 1) * width + x) * 4;
                
                imageData.data[dstIndex] = pixels[srcIndex];
                imageData.data[dstIndex + 1] = pixels[srcIndex + 1];
                imageData.data[dstIndex + 2] = pixels[srcIndex + 2];
                imageData.data[dstIndex + 3] = pixels[srcIndex + 3];
            }
        }
        
        return imageData;
    }
    
    dispose() {
        const gl = this.gl;
        
        // Clean up textures
        this.textures.forEach(texture => gl.deleteTexture(texture));
        this.textures.clear();
        
        // Clean up framebuffers
        this.frameBuffers.forEach(fb => gl.deleteFramebuffer(fb));
        this.frameBuffers.clear();
        
        // Delete shader program
        if (this.shaderProgram) {
            gl.deleteProgram(this.shaderProgram);
        }
    }
}