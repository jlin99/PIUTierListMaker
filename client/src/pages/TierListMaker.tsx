import React, { useState, useRef, useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';
import { Chart, Tier, TierList, ChartFilter } from '@shared/schema';
import TierRow from '@/components/TierRow';
import TierListHeader from '@/components/TierListHeader';
import ExportModal from '@/components/modals/ExportModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Download, Plus, Database } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getPhoenixCharts } from '@/data/phoenix-data';
import ChartCard from '@/components/ChartCard';
import { useDroppable } from '@dnd-kit/core';

const TierListMaker: React.FC = () => {
  const [activeTierListId, setActiveTierListId] = useState<number | null>(null);
  const [chartFilter, setChartFilter] = useState<ChartFilter>({
    mode: 'singles',
    level: 21
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTierEditModal, setShowTierEditModal] = useState(false);
  const tierListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Static data
  const [charts, setCharts] = useState<Chart[]>(getPhoenixCharts());
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [activeTierList, setActiveTierList] = useState<TierList | null>(null);

  useEffect(() => {
    // Initialize with a default tier list
    if (tierLists.length === 0) {
      const defaultTierList: TierList = {
        id: 1,
        name: 'My Tier List',
        mode: 'singles',
        tiers: [
            { name: "Impossible", color: "#EF4444", position: 1, charts: [] },
            { name: "Hard", color: "#F97316", position: 2, charts: [] },
            { name: "Medium", color: "#EAB308", position: 3, charts: [] },
            { name: "Easy", color: "#84CC16", position: 4, charts: [] },
            { name: "Free", color: "#22C55E", position: 5, charts: [] },
        ],
      };
      setTierLists([defaultTierList]);
      setActiveTierList(defaultTierList);
      setActiveTierListId(defaultTierList.id);
    }
  }, [tierLists]);

  // Handle new tier list creation
  const handleNewList = () => {
    const newTierList: TierList = {
      id: tierLists.length + 1,
      name: 'New Tier List',
      mode: chartFilter.mode,
      tiers: [],
    };
    setTierLists([...tierLists, newTierList]);
    setActiveTierList(newTierList);
    setActiveTierListId(newTierList.id);
    toast({
      title: 'Success',
      description: 'New tier list created',
    });
  };

  // Update tier list name
  const handleNameChange = (name: string) => {
    if (!activeTierListId) return;
    const updatedTierLists = tierLists.map(tl =>
      tl.id === activeTierListId ? { ...tl, name } : tl
    );
    setTierLists(updatedTierLists);
    setActiveTierList(updatedTierLists.find(tl => tl.id === activeTierListId) || null);
  };

  // Update tier list mode
  const handleModeChange = (mode: 'singles' | 'doubles') => {
    if (!activeTierListId) return;
    const updatedTierLists = tierLists.map(tl =>
      tl.id === activeTierListId ? { ...tl, mode } : tl
    );
    setTierLists(updatedTierLists);
    setActiveTierList(updatedTierLists.find(tl => tl.id === activeTierListId) || null);
    setChartFilter({
      ...chartFilter,
      mode
    });
  };

  // Handle level change
  const handleLevelChange = (level: number) => {
    setChartFilter({
      ...chartFilter,
      level
    });
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || !activeTierListId) return;

    const sourceId = active.id;
    const destinationId = over.id;

    // Check if the destination is a tier
    if (destinationId.startsWith('tier-')) {
      const destinationTierId = parseInt(destinationId.split('-')[1]);
      const chartId = parseInt(sourceId.split('-')[1]);

      // Find the chart
      const chart = charts.find(chart => chart.id === chartId);
      if (!chart) return;

      // Remove chart from its current tier if source is a tier
      const updatedTiers = activeTierList?.tiers.map(tier => {
        if (tier.charts.some(c => c.id === chartId)) {
          return { ...tier, charts: tier.charts.filter(c => c.id !== chartId) };
        }
        return tier;
      }) || [];

      // Add chart to the destination tier
      const finalTiers = updatedTiers.map(tier =>
        tier.position === destinationTierId ? { ...tier, charts: [...(tier.charts || []), chart] } : tier
      );

      setActiveTierList({ ...activeTierList!, tiers: finalTiers });

      // Remove chart from available charts if it was initially there
      if (!sourceId.startsWith('tier-')) {
        const updatedCharts = charts.filter(chart => chart.id !== chartId);
        setCharts(updatedCharts);
      }
    }
  };

  // Handle remove chart from tier
  const handleRemoveChart = (chartId: number) => {
    if (!activeTierList) return;
    const updatedTiers = activeTierList.tiers.map(tier => ({
      ...tier,
      charts: tier.charts.filter(chart => chart.id !== chartId)
    }));
    setActiveTierList({ ...activeTierList, tiers: updatedTiers });
  };

  // Handle tier name change
  const handleTierNameChange = (tierId: number, name: string) => {
    if (!activeTierList) return;
    const updatedTiers = activeTierList.tiers.map(tier =>
      tier.position === tierId ? { ...tier, name } : tier
    );
    setActiveTierList({ ...activeTierList, tiers: updatedTiers });
  };

  // Filter charts based on the current filter settings
  const filteredCharts = charts.filter(chart => {
    if (chartFilter.mode === 'singles') {
      return chart.singlesLevels && chart.singlesLevels.includes(chartFilter.level);
    } else {
      return chart.doublesLevels && chart.doublesLevels.includes(chartFilter.level);
    }
  });

  // Droppable setup for chart library
  const { setNodeRef: setLibraryNodeRef } = useDroppable({
    id: 'chart-library',
  });

  // Render tier rows
  const renderTierRows = () => {
    if (!activeTierList || !activeTierList.tiers) return null;

    return activeTierList.tiers.map((tierWithCharts: any) => (
      <TierRow
        key={tierWithCharts.position}
        tier={tierWithCharts}
        charts={tierWithCharts.charts || []}
        mode={activeTierList.mode}
        level={chartFilter.level}
        onTierNameChange={handleTierNameChange}
        onRemoveChart={handleRemoveChart}
      />
    ));
  };

  // Render tier list header
  const renderTierListHeader = () => {
    if (!activeTierList) return null;

    return (
      <TierListHeader
        tierList={activeTierList}
        filter={chartFilter}
        onNameChange={handleNameChange}
        onAddTier={() => setShowTierEditModal(true)}
        onEditTiers={() => setShowTierEditModal(true)}
        onClearAll={() => setActiveTierList({ ...activeTierList, tiers: [] })}
        onModeChange={handleModeChange}
        onLevelChange={handleLevelChange}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* Header */}
      <header className="bg-[#4C1D95] text-white shadow-md">
        <div className="container mx-auto p-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <div className="w-8 h-8 flex items-center justify-center bg-[#7C3AED] rounded-full">
              <Database className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-poppins font-bold text-2xl">Pump It Up Tier List Maker</h1>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => setActiveTierList({ ...activeTierList!, tiers: [] })}
            >
              <Save className="mr-1 h-4 w-4" /> Reset
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <DndContext onDragEnd={handleDragEnd}>
        <main className="flex-grow container mx-auto p-4 flex flex-col gap-6">
          {/* Tier List Container */}
          <section className="max-w-4xl mx-auto w-full">
            {/* Tier List Header */}
            {renderTierListHeader()}

            {/* Tier Rows */}
            <div className="space-y-4 mb-4" ref={tierListRef}>
              {renderTierRows()}
            </div>

            {/* Chart Library Panel for Bottom Placement */}
            <div className="mt-8 bg-white rounded-lg shadow-md">
              <h3 className="p-3 font-poppins font-semibold text-lg border-b">Available Charts</h3>
              <div ref={setLibraryNodeRef} className="p-4 flex flex-wrap gap-3 min-h-[120px]">
                {filteredCharts.length > 0 ? (
                  filteredCharts.map((chart, index) => (
                    <ChartCard
                      key={chart.id}
                      chart={chart}
                      index={index}
                      mode={chartFilter.mode}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 w-full">
                    No charts found. Try adjusting level filter.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </DndContext>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tierListRef={tierListRef}
      />

    </div>
  );
};

export default TierListMaker;