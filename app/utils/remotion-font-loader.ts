import { loadFont } from "@remotion/fonts";
import { staticFile, continueRender, delayRender } from "remotion";
import { getFontByFamily, loadFont as loadEnhancedFont } from "./enhanced-font-loader";
import { FONTS } from "@/app/data/fonts";

// Cache for loaded fonts
const loadedFonts = new Set<string>();
const fontPromises = new Map<string, Promise<void>>();

// Popular Google Fonts that we support
export const SUPPORTED_GOOGLE_FONTS = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
  'Raleway', 'Poppins', 'PT Sans', 'Merriweather', 'Playfair Display',
  'Ubuntu', 'Nunito', 'Work Sans', 'Rubik', 'Inter',
  'Quicksand', 'Cabin', 'Barlow', 'Heebo', 'Karla'
];

// System fonts that don't need loading
const SYSTEM_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
  'Courier New', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
  'Impact' // Common meme font available on most systems
];

interface FontLoadOptions {
  weight?: string;
  style?: 'normal' | 'italic';
}

/**
 * Load a font for use in Remotion
 */
export async function loadRemotionFont(
  fontFamily: string, 
  options: FontLoadOptions = {}
): Promise<void> {
  // Skip if already loaded
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Skip system fonts
  if (SYSTEM_FONTS.includes(fontFamily)) {
    loadedFonts.add(fontFamily);
    return;
  }

  // Check if we already have a loading promise for this font
  const cacheKey = `${fontFamily}-${options.weight || '400'}-${options.style || 'normal'}`;
  if (fontPromises.has(cacheKey)) {
    return fontPromises.get(cacheKey)!;
  }

  // Create loading promise
  const loadPromise = (async () => {
    try {
      // Check if we have this font in our font data
      const fontData = FONTS.find(f => f.family === fontFamily || f.postScriptName === fontFamily);
      
      if (fontData) {
        // Use our enhanced font loader for fonts in our data
        await loadEnhancedFont(fontData);
        loadedFonts.add(fontFamily);
        loadedFonts.add(fontData.postScriptName);
        return;
      }

      // For fonts not in our data, just mark as loaded - browser handles fallbacks
      loadedFonts.add(fontFamily);
      // console.log(`Font "${fontFamily}" ready (browser fallback)`);
      
    } catch (error) {
      console.error(`Failed to load font "${fontFamily}":`, error);
      // Still mark as loaded to prevent repeated attempts
      loadedFonts.add(fontFamily);
    } finally {
      fontPromises.delete(cacheKey);
    }
  })();

  fontPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

/**
 * Load multiple fonts for a Remotion composition
 */
export async function loadRemotionFonts(fonts: Array<{ family: string; weight?: string; style?: 'normal' | 'italic' }>) {
  const loadPromises = fonts.map(font => 
    loadRemotionFont(font.family, { weight: font.weight, style: font.style })
  );
  await Promise.all(loadPromises);
}

/**
 * Get font family string with fallbacks
 */
export function getFontFamilyWithFallbacks(fontFamily: string): string {
  const fallbacks = ['Inter', 'system-ui', '-apple-system', 'sans-serif'];
  
  if (SYSTEM_FONTS.includes(fontFamily)) {
    return `"${fontFamily}", ${fallbacks.join(', ')}`;
  }
  
  return `"${fontFamily}", ${fallbacks.join(', ')}`;
}

/**
 * Hook to ensure font is loaded in a Remotion component
 */
export function useRemotionFont(fontFamily: string, options: FontLoadOptions = {}) {
  if (typeof window === 'undefined') {
    return; // Skip during SSR
  }

  const handle = delayRender();
  
  loadRemotionFont(fontFamily, options)
    .then(() => {
      continueRender(handle);
    })
    .catch((error) => {
      console.error('Font loading error:', error);
      continueRender(handle); // Continue even if font fails
    });
}

/**
 * Extract all unique fonts from text elements
 */
export function extractFontsFromTextElements(textElements: Array<{ font?: string; fontFamily?: string }>): string[] {
  const fonts = new Set<string>();
  
  textElements.forEach(element => {
    // Use fontFamily (CSS name) if available, otherwise fall back to font (postScriptName)
    const fontToUse = element.fontFamily || element.font;
    if (fontToUse && !SYSTEM_FONTS.includes(fontToUse)) {
      fonts.add(fontToUse);
    }
  });
  
  return Array.from(fonts);
}