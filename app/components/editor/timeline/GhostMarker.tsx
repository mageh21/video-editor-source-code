import React from 'react';

interface GhostMarkerProps {
  position: number | null;
  isDragging: boolean;
  isContextMenuOpen: boolean;
}

const GhostMarker: React.FC<GhostMarkerProps> = ({ position, isDragging, isContextMenuOpen }) => {
  if (!position || isDragging || isContextMenuOpen) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500/50 pointer-events-none z-40"
      style={{ left: `${position}px` }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
    </div>
  );
};

export default GhostMarker;