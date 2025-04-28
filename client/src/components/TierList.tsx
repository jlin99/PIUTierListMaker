import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Chart, Tier, TierList as TierListType, ChartFilter } from '@shared/schema';
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
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';
import invariant from 'tiny-invariant';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';


// Define types for drag-and-drop operations
type Outcome =
	| {
			type: 'chart-reorder';
			tierId: string;
			startIndex: number;
			finishIndex: number;
	  }
	| {
			type: 'chart-move';
			finishTierId: string;
			itemIndexInStartTier: number;
			itemIndexInFinishTier: number;
	  };

type Trigger = 'pointer' | 'keyboard';

type Operation = {
    trigger: Trigger;
    outcome: Outcome;
};

export type TierMap = { [tierId: string]: Tier };

type BoardState = {
    tierMap: TierMap;
    orderedTierIds: string[];
    lastOperation: Operation | null;
};


export type ChartEntry = {
	element: HTMLElement;
	actionMenuTrigger: HTMLElement;
};

export type TierEntry = {
	element: HTMLElement;
};


function createRegistry() {
	const charts = new Map<string, ChartEntry>();
	const tiers = new Map<string, TierEntry>();

	function registerChart({ chartId, entry }: { chartId: string; entry: ChartEntry }): CleanupFn {
		charts.set(chartId, entry);
		return function cleanup() {
			charts.delete(chartId);
		};
	}

	function registerTier({
		tierId,
		entry,
	}: {
		tierId: string;
		entry: TierEntry;
	}): CleanupFn {
		tiers.set(tierId, entry);
		return function cleanup() {
			tiers.delete(tierId);
		};
	}

	function getChart(chartId: string): ChartEntry {
		const entry = charts.get(chartId);
		invariant(entry);
		return entry;
	}

	function getTier(tierId: string): TierEntry {
		const entry = tiers.get(tierId);
		invariant(entry);
		return entry;
	}

	return { registerChart, registerTier, getChart, getTier };
}


