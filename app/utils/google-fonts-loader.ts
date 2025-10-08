// Dynamic Google Fonts loader for Remotion
// This handles loading Google Fonts dynamically since we can't use static imports

import { loadFont as remotionLoadFont } from '@remotion/fonts';

// Helper function to generate Google Fonts CSS URL
function getGoogleFontsCSSUrl(fontFamily: string): string {
  const encodedFamily = fontFamily.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
}

// Cache loaded Google fonts
const loadedGoogleFonts = new Set<string>();

/**
 * Load a Google Font dynamically for Remotion
 */
export async function loadGoogleFont(fontFamily: string): Promise<boolean> {
  if (loadedGoogleFonts.has(fontFamily)) {
    return true;
  }

  const cssUrl = getGoogleFontsCSSUrl(fontFamily);

  try {
    // Create link element to load the font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    
    // Add to head
    document.head.appendChild(link);
    
    // Wait for font to load
    return new Promise((resolve) => {
      link.onload = () => {
        loadedGoogleFonts.add(fontFamily);
        // console.log(`Google Font "${fontFamily}" loaded successfully`);
        resolve(true);
      };
      
      link.onerror = () => {
        console.error(`Failed to load Google Font "${fontFamily}"`);
        resolve(false);
      };
      
      // Timeout after 8 seconds (increased for better reliability)
      setTimeout(() => {
        console.warn(`Timeout loading Google Font "${fontFamily}"`);
        resolve(false);
      }, 8000);
    });
  } catch (error) {
    console.error(`Error loading Google Font "${fontFamily}":`, error);
    return false;
  }
}

/**
 * Check if a font is likely a Google Font (simplified check)
 */
export function isGoogleFont(fontFamily: string): boolean {
  // Most fonts are Google Fonts, so we'll try to load any font
  return true;
}

/**
 * Get all available Google Fonts (simplified - we support any font name)
 */
export function getAvailableGoogleFonts(): string[] {
  return Array.from(loadedGoogleFonts);
}