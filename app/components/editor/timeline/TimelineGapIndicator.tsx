import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GapIndicatorProps {
  gap: { start: number; end: number };
  rowIndex: number;
  totalDuration: number;
  onRemoveGap?: (rowIndex: number, gapStart: number, gapEnd: number) => void;
}

const TimelineGapIndicator: React.FC<GapIndicatorProps> = ({
  gap,
  rowIndex,
  totalDuration,
  onRemoveGap,
}) => {
  const gapWidth = ((gap.end - gap.start) / totalDuration) * 100;
  const gapLeft = (gap.start / totalDuration) * 100;

  // Only show indicator for gaps larger than 2% of timeline
  if (gapWidth < 2) return null;

  return (
    <div
      className="absolute inset-y-0 flex items-center justify-center group"
      style={{
        left: `${gapLeft}%`,
        width: `${gapWidth}%`,
      }}
    >
      <button
        onClick={() => onRemoveGap?.(rowIndex, gap.start, gap.end)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                   bg-gray-700/80 hover:bg-gray-600 rounded px-1 py-0.5 
                   flex items-center gap-0.5 text-xs text-gray-300"
        title="Remove gap"
      >
        <ChevronLeft className="w-3 h-3" />
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default TimelineGapIndicator;