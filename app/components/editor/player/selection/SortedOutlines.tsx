'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { SelectionOutline } from './SelectionOutline';
import { InlineTextEditor } from './InlineTextEditor';
import { setMediaFiles, setTextElements, setSelectedMediaIds, setSelectedTextIds, setActiveElement } from '@/app/store/slices/projectSlice';
import { MediaFile, TextElement } from '@/app/types';

interface SortedOutlinesProps {
  zoom: number;
}

export const SortedOutlines: React.FC<SortedOutlinesProps> = ({ zoom }) => {
  const dispatch = useAppDispatch();
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const { 
    mediaFiles, 
    textElements, 
    selectedMediaIds, 
    selectedTextIds,
    currentTime 
  } = useAppSelector((state) => state.projectState);

  // Get visible elements at current time
  const visibleMedia = useMemo(() => 
    mediaFiles.filter(m => 
      currentTime >= m.positionStart && 
      currentTime <= m.positionEnd
    ), [mediaFiles, currentTime]
  );

  const visibleText = useMemo(() =>
    textElements.filter(t => 
      currentTime >= t.positionStart && 
      currentTime <= t.positionEnd
    ), [textElements, currentTime]
  );

  // Combine and sort by row
  const allVisibleElements = useMemo(() => {
    const combined = [...visibleMedia, ...visibleText];
    return combined.sort((a, b) => (b.row || 0) - (a.row || 0)); // Higher rows render first (background)
  }, [visibleMedia, visibleText]);

  const isDragging = false; // We'll track this differently if needed

  const changeMediaElement = (id: string, updater: (element: MediaFile) => MediaFile) => {
    dispatch(setMediaFiles(
      mediaFiles.map(m => m.id === id ? updater(m) : m)
    ));
  };

  const changeTextElement = (id: string, updater: (element: TextElement) => TextElement) => {
    dispatch(setTextElements(
      textElements.map(t => t.id === id ? updater(t) : t)
    ));
  };

  const setSelectedId = (id: string | null) => {
    if (!id) {
      dispatch(setSelectedMediaIds([]));
      dispatch(setSelectedTextIds([]));
      dispatch(setActiveElement(null));
      return;
    }

    // Check if it's a media or text element
    const isMedia = visibleMedia.some(m => m.id === id);
    if (isMedia) {
      dispatch(setSelectedMediaIds([id]));
      dispatch(setSelectedTextIds([]));
      dispatch(setActiveElement('media'));
    } else {
      dispatch(setSelectedTextIds([id]));
      dispatch(setSelectedMediaIds([]));
      dispatch(setActiveElement('text'));
    }
  };

  // Handle text editing - define before useEffect
  const handleTextEdit = useCallback((textElement: TextElement) => {
    setEditingTextId(textElement.id);
  }, []);

  const handleCloseTextEditor = useCallback(() => {
    setEditingTextId(null);
  }, []);

  // Keyboard shortcuts for fine positioning and text editing
  useEffect(() => {
    const hasSelection = selectedMediaIds.length > 0 || selectedTextIds.length > 0;
    if (!hasSelection && !editingTextId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if we're editing text
      if (editingTextId) return;

      // Handle Enter key for text editing
      if (e.key === 'Enter' && selectedTextIds.length === 1) {
        e.preventDefault();
        const selectedTextElement = textElements.find(t => t.id === selectedTextIds[0]);
        if (selectedTextElement) {
          handleTextEdit(selectedTextElement);
        }
        return;
      }

      // Only handle arrow keys
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let deltaX = 0;
      let deltaY = 0;
      
      switch (e.key) {
        case 'ArrowLeft':
          deltaX = -step;
          break;
        case 'ArrowRight':
          deltaX = step;
          break;
        case 'ArrowUp':
          deltaY = -step;
          break;
        case 'ArrowDown':
          deltaY = step;
          break;
      }
      
      // Update selected media elements
      if (selectedMediaIds.length > 0) {
        dispatch(setMediaFiles(
          mediaFiles.map(m => 
            selectedMediaIds.includes(m.id) 
              ? { ...m, x: (m.x || 0) + deltaX, y: (m.y || 0) + deltaY }
              : m
          )
        ));
      }
      
      // Update selected text elements
      if (selectedTextIds.length > 0) {
        dispatch(setTextElements(
          textElements.map(t => 
            selectedTextIds.includes(t.id)
              ? { ...t, x: (t.x || 0) + deltaX, y: (t.y || 0) + deltaY }
              : t
          )
        ));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMediaIds, selectedTextIds, mediaFiles, textElements, dispatch, editingTextId, handleTextEdit]);

  // Find the text element being edited
  const editingTextElement = useMemo(
    () => textElements.find(t => t.id === editingTextId),
    [textElements, editingTextId]
  );

  return (
    <>
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999 
        }}
      >
        {allVisibleElements.map((element) => {
          const isMedia = 'type' in element;
          const isSelected = isMedia 
            ? selectedMediaIds.includes(element.id)
            : selectedTextIds.includes(element.id);
          
          // Don't show outline for text element being edited
          if (!isMedia && element.id === editingTextId) {
            return null;
          }
          
          return (
            <SelectionOutline
              key={element.id}
              element={element}
              isSelected={isSelected}
              changeElement={isMedia ? changeMediaElement : changeTextElement}
              setSelectedId={setSelectedId}
              isDragging={isDragging}
              zoom={zoom}
              onTextEdit={handleTextEdit}
            />
          );
        })}
      </div>
      
      {/* Inline Text Editor */}
      {editingTextElement && (
        <InlineTextEditor
          textElement={editingTextElement}
          zoom={zoom}
          onClose={handleCloseTextEditor}
        />
      )}
    </>
  );
};