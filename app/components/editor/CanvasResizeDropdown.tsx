"use client"

import { Button } from '../ui/Button';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { useAppSelector, useAppDispatch } from '@/app/store';
import { setCanvasSize } from '../../store/slices/projectSlice';
import { Maximize2 } from 'lucide-react';

interface CanvasSize {
  width: number;
  height: number;
  aspectRatio: string;
  label: string;
  description: string;
}

const canvasSizes: CanvasSize[] = [
  { width: 1920, height: 1080, aspectRatio: '16:9', label: '16:9 Landscape', description: 'YouTube, Desktop' },
  { width: 1080, height: 1920, aspectRatio: '9:16', label: '9:16 Portrait', description: 'TikTok, Shorts' },
  { width: 1080, height: 1080, aspectRatio: '1:1', label: '1:1 Square', description: 'Instagram' },
  { width: 1280, height: 720, aspectRatio: '16:9', label: 'HD 720p', description: 'Lower Resolution' },
];

export default function CanvasResizeDropdown() {
  const dispatch = useAppDispatch();
  const { resolution, aspectRatio } = useAppSelector((state) => state.projectState);

  const handleResize = (size: CanvasSize) => {
    dispatch(setCanvasSize({
      width: size.width,
      height: size.height,
      aspectRatio: size.aspectRatio,
    }));
  };

  const currentSize = canvasSizes.find(
    size => size.width === resolution.width && size.height === resolution.height
  ) || canvasSizes[0];

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Maximize2 className="h-4 w-4" />
          <span>{currentSize.label}</span>
        </Button>
      }
    >
      {canvasSizes.map((size) => (
        <DropdownItem
          key={`${size.width}x${size.height}`}
          onClick={() => handleResize(size)}
          className={
            size.width === resolution.width && size.height === resolution.height
              ? 'bg-gray-700'
              : ''
          }
        >
          <div className="flex justify-between items-center w-full">
            <div>
              <div className="font-medium">{size.label}</div>
              <div className="text-xs text-gray-400">{size.width}x{size.height} • {size.description}</div>
            </div>
            {size.width === resolution.width && size.height === resolution.height && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-3" />
            )}
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}