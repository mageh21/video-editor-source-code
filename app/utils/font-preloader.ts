import { FONTS, FONT_FAMILIES } from '@/app/data/fonts';
import { loadFont } from './enhanced-font-loader';

// Popular fonts to preload for better performance
const PRELOAD_FONTS = [
  'Roboto',
  'Inter',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Poppins',
  'Raleway',
  'Nunito',
  'Bebas Neue',
  'Playfair Display',
  'Bangers',
  'Pacifico',
  'Dancing Script'
];

// Font loading queue to prevent overwhelming the browser
class FontLoadingQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private concurrentLoads = 3;

  async add(loadFn: () => Promise<void>) {
    this.queue.push(loadFn);
    if (!this.isProcessing) {
      this.process();
    }
  }

  private async process() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrentLoads);
      await Promise.allSettled(batch.map(fn => fn()));
    }

    this.isProcessing = false;
  }
}

const fontQueue = new FontLoadingQueue();

/**
 * Preload essential fonts on app startup
 */
export async function preloadEssentialFonts() {
  // console.log('Starting font preload...');
  
  const fontsToPreload = PRELOAD_FONTS.map(family => {
    const familyFonts = FONT_FAMILIES[family];
    if (familyFonts && familyFonts.length > 0) {
      // Load the regular weight by default
      return familyFonts.find(f => f.weight === 400 || f.style.includes('Regular')) || familyFonts[0];
    }
    return null;
  }).filter(Boolean);

  // Load fonts in batches to avoid overwhelming the browser
  const loadPromises = fontsToPreload.map(font => 
    () => loadFont(font!)
  );

  for (const loadFn of loadPromises) {
    await fontQueue.add(loadFn);
  }

  // console.log(`Preloaded ${fontsToPreload.length} essential fonts`);
}

/**
 * Load font on demand with queuing
 */
export async function loadFontOnDemand(fontFamily: string) {
  const fonts = FONT_FAMILIES[fontFamily];
  if (!fonts || fonts.length === 0) {
    // Font not in our data, that's ok - browser will use system fonts
    // console.log(`Font ${fontFamily} not in font data, will use system fallback`);
    return;
  }

  // Load the default font for the family
  const defaultFont = fonts.find(f => f.weight === 400 || f.style.includes('Regular')) || fonts[0];
  
  await fontQueue.add(() => loadFont(defaultFont));
}

/**
 * Get all loaded fonts
 */
export function getLoadedFonts(): string[] {
  const loaded: string[] = [];
  
  document.fonts.forEach((fontFace) => {
    if (fontFace.status === 'loaded') {
      loaded.push(fontFace.family);
    }
  });

  return [...new Set(loaded)];
}

/**
 * Check if a font is loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  // Check by postScriptName
  const font = FONTS.find(f => f.postScriptName === fontFamily || f.family === fontFamily);
  if (!font) return false;

  let isLoaded = false;
  document.fonts.forEach((fontFace) => {
    if (fontFace.family === font.postScriptName && fontFace.status === 'loaded') {
      isLoaded = true;
    }
  });

  return isLoaded;
}