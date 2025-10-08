import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Check, GripHorizontal, Loader2 } from 'lucide-react';
import { FONTS, FONT_FAMILIES, Font, getDefaultFontForFamily } from '@/app/data/fonts';
import { loadFont } from '@/app/utils/enhanced-font-loader';
import { loadFontOnDemand, isFontLoaded } from '@/app/utils/font-preloader';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setTextElements } from '@/app/store/slices/projectSlice';
import { getAvailableFonts } from '@remotion/google-fonts';

interface FloatingFontPickerProps {
  onClose: () => void;
  selectedTextId: string;
}

export const FloatingFontPicker: React.FC<FloatingFontPickerProps> = ({ onClose, selectedTextId }) => {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [loadingFont, setLoadingFont] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const dispatch = useAppDispatch();
  const { textElements } = useAppSelector((state) => state.projectState);
  const selectedText = textElements.find(t => t.id === selectedTextId);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  
  // Get current font family - either from fontFamily or by looking up the postScriptName
  const getCurrentFontFamily = () => {
    if (selectedText?.fontFamily) return selectedText.fontFamily;
    if (selectedText?.font) {
      const font = FONTS.find(f => f.postScriptName === selectedText.font);
      return font?.family || 'Roboto';
    }
    return 'Roboto';
  };
  
  const currentFontFamily = getCurrentFontFamily();

  // Get available Remotion Google Fonts  
  const [remotionFonts, setRemotionFonts] = useState<string[]>([]);
  const [remotionFontObjects, setRemotionFontObjects] = useState<any[]>([]);
  
  // Load available Remotion fonts on mount
  useEffect(() => {
    const loadRemotionFonts = async () => {
      try {
        const availableFonts = getAvailableFonts();
        // Store the full font objects for later use
        const validFontObjects = availableFonts.filter(font => font && typeof font === 'object' && font.fontFamily);
        setRemotionFontObjects(validFontObjects);
        
        // Extract fontFamily for display
        const validFonts = validFontObjects
          .map(font => font.fontFamily)
          .filter((fontFamily): fontFamily is string => typeof fontFamily === 'string' && fontFamily.length > 0)
          .sort();
        setRemotionFonts(validFonts);
        // console.log(`📚 Loaded ${validFonts.length} Remotion Google Fonts`);
      } catch (error) {
        console.error('Failed to load Remotion fonts:', error);
        // Fallback to our font data
        setRemotionFonts(Object.keys(FONT_FAMILIES).sort());
        setRemotionFontObjects([]);
      }
    };
    
    loadRemotionFonts();
  }, []);

  // Use Remotion fonts if available, otherwise fallback to our font data
  const fontFamilies = remotionFonts.length > 0 ? remotionFonts : Object.keys(FONT_FAMILIES).sort();

  // Cache for loaded Remotion fonts
  const [loadedRemotionFonts, setLoadedRemotionFonts] = useState<Set<string>>(new Set());

  // Load Google Fonts via CSS (using Remotion's font list for compatibility)
  const loadFontViaRemotion = async (fontFamily: string) => {
    if (loadedRemotionFonts.has(fontFamily)) {
      // console.log(`✅ Font ${fontFamily} already loaded`);
      return;
    }

    try {
      // console.log(`🔄 Loading font via CSS: ${fontFamily}`);
      
      // Create Google Fonts CSS URL
      const encodedFamily = fontFamily.replace(/\s+/g, '+');
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;
      
      // Check if link already exists
      const existingLink = document.querySelector(`link[href*="${encodedFamily}"]`);
      if (existingLink) {
        setLoadedRemotionFonts(prev => new Set(Array.from(prev).concat(fontFamily)));
        // console.log(`✅ Font "${fontFamily}" already loaded via CSS`);
        return true;
      }
      
      // Create and append CSS link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
      
      // Wait for font to load
      await new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
        setTimeout(reject, 5000); // 5 second timeout
      });
      
      setLoadedRemotionFonts(prev => new Set(Array.from(prev).concat(fontFamily)));
      // console.log(`✅ Font "${fontFamily}" loaded successfully via CSS`);
      return true;
    } catch (error) {
      console.warn(`⚠️  Font loading timeout for "${fontFamily}", using fallback`);
      // Still mark as loaded to prevent repeated attempts
      setLoadedRemotionFonts(prev => new Set(Array.from(prev).concat(fontFamily)));
      return false;
    }
  };

  // Preload visible fonts
  const preloadFont = useCallback(async (family: string) => {
    if (loadedFonts.has(family) || loadingFont === family) return;
    
    try {
      if (!isFontLoaded(family)) {
        await loadFontOnDemand(family);
      }
      setLoadedFonts(prev => new Set(Array.from(prev).concat(family)));
    } catch (error) {
      console.warn(`Failed to preload font ${family}:`, error);
    }
  }, [loadedFonts, loadingFont]);

  // Filter fonts based on search with type safety
  const filteredFonts = fontFamilies.filter(family => 
    typeof family === 'string' && family.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-focus search on mount 
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Removed intersection observer to prevent timeout issues
  // Fonts will load on-demand when selected

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Group fonts by category
  const groupedFonts = filteredFonts.reduce((acc, family) => {
    const font = getDefaultFontForFamily(family);
    if (font) {
      const category = font.category || 'sans-serif';
      if (!acc[category]) acc[category] = [];
      acc[category].push(family);
    }
    return acc;
  }, {} as Record<string, string[]>);
  
  const categoryOrder = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'];
  const categoryLabels = {
    'sans-serif': 'Sans Serif',
    'serif': 'Serif',
    'display': 'Display',
    'handwriting': 'Handwriting',
    'monospace': 'Monospace'
  };

  const handleFontSelect = async (family: string) => {
    setLoadingFont(family);
    
    try {
      console.log(`🎨 Applying font: ${family}`);
      
      // Update the selected text element immediately with just the fontFamily
      // The sequence-item.tsx already handles fontFamily properly
      const updatedElements = textElements.map(text =>
        text.id === selectedTextId
          ? { ...text, fontFamily: family }
          : text
      );
      
      dispatch(setTextElements(updatedElements));
      console.log(`✅ Updated text element with fontFamily: ${family}`);
      
      // Mark font as loaded for UI purposes
      setLoadedFonts(prev => new Set(Array.from(prev).concat(family)));
      
      // Load font via Remotion (non-blocking)
      loadFontViaRemotion(family).catch(error => {
        console.warn(`Font loading failed but continuing: ${error.message}`);
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to apply font:', error);
    } finally {
      setLoadingFont(null);
    }
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        setPosition({
          x: dragRef.current.initialX + deltaX,
          y: dragRef.current.initialY + deltaY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className="fixed bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-80 z-[100]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 drag-handle cursor-grab">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-white">Fonts</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search font..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Font List */}
      <div className="max-h-[500px] overflow-y-auto">
        {categoryOrder.map(category => {
          const fontsInCategory = groupedFonts[category];
          if (!fontsInCategory || fontsInCategory.length === 0) return null;
          
          return (
            <div key={category}>
              <div className="px-3 py-1.5 bg-gray-800 sticky top-0 z-10">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
              </div>
              
              {fontsInCategory.map((family) => {
                const isSelected = currentFontFamily === family;
                const isLoaded = loadedFonts.has(family);
                const font = getDefaultFontForFamily(family);
                
                return (
                  <button
                    key={family}
                    data-font-family={family}
                    onClick={() => handleFontSelect(family)}
                    onMouseEnter={() => {
                      // Preload font on hover for instant preview
                      loadFontViaRemotion(family).catch(() => {});
                    }}
                    disabled={loadingFont === family}
                    className={`w-full px-3 py-3 text-left transition-colors flex items-center justify-between group ${
                      isSelected ? 'bg-gray-800' : 'hover:bg-gray-800'
                    } ${loadingFont === family ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                      {/* Font family name */}
                      <div className="text-xs text-gray-400 truncate mb-1 flex items-center">
                        {family}
                        {loadedRemotionFonts.has(family) && (
                          <div className="ml-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {/* Font preview text */}
                      <div 
                        className="text-white truncate"
                        style={{
                          fontFamily: `"${family}", "Inter", system-ui, -apple-system, sans-serif`,
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: 1.2,
                          transition: 'font-family 0.3s ease'
                        }}
                      >
                        The quick brown fox
                      </div>
                    </div>
                    {loadingFont === family && (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 ml-2 animate-spin" />
                    )}
                    {isSelected && loadingFont !== family && (
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        
        {filteredFonts.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No fonts found</p>
          </div>
        )}
      </div>

      {/* Font count */}
      <div className="p-2 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-500">
          {filteredFonts.length} of {fontFamilies.length} fonts
        </p>
      </div>
    </div>
  );
};