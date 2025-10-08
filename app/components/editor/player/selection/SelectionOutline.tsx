'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { ResizeHandle } from './ResizeHandle';
import { RotateHandle } from './RotateHandle';
import { MediaFile, TextElement } from '@/app/types';
import { setActiveElement } from '@/app/store/slices/projectSlice';

type Element = MediaFile | TextElement;

interface SelectionOutlineProps {
  element: Element;
  isSelected: boolean;
  changeElement: (id: string, updater: (element: Element) => Element) => void;
  setSelectedId: (id: string | null) => void;
  isDragging: boolean;
  zoom: number;
  onTextEdit?: (textElement: TextElement) => void;
}

export const SelectionOutline: React.FC<SelectionOutlineProps> = ({
  element,
  isSelected,
  changeElement,
  setSelectedId,
  isDragging,
  zoom,
  onTextEdit,
}) => {
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);
  const scaledBorder = Math.ceil(2 / zoom);

  const onMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const style: React.CSSProperties = useMemo(() => {
    // Calculate z-index based on row
    const baseZIndex = 1000 - (element.row || 0) * 10;
    const selectionBoost = isSelected ? 1000 : 0;
    const zIndex = baseZIndex + selectionBoost;

    // For text elements, we need to ensure we have proper dimensions
    const isText = !('type' in element);
    const width = element.width || (isText ? 200 : 100);
    const height = element.height || (isText ? 50 : 100);

    return {
      width,
      height,
      left: element.x || 0,
      top: element.y || 0,
      position: 'absolute',
      outline:
        (hovered && !isDragging) || isSelected
          ? `${scaledBorder}px solid #3B82F6`
          : undefined,
      outlineOffset: '-1px',
      transform: `rotate(${element.rotation || 0}deg)`,
      transformOrigin: 'center center',
      userSelect: 'none',
      touchAction: 'none',
      zIndex,
      pointerEvents: 'all',
      cursor: isText ? 'text' : 'move',
    };
  }, [element, hovered, isDragging, isSelected, scaledBorder]);

  const startDragging = useCallback(
    (e: PointerEvent | React.MouseEvent) => {
      const initialX = e.clientX;
      const initialY = e.clientY;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / zoom;
        const offsetY = (pointerMoveEvent.clientY - initialY) / zoom;
        
        changeElement(element.id, (el) => ({
          ...el,
          x: Math.round((element.x || 0) + offsetX),
          y: Math.round((element.y || 0) + offsetY),
        }));
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [element, zoom, changeElement]
  );

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      setSelectedId(element.id);
      
      // Set the appropriate active element type
      const isText = !('type' in element);
      if (isText) {
        dispatch(setActiveElement('text'));
      } else {
        dispatch(setActiveElement('media'));
      }
      
      startDragging(e);
    },
    [element.id, setSelectedId, startDragging, dispatch]
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Check if it's a text element
      const isText = !('type' in element);
      if (isText && onTextEdit) {
        onTextEdit(element as TextElement);
      }
    },
    [element, onTextEdit]
  );

  // Don't show outline for audio elements
  if ('type' in element && element.type === 'audio') {
    return null;
  }

  return (
    <div
      data-element-type={!('type' in element) ? 'text' : 'media'}
      className="selection-outline"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={onMouseEnter}
      onPointerLeave={onMouseLeave}
      style={style}
    >
      {isSelected && (
        <>
          <ResizeHandle
            element={element}
            changeElement={changeElement}
            type="top-left"
            zoom={zoom}
          />
          <ResizeHandle
            element={element}
            changeElement={changeElement}
            type="top-right"
            zoom={zoom}
          />
          <ResizeHandle
            element={element}
            changeElement={changeElement}
            type="bottom-left"
            zoom={zoom}
          />
          <ResizeHandle
            element={element}
            changeElement={changeElement}
            type="bottom-right"
            zoom={zoom}
          />
          <RotateHandle
            element={element}
            changeElement={changeElement}
            zoom={zoom}
          />
          
          {/* Edit hint for text elements */}
          {!('type' in element) && (
            <div
              style={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 10001,
              }}
            >
              Double-click to edit • Press Enter
            </div>
          )}
        </>
      )}
    </div>
  );
};