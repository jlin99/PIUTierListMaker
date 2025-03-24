import React, { useState } from 'react';
import { Chart, ChartFilter } from '@shared/schema';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  charts: Chart[];
  filter: ChartFilter;
  onFilterChange: (filter: Partial<ChartFilter>) => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ charts, filter, onFilterChange, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Generate level options
  const generateLevelOptions = (max: number) => {
    return Array.from({ length: max }, (_, i) => i + 1).map(num => (
      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
    ));
  };

  // Handle filter changes
  const handleModeChange = (value: string) => {
    const mode = value as 'singles' | 'doubles';
    onFilterChange({ mode });
  };

  return (
    <aside className="w-full md:w-72 bg-white rounded-lg shadow-md p-4 h-fit md:sticky md:top-4" id="sidebar">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-poppins font-semibold text-lg">Chart Library</h2>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden text-gray-500"
        >
          <i className={`ri-menu-${isExpanded ? 'fold' : 'unfold'}-line`}></i>
        </button>
      </div>

      {/* Chart Type Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-sm text-gray-500 mb-2">CHART TYPE</h3>
        <div className="flex gap-2">
          <Button
            variant={filter.mode === 'singles' ? 'default' : 'outline'}
            className={filter.mode === 'singles' ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex-1' : 'flex-1'}
            onClick={() => handleModeChange('singles')}
          >
            Singles
          </Button>
          <Button
            variant={filter.mode === 'doubles' ? 'default' : 'outline'}
            className={filter.mode === 'doubles' ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex-1' : 'flex-1'}
            onClick={() => handleModeChange('doubles')}
          >
            Doubles
          </Button>
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-sm text-gray-500 mb-2">LEVEL</h3>
        <div>
          <Select 
            value={filter.level.toString()} 
            onValueChange={(value) => onFilterChange({ level: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {generateLevelOptions(filter.mode === 'singles' ? 26 : 28)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Library */}
      <div>
        <h3 className="font-medium text-sm text-gray-500 mb-2">AVAILABLE CHARTS</h3>
        <Droppable droppableId="chart-library" isDropDisabled={true}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 ${isExpanded ? 'h-96' : 'h-0'} overflow-y-auto p-1 transition-all duration-300`}
            >
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
                </div>
              ) : charts.length > 0 ? (
                charts.map((chart, index) => (
                  <Draggable key={chart.id} draggableId={`library-chart-${chart.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`chart-item bg-gray-100 rounded-lg p-2 flex gap-3 cursor-move hover:bg-gray-200 transition ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <img 
                          src={chart.imagePath || "https://via.placeholder.com/60"} 
                          alt={chart.name} 
                          className="w-14 h-14 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{chart.name}</h4>
                          <div className="flex gap-1 mt-1">
                            {chart.singlesLevels?.map(level => (
                              <span key={`s-${level}`} className="bg-[#7C3AED] text-white text-xs px-1.5 py-0.5 rounded">
                                S{level}
                              </span>
                            ))}
                            {chart.doublesLevels?.map(level => (
                              <span key={`d-${level}`} className="bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded">
                                D{level}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No charts found. Try adjusting filters.
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </aside>
  );
};

export default Sidebar;
