'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/app/store';

export function FontPreloader() {
  const { textElements } = useAppSelector((state) => state.projectState);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadFontsForProject = async () => {
      // Get all unique font families used in text elements
      const usedFonts = new Set<string>();
      
      textElements.forEach(t => {
        // Use fontFamily if available (CSS name), otherwise fall back to font (postScriptName)
        const fontToUse = t.fontFamily || t.font;
        if (fontToUse && fontToUse !== 'Inter' && !loadedFonts.has(fontToUse)) {
          usedFonts.add(fontToUse);
        }
      });

      if (usedFonts.size === 0) return;

      // console.log(`🎨 FontPreloader: Loading ${usedFonts.size} fonts:`, Array.from(usedFonts));

      // Load fonts via CSS (same approach as FloatingFontPicker)
      const loadPromises = Array.from(usedFonts).map(async (fontFamily) => {
        try {
          // Check if already loaded
          const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
          if (existingLink) {
            setLoadedFonts(prev => new Set([...prev, fontFamily]));
            return;
          }
          
          // Create Google Fonts CSS URL
          const encodedFamily = fontFamily.replace(/\s+/g, '+');
          const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
          
          // Create and append CSS link
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = cssUrl;
          document.head.appendChild(link);
          
          // Wait for font to load with timeout
          await new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
            setTimeout(reject, 2000); // 2 second timeout for preloader
          });
          
          setLoadedFonts(prev => new Set([...prev, fontFamily]));
          // console.log(`✅ FontPreloader: Font "${fontFamily}" loaded successfully`);
        } catch (error) {
          console.warn(`⚠️ FontPreloader: Font loading timeout for "${fontFamily}", will use fallback`);
          // Still mark as "loaded" to prevent repeated attempts
          setLoadedFonts(prev => new Set([...prev, fontFamily]));
        }
      });
      
      await Promise.allSettled(loadPromises);
      // console.log(`✅ FontPreloader: All fonts loaded successfully`);
    };

    loadFontsForProject();
  }, [textElements, loadedFonts]);

  return null;
}