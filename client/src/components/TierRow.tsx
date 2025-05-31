'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { FaEdit, FaCheck } from 'react-icons/fa';
import { Tier, Chart } from '../data/data-types';
import {
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import invariant from 'tiny-invariant';
import ChartCard from './ChartCard';

type TTierRowState =
  | {
      type: 'is-chart-over';
      isOverChildChart: boolean;
      dragging: DOMRect;
    }
  | {
      type: 'idle';
    };

const stateStyles: { [Key in TTierRowState['type']]: string } = {
  idle: '',
  'is-chart-over': 'outline outline-2 outline-neutral-50',
};

const idle = { type: 'idle' } satisfies TTierRowState;

interface TierRowProps {
  tier: Tier;
  charts: Chart[];
  mode: 'singles' | 'doubles';
  level?: number;
  onTierNameChange: (tierId: number, name: string) => void;
  onRemoveChart: (chartId: number) => void;
}

const ChartList = memo(function ChartList({ charts, tierId, mode }: { charts: Chart[]; tierId: number; mode: 'singles' | 'doubles' }) {
  return charts.map((chart, index) => (
    <ChartCard 
      key={chart.id} 
      chart={chart} 
      index={index}
      tierId={tierId}
      mode={mode}
    />
  ));
});

const TierRow: React.FC<TierRowProps> = ({ 
  tier, 
  charts, 
  mode,
  level = 21, 
  onTierNameChange,
  onRemoveChart 
}) => {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const outerFullWidthRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<TTierRowState>(idle);
  const [readOnly, setReadOnly] = useState(true);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTierNameChange(tier.position, e.target.value);
  };

  const toggleEditMode = () => {
    setReadOnly((prev) => {
      if (prev === true) {
        // Focus the input when entering edit mode
        inputRef.current?.focus();
      }
      return !prev;
    });
  };

  useEffect(() => {
    const outer = outerFullWidthRef.current;
    const scrollable = scrollableRef.current;
    invariant(outer);
    invariant(scrollable);

    function setIsChartOver({ data, location }: { data: any; location: any }) {
      const innerMost = location.current.dropTargets[0];
      const isOverChildChart = Boolean(innerMost && innerMost.data.type === 'chart');

      const proposed: TTierRowState = {
        type: 'is-chart-over',
        dragging: data.rect,
        isOverChildChart,
      };
      
      setState((current) => {
        if (JSON.stringify(proposed) === JSON.stringify(current)) {
          return current;
        }
        return proposed;
      });
    }

    return combine(
      dropTargetForElements({
        element: outer,
        getData: () => ({
          type: 'tier',
          tierId: tier.position,
          index: charts.length,
        }),
        canDrop({ source }) {
          return source.data.type === 'chart';
        },
        getIsSticky: () => true,
        onDragStart({ source, location }) {
          if (source.data.type === 'chart') {
            setIsChartOver({ data: source.data, location });
          }
        },
        onDragEnter({ source, location }) {
          if (source.data.type === 'chart') {
            setIsChartOver({ data: source.data, location });
          }
        },
        onDropTargetChange({ source, location }) {
          if (source.data.type === 'chart') {
            setIsChartOver({ data: source.data, location });
          }
        },
        onDragLeave() {
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      }),
      autoScrollForElements({
        element: scrollable,
        canScroll({ source }) {
          return source.data.type === 'chart';
        },
      }),
      unsafeOverflowAutoScrollForElements({
        element: scrollable,
        canScroll({ source }) {
          return source.data.type === 'chart';
        },
        getOverflow() {
          return {
            forLeftEdge: {
              left: 1000,
            },
            forRightEdge: {
              right: 1000,
            },
          };
        },
      }),
    );
  }, [tier]);

  return (
    <div className="tier-row w-full" ref={outerFullWidthRef}>
      <div 
        className={`flex flex-col min-h-[90px] ${stateStyles[state.type]}`}
      >
        <div 
          className="w-full rounded-t-lg flex items-center justify-between p-2 group"
          style={{ backgroundColor: tier.color }}
        >
          <input 
            type="text" 
            value={tier.name} 
            onChange={handleNameChange}
            className="bg-transparent text-white font-bold text-center w-full focus:outline-none"
            readOnly={readOnly}
            ref={inputRef}
          />
          <button 
            onClick={toggleEditMode} 
            className="ml-2 text-white hover:text-gray-300 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={readOnly ? "Edit Tier Name" : "Save Tier Name"}
          >
            {readOnly ? <FaEdit className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
          </button>
        </div>
        <div 
          ref={scrollableRef}
          className="flex-1 bg-white rounded-b-lg border-2 p-2 flex flex-wrap gap-2 overflow-x-auto"
          style={{ borderColor: tier.color }}
        >
          <ChartList charts={charts} tierId={tier.position} mode={mode} />
          {state.type === 'is-chart-over' && !state.isOverChildChart ? (
            <div className="flex-shrink-0 p-1">
              <div 
                className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-dashed"
                style={{ borderColor: tier.color }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TierRow;
