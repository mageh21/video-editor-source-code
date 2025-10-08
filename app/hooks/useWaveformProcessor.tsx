'use client';
import React from 'react';
import { MediaFile } from '../types';

interface WaveformData {
  peaks: number[];
  length: number;
}

interface UseWaveformProcessorProps {
  media: MediaFile;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useWaveformProcessor = ({ media, containerRef }: UseWaveformProcessorProps): WaveformData | null => {
  const [waveformData, setWaveformData] = React.useState<WaveformData | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const processingRef = React.useRef(false);

  const processAudio = React.useCallback(async () => {
    if (media.type !== 'audio' && media.type !== 'video') return;
    if (!media.src) return;
    if (processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const response = await fetch(media.src);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0); // Get first channel
      const sampleRate = audioBuffer.sampleRate;
      
      // Calculate start and end samples based on media timing
      const startSample = Math.floor(media.startTime * sampleRate);
      const endSample = Math.floor(media.endTime * sampleRate);
      const totalSamples = endSample - startSample;
      
      // Number of peaks to generate (based on container width)
      const containerWidth = containerRef.current?.clientWidth || 800;
      const peaksCount = Math.min(400, Math.floor(containerWidth / 2));
      
      const samplesPerPeak = Math.floor(totalSamples / peaksCount);
      const peaks: number[] = [];

      // Process audio data to generate peaks
      for (let i = 0; i < peaksCount; i++) {
        const start = startSample + (i * samplesPerPeak);
        const end = Math.min(start + samplesPerPeak, endSample);
        
        let peakMax = 0;
        let sum = 0;
        let count = 0;
        
        // Find peak and calculate RMS for this segment
        for (let j = start; j < end; j++) {
          if (j < channelData.length) {
            const sample = Math.abs(channelData[j]);
            peakMax = Math.max(peakMax, sample);
            sum += sample * sample;
            count++;
          }
        }
        
        // Calculate RMS (Root Mean Square)
        const rms = count > 0 ? Math.sqrt(sum / count) : 0;
        
        // Use average of peak and RMS for smoother visualization
        peaks.push((peakMax + rms) / 2);
      }

      // Normalize peaks using 95th percentile to handle outliers
      const sortedPeaks = [...peaks].sort((a, b) => b - a);
      const percentile95 = sortedPeaks[Math.floor(peaks.length * 0.05)] || 1;
      
      const normalizedPeaks = peaks.map(peak => Math.min(peak / percentile95, 1));

      setWaveformData({
        peaks: normalizedPeaks,
        length: totalSamples,
      });

      // Close audio context
      audioContext.close();
    } catch (error) {
      console.error('Error processing audio waveform:', error);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [media, containerRef]);

  React.useEffect(() => {
    processAudio();
  }, [processAudio]);

  return waveformData;
};