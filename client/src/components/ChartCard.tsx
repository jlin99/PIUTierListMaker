import React from 'react';
import { Chart } from '@shared/schema';
import { Draggable } from 'react-beautiful-dnd';
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


  return (
    <Draggable
      draggableId={`chart-${chart.id}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`chart-item bg-gray-100 rounded-lg p-2 cursor-move hover:bg-gray-200 transition relative group ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
          title={chart.name}
        >
          <img 
            src={chart.imagePath || "https://via.placeholder.com/60"} 
            alt={chart.name} 
            className="w-16 h-16 rounded object-cover mx-auto"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center rounded-lg">
            <p className="text-white text-xs text-center px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{chart.name}</p>
          </div>
          {onRemove && (
            <button 
              onClick={() => onRemove(chart.id)}
              className="absolute top-1 right-1 text-white bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="text-xs">×</span>
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ChartCard;
