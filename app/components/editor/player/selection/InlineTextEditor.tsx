'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setTextElements } from '@/app/store/slices/projectSlice';
import { TextElement } from '@/app/types';
import { getFontFamilyWithFallbacks } from '@/app/utils/remotion-font-loader';

interface InlineTextEditorProps {
  textElement: TextElement;
  zoom: number;
  onClose: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  textElement,
  zoom,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { textElements, resolution } = useAppSelector((state) => state.projectState);
  const [editingText, setEditingText] = useState(textElement.text);
  const [originalText] = useState(textElement.text); // Store original text for cancel
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate position and size
  const x = textElement.x || 0;
  const y = textElement.y || 0;
  const width = textElement.width || 400;
  const fontSize = textElement.fontSize || 32;
  const fontFamily = getFontFamilyWithFallbacks(textElement.fontFamily || textElement.font || 'Inter');
  
  // Adjust for text baseline and padding
  const paddingX = textElement.backgroundColor !== 'transparent' ? 20 : 0;
  const paddingY = textElement.backgroundColor !== 'transparent' ? 12 : 0;

  // Style for the textarea
  const textareaStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x + paddingX}px`,
    top: `${y + paddingY}px`,
    width: `${width - paddingX * 2}px`,
    minHeight: `${fontSize * 1.4}px`,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: textElement.fontWeight || 400,
    fontStyle: textElement.italic ? 'italic' : 'normal',
    textDecoration: textElement.underline ? 'underline' : 'none',
    textTransform: (textElement.textTransform || 'none') as any,
    color: textElement.color || '#FFFFFF',
    backgroundColor: 'transparent',
    textAlign: textElement.align || 'left',
    lineHeight: 1.4,
    padding: 0,
    margin: 0,
    border: '2px solid #3B82F6',
    borderRadius: '4px',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    transform: textElement.rotation ? `rotate(${textElement.rotation}deg)` : undefined,
    transformOrigin: 'top left',
    zIndex: 10000,
  };

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
    // Focus and select all text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [adjustTextareaHeight]);

  // Update text in real-time as user types
  const updateTextInStore = useCallback((newText: string) => {
    const updatedTextElements = textElements.map((t) =>
      t.id === textElement.id ? { ...t, text: newText } : t
    );
    dispatch(setTextElements(updatedTextElements));
  }, [textElement.id, textElements, dispatch]);

  const handleSave = useCallback(() => {
    // Just close the editor, text is already updated
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Restore original text before closing
        updateTextInStore(originalText);
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, onClose, originalText, updateTextInStore]
  );

  const handleBlur = useCallback(() => {
    // Save on blur (when clicking outside)
    handleSave();
  }, [handleSave]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <textarea
        ref={textareaRef}
        value={editingText}
        onChange={(e) => {
          const newText = e.target.value;
          setEditingText(newText);
          updateTextInStore(newText); // Update Redux store in real-time
          adjustTextareaHeight();
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          ...textareaStyle,
          pointerEvents: 'all',
        }}
        placeholder="Enter text..."
      />
      
      {/* Helper text */}
      <div
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y + (textElement.height || fontSize * 1.4) + 10}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 10001,
          pointerEvents: 'none',
        }}
      >
        Press Ctrl+Enter to save • Esc to cancel
      </div>
    </div>
  );
};