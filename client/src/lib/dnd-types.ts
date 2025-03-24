export enum DragDropTypes {
  CHART = 'chart',
  TIER = 'tier'
}

export interface DragItem {
  id: number;
  type: DragDropTypes;
  content: any;
}
