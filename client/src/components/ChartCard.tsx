import React from 'react';
import { Chart } from '../data/data-types';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';

interface ChartCardProps {
  chart: Chart;
  index: number;
  mode: 'singles' | 'doubles';
  level?: number;
  isDragDisabled?: boolean;
  onRemove?: (chartId: number) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  chart, 
  index, 
  mode, 
  level = 21, // Default to level 21 if not provided
  isDragDisabled = false,
  onRemove
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `chart-${chart.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`chart-item bg-gray-100 rounded-lg p-2 cursor-move hover:bg-gray-200 transition relative group ${
        isDragDisabled ? 'opacity-50' : ''
      }`}
      title={chart.name}
    >
      <img 
        src={chart.imagePath} 
        alt={chart.name} 
        className="w-16 h-16 rounded object-cover mx-auto"
      />
      {onRemove && (
        <button 
          onClick={() => onRemove(chart.id)}
          className="absolute top-1 right-1 text-white bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-xs">×</span>
        </button>
      )}
    </div>
  );
};

export default ChartCard;