export default function TierList() {
    const [data, setData] = useState<BoardState>(() => {
		const base = getPhoenixCharts();
		return {
			tierMap: base.tierMap,
			orderedTierIds: base.orderedTierIds,
			lastOperation: null,
		};
	});

	const scrollableRef = useRef<HTMLDivElement | null>(null);
	const stableData = useRef(data);
	useEffect(() => {
		stableData.current = data;
	}, [data]);

	const [registry] = useState(createRegistry);

	const { lastOperation } = data;

	useEffect(() => {
		if (lastOperation === null) {
			return;
		}
		const { outcome, trigger } = lastOperation;

		if (outcome.type === 'chart-reorder') {
			const { tierId, startIndex, finishIndex } = outcome;

			const { tierMap } = stableData.current;
			const tier = tierMap[tierId];
			const item = tier.items[finishIndex];

			const entry = registry.getChart(item.userId);
			triggerPostMoveFlash(entry.element);

			if (trigger !== 'keyboard') {
				return;
			}

			liveRegion.announce(
				`You've moved ${item.name} from position ${
					startIndex + 1
				} to position ${finishIndex + 1} of ${tier.items.length} in the ${tier.title} tier.`,
			);

			return;
		}

		if (outcome.type === 'chart-move') {
			const { finishTierId, itemIndexInStartTier, itemIndexInFinishTier } = outcome;

			const data = stableData.current;
			const destinationTier = data.tierMap[finishTierId];
			const item = destinationTier.items[itemIndexInFinishTier];

			const finishPosition =
				typeof itemIndexInFinishTier === 'number'
					? itemIndexInFinishTier + 1
					: destinationTier.items.length;

			const entry = registry.getChart(item.userId);
			triggerPostMoveFlash(entry.element);

			if (trigger !== 'keyboard') {
				return;
			}

			liveRegion.announce(
				`You've moved ${item.name} from position ${
					itemIndexInStartTier + 1
				} to position ${finishPosition} in the ${destinationTier.title} tier.`,
			);

			/**
			 * Because the chart has moved tier, it will have remounted.
			 * This means we need to manually restore focus to it.
			 */
			entry.actionMenuTrigger.focus();

			return;
		}
	}, [lastOperation, registry]);

	useEffect(() => {
		return liveRegion.cleanup();
	}, []);

	const getTiers = useCallback(() => {
		const { tierMap, orderedTierIds } = stableData.current;
		return orderedTierIds.map((tierId) => tierMap[tierId]);
	}, []);

	const reorderTier = useCallback(
		({
			startIndex,
			finishIndex,
			trigger = 'keyboard',
		}: {
			startIndex: number;
			finishIndex: number;
			trigger?: Trigger;
		}) => {
			setData((data) => {
				const outcome: Outcome = {
					type: 'chart-reorder',
					tierId: data.orderedTierIds[startIndex],
					startIndex,
					finishIndex,
				};

				return {
					...data,
					orderedTierIds: reorder({
						list: data.orderedTierIds,
						startIndex,
						finishIndex,
					}),
					lastOperation: {
						outcome,
						trigger,
					},
				};
			});
		},
		[],
	);

	const reorderChart = useCallback(
		({
			tierId,
			startIndex,
			finishIndex,
			trigger = 'keyboard',
		}: {
			tierId: string;
			startIndex: number;
			finishIndex: number;
			trigger?: Trigger;
		}) => {
			setData((data) => {
				const sourceTier = data.tierMap[tierId];
				const updatedItems = reorder({
					list: sourceTier.items,
					startIndex,
					finishIndex,
				});

				const updatedSourceTier: Tier = {
					...sourceTier,
					items: updatedItems,
				};

				const updatedMap: TierMap = {
					...data.tierMap,
					[tierId]: updatedSourceTier,
				};

				const outcome: Outcome = {
					type: 'chart-reorder',
					tierId,
					startIndex,
					finishIndex,
				};

				return {
					...data,
					tierMap: updatedMap,
					lastOperation: {
						trigger,
						outcome,
					},
				};
			});
		},
		[],
	);

	const moveChart = useCallback(
		({
			startTierId,
			finishTierId,
			itemIndexInStartTier,
			itemIndexInFinishTier,
			trigger = 'keyboard',
		}: {
			startTierId: string;
			finishTierId: string;
			itemIndexInStartTier: number;
			itemIndexInFinishTier?: number;
			trigger?: Trigger;
		}) => {
			if (startTierId === finishTierId) {
				return;
			}
			setData((data) => {
				const sourceTier = data.tierMap[startTierId];
				const destinationTier = data.tierMap[finishTierId];
				const item = sourceTier.items[itemIndexInStartTier];

				const destinationItems = Array.from(destinationTier.items);
				const newIndexInDestination = itemIndexInFinishTier ?? 0;
				destinationItems.splice(newIndexInDestination, 0, item);

				const updatedMap = {
					...data.tierMap,
					[startTierId]: {
						...sourceTier,
						items: sourceTier.items.filter((i: Chart) => i.id !== item.id),
					},
					[finishTierId]: {
						...destinationTier,
						items: destinationItems,
					},
				};

				const outcome: Outcome = {
					type: 'chart-move',
					finishTierId,
					itemIndexInStartTier,
					itemIndexInFinishTier: newIndexInDestination,
				};

				return {
					...data,
					tierMap: updatedMap,
					lastOperation: {
						outcome,
						trigger,
					},
				};
			});
		},
		[],
	);

	const [instanceId] = useState(() => Symbol('instance-id'));

	useEffect(() => {
		const element = scrollableRef.current;
		invariant(element);

		return combine(
			monitorForElements({
				canMonitor({ source }) {
					return source.data.type === 'chart' || source.data.type === 'tier';
				},
				onDrop({ source, location }) {
					if (!location.current.dropTargets.length) {
						return;
					}

					if (source.data.type === 'tier') {
						const startIndex = data.orderedTierIds.findIndex(
							(tierId) => tierId === source.data.tierId,
						);

						const target = location.current.dropTargets[0];
						const indexOfTarget = data.orderedTierIds.findIndex(
							(id) => id === target.data.tierId,
						);
						const closestEdgeOfTarget = extractClosestEdge(target.data);

						const finishIndex = getReorderDestinationIndex({
							startIndex,
							indexOfTarget,
							closestEdgeOfTarget,
							axis: 'vertical',
						});

						reorderTier({ startIndex, finishIndex, trigger: 'pointer' });
					}
					if (source.data.type === 'chart') {
						const itemId = source.data.itemId;
						invariant(typeof itemId === 'string');
						
						const [, startTierRecord] = location.initial.dropTargets;
						const sourceId = startTierRecord.data.tierId;
						invariant(typeof sourceId === 'string');
						const sourceTier = data.tierMap[sourceId];
						const itemIndex = sourceTier.items.findIndex((item: Chart) => item.userId === itemId);

						if (location.current.dropTargets.length === 1) {
							const [destinationTierRecord] = location.current.dropTargets;
							const destinationId = destinationTierRecord.data.tierId;
							invariant(typeof destinationId === 'string');
							const destinationTier = data.tierMap[destinationId];
							invariant(destinationTier);

							if (sourceTier === destinationTier) {
								const destinationIndex = getReorderDestinationIndex({
									startIndex: itemIndex,
									indexOfTarget: sourceTier.items.length - 1,
									closestEdgeOfTarget: null,
									axis: 'horizontal',
								});
								reorderChart({
									tierId: sourceTier.tierId,
									startIndex: itemIndex,
									finishIndex: destinationIndex,
									trigger: 'pointer',
								});
								return;
							}

							moveChart({
								itemIndexInStartTier: itemIndex,
								startTierId: sourceTier.tierId,
								finishTierId: destinationTier.tierId,
								trigger: 'pointer',
							});
							return;
						}

						if (location.current.dropTargets.length === 2) {
							const [destinationChartRecord, destinationTierRecord] = location.current.dropTargets;
							const destinationTierId = destinationTierRecord.data.tierId;
							invariant(typeof destinationTierId === 'string');
							const destinationTier = data.tierMap[destinationTierId];

							const indexOfTarget = destinationTier.items.findIndex(
								(item: Chart) => item.id === destinationChartRecord.data.id,
							);
							const closestEdgeOfTarget = extractClosestEdge(destinationChartRecord.data);

							if (sourceTier === destinationTier) {
								const destinationIndex = getReorderDestinationIndex({
									startIndex: itemIndex,
									indexOfTarget,
									closestEdgeOfTarget,
									axis: 'horizontal',
								});
								reorderChart({
									tierId: sourceTier.tierId,
									startIndex: itemIndex,
									finishIndex: destinationIndex,
									trigger: 'pointer',
								});
								return;
							}

							const destinationIndex =
								closestEdgeOfTarget === 'bottom' ? indexOfTarget + 1 : indexOfTarget;

							moveChart({
								itemIndexInStartTier: itemIndex,
								startTierId: sourceTier.tierId,
								finishTierId: destinationTier.tierId,
								itemIndexInFinishTier: destinationIndex,
								trigger: 'pointer',
							});
						}
					}
				},
			}),
			autoScrollForElements({
				element,
				canScroll({ source }) {
					return source.data.type === 'chart' || source.data.type === 'tier';
				},
				getConfiguration: () => ({ maxScrollSpeed: 'standard' }),
			}),
			unsafeOverflowAutoScrollForElements({
				element,
				canScroll({ source }) {
					return source.data.type === 'chart' || source.data.type === 'tier';
				},
				getConfiguration: () => ({ maxScrollSpeed: 'standard' }),
				getOverflow() {
					return {
						forTopEdge: {
							top: 1000,
						},
						forBottomEdge: {
							bottom: 1000,
						},
					};
				},
			}),
		);
	}, [data, moveChart, reorderChart, reorderTier]);

	const contextValue = useCallback(() => {
		return {
			getTiers,
			reorderTier,
			reorderChart,
			moveChart,
			registerChart: registry.registerChart,
			registerTier: registry.registerTier,
			instanceId,
		};
	}, [getTiers, reorderTier, reorderChart, registry, moveChart, instanceId]);

	return (
		<div className="flex h-full flex-col">
			<div
				ref={scrollableRef}
				className="flex h-full flex-col gap-3 overflow-y-auto p-3 [scrollbar-color:theme(colors.sky.600)_theme(colors.sky.800)] [scrollbar-width:thin]"
			>
				{data.orderedTierIds.map((tierId) => (
					<TierRow 
						key={tierId}
						tier={data.tierMap[tierId]}
						charts={data.tierMap[tierId].items}
						mode="singles"
						onTierNameChange={(id, name) => {
							setData(prev => ({
								...prev,
								tierMap: {
									...prev.tierMap,
									[tierId]: {
										...prev.tierMap[tierId],
										name
									}
								}
							}));
						}}
						onRemoveChart={(chartId) => {
							setData(prev => ({
								...prev,
								tierMap: {
									...prev.tierMap,
									[tierId]: {
										...prev.tierMap[tierId],
										items: prev.tierMap[tierId].items.filter((c: Chart) => c.id !== chartId)
									}
								}
							}));
						}}
					/>
				))}
			</div>
		</div>
	);
}