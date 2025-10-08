"use client";

import React, { useState } from 'react';

interface DraggableTransitionProps {
  data: {
    type: string;
    kind: string;
    name?: string;
    duration: number;
    direction?: string;
  };
  children: React.ReactNode;
  renderCustomPreview?: React.ReactNode;
  shouldDisplayPreview?: boolean;
}

export const DraggableTransition: React.FC<DraggableTransitionProps> = ({
  data,
  children,
  renderCustomPreview,
  shouldDisplayPreview = true
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    
    // Set drag data
    const dragData = JSON.stringify(data);
    console.log('Setting drag data:', dragData);
    
    // Set data using the reference app's approach - use stringified data as key
    e.dataTransfer.setData(dragData, dragData);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Set custom drag image if preview is provided
    if (renderCustomPreview && shouldDisplayPreview) {
      // Create a temporary element for the drag image
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.zIndex = '-1';
      
      // Render the custom preview
      const previewElement = document.createElement('div');
      previewElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 8px;">
          <div style="width: 70px; height: 70px; background: linear-gradient(45deg, #3B82F6, #8B5CF6); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 18px; font-weight: bold;">${data.kind?.charAt(0).toUpperCase()}</span>
          </div>
          <div style="color: white; font-size: 12px; margin-top: 6px; text-align: center; font-weight: 500;">
            ${data.kind === "none" ? "Remove" : (data.name || data.kind)}
          </div>
        </div>
      `;
      
      dragImage.appendChild(previewElement);
      document.body.appendChild(dragImage);
      
      // Set the drag image
      e.dataTransfer.setDragImage(dragImage, 40, 50);
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
    
    // Dispatch drag start event
    window.dispatchEvent(new CustomEvent('transition-drag-start', { detail: data }));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    
    // Dispatch drag end event
    window.dispatchEvent(new CustomEvent('transition-drag-end', { detail: data }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {children}
    </div>
  );
};