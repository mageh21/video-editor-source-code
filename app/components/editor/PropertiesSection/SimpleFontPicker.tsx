import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { FONTS, FONT_FAMILIES, Font, getDefaultFontForFamily } from '@/app/data/fonts';
import { loadFont } from '@/app/utils/enhanced-font-loader';

interface SimpleFontPickerProps {
  onClose: () => void;
  onSelectFont: (font: string) => void;
  currentFont?: string;
}

export const SimpleFontPicker: React.FC<SimpleFontPickerProps> = ({ onClose, onSelectFont, currentFont }) => {
  const [search, setSearch] = useState('');
  const [selectedFont, setSelectedFont] = useState<string | null>(currentFont || null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Get unique font families
  const fontFamilies = Object.keys(FONT_FAMILIES).sort();
  
  // Filter fonts based on search
  const filteredFonts = fontFamilies.filter(family => 
    family.toLowerCase().includes(search.toLowerCase())
  );

  const handleFontSelect = async (family: string) => {
    setSelectedFont(family);
    
    // Load the font
    const font = getDefaultFontForFamily(family);
    if (font) {
      try {
        await loadFont(font);
      } catch (error) {
        console.error('Failed to load font:', error);
      }
    }
    
    // Pass the selected font to parent
    onSelectFont(family);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-[400px] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Fonts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search font..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Font List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFonts.map((family) => {
            const font = getDefaultFontForFamily(family);
            return (
              <button
                key={family}
                onClick={() => handleFontSelect(family)}
                className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center justify-between group"
              >
                <span 
                  className="text-white text-base"
                  style={{ 
                    fontFamily: family,
                    fontSize: '16px',
                    lineHeight: '20px'
                  }}
                >
                  {family}
                </span>
                {currentFont === family && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            );
          })}
          
          {filteredFonts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No fonts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};