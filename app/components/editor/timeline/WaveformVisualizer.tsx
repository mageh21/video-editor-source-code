import React from 'react';

interface WaveformVisualizerProps {
  peaks: number[];
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ peaks, className = '' }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current || peaks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up drawing style
    ctx.fillStyle = '#FFC107'; // Yellow/amber color for audio
    
    const barWidth = canvas.width / peaks.length;
    const centerY = canvas.height / 2;
    
    // Draw waveform bars
    peaks.forEach((peak, index) => {
      // Apply logarithmic scaling for better perceived loudness
      const scaledPeak = Math.pow(peak, 0.7);
      const barHeight = scaledPeak * (canvas.height * 0.8); // 80% of container height
      
      const x = index * barWidth;
      const y = centerY - (barHeight / 2);
      
      // Draw mirrored bars for symmetrical waveform
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  }, [peaks]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Alternative bar-based visualizer (matches RVE style)
export const WaveformBars: React.FC<WaveformVisualizerProps> = ({ peaks, className = '' }) => {
  // Sample peaks for performance
  const sampledPeaks = React.useMemo(() => {
    if (peaks.length <= 100) return peaks;
    
    const sampleRate = Math.ceil(peaks.length / 100);
    return peaks.filter((_, index) => index % sampleRate === 0);
  }, [peaks]);

  return (
    <div className={`flex items-center h-full w-full ${className}`}>
      {sampledPeaks.map((peak, index) => {
        // Apply logarithmic scaling
        const scaledPeak = Math.pow(peak, 0.7);
        const heightPercentage = Math.max(4, scaledPeak * 100); // Min 4% height
        
        return (
          <div
            key={index}
            className="flex-1 flex items-center justify-center"
            style={{ height: '100%' }}
          >
            <div
              className="bg-yellow-500 dark:bg-yellow-400 min-w-[1px]"
              style={{
                height: `${heightPercentage}%`,
                transform: 'translateY(0)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};