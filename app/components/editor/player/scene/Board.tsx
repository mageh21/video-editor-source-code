"use client";

import { useState } from "react";

interface BoardProps {
  size: { width: number; height: number };
  children: React.ReactNode;
  onDrop?: (files: File[]) => void;
}

export default function Board({ size, children, onDrop }: BoardProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're leaving the board entirely
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onDrop) {
      onDrop(files);
    }
  };

  return (
    <div
      id="artboard"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: size.width,
        height: size.height,
        position: "relative"
      }}
      className="pointer-events-auto"
    >
      <div
        style={{
          width: size.width,
          height: size.height,
        }}
        className={`pointer-events-none absolute z-50 border transition-colors duration-200 ease-in-out ${
          isDraggingOver 
            ? "border-4 border-dashed border-white bg-white/[0.075]" 
            : "border-white/15 bg-transparent"
        } shadow-[0_0_0_5000px_#121213]`}
      />
      {children}
    </div>
  );
}