import React from 'react';
import { Chart, ChartFilter } from '@shared/schema';

interface SidebarProps {
  charts: Chart[];
  filter: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  charts, 
  filter, 
  onFilterChange,
  isLoading 
}) => {
  return (
    <aside className="bg-white rounded-lg p-4 space-y-4">
      <h2 className="font-bold text-lg">Charts</h2>
      <div className="space-y-2">
        {charts.map(chart => (
          <div key={chart.id} className="p-2 border rounded">
            {chart.name}
          </div>
        ))}
      </div>
    </aside>
  );
};