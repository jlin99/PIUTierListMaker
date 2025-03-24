import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tier } from '@shared/schema';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface TierEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiers: Tier[];
  onSave: (tiers: Tier[]) => void;
}

const TierEditModal: React.FC<TierEditModalProps> = ({ isOpen, onClose, tiers, onSave }) => {
  const [editableTiers, setEditableTiers] = useState<Tier[]>([]);
  const [activeColorTier, setActiveColorTier] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditableTiers([...tiers]);
    }
  }, [isOpen, tiers]);

  const handleTierNameChange = (id: number, name: string) => {
    setEditableTiers(prev => 
      prev.map(tier => 
        tier.id === id ? { ...tier, name } : tier
      )
    );
  };

  const handleTierColorChange = (id: number, color: string) => {
    setEditableTiers(prev => 
      prev.map(tier => 
        tier.id === id ? { ...tier, color } : tier
      )
    );
  };

  const handleDeleteTier = (id: number) => {
    setEditableTiers(prev => prev.filter(tier => tier.id !== id));
  };

  const handleAddTier = () => {
    const nextPosition = editableTiers.length > 0 
      ? Math.max(...editableTiers.map(t => t.position)) + 1 
      : 1;
    
    // Generate a unique temporary ID (negative to avoid conflicts)
    const tempId = -Date.now();
    
    setEditableTiers([
      ...editableTiers, 
      { 
        id: tempId, 
        name: 'New Tier', 
        color: '#6D28D9', 
        position: nextPosition 
      }
    ]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(editableTiers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index + 1
    }));
    
    setEditableTiers(updatedItems);
  };

  const handleSave = () => {
    onSave(editableTiers);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-bold text-lg">Manage Tiers</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tier-edit-list">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {editableTiers.map((tier, index) => (
                    <Draggable 
                      key={tier.id} 
                      draggableId={`tier-edit-${tier.id}`} 
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="cursor-move"
                          >
                            <i className="ri-drag-move-2-fill text-gray-400"></i>
                          </div>
                          <Popover 
                            open={activeColorTier === tier.id} 
                            onOpenChange={(open) => setActiveColorTier(open ? tier.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <div 
                                className="w-8 h-8 rounded cursor-pointer" 
                                style={{ backgroundColor: tier.color }}
                              ></div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <HexColorPicker 
                                color={tier.color} 
                                onChange={(color) => handleTierColorChange(tier.id, color)}
                              />
                              <Input 
                                value={tier.color}
                                onChange={(e) => handleTierColorChange(tier.id, e.target.value)}
                                className="mt-2"
                              />
                            </PopoverContent>
                          </Popover>
                          <Input 
                            value={tier.name} 
                            onChange={(e) => handleTierNameChange(tier.id, e.target.value)}
                            className="flex-1"
                          />
                          <button 
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => handleDeleteTier(tier.id)}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <Button 
            variant="outline" 
            className="mt-4 w-full border-dashed" 
            onClick={handleAddTier}
          >
            <i className="ri-add-line mr-1"></i> Add New Tier
          </Button>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#4C1D95] hover:bg-[#3B0764]">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TierEditModal;
