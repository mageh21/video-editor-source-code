'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FONTS, FONT_FAMILIES, getDefaultFontForFamily } from '@/app/data/fonts';
import { loadFontOnDemand } from '@/app/utils/font-preloader';

interface FontPreviewCanvasProps {
  fontFamily: string;
  onPreviewGenerated: (dataUrl: string) => void;
}

export const FontPreviewCanvas: React.FC<FontPreviewCanvasProps> = ({ fontFamily, onPreviewGenerated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generatePreview = async () => {
      if (!canvasRef.current || isGenerating) return;
      
      setIsGenerating(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 280;
      canvas.height = 40;

      // Clear canvas with dark background
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        // Load the font
        await loadFontOnDemand(fontFamily);
        
        // Get font details
        const font = getDefaultFontForFamily(fontFamily);
        const fontName = font?.postScriptName || fontFamily;
        
        // Wait a bit for font to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Draw the font name in its own font
        ctx.font = `24px "${fontName}"`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(fontFamily, 10, 20);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        onPreviewGenerated(dataUrl);
      } catch (error) {
        console.error(`Failed to generate preview for ${fontFamily}:`, error);
        
        // Fallback: just draw with system font
        ctx.font = '20px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(fontFamily, 10, 20);
        
        const dataUrl = canvas.toDataURL('image/png');
        onPreviewGenerated(dataUrl);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreview();
  }, [fontFamily, onPreviewGenerated]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

// Component to preload all font previews
export const FontPreviewPreloader: React.FC = () => {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get all font families
  const fontFamilies = Object.keys(FONT_FAMILIES).sort();

  useEffect(() => {
    // Store previews in localStorage
    const stored = localStorage.getItem('fontPreviews');
    if (stored) {
      try {
        setPreviews(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load font previews from storage');
      }
    }
  }, []);

  const handlePreviewGenerated = (family: string, dataUrl: string) => {
    setPreviews(prev => {
      const updated = { ...prev, [family]: dataUrl };
      // Store in localStorage
      try {
        localStorage.setItem('fontPreviews', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to store font previews');
      }
      return updated;
    });
    
    // Move to next font
    setCurrentIndex(prev => prev + 1);
  };

  // Only render canvas for fonts we haven't generated yet
  const currentFamily = fontFamilies[currentIndex];
  const needsGeneration = currentFamily && !previews[currentFamily];

  return (
    <>
      {needsGeneration && (
        <FontPreviewCanvas
          key={currentFamily}
          fontFamily={currentFamily}
          onPreviewGenerated={(url) => handlePreviewGenerated(currentFamily, url)}
        />
      )}
    </>
  );
};

// Hook to get font previews
export const useFontPreviews = () => {
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('fontPreviews');
    if (stored) {
      try {
        setPreviews(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load font previews');
      }
    }

    // Listen for updates
    const handleStorage = () => {
      const updated = localStorage.getItem('fontPreviews');
      if (updated) {
        try {
          setPreviews(JSON.parse(updated));
        } catch (e) {
          console.error('Failed to load updated font previews');
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return previews;
};