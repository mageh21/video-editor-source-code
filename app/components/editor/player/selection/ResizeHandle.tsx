'use client';

import React, { useCallback, useMemo } from 'react';
import { MediaFile, TextElement } from '@/app/types';

type Element = MediaFile | TextElement;

const HANDLE_SIZE = 12;

interface ResizeHandleProps {
  type: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  changeElement: (id: string, updater: (element: Element) => Element) => void;
  element: Element;
  zoom: number;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  type,
  changeElement,
  element,
  zoom,
}) => {
  const size = Math.round(HANDLE_SIZE / zoom);
  const borderSize = 1 / zoom;

  const sizeStyle: React.CSSProperties = useMemo(() => {
    return {
      position: 'absolute',
      height: size,
      width: size,
      backgroundColor: 'white',
      border: `${borderSize}px solid #3B82F6`,
      zIndex: 2000,
      pointerEvents: 'all',
    };
  }, [borderSize, size]);

  const margin = -size / 2 - borderSize;

  const style: React.CSSProperties = useMemo(() => {
    if (type === 'top-left') {
      return {
        ...sizeStyle,
        marginLeft: margin,
        marginTop: margin,
        cursor: 'nwse-resize',
      };
    }

    if (type === 'top-right') {
      return {
        ...sizeStyle,
        marginTop: margin,
        marginRight: margin,
        right: 0,
        cursor: 'nesw-resize',
      };
    }

    if (type === 'bottom-left') {
      return {
        ...sizeStyle,
        marginBottom: margin,
        marginLeft: margin,
        bottom: 0,
        cursor: 'nesw-resize',
      };
    }

    if (type === 'bottom-right') {
      return {
        ...sizeStyle,
        marginBottom: margin,
        marginRight: margin,
        right: 0,
        bottom: 0,
        cursor: 'nwse-resize',
      };
    }

    throw new Error('Unknown type: ' + type);
  }, [margin, sizeStyle, type]);

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      const initialX = e.clientX;
      const initialY = e.clientY;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / zoom;
        const offsetY = (pointerMoveEvent.clientY - initialY) / zoom;

        const isLeft = type === 'top-left' || type === 'bottom-left';
        const isTop = type === 'top-left' || type === 'top-right';

        changeElement(element.id, (el) => {
          const currentWidth = el.width || 100;
          const currentHeight = el.height || 100;
          const currentX = el.x || 0;
          const currentY = el.y || 0;

          const newWidth = currentWidth + (isLeft ? -offsetX : offsetX);
          const newHeight = currentHeight + (isTop ? -offsetY : offsetY);
          const newX = currentX + (isLeft ? offsetX : 0);
          const newY = currentY + (isTop ? offsetY : 0);

          return {
            ...el,
            width: Math.max(20, Math.round(newWidth)),
            height: Math.max(20, Math.round(newHeight)),
            x: Math.round(newX),
            y: Math.round(newY),
          };
        });
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [element, zoom, changeElement, type]
  );

  return <div onPointerDown={onPointerDown} style={style} />;
};