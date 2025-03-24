import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Chart, TierList, Tier } from '@shared/schema';
import { Sidebar } from '../components/Sidebar';
import { TierRow } from '../components/TierRow';
import { getPhoenixCharts } from '../data/phoenix-data';

// Default tiers
const DEFAULT_TIERS: Tier[] = [
  { name: 'S', color: '#EF4444', position: 0 },
  { name: 'A', color: '#F97316', position: 1 },
  { name: 'B', color: '#EAB308', position: 2 },
  { name: 'C', color: '#22C55E', position: 3 },
  { name: 'D', color: '#3B82F6', position: 4 },
  { name: 'F', color: '#8B5CF6', position: 5 },
];

export const TierListMaker: React.FC = () => {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [tierList, setTierList] = useState<TierList>({
    name: "My Pump It Up Tier List",
    mode: "singles",
    tiers: DEFAULT_TIERS,
    chartPlacements: {}
  });

  useEffect(() => {
    setCharts(getPhoenixCharts());
  }, []);

  const onFilterChange = (filter: Partial<{ mode: 'singles' | 'doubles', minLevel?: number, maxLevel?: number }>) => {
    if (filter.mode && filter.mode !== tierList.mode) {
      setTierList(prev => ({ ...prev, mode: filter.mode, chartPlacements: {} }));
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    setTierList(prev => {
      const newPlacements = { ...prev.chartPlacements };

      if (source.droppableId === 'chart-library') {
        const chartId = parseInt(draggableId.replace('library-chart-', ''));
        newPlacements[chartId] = destination.droppableId;
      } else {
        const chartId = parseInt(draggableId.replace('placed-chart-', ''));
        if (destination.droppableId === 'chart-library') {
          delete newPlacements[chartId];
        } else {
          newPlacements[chartId] = destination.droppableId;
        }
      }

      return {
        ...prev,
        chartPlacements: newPlacements
      };
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <main className="min-h-screen bg-gray-100 p-4">
        <section className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            <h1 className="font-poppins text-2xl font-bold">Pump It Up {tierList.mode === 'singles' ? 'Singles' : 'Doubles'} Tier List</h1>
            <div className="space-y-2">
              {DEFAULT_TIERS.map((tier) => (
                <TierRow
                  key={tier.name}
                  tier={tier}
                  charts={charts.filter(c => tierList.chartPlacements[c.id] === tier.name)}
                />
              ))}
            </div>
          </div>
          <Sidebar
            charts={charts.filter(c => !tierList.chartPlacements[c.id])}
            filter={{ mode: tierList.mode }}
            onFilterChange={onFilterChange}
            isLoading={false}
          />
        </section>
      </main>
    </DragDropContext>
  );
};