import React from 'react';
import { Chart } from '@shared/schema';
import { Draggable } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';

interface ChartCardProps {
  chart: Chart;
  index: number;
  mode: 'singles' | 'doubles';
  isDragDisabled?: boolean;
  onRemove?: (chartId: number) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  chart, 
  index, 
  mode, 
  isDragDisabled = false,
  onRemove
}) => {
  const getChartLevels = () => {
    const singles = chart.singlesLevels?.map(level => (
      <Badge key={`s-${level}`} className="bg-[#7C3AED] hover:bg-[#7C3AED] text-white">
        S{level}
      </Badge>
    ));

    const doubles = chart.doublesLevels?.map(level => (
      <Badge key={`d-${level}`} className="bg-gray-700 hover:bg-gray-700 text-white">
        D{level}
      </Badge>
    ));

    return (
      <div className="flex gap-1 mt-1">
        {singles}
        {doubles}
      </div>
    );
  };

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
          className={`chart-item bg-gray-100 rounded-lg p-2 flex gap-3 cursor-move hover:bg-gray-200 transition ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          <img 
            src={chart.imagePath || "https://via.placeholder.com/60"} 
            alt={chart.name} 
            className="w-14 h-14 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{chart.name}</h4>
            {getChartLevels()}
          </div>
          {onRemove && (
            <button 
              onClick={() => onRemove(chart.id)}
              className="text-gray-400 hover:text-red-500 self-start"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ChartCard;
