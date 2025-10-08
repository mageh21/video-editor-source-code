import React, { useState, useEffect, useRef } from 'react';
import { Type, Search, ChevronDown } from 'lucide-react';
import { FONTS, FONT_FAMILIES, FONT_CATEGORIES, Font, getDefaultFontForFamily } from '@/app/data/fonts';
import { loadFont } from '@/app/utils/enhanced-font-loader';

interface FontPickerProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({ selectedFont, onFontChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter fonts based on search and category
  const filteredFonts = FONTS.filter(font => {
    const matchesSearch = font.family.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || font.category === category;
    return matchesSearch && matchesCategory;
  });

  // Group filtered fonts by family
  const groupedFonts = filteredFonts.reduce((acc, font) => {
    if (!acc[font.family]) {
      acc[font.family] = [];
    }
    acc[font.family].push(font);
    return acc;
  }, {} as Record<string, Font[]>);

  // Handle font selection
  const handleFontSelect = async (font: Font) => {
    setLoadingFonts(prev => new Set(prev).add(font.id));
    
    try {
      // Load the font for browser rendering
      await loadFont(font);
      
      // Update the selected font
      onFontChange(font.family);
      setIsOpen(false);
      setSearch('');
    } catch (error) {
      console.error('Failed to load font:', error);
    } finally {
      setLoadingFonts(prev => {
        const newSet = new Set(prev);
        newSet.delete(font.id);
        return newSet;
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Font Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-left flex items-center justify-between hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-gray-400" />
          <span style={{ fontFamily: selectedFont }}>{selectedFont}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fonts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="flex gap-2">
              {FONT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    category === cat.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedFonts).map(([family, fonts]) => (
              <div key={family} className="border-b border-gray-700 last:border-b-0">
                {/* Font Family Header */}
                <div className="px-3 py-2 bg-gray-750 sticky top-0 z-10">
                  <h4 className="text-sm font-medium text-gray-300">{family}</h4>
                </div>
                
                {/* Font Variants */}
                <div className="py-1">
                  {fonts.map(font => (
                    <button
                      key={font.id}
                      onClick={() => handleFontSelect(font)}
                      disabled={loadingFonts.has(font.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="text-2xl"
                          style={{ fontFamily: font.family }}
                        >
                          Aa
                        </span>
                        <div>
                          <div 
                            className="text-sm text-white"
                            style={{ fontFamily: font.family }}
                          >
                            {font.fullName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {font.category} • {font.weight || 400}
                          </div>
                        </div>
                      </div>
                      
                      {selectedFont === font.family && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      
                      {loadingFonts.has(font.id) && (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedFonts).length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No fonts found</p>
              </div>
            )}
          </div>

          {/* Quick Access */}
          <div className="p-3 border-t border-gray-700 bg-gray-750">
            <div className="text-xs text-gray-400 mb-2">Popular Fonts</div>
            <div className="flex flex-wrap gap-2">
              {['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Bebas Neue'].map(fontName => {
                const font = getDefaultFontForFamily(fontName);
                return font ? (
                  <button
                    key={fontName}
                    onClick={() => handleFontSelect(font)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-white transition-colors"
                    style={{ fontFamily: fontName }}
                  >
                    {fontName}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};