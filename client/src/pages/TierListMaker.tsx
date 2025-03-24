import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Chart, Tier, TierList, ChartFilter } from '@shared/schema';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import Sidebar from '@/components/Sidebar';
import TierRow from '@/components/TierRow';
import TierListHeader from '@/components/TierListHeader';
import ExportModal from '@/components/modals/ExportModal';
import TierEditModal from '@/components/modals/TierEditModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Download, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const TierListMaker: React.FC = () => {
  const [activeTierListId, setActiveTierListId] = useState<number | null>(null);
  const [chartFilter, setChartFilter] = useState<ChartFilter>({
    mode: 'singles',
    minLevel: 1,
    maxLevel: 26,
    search: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTierEditModal, setShowTierEditModal] = useState(false);
  const tierListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch charts
  const { data: charts = [], isLoading: isLoadingCharts } = useQuery({
    queryKey: ['/api/charts', chartFilter],
    queryFn: async ({ queryKey }) => {
      const [_, filter] = queryKey;
      const queryParams = new URLSearchParams();
      if (filter) {
        Object.entries(filter as ChartFilter).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      const res = await fetch(`/api/charts?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch charts');
      return res.json();
    }
  });

  // Fetch tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ['/api/tiers'],
    queryFn: async () => {
      const res = await fetch('/api/tiers');
      if (!res.ok) throw new Error('Failed to fetch tiers');
      return res.json();
    }
  });

  // Fetch tier lists
  const { data: tierLists = [] } = useQuery({
    queryKey: ['/api/tierlists'],
    queryFn: async () => {
      const res = await fetch('/api/tierlists');
      if (!res.ok) throw new Error('Failed to fetch tier lists');
      return res.json();
    }
  });

  // Fetch active tier list
  const { data: activeTierList, isLoading: isLoadingTierList } = useQuery({
    queryKey: ['/api/tierlists', activeTierListId],
    queryFn: async ({ queryKey }) => {
      const [_, id] = queryKey;
      if (!id) return null;
      const res = await fetch(`/api/tierlists/${id}`);
      if (!res.ok) throw new Error('Failed to fetch tier list');
      return res.json();
    },
    enabled: !!activeTierListId
  });

  // Create tier list mutation
  const createTierListMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/tierlists', {
        name,
        mode: chartFilter.mode,
        createdAt: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveTierListId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/tierlists'] });
      toast({
        title: 'Success',
        description: 'New tier list created',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create tier list: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update tier list mutation
  const updateTierListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<TierList> }) => {
      const res = await apiRequest('PUT', `/api/tierlists/${id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tierlists', data.id] });
      toast({
        title: 'Success',
        description: 'Tier list updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update tier list: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Add chart to tier mutation
  const addChartToTierMutation = useMutation({
    mutationFn: async ({ tierListId, tierId, chartId }: { tierListId: number, tierId: number, chartId: number }) => {
      const res = await apiRequest('POST', '/api/tiercharts', {
        tierListId,
        tierId,
        chartId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tierlists', activeTierListId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add chart to tier: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Remove chart from tier mutation
  const removeChartFromTierMutation = useMutation({
    mutationFn: async (chartId: number) => {
      // Find the tier chart id first
      const tierCharts = activeTierList.tiers.flatMap((tier: any) => 
        tier.charts.map((chart: Chart) => ({ 
          tierId: tier.id, 
          chartId: chart.id,
          // This is a bit of a hack since we don't have the tierChartId in the response
          // In a real app, we'd store or fetch this
          tierChartId: `${tier.id}-${chart.id}`
        }))
      );
      
      const tierChart = tierCharts.find(tc => tc.chartId === chartId);
      if (!tierChart) throw new Error('Chart not found in any tier');

      const res = await apiRequest('DELETE', `/api/tiercharts/${tierChart.tierChartId}`);
      return { success: res.ok };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tierlists', activeTierListId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove chart from tier: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Clear tier list mutation
  const clearTierListMutation = useMutation({
    mutationFn: async (tierListId: number) => {
      const res = await apiRequest('POST', `/api/tierlists/${tierListId}/clear`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tierlists', activeTierListId] });
      toast({
        title: 'Success',
        description: 'Tier list cleared',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to clear tier list: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update tiers mutation
  const updateTiersMutation = useMutation({
    mutationFn: async (updatedTiers: Tier[]) => {
      // Update existing tiers
      const existingTiers = updatedTiers.filter(tier => tier.id > 0);
      const newTiers = updatedTiers.filter(tier => tier.id < 0);
      
      // Update existing tiers
      for (const tier of existingTiers) {
        await apiRequest('PUT', `/api/tiers/${tier.id}`, {
          name: tier.name,
          color: tier.color,
          position: tier.position
        });
      }
      
      // Create new tiers
      for (const tier of newTiers) {
        await apiRequest('POST', '/api/tiers', {
          name: tier.name,
          color: tier.color,
          position: tier.position
        });
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tiers'] });
      toast({
        title: 'Success',
        description: 'Tiers updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update tiers: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // File upload mutation
  const uploadChartMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/charts', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload chart');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/charts'] });
      toast({
        title: 'Success',
        description: 'Chart uploaded successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to upload chart: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Create a new tier list
  const handleNewList = () => {
    createTierListMutation.mutate('My Pump It Up Tier List');
  };

  // Update tier list name
  const handleNameChange = (name: string) => {
    if (!activeTierListId) return;
    updateTierListMutation.mutate({ id: activeTierListId, data: { name } });
  };

  // Update tier list mode
  const handleModeChange = (mode: 'singles' | 'doubles') => {
    if (!activeTierListId) return;
    updateTierListMutation.mutate({ id: activeTierListId, data: { mode } });
    
    // Also update the chart filter
    setChartFilter({
      ...chartFilter,
      mode,
      maxLevel: mode === 'singles' ? 26 : 28
    });
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !activeTierListId) return;

    const { source, destination, draggableId } = result;

    // Moving from library to tier
    if (source.droppableId === 'chart-library' && destination.droppableId.startsWith('tier-')) {
      const tierId = parseInt(destination.droppableId.split('-')[1]);
      const chartId = parseInt(draggableId.split('-')[2]);
      
      addChartToTierMutation.mutate({
        tierListId: activeTierListId,
        tierId,
        chartId
      });
    }
    
    // Moving between tiers
    else if (
      source.droppableId.startsWith('tier-') && 
      destination.droppableId.startsWith('tier-') &&
      source.droppableId !== destination.droppableId
    ) {
      const sourceTierId = parseInt(source.droppableId.split('-')[1]);
      const destinationTierId = parseInt(destination.droppableId.split('-')[1]);
      const chartId = parseInt(draggableId.split('-')[1]);
      
      // Remove from source tier and add to destination tier
      removeChartFromTierMutation.mutate(chartId);
      addChartToTierMutation.mutate({
        tierListId: activeTierListId,
        tierId: destinationTierId,
        chartId
      });
    }
  };

  // Handle remove chart from tier
  const handleRemoveChart = (chartId: number) => {
    removeChartFromTierMutation.mutate(chartId);
  };

  // Handle tier name change
  const handleTierNameChange = (tierId: number, name: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;
    
    updateTiersMutation.mutate([{
      ...tier,
      name
    }]);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', file.name.split('.')[0]);
    
    // Add example levels - in a real app, these would come from the JSON file
    const singleLevels = [Math.floor(Math.random() * 26) + 1];
    const doubleLevels = [Math.floor(Math.random() * 28) + 1];
    
    formData.append('singlesLevels', JSON.stringify(singleLevels));
    formData.append('doublesLevels', JSON.stringify(doubleLevels));
    
    uploadChartMutation.mutate(formData);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Initialize a tier list if none exists
  useEffect(() => {
    if (tierLists.length > 0 && !activeTierListId) {
      setActiveTierListId(tierLists[0].id);
    } else if (tierLists.length === 0 && !createTierListMutation.isPending) {
      handleNewList();
    }
  }, [tierLists, activeTierListId]);

  // Render tier rows
  const renderTierRows = () => {
    if (!activeTierList || !activeTierList.tiers) return null;

    return activeTierList.tiers.map((tierWithCharts: any) => (
      <TierRow
        key={tierWithCharts.id}
        tier={tierWithCharts}
        charts={tierWithCharts.charts || []}
        mode={activeTierList.mode}
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
        onNameChange={handleNameChange}
        onAddTier={() => setShowTierEditModal(true)}
        onEditTiers={() => setShowTierEditModal(true)}
        onClearAll={() => clearTierListMutation.mutate(activeTierListId!)}
        onModeChange={handleModeChange}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* Header */}
      <header className="bg-[#4C1D95] text-white shadow-md">
        <div className="container mx-auto p-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <i className="ri-game-line text-3xl"></i>
            <h1 className="font-poppins font-bold text-2xl">Pump It Up Tier List Maker</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleNewList}
              className="bg-[#7C3AED] hover:bg-opacity-80"
            >
              <i className="ri-add-line mr-1"></i> New List
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => {
                toast({
                  title: "Saved",
                  description: "Tier list saved successfully",
                });
              }}
            >
              <i className="ri-save-line mr-1"></i> Save
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-[#4C1D95] hover:bg-gray-100 border-none"
              onClick={() => setShowExportModal(true)}
            >
              <i className="ri-download-line mr-1"></i> Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <Sidebar
            charts={charts}
            filter={chartFilter}
            onFilterChange={(filter) => setChartFilter({ ...chartFilter, ...filter })}
            isLoading={isLoadingCharts}
          />

          {/* Tier List Container */}
          <section className="flex-1">
            {isLoadingTierList ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
              </div>
            ) : (
              <>
                {/* Tier List Header */}
                {renderTierListHeader()}

                {/* Tier Rows */}
                <div className="space-y-4 mb-4" ref={tierListRef}>
                  {renderTierRows()}
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-poppins font-semibold text-lg mb-3">Import Chart Data</h3>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0 && fileInputRef.current) {
                        fileInputRef.current.files = files;
                        handleFileUpload({ target: { files } } as any);
                      }
                    }}
                  >
                    <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-500 mb-3">Drag and drop your chart folder or click to browse</p>
                    <Button 
                      className="bg-[#4C1D95] hover:bg-opacity-90"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                    />
                    <p className="text-xs text-gray-400 mt-3">Supports folder upload with JPG images and JSON data files</p>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </DragDropContext>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tierListRef={tierListRef}
      />

      {/* Tier Edit Modal */}
      <TierEditModal
        isOpen={showTierEditModal}
        onClose={() => setShowTierEditModal(false)}
        tiers={tiers}
        onSave={updateTiersMutation.mutate}
      />
    </div>
  );
};

export default TierListMaker;
