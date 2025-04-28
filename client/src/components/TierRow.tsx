'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { Tier, Chart } from '../data/data-types';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import invariant from 'tiny-invariant';
import ChartCard from './ChartCard';

type TTierRowState =
  | {
      type: 'is-chart-over';
      isOverChildChart: boolean;
      dragging: DOMRect;
    }
  | {
      type: 'is-tier-over';
    }
  | {
      type: 'idle';
    }
  | {
      type: 'is-dragging';
    };

const stateStyles: { [Key in TTierRowState['type']]: string } = {
  idle: 'cursor-grab',
  'is-chart-over': 'outline outline-2 outline-neutral-50',
  'is-dragging': 'opacity-40',
  'is-tier-over': 'bg-slate-900',
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
  const labelRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TTierRowState>(idle);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTierNameChange(tier.position, e.target.value);
  };

  useEffect(() => {
    const outer = outerFullWidthRef.current;
    const scrollable = scrollableRef.current;
    const label = labelRef.current;
    const inner = innerRef.current;
    invariant(outer);
    invariant(scrollable);
    invariant(label);
    invariant(inner);

    const data = {
      type: 'tier',
      tier,
      rect: outer.getBoundingClientRect(),
    };

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
      draggable({
        element: label,
        getInitialData: () => data,
        onGenerateDragPreview({ source, location, nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: label, input: location.current.input }),
            render({ container }) {
              const rect = inner.getBoundingClientRect();
              const preview = inner.cloneNode(true);
              invariant(preview instanceof HTMLElement);
              preview.style.width = `${rect.width}px`;
              preview.style.height = `${rect.height}px`;
              preview.style.transform = 'rotate(4deg)';
              container.appendChild(preview);
            },
          });
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element: outer,
        getData: () => ({
          type: 'tier',
          tierId: tier.position,
          index: charts.length,
        }),
        canDrop({ source }) {
          return source.data.type === 'chart' || source.data.type === 'tier';
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
            return;
          }
          if (source.data.type === 'tier' && source.data.tier.position !== tier.position) {
            setState({ type: 'is-tier-over' });
          }
        },
        onDropTargetChange({ source, location }) {
          if (source.data.type === 'chart') {
            setIsChartOver({ data: source.data, location });
            return;
          }
        },
        onDragLeave({ source }) {
          if (source.data.type === 'tier' && source.data.tier.position === tier.position) {
            return;
          }
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
        ref={innerRef}
      >
        <div 
          ref={labelRef}
          className="w-full rounded-t-lg flex items-center justify-center p-2"
          style={{ backgroundColor: tier.color }}
        >
          <input 
            type="text" 
            value={tier.name} 
            onChange={handleNameChange}
            className="bg-transparent text-white font-bold text-center w-full focus:outline-none"
          />
        </div>
        <div 
          ref={scrollableRef}
          className={`flex-1 bg-white rounded-b-lg border-2 p-2 flex flex-wrap gap-2 overflow-x-auto`}
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
