import React, { useEffect, useRef, useState } from 'react';
import { Chart, ChartFilter } from '../data/data-types';
import ChartCard from './ChartCard';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

interface AvailableChartsProps {
  filteredCharts: Chart[];
  chartFilter: ChartFilter;
  onChartDrop: (chartId: number) => void;
}

const AvailableCharts: React.FC<AvailableChartsProps> = ({ 
  filteredCharts,
  chartFilter,
  onChartDrop
}) => {
  const handleOnChartDrop = (chart: Chart) => {onChartDrop(chart.id)}
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    return combine(
      dropTargetForElements({
        element: container,
        getData: () => ({
          type: 'available',
        }),
        canDrop({ source }) {
          return source.data.type === 'chart';
        },
        onDragEnter() {
          setIsOver(true);
        },
        onDragLeave() {
          setIsOver(false);
        },
        onDrop({ source }) {
          setIsOver(false);
          if (source.data.type === 'chart') {
            onChartDrop(source.data.chart as Chart);
          }
        },
      })
    );
  }, [onChartDrop]);

  return (
    <div 
      ref={containerRef} 
      className={`mt-8 bg-white rounded-lg shadow-md ${isOver ? 'outline outline-2 outline-blue-500' : ''}`}
    >
      <h3 className="p-3 font-poppins font-semibold text-lg border-b">Available Charts</h3>
      <div className="p-4 flex flex-wrap gap-3 min-h-[120px]">
        {filteredCharts.length > 0 ? (
          filteredCharts.map((chart, index) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              index={index}
              mode={chartFilter.mode}
              level={chartFilter.level}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 w-full">
            No charts found. Try adjusting level filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableCharts;