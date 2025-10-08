import React, { useState } from 'react';
import { ChevronDown, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setTextElements } from '@/app/store/slices/projectSlice';
import { TextElement } from '@/app/types';
import { FloatingFontPicker } from './FloatingFontPicker';
import { AnimationShowcase } from '../AnimationShowcase';
import { FONTS, FONT_FAMILIES, getDefaultFontForFamily } from '@/app/data/fonts';

interface TextPropertiesRedesignedProps {
  selectedText: TextElement;
}

const TextPropertiesRedesigned: React.FC<TextPropertiesRedesignedProps> = ({ selectedText }) => {
  const dispatch = useAppDispatch();
  const { textElements } = useAppSelector((state) => state.projectState);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showAnimationShowcase, setShowAnimationShowcase] = useState(false);

  const updateTextProperty = (property: keyof TextElement, value: any) => {
    const updatedElements = textElements.map(text =>
      text.id === selectedText.id
        ? { ...text, [property]: value }
        : text
    );
    dispatch(setTextElements(updatedElements));
  };

  const updateTextStyle = (updates: Partial<TextElement>) => {
    const updatedElements = textElements.map(text =>
      text.id === selectedText.id
        ? { ...text, ...updates }
        : text
    );
    dispatch(setTextElements(updatedElements));
  };

  // Get the font family name from the postScriptName
  const getFontFamilyFromPostScript = (postScriptName: string) => {
    const font = FONTS.find(f => f.postScriptName === postScriptName);
    return font?.family || postScriptName;
  };
  
  const displayFontFamily = selectedText.fontFamily || getFontFamilyFromPostScript(selectedText.font || 'Roboto-Bold');
  
  // Comprehensive font weight options with italic variations
  const availableWeights = [
    { value: 100, label: 'Thin', italic: false },
    { value: 100, label: 'Thin Italic', italic: true },
    { value: 300, label: 'Light', italic: false },
    { value: 300, label: 'Light Italic', italic: true },
    { value: 400, label: 'Regular', italic: false },
    { value: 400, label: 'Italic', italic: true },
    { value: 500, label: 'Medium', italic: false },
    { value: 500, label: 'Medium Italic', italic: true },
    { value: 700, label: 'Bold', italic: false },
    { value: 700, label: 'Bold Italic', italic: true },
    { value: 900, label: 'Black', italic: false },
    { value: 900, label: 'Black Italic', italic: true }
  ];

  // Get current weight and italic status
  const getCurrentWeightKey = () => {
    const weight = selectedText.fontWeight || 400;
    const isItalic = selectedText.italic || false;
    return `${weight}-${isItalic}`;
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Styles</h3>

      {/* Font Selection */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Font</label>
        <button
          onClick={() => setShowFontPicker(true)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm">{displayFontFamily}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Weight & Style Selection */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Weight & Style</label>
        <select
          value={getCurrentWeightKey()}
          onChange={(e) => {
            const selectedOption = availableWeights.find(w => `${w.value}-${w.italic}` === e.target.value);
            if (selectedOption) {
              updateTextStyle({
                fontWeight: selectedOption.value,
                italic: selectedOption.italic
              });
            }
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px'
          }}
        >
          {availableWeights.map(weight => (
            <option key={`${weight.value}-${weight.italic}`} value={`${weight.value}-${weight.italic}`}>
              {weight.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Size</label>
        <input
          type="number"
          value={selectedText.fontSize || 32}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty input for better UX when replacing values
            if (value === '') {
              updateTextProperty('fontSize', 32); // Default fallback
            } else {
              const numValue = parseInt(value);
              if (!isNaN(numValue) && numValue >= 8 && numValue <= 200) {
                updateTextProperty('fontSize', numValue);
              }
            }
          }}
          onFocus={(e) => e.target.select()} // Select all text on focus for easy replacement
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="8"
          max="200"
          step="1"
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Color</label>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: selectedText.color || '#ffffff' }}
          >
            <input
              type="color"
              value={selectedText.color || '#ffffff'}
              onChange={(e) => updateTextProperty('color', e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={selectedText.color || '#ffffff'}
            onChange={(e) => updateTextProperty('color', e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fill (Background) */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Fill</label>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: selectedText.backgroundColor || 'transparent' }}
          >
            <input
              type="color"
              value={selectedText.backgroundColor === 'transparent' ? '#000000' : selectedText.backgroundColor || '#000000'}
              onChange={(e) => updateTextProperty('backgroundColor', e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={selectedText.backgroundColor || 'transparent'}
            onChange={(e) => updateTextProperty('backgroundColor', e.target.value)}
            placeholder="transparent"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Align */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Align</label>
        <select
          value={selectedText.align || 'center'}
          onChange={(e) => updateTextProperty('align', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px'
          }}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Additional Formatting */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Additional Formatting</label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Quick bold toggle - sets to 700 weight if not already bold, or back to 400
              const currentWeight = selectedText.fontWeight || 400;
              const newWeight = currentWeight >= 700 ? 400 : 700;
              updateTextProperty('fontWeight', newWeight);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              (selectedText.fontWeight || 400) >= 700
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Quick Bold Toggle"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => updateTextProperty('italic', !selectedText.italic)}
            className={`p-2 rounded-lg border transition-colors ${
              selectedText.italic
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Italic Toggle"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => updateTextProperty('underline', !selectedText.underline)}
            className={`p-2 rounded-lg border transition-colors ${
              selectedText.underline
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Underline Toggle"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Tip: Use the Weight & Style dropdown above for more precise control
        </p>
      </div>

      {/* Case */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Case</label>
        <select
          value={selectedText.textTransform || 'none'}
          onChange={(e) => updateTextProperty('textTransform', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px'
          }}
        >
          <option value="none">None</option>
          <option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Opacity</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={selectedText.opacity || 100}
            onChange={(e) => updateTextProperty('opacity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-white w-10 text-right">{selectedText.opacity || 100}</span>
        </div>
      </div>

      {/* Background Shape */}
      {selectedText.backgroundColor && selectedText.backgroundColor !== 'transparent' && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Background Shape</label>
          <select
            value={selectedText.backgroundShape || 'rectangle'}
            onChange={(e) => {
              console.log(`🎨 Changing background shape from "${selectedText.backgroundShape || 'rectangle'}" to "${e.target.value}"`);
              updateTextProperty('backgroundShape', e.target.value);
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px'
            }}
          >
            <option value="rectangle">Rectangle</option>
            <option value="rounded">Rounded</option>
            <option value="pill">Pill</option>
            <option value="bubble">Bubble</option>
            <option value="marker">Marker</option>
            <option value="underline">Underline</option>
            <option value="speech">Speech Bubble</option>
          </select>
        </div>
      )}

      {/* Font Stroke */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider">Font stroke</h4>
        
        {/* Stroke Color */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: selectedText.strokeColor || '#000000' }}
            >
              <input
                type="color"
                value={selectedText.strokeColor || '#000000'}
                onChange={(e) => updateTextProperty('strokeColor', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={selectedText.strokeColor || '#000000'}
              onChange={(e) => updateTextProperty('strokeColor', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stroke Size */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Size</label>
          <input
            type="number"
            value={selectedText.strokeWidth || 0}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateTextProperty('strokeWidth', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
                  updateTextProperty('strokeWidth', numValue);
                }
              }
            }}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="10"
            step="1"
          />
        </div>
      </div>

      {/* Font Shadow */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider">Font shadow</h4>
        
        {/* Shadow Color */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: selectedText.shadowColor || '#000000' }}
            >
              <input
                type="color"
                value={selectedText.shadowColor || '#000000'}
                onChange={(e) => updateTextProperty('shadowColor', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={selectedText.shadowColor || '#000000'}
              onChange={(e) => updateTextProperty('shadowColor', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Shadow X */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">X</label>
          <input
            type="number"
            value={selectedText.shadowX || 0}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateTextProperty('shadowX', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= -20 && numValue <= 20) {
                  updateTextProperty('shadowX', numValue);
                }
              }
            }}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="-20"
            max="20"
            step="1"
          />
        </div>

        {/* Shadow Y */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Y</label>
          <input
            type="number"
            value={selectedText.shadowY || 0}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateTextProperty('shadowY', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= -20 && numValue <= 20) {
                  updateTextProperty('shadowY', numValue);
                }
              }
            }}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="-20"
            max="20"
            step="1"
          />
        </div>

        {/* Shadow Blur */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Blur</label>
          <input
            type="number"
            value={selectedText.shadowBlur || 0}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateTextProperty('shadowBlur', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
                  updateTextProperty('shadowBlur', numValue);
                }
              }
            }}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="20"
            step="1"
          />
        </div>
      </div>

      {/* Animation Controls */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider">Animations</h4>
        
        {/* Animation In */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Enter Animation</label>
          <div className="flex gap-2">
            <select
              value={selectedText.animationIn || 'none'}
              onChange={(e) => updateTextProperty('animationIn', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px'
              }}
            >
              <option value="none">None</option>
              <option value="fade">Fade In</option>
              <option value="slide-left">Slide from Left</option>
              <option value="slide-right">Slide from Right</option>
              <option value="slide-up">Slide from Bottom</option>
              <option value="slide-down">Slide from Top</option>
              <option value="zoom-in">Zoom In</option>
              <option value="zoom-out">Zoom Out</option>
              <option value="bounce">Bounce In</option>
              <option value="flip">Flip In</option>
              <option value="rotate">Rotate In</option>
            </select>
            <input
              type="number"
              value={selectedText.animationInDuration || 0.5}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  updateTextProperty('animationInDuration', 0.5);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 5) {
                    updateTextProperty('animationInDuration', numValue);
                  }
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-20 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.1"
              max="5"
              step="0.1"
              title="Duration (seconds)"
            />
          </div>
        </div>

        {/* Animation Out */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Exit Animation</label>
          <div className="flex gap-2">
            <select
              value={selectedText.animationOut || 'none'}
              onChange={(e) => updateTextProperty('animationOut', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px'
              }}
            >
              <option value="none">None</option>
              <option value="fade">Fade Out</option>
              <option value="slide-left">Slide to Left</option>
              <option value="slide-right">Slide to Right</option>
              <option value="slide-up">Slide to Top</option>
              <option value="slide-down">Slide to Bottom</option>
              <option value="zoom-in">Zoom Out</option>
              <option value="zoom-out">Zoom In</option>
              <option value="bounce">Bounce Out</option>
              <option value="flip">Flip Out</option>
              <option value="rotate">Rotate Out</option>
            </select>
            <input
              type="number"
              value={selectedText.animationOutDuration || 0.5}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  updateTextProperty('animationOutDuration', 0.5);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 5) {
                    updateTextProperty('animationOutDuration', numValue);
                  }
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-20 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.1"
              max="5"
              step="0.1"
              title="Duration (seconds)"
            />
          </div>
        </div>

        {/* Loop Animation */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Loop Animation</label>
          <div className="flex gap-2">
            <select
              value={selectedText.animationLoop || 'none'}
              onChange={(e) => updateTextProperty('animationLoop', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px'
              }}
            >
              <option value="none">None</option>
              <option value="pulse">Pulse</option>
              <option value="wiggle">Wiggle</option>
              <option value="float">Float</option>
              <option value="spin">Spin</option>
              <option value="blink">Blink</option>
              <option value="shake">Shake</option>
            </select>
            <input
              type="number"
              value={selectedText.animationLoopSpeed || 1}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  updateTextProperty('animationLoopSpeed', 1);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 5) {
                    updateTextProperty('animationLoopSpeed', numValue);
                  }
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-20 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.1"
              max="5"
              step="0.1"
              title="Speed multiplier"
            />
          </div>
          <p className="text-xs text-gray-500">
            Loop animations play continuously while the text is visible
          </p>
        </div>

        {/* Animation Preview Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Trigger animation preview by updating a timestamp
              updateTextProperty('lastAnimationPreview' as any, Date.now());
            }}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Preview Animations
          </button>
          <button
            onClick={() => setShowAnimationShowcase(true)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            title="Show animation examples"
          >
            <Sparkles className="w-4 h-4" />
            <span>Examples</span>
          </button>
        </div>
      </div>

      {/* Font Picker Modal */}
      {showFontPicker && (
        <FloatingFontPicker
          onClose={() => setShowFontPicker(false)}
          selectedTextId={selectedText.id}
        />
      )}
      
      {/* Animation Showcase Modal */}
      {showAnimationShowcase && (
        <AnimationShowcase
          onClose={() => setShowAnimationShowcase(false)}
        />
      )}
    </div>
  );
};

export default TextPropertiesRedesigned;