import React, { useState, useRef, useEffect } from 'react';
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
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
      
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

  const [lastOperation, setLastOperation] = useState<Operation | null>(null);

  const DEFAULT_TIERS: Tier[] = [
    { name: "Impossible", color: "#EF4444", position: 1, charts: [] },
    { name: "Hard", color: "#F97316", position: 2, charts: [] },
    { name: "Medium", color: "#EAB308", position: 3, charts: [] },
    { name: "Easy", color: "#84CC16", position: 4, charts: [] },
    { name: "Free", color: "#22C55E", position: 5, charts: [] },
  ];

  useEffect(() => {
    // Initialize with a default tier list
    if (tierLists.length === 0) {
      const defaultTierList: TierList = {
        id: 1,
        name: `${chartFilter.mode === 'singles' ? 'S' : 'D'}${chartFilter.level} Tier List`,
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

  useEffect(() => {
    if (lastOperation === null) {
      return;
    }
    const { outcome, trigger } = lastOperation;

    if (outcome.type === 'tier-reorder') {
      const { startIndex, finishIndex } = outcome;
      const updatedTiers = reorder({
        list: activeTierList!.tiers,
        startIndex,
        finishIndex,
      });
      setActiveTierList({ ...activeTierList!, tiers: updatedTiers });
    }

    if (outcome.type === 'chart-reorder') {
      const { tierId, startIndex, finishIndex } = outcome;
      const tier = activeTierList!.tiers.find(t => t.position === tierId);
      if (!tier) return;
      const updatedCharts = reorder({
        list: tier.charts,
        startIndex,
        finishIndex,
      });
      const updatedTiers = activeTierList!.tiers.map((t: Tier) =>
        t.position === tierId ? { ...t, charts: updatedCharts } : t
      );
      setActiveTierList({ ...activeTierList!, tiers: updatedTiers });
    }

    if (outcome.type === 'chart-move') {
      const { sourceTierId, destinationTierId, startIndex, finishIndex } = outcome;
      handleChartMove(sourceTierId, destinationTierId, startIndex, finishIndex);
    }
  }, [lastOperation]);

  useEffect(() => {
    return monitorForElements({
      canMonitor({ source }) {
        return source.data.type === 'chart' || source.data.type === 'tier';
      },
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) {
          return;
        }

        if (source.data.type === 'chart' && destination.data.type === 'tier') {
          const destinationTierId = destination.data.tierId;
          const destinationIndex = destination.data.index;

          // If the chart is coming from the available charts box
          if (!source.data.tierId) {
            const chart = source.data.chart;
            if (!activeTierList) return;
            
            const destinationTier = activeTierList.tiers.find(t => t.position === destinationTierId);
            if (!destinationTier) return;
            
            // Create a new charts array with the new chart inserted at the destination index
            const updatedCharts = [...destinationTier.charts];
            updatedCharts.splice(destinationIndex, 0, chart);
            
            // Create a new tier with the updated charts
            const updatedTier = { ...destinationTier, charts: updatedCharts };
            
            // Update the tiers array with the new tier
            const updatedTiers = activeTierList.tiers.map(t => {
              if (t.position === destinationTierId) return updatedTier;
              return t;
            });
            
            // Update both activeTierList and tierLists
            const updatedTierList = { ...activeTierList, tiers: updatedTiers };
            setActiveTierList(updatedTierList);
            setTierLists(prevTierLists => 
              prevTierLists.map(tl => 
                tl.id === activeTierList.id ? updatedTierList : tl
              )
            );
            
            // Remove the chart from the available charts
            setCharts(prevCharts => prevCharts.filter(c => c.id !== chart.id));
            return;
          }

          // If the chart is being moved between tiers or reordered within the same tier
          const sourceTierId = source.data.tierId;
          const sourceIndex = source.data.index;

          if (!activeTierList) return;
          
          const sourceTier = activeTierList.tiers.find(t => t.position === sourceTierId);
          const destinationTier = activeTierList.tiers.find(t => t.position === destinationTierId);
          
          if (!sourceTier || !destinationTier) return;
          
          // If reordering within the same tier
          if (sourceTierId === destinationTierId) {
            const updatedCharts = [...sourceTier.charts];
            const [movedChart] = updatedCharts.splice(sourceIndex, 1);
            updatedCharts.splice(destinationIndex, 0, movedChart);
            
            const updatedTier = { ...sourceTier, charts: updatedCharts };
            
            const updatedTiers = activeTierList.tiers.map(t => {
              if (t.position === sourceTierId) return updatedTier;
              return t;
            });
            
            const updatedTierList = { ...activeTierList, tiers: updatedTiers };
            setActiveTierList(updatedTierList);
            setTierLists(prevTierLists => 
              prevTierLists.map(tl => 
                tl.id === activeTierList.id ? updatedTierList : tl
              )
            );
            return;
          }
          
          // If moving between different tiers
          const updatedSourceCharts = [...sourceTier.charts];
          const updatedDestinationCharts = [...destinationTier.charts];
          
          const [movedChart] = updatedSourceCharts.splice(sourceIndex, 1);
          updatedDestinationCharts.splice(destinationIndex, 0, movedChart);
          
          const updatedSourceTier = { ...sourceTier, charts: updatedSourceCharts };
          const updatedDestinationTier = { ...destinationTier, charts: updatedDestinationCharts };
          
          const updatedTiers = activeTierList.tiers.map(t => {
            if (t.position === sourceTierId) return updatedSourceTier;
            if (t.position === destinationTierId) return updatedDestinationTier;
            return t;
          });
          
          const updatedTierList = { ...activeTierList, tiers: updatedTiers };
          setActiveTierList(updatedTierList);
          setTierLists(prevTierLists => 
            prevTierLists.map(tl => 
              tl.id === activeTierList.id ? updatedTierList : tl
            )
          );
        }
      },
    });
  }, [charts, activeTierList]);

  // Helper function to reorder items
  function reorder<T>({ list, startIndex, finishIndex }: { list: T[]; startIndex: number; finishIndex: number; }): T[] {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(finishIndex, 0, removed);
    return result;
  }

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
    const updatedTiers = activeTierList.tiers.map((t: Tier) =>
      t.position === tierId ? { ...t, name } : t
    );
    setActiveTierList({ ...activeTierList, tiers: updatedTiers });
  };

  // Handle chart move between tiers
  const handleChartMove = (sourceTierId: number, destinationTierId: number, sourceIndex: number, destinationIndex: number) => {
    if (!activeTierList) return;
    
    const sourceTier = activeTierList.tiers.find(t => t.position === sourceTierId);
    const destinationTier = activeTierList.tiers.find(t => t.position === destinationTierId);
    
    if (!sourceTier || !destinationTier) return;
    
    // Create new arrays for both tiers
    const updatedSourceCharts = [...sourceTier.charts];
    const updatedDestinationCharts = [...destinationTier.charts];
    
    // Remove chart from source tier
    const [movedChart] = updatedSourceCharts.splice(sourceIndex, 1);
    
    // Add chart to destination tier
    updatedDestinationCharts.splice(destinationIndex, 0, movedChart);
    
    // Create updated tier objects
    const updatedSourceTier = { ...sourceTier, charts: updatedSourceCharts };
    const updatedDestinationTier = { ...destinationTier, charts: updatedDestinationCharts };
    
    // Update the tiers array
    const updatedTiers = activeTierList.tiers.map(t => {
      if (t.position === sourceTierId) return updatedSourceTier;
      if (t.position === destinationTierId) return updatedDestinationTier;
      return t;
    });
    
    // Update both activeTierList and tierLists
    const updatedTierList = { ...activeTierList, tiers: updatedTiers };
    setActiveTierList(updatedTierList);
    setTierLists(prevTierLists => 
      prevTierLists.map(tl => 
        tl.id === activeTierList.id ? updatedTierList : tl
      )
    );
  };

  // Filter charts based on the current filter settings
  const filteredCharts = charts.filter(chart => {
    if (chartFilter.mode === 'singles') {
      return chart.singlesLevels && chart.singlesLevels.includes(chartFilter.level);
    } else {
      return chart.doublesLevels && chart.doublesLevels.includes(chartFilter.level);
    }
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
            <h1 className="font-poppins font-bold text-2xl">Pump It Up Tier List Maker</h1>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => setActiveTierList({ ...activeTierList!, tiers: DEFAULT_TIERS })}
            >
              <Save className="mr-1 h-4 w-4" /> Reset
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => activeTierList && setShowExportModal(true)}
            >
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
        </section>
      </main>

      {/* Export Modal */}
      {activeTierList && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          tierList={activeTierList}
          filter={chartFilter}
        />
      )}

    </div>
  );
};

export default TierListMaker;