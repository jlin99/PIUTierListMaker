import React from 'react';
import { Button } from '@/components/ui/button';
import { TierList } from '@shared/schema';

interface TierListHeaderProps {
  tierList: TierList;
  onNameChange: (name: string) => void;
  onAddTier: () => void;
  onEditTiers: () => void;
  onClearAll: () => void;
  onModeChange: (mode: 'singles' | 'doubles') => void;
}

const TierListHeader: React.FC<TierListHeaderProps> = ({
  tierList,
  onNameChange,
  onAddTier,
  onEditTiers,
  onClearAll,
  onModeChange
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
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
      </div>
    </div>
  );
};

export default TierListHeader;
