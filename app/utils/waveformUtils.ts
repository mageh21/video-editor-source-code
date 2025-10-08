export interface WaveformData {
  peaks: number[];
  duration: number;
}

/**
 * Generate waveform peaks from an audio/video URL
 * @param url - The audio/video file URL
 * @param samplesPerPixel - Number of audio samples per waveform pixel
 * @param signal - AbortSignal for cancellation
 * @returns Array of peak values normalized between 0 and 1
 */
export const generateWaveform = async (
  url: string,
  samplesPerPixel: number = 256,
  signal?: AbortSignal
): Promise<WaveformData> => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Fetch the audio file
    const response = await fetch(url, { signal });
    const arrayBuffer = await response.arrayBuffer();
    
    if (signal?.aborted) {
      throw new Error('Aborted');
    }
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    if (signal?.aborted) {
      throw new Error('Aborted');
    }
    
    // Get audio data from the first channel
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Calculate number of peaks
    const totalSamples = channelData.length;
    const peaksCount = Math.ceil(totalSamples / samplesPerPixel);
    const peaks: number[] = [];
    
    // Generate peaks
    for (let i = 0; i < peaksCount; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, totalSamples);
      
      let min = 0;
      let max = 0;
      
      // Find min and max in this sample range
      for (let j = start; j < end; j++) {
        const value = channelData[j];
        if (value > max) max = value;
        if (value < min) min = value;
      }
      
      // Store the peak (average of absolute min and max)
      const peak = (Math.abs(max) + Math.abs(min)) / 2;
      peaks.push(peak);
    }
    
    // Normalize peaks to 0-1 range
    const maxPeak = Math.max(...peaks);
    const normalizedPeaks = peaks.map(peak => peak / maxPeak);
    
    // Close audio context
    audioContext.close();
    
    return {
      peaks: normalizedPeaks,
      duration
    };
  } catch (error) {
    console.error('Error generating waveform:', error);
    // Return empty waveform on error
    return {
      peaks: [],
      duration: 0
    };
  }
};

/**
 * Generate a simple waveform visualization for display
 * @param peaks - Array of peak values
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @returns Canvas element with waveform
 */
export const drawWaveform = (
  peaks: number[],
  width: number,
  height: number,
  color: string = '#ffffff'
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set up drawing style
  ctx.fillStyle = color;
  
  const barWidth = Math.max(1, width / peaks.length);
  const barSpacing = 0.5;
  
  // Draw waveform bars
  peaks.forEach((peak, index) => {
    const barHeight = peak * height * 0.8; // 80% of height for padding
    const x = index * barWidth;
    const y = (height - barHeight) / 2;
    
    // Draw mirrored bars (top and bottom)
    ctx.fillRect(x, y, barWidth - barSpacing, barHeight);
  });
  
  return canvas;
};

/**
 * Cache for waveform data to avoid regenerating
 */
const waveformCache = new Map<string, WaveformData>();

/**
 * Get waveform data with caching
 */
export const getWaveformData = async (
  url: string,
  samplesPerPixel: number = 256,
  signal?: AbortSignal
): Promise<WaveformData> => {
  const cacheKey = `${url}_${samplesPerPixel}`;
  
  // Check cache first
  if (waveformCache.has(cacheKey)) {
    return waveformCache.get(cacheKey)!;
  }
  
  // Generate new waveform
  const waveformData = await generateWaveform(url, samplesPerPixel, signal);
  
  // Cache the result
  if (waveformData.peaks.length > 0) {
    waveformCache.set(cacheKey, waveformData);
  }
  
  return waveformData;
};