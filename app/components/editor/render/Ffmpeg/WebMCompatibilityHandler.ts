import { FFmpeg } from "@ffmpeg/ffmpeg";

/**
 * Handles WebM compatibility and memory issues for FFmpeg WASM
 */
export class WebMCompatibilityHandler {
    /**
     * Pre-processes inputs for WebM export to avoid memory issues
     */
    static async preprocessForWebM(
        ffmpeg: FFmpeg,
        inputs: string[],
        mediaFiles: any[]
    ): Promise<{ processedInputs: string[]; tempFiles: string[] }> {
        const processedInputs: string[] = [];
        const tempFiles: string[] = [];
        let inputIndex = 0;

        for (let i = 0; i < mediaFiles.length; i++) {
            const media = mediaFiles[i];
            
            // Skip non-video files for pre-processing
            if (media.type !== 'video') {
                processedInputs.push(...inputs.slice(inputIndex * 2, (inputIndex + 1) * 2));
                inputIndex++;
                continue;
            }

            // For WebM input files, re-encode to intermediate format
            const mimeType = media.mimeType || '';
            if (mimeType.includes('webm')) {
                const tempFileName = `temp_${i}.mp4`;
                tempFiles.push(tempFileName);

                try {
                    // Re-encode WebM to MP4 first (more stable in FFmpeg WASM)
                    await ffmpeg.exec([
                        '-i', inputs[inputIndex * 2 + 1],
                        '-c:v', 'libx264',
                        '-preset', 'ultrafast',
                        '-crf', '23',
                        '-pix_fmt', 'yuv420p',
                        '-an', // No audio for temp file
                        tempFileName
                    ]);

                    // Use the temp file instead
                    processedInputs.push('-i', tempFileName);
                } catch (error) {
                    console.warn('Failed to pre-process WebM, using original:', error);
                    processedInputs.push(...inputs.slice(inputIndex * 2, (inputIndex + 1) * 2));
                }
            } else {
                processedInputs.push(...inputs.slice(inputIndex * 2, (inputIndex + 1) * 2));
            }
            
            inputIndex++;
        }

        return { processedInputs, tempFiles };
    }

    /**
     * Gets optimized WebM encoding parameters
     */
    static getOptimizedWebMParams(quality: string): string[] {
        const params = [
            '-c:v', 'libvpx-vp9',
            '-pix_fmt', 'yuva420p',
            '-auto-alt-ref', '0',
            '-lag-in-frames', '0',
            '-g', '30',
            '-tile-columns', '2',
            '-threads', '4'
        ];

        // Quality-specific settings
        switch (quality) {
            case 'low':
                params.push('-cpu-used', '5', '-deadline', 'realtime');
                break;
            case 'medium':
                params.push('-cpu-used', '3', '-deadline', 'good');
                break;
            case 'high':
            case 'ultra':
                params.push('-cpu-used', '1', '-deadline', 'good');
                break;
            case 'lossless':
                params.push('-cpu-used', '0', '-deadline', 'best', '-lossless', '1');
                break;
        }

        return params;
    }

    /**
     * Builds a safer filter complex for WebM
     */
    static buildSafeFilterComplex(
        originalFilter: string,
        hasAlpha: boolean
    ): string {
        // Ensure consistent pixel format throughout the chain
        if (hasAlpha) {
            // Replace any format conversions with consistent yuva420p
            return originalFilter.replace(/format=\w+/g, 'format=yuva420p');
        } else {
            // For non-alpha, use yuv420p
            return originalFilter.replace(/format=\w+/g, 'format=yuv420p');
        }
    }

    /**
     * Validates if WebM export is possible with current inputs
     */
    static validateWebMExport(mediaFiles: any[]): { valid: boolean; warnings: string[] } {
        const warnings: string[] = [];
        let hasValidInput = false;

        for (const media of mediaFiles) {
            if (media.type === 'video' || media.type === 'image') {
                hasValidInput = true;
                
                // Check for potential issues
                const mimeType = media.mimeType || '';
                if (mimeType.includes('hevc') || mimeType.includes('h265')) {
                    warnings.push(`File "${media.fileName}" uses HEVC codec which may cause issues`);
                }
                
                if (media.fileSize && media.fileSize > 100 * 1024 * 1024) { // 100MB
                    warnings.push(`File "${media.fileName}" is large and may cause memory issues`);
                }
            }
        }

        return { valid: hasValidInput, warnings };
    }

    /**
     * Cleanup temporary files
     */
    static async cleanupTempFiles(ffmpeg: FFmpeg, tempFiles: string[]): Promise<void> {
        for (const file of tempFiles) {
            try {
                await ffmpeg.deleteFile(file);
            } catch (error) {
                console.warn(`Failed to delete temp file ${file}:`, error);
            }
        }
    }
}