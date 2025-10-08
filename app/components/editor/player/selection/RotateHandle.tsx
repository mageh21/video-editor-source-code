'use client';

import React, { useCallback, useMemo } from 'react';
import { MediaFile, TextElement } from '@/app/types';

type Element = MediaFile | TextElement;

const HANDLE_SIZE = 16;
const HANDLE_DISTANCE = 30;

interface RotateHandleProps {
  element: Element;
  changeElement: (id: string, updater: (element: Element) => Element) => void;
  zoom: number;
}

export const RotateHandle: React.FC<RotateHandleProps> = ({
  element,
  changeElement,
  zoom,
}) => {
  const size = Math.round(HANDLE_SIZE / zoom);
  const distance = HANDLE_DISTANCE / zoom;

  const style: React.CSSProperties = useMemo(() => {
    return {
      position: 'absolute',
      width: size,
      height: size,
      backgroundColor: '#3B82F6',
      border: `${1 / zoom}px solid white`,
      borderRadius: '50%',
      left: '50%',
      top: -distance,
      transform: 'translateX(-50%)',
      cursor: 'grab',
      zIndex: 2001,
      pointerEvents: 'all',
    };
  }, [size, distance, zoom]);

  const lineStyle: React.CSSProperties = useMemo(() => {
    return {
      position: 'absolute',
      width: 2 / zoom,
      height: distance - size / 2,
      backgroundColor: '#3B82F6',
      left: '50%',
      top: 0,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
    };
  }, [distance, size, zoom]);

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const deltaX = pointerMoveEvent.clientX - centerX;
        const deltaY = pointerMoveEvent.clientY - centerY;
        
        // Calculate angle in degrees
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        
        // Snap to 15 degree increments if shift is held
        if (pointerMoveEvent.shiftKey) {
          angle = Math.round(angle / 15) * 15;
        }

        changeElement(element.id, (el) => ({
          ...el,
          rotation: Math.round(angle),
        }));
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [element.id, changeElement]
  );

  return (
    <>
      <div style={lineStyle} />
      <div onPointerDown={onPointerDown} style={style} />
    </>
  );
};