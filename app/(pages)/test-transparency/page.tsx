'use client';

import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export default function TestTransparency() {
  const [log, setLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testTransparencyExport = async () => {
    setIsLoading(true);
    setLog([]);
    setResultUrl(null);

    try {
      // Load FFmpeg
      addLog('Loading FFmpeg...');
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        addLog(`FFmpeg: ${message}`);
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      
      addLog('FFmpeg loaded successfully');

      // Create test files
      addLog('Creating test video files...');
      
      // Create a green screen video (simulate transparent video)
      await ffmpeg.exec([
        '-f', 'lavfi',
        '-i', 'color=green:size=640x480:duration=5',
        '-c:v', 'libvpx',
        '-pix_fmt', 'yuva420p',
        'green.webm'
      ]);
      
      // Create a background video
      await ffmpeg.exec([
        '-f', 'lavfi',
        '-i', 'testsrc=size=640x480:duration=5',
        'background.mp4'
      ]);
      
      addLog('Test files created');

      // Test different overlay approaches
      addLog('Testing overlay with alpha channel...');
      
      // Approach 1: Direct overlay
      try {
        await ffmpeg.exec([
          '-i', 'background.mp4',
          '-i', 'green.webm',
          '-filter_complex',
          '[0:v][1:v]overlay=0:0',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          'output1.mp4'
        ]);
        addLog('✓ Direct overlay completed');
      } catch (error) {
        addLog(`✗ Direct overlay failed: ${error}`);
      }

      // Approach 2: With format conversion
      try {
        await ffmpeg.exec([
          '-i', 'background.mp4',
          '-i', 'green.webm',
          '-filter_complex',
          '[1:v]format=yuva420p[overlay];[0:v][overlay]overlay=0:0',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          'output2.mp4'
        ]);
        addLog('✓ Format conversion overlay completed');
      } catch (error) {
        addLog(`✗ Format conversion overlay failed: ${error}`);
      }

      // Approach 3: Using chromakey
      try {
        await ffmpeg.exec([
          '-i', 'background.mp4',
          '-i', 'green.webm',
          '-filter_complex',
          '[1:v]chromakey=green:0.1:0.2[ckout];[0:v][ckout]overlay=0:0',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          'output3.mp4'
        ]);
        addLog('✓ Chromakey overlay completed');
      } catch (error) {
        addLog(`✗ Chromakey overlay failed: ${error}`);
      }

      // Read the output
      try {
        const data = await ffmpeg.readFile('output1.mp4');
        const blob = new Blob([data], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        addLog('✓ Output file created successfully');
      } catch (error) {
        addLog(`✗ Failed to read output: ${error}`);
      }

    } catch (error) {
      addLog(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebM Transparency Test</h1>
      
      <button
        onClick={testTransparencyExport}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Test'}
      </button>

      {resultUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <video 
            src={resultUrl} 
            controls 
            className="w-full max-w-md bg-gray-800"
          />
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Log:</h2>
        <div className="bg-gray-900 p-4 rounded text-sm font-mono h-96 overflow-y-auto">
          {log.map((line, i) => (
            <div key={i} className={line.includes('✓') ? 'text-green-400' : line.includes('✗') ? 'text-red-400' : 'text-gray-300'}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}