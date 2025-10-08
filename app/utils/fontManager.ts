import { FFmpeg } from "@ffmpeg/ffmpeg";
import { getGoogleFontTTFUrl, GOOGLE_FONTS_TTF_URLS } from "./googleFontsApi";

// Google Fonts API key can be obtained from https://developers.google.com/fonts/docs/developer_api
const GOOGLE_FONTS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || '';
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

// Popular Google Fonts subset
const POPULAR_GOOGLE_FONTS = Object.keys(GOOGLE_FONTS_TTF_URLS);

// Font cache in memory
const fontCache = new Map<string, ArrayBuffer>();

// Store uploaded fonts in IndexedDB
const FONT_DB_NAME = 'clip-js-fonts';
const FONT_STORE_NAME = 'custom-fonts';

interface StoredFont {
    name: string;
    data: ArrayBuffer;
    type: 'google' | 'custom';
}

/**
 * Initialize font database
 */
async function openFontDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(FONT_DB_NAME, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(FONT_STORE_NAME)) {
                db.createObjectStore(FONT_STORE_NAME, { keyPath: 'name' });
            }
        };
    });
}

/**
 * Load Google Fonts list (returns popular fonts if no API key)
 */
export async function loadGoogleFonts(): Promise<string[]> {
    try {
        if (!GOOGLE_FONTS_API_KEY) {
            // Return popular fonts if no API key
            const systemFonts = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
            return [...systemFonts, ...POPULAR_GOOGLE_FONTS];
        }

        const response = await fetch(`${GOOGLE_FONTS_API_URL}?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`);
        if (!response.ok) throw new Error('Failed to fetch Google Fonts');
        
        const data = await response.json();
        const systemFonts = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
        const googleFonts = data.items.slice(0, 100).map((font: any) => font.family);
        
        return [...systemFonts, ...googleFonts];
    } catch (error) {
        console.error('Failed to load Google Fonts:', error);
        // Fallback to popular fonts
        const systemFonts = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
        return [...systemFonts, ...POPULAR_GOOGLE_FONTS];
    }
}

/**
 * Get all available fonts (system + custom + google)
 */
export async function getAvailableFonts(): Promise<string[]> {
    const systemFonts = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
    
    try {
        const db = await openFontDB();
        const transaction = db.transaction([FONT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(FONT_STORE_NAME);
        const request = store.getAllKeys();
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const customFonts = request.result as string[];
                resolve([...systemFonts, ...customFonts, ...POPULAR_GOOGLE_FONTS]);
            };
            request.onerror = () => resolve(systemFonts);
        });
    } catch (error) {
        return systemFonts;
    }
}

/**
 * Upload custom font file
 */
export async function uploadCustomFont(file: File): Promise<string> {
    const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
    const arrayBuffer = await file.arrayBuffer();
    
    // Store in IndexedDB
    const db = await openFontDB();
    const transaction = db.transaction([FONT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(FONT_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
        const request = store.put({
            name: fontName,
            data: arrayBuffer,
            type: 'custom'
        } as StoredFont);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
    
    // Cache in memory
    fontCache.set(fontName, arrayBuffer);
    
    return fontName;
}

/**
 * Load font data for FFmpeg
 */
export async function loadFontForFFmpeg(fontName: string, ffmpeg: FFmpeg): Promise<void> {
    // Create safe filename for FFmpeg
    const safeFontName = fontName.replace(/[^a-zA-Z0-9]/g, '');
    
    try {
        console.log(`Loading font ${fontName} as font${safeFontName}.ttf for FFmpeg`);
        
        // Check memory cache first
        if (fontCache.has(fontName)) {
            const data = fontCache.get(fontName)!;
            await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(data));
            console.log(`Loaded ${fontName} from cache`);
            return;
        }
        
        // Check IndexedDB for custom fonts
        const db = await openFontDB();
        const transaction = db.transaction([FONT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(FONT_STORE_NAME);
        
        const storedFont = await new Promise<StoredFont | null>((resolve) => {
            const request = store.get(fontName);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
        
        if (storedFont) {
            await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(storedFont.data));
            fontCache.set(fontName, storedFont.data);
            console.log(`Loaded ${fontName} from IndexedDB`);
            return;
        }
        
        // Try to load from public fonts directory
        const response = await fetch(`/fonts/${fontName}.ttf`);
        if (response.ok) {
            const data = await response.arrayBuffer();
            await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(data));
            fontCache.set(fontName, data);
            console.log(`Loaded ${fontName} from public directory`);
            return;
        }
        
        // Try to load from Google Fonts using direct TTF URLs
        const googleFontUrl = getGoogleFontTTFUrl(fontName);
        if (googleFontUrl) {
            console.log(`Trying to load ${fontName} from Google Fonts TTF URL`);
            try {
                const fontResponse = await fetch(googleFontUrl);
                if (fontResponse.ok) {
                    const data = await fontResponse.arrayBuffer();
                    await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(data));
                    fontCache.set(fontName, data);
                    console.log(`Loaded ${fontName} from Google Fonts (TTF)`);
                    return;
                }
            } catch (error) {
                console.warn(`Failed to load Google Font TTF: ${fontName}`, error);
            }
        }
        
        // Create a synthetic font using canvas as last resort
        console.warn(`Font ${fontName} not found, creating synthetic font`);
        await createSyntheticFont(safeFontName, ffmpeg);
        
    } catch (error) {
        console.error(`Failed to load font ${fontName}:`, error);
        // Create synthetic font as fallback
        await createSyntheticFont(safeFontName, ffmpeg);
    }
}

/**
 * Create a synthetic font file for fallback
 */
async function createSyntheticFont(safeFontName: string, ffmpeg: FFmpeg): Promise<void> {
    try {
        // Try to use Roboto as fallback from Google Fonts
        const robotoUrl = getGoogleFontTTFUrl('Roboto');
        if (robotoUrl) {
            const response = await fetch(robotoUrl);
            if (response.ok) {
                const data = await response.arrayBuffer();
                await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(data));
                console.log(`Using Roboto as fallback for ${safeFontName}`);
                return;
            }
        }
        
        // Try Arial from the fonts directory
        const arialResponse = await fetch('/fonts/Arial.ttf');
        if (arialResponse.ok) {
            const data = await arialResponse.arrayBuffer();
            await ffmpeg.writeFile(`font${safeFontName}.ttf`, new Uint8Array(data));
            console.log(`Using Arial as fallback for ${safeFontName}`);
            return;
        }
        
        console.error('Could not create synthetic font, text rendering may fail');
    } catch (error) {
        console.error('Failed to create synthetic font:', error);
    }
}

/**
 * Load all fonts used in text elements
 */
export async function loadAllFontsForFFmpeg(fonts: Set<string>, ffmpeg: FFmpeg): Promise<void> {
    const loadPromises = Array.from(fonts).map(font => loadFontForFFmpeg(font, ffmpeg));
    await Promise.all(loadPromises);
}

/**
 * Load font for browser rendering (Canvas API)
 */
export async function loadFontForBrowser(fontName: string): Promise<void> {
    try {
        // Check if font is already loaded
        if (document.fonts.check(`16px "${fontName}"`)) {
            return;
        }

        // Check memory cache
        if (fontCache.has(fontName)) {
            const data = fontCache.get(fontName)!;
            const fontFace = new FontFace(fontName, data);
            await fontFace.load();
            document.fonts.add(fontFace);
            return;
        }

        // Check IndexedDB for custom fonts
        const db = await openFontDB();
        const transaction = db.transaction([FONT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(FONT_STORE_NAME);
        
        const storedFont = await new Promise<StoredFont | null>((resolve) => {
            const request = store.get(fontName);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
        
        if (storedFont) {
            const fontFace = new FontFace(fontName, storedFont.data);
            await fontFace.load();
            document.fonts.add(fontFace);
            fontCache.set(fontName, storedFont.data);
            return;
        }

        // Try to load from public fonts directory
        try {
            const response = await fetch(`/fonts/${fontName}.ttf`);
            if (response.ok) {
                const data = await response.arrayBuffer();
                const fontFace = new FontFace(fontName, data);
                await fontFace.load();
                document.fonts.add(fontFace);
                fontCache.set(fontName, data);
                return;
            }
        } catch (error) {
            console.warn(`Failed to load font from public directory: ${fontName}`);
        }

        // Try to load from Google Fonts
        if (POPULAR_GOOGLE_FONTS.includes(fontName)) {
            // Add Google Fonts link to document
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            
            // Wait for font to load
            await document.fonts.load(`16px "${fontName}"`);
            return;
        }

        console.warn(`Font ${fontName} not available for browser rendering`);
    } catch (error) {
        console.error(`Failed to load font for browser: ${fontName}`, error);
    }
}

/**
 * Load all fonts for browser rendering
 */
export async function loadAllFontsForBrowser(fonts: Set<string>): Promise<void> {
    const loadPromises = Array.from(fonts).map(font => loadFontForBrowser(font));
    await Promise.all(loadPromises);
}