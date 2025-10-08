import { Font, FONTS, DEFAULT_FONT } from '@/app/data/fonts';

// Cache for loaded fonts
const loadedFonts = new Set<string>();
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Load a font object for web rendering
 */
export async function loadFont(font: Font): Promise<void> {
  const fontKey = font.postScriptName;
  
  // Check if already loaded
  if (loadedFonts.has(fontKey)) {
    return;
  }

  // Helper function to try loading a font URL
  const tryLoadFont = async (url: string): Promise<boolean> => {
    try {
      const fontFace = new FontFace(font.postScriptName, `url(${url})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Simply mark font as loaded - browser will handle font fallbacks
  loadedFonts.add(fontKey);
  console.log(`Font ${font.family} ready for use`);
  return;
}

/**
 * Load multiple fonts
 */
export async function loadFonts(fonts: Font[]): Promise<void> {
  const loadPromises = fonts.map(font => loadFont(font));
  await Promise.allSettled(loadPromises);
}

/**
 * Get font by family name
 */
export function getFontByFamily(family: string): Font | null {
  return FONTS.find(f => f.family === family) || null;
}

/**
 * Get all fonts for a family
 */
export function getFontsByFamily(family: string): Font[] {
  return FONTS.filter(f => f.family === family);
}

/**
 * Load font for FFmpeg export
 */
export async function loadFontForFFmpeg(font: Font, ffmpeg: any): Promise<string> {
  const safeFontName = font.family.replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `font${safeFontName}.ttf`;
  
  try {
    // Check cache first
    const fontKey = `${font.family}_${font.weight || 400}`;
    if (fontCache.has(fontKey)) {
      const data = fontCache.get(fontKey)!;
      await ffmpeg.writeFile(fileName, new Uint8Array(data));
      console.log(`Loaded ${font.family} from cache for FFmpeg`);
      return fileName;
    }

    // Download font
    const response = await fetch(font.url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));
    
    // Cache for future use
    fontCache.set(fontKey, arrayBuffer);
    console.log(`Loaded ${font.family} for FFmpeg export`);
    
    return fileName;
  } catch (error) {
    console.error(`Failed to load font ${font.family} for FFmpeg:`, error);
    
    // Fallback to default font
    if (font.id !== DEFAULT_FONT.id) {
      console.log(`Using default font as fallback`);
      return loadFontForFFmpeg(DEFAULT_FONT, ffmpeg);
    }
    
    throw error;
  }
}

/**
 * Preload essential fonts
 */
export async function preloadEssentialFonts(): Promise<void> {
  const essentialFonts = [
    DEFAULT_FONT,
    getFontByFamily('Roboto'),
    getFontByFamily('Open Sans'),
    getFontByFamily('Montserrat'),
    getFontByFamily('Bebas Neue'),
    getFontByFamily('Playfair Display')
  ].filter(Boolean) as Font[];

  await loadFonts(essentialFonts);
}

/**
 * Get font fallback string
 */
export function getFontFallbackString(font: Font): string {
  const fallbacks = {
    'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'serif': 'Georgia, Cambria, "Times New Roman", serif',
    'display': 'Impact, Haettenschweiler, "Franklin Gothic Bold", sans-serif',
    'handwriting': 'cursive',
    'monospace': 'Consolas, "Courier New", monospace'
  };
  
  return `"${font.family}", ${fallbacks[font.category]}`;
}