import React from 'react';
import { Chart } from '../data/data-types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { cn } from "@/lib/utils"

interface ChartCardProps {
  chart: Chart;
  index: number;
  mode: 'singles' | 'doubles';
  level?: number;
  isDragDisabled?: boolean;
  onRemove?: (chartId: number) => void;
  tierId?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  chart,
  index,
  mode,
  level,
  tierId,
}) => {
  const ref = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return draggable({
      element: el,
      getInitialData: () => ({
        type: 'chart',
        chart,
        index,
        mode,
        level,
        tierId,
        rect: el.getBoundingClientRect(),
      }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, [chart, index, mode, level, tierId]);

  return (
    <img
      className={cn("h-20 w-20", dragging && "opacity-40")}
      src={chart.imagePath}
      alt={chart.name}
      ref={ref}
    />
  );
};

export default ChartCard;
