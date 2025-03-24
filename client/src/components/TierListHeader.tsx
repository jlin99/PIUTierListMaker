import React from 'react';
import { Button } from '@/components/ui/button';
import { TierList, ChartFilter } from '@shared/schema';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TierListHeaderProps {
  tierList: TierList;
  filter: ChartFilter;
  onNameChange: (name: string) => void;
  onAddTier: () => void;
  onEditTiers: () => void;
  onClearAll: () => void;
  onModeChange: (mode: 'singles' | 'doubles') => void;
  onLevelChange: (level: number) => void;
}

const TierListHeader: React.FC<TierListHeaderProps> = ({
  tierList,
  filter,
  onNameChange,
  onAddTier,
  onEditTiers,
  onClearAll,
  onModeChange,
  onLevelChange
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
  };

  // Generate level options based on the mode
  const generateLevelOptions = () => {
    const maxLevel = tierList.mode === 'singles' ? 26 : 28;
    const options = [
      <SelectItem key="all" value="all">All</SelectItem>
    ];
    
    Array.from({ length: maxLevel }, (_, i) => i + 1).forEach(num => {
      options.push(<SelectItem key={num} value={num.toString()}>{num}</SelectItem>);
    });
    
    return options;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <input 
        type="text" 
        value={tierList.name} 
        onChange={handleNameChange}
        className="w-full font-poppins font-bold text-xl mb-3 border-b border-gray-200 pb-2 focus:outline-none focus:border-brand-light"
      />
      
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onAddTier}
          >
            <i className="ri-add-line mr-1"></i> Add Tier
          </Button>
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onEditTiers}
          >
            <i className="ri-edit-line mr-1"></i> Edit Tiers
          </Button>
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onClearAll}
          >
            <i className="ri-delete-bin-line mr-1"></i> Clear All
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {/* Mode Selector */}
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Mode:</span>
            <div className="bg-gray-200 rounded-md p-1 flex">
              <button 
                className={`px-3 py-1 text-sm ${tierList.mode === 'singles' ? 'bg-white rounded shadow' : 'text-gray-700'}`}
                onClick={() => onModeChange('singles')}
              >
                Singles
              </button>
              <button 
                className={`px-3 py-1 text-sm ${tierList.mode === 'doubles' ? 'bg-white rounded shadow' : 'text-gray-700'}`}
                onClick={() => onModeChange('doubles')}
              >
                Doubles
              </button>
            </div>
          </div>
          
          {/* Level Selector */}
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Level:</span>
            <Select 
              value={filter.level !== undefined ? filter.level.toString() : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  // Remove level filter
                  onLevelChange(-1); // Use -1 to indicate "all levels"
                } else {
                  onLevelChange(parseInt(value));
                }
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {generateLevelOptions()}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierListHeader;
