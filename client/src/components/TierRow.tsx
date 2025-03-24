import React from 'react';
import { Tier, Chart } from '../data/data-types';
import { useDroppable } from '@dnd-kit/core';
import ChartCard from './ChartCard';

interface TierRowProps {
  tier: Tier;
  charts: Chart[];
  mode: 'singles' | 'doubles';
  level?: number;
  onTierNameChange: (tierId: number, name: string) => void;
  onRemoveChart: (chartId: number) => void;
}

const TierRow: React.FC<TierRowProps> = ({ 
  tier, 
  charts, 
  mode,
  level = 21, 
  onTierNameChange,
  onRemoveChart 
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTierNameChange(tier.position, e.target.value);
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `tier-${tier.position}`,
  });

  return (
    <div className="tier-row">
      <div className="flex">
        <div 
          className="w-36 rounded-l-lg flex items-center justify-center p-2"
          style={{ backgroundColor: tier.color }}
        >
          <input 
            type="text" 
            value={tier.name} 
            onChange={handleNameChange}
            className="bg-transparent text-white font-bold text-center w-full focus:outline-none"
          />
        </div>
        <div 
          ref={setNodeRef}
          className={`flex-1 min-h-[90px] bg-white rounded-r-lg border-2 p-2 flex flex-wrap gap-2 ${
            isOver ? 'bg-gray-100' : ''
          }`}
          style={{ borderColor: tier.color }}
        >
          {charts.map((chart, index) => (
            <ChartCard 
              key={chart.id}
              chart={chart} 
              index={index} 
              mode={mode}
              level={level}
              onRemove={onRemoveChart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierRow;
