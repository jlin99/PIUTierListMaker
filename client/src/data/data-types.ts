import { z } from "zod";

export const chartFilterSchema = z.object({
    mode: z.enum(["singles", "doubles"]),
    level: z.number().min(1).max(28).optional(),
  });

export type Tier= {
    name: string;
    color: string;
    position: number;
    charts: Chart[];
}
  
export type Chart = {
    id: number;
    name: string;
    imagePath: string;
    singlesLevels: number[] | null;
    doublesLevels: number[] | null;
}
  
export type TierList = {
    name: string;
    mode: string;
    tiers: Tier[];
    chartPlacements: Record<number, string>;
}

export type ChartFilter = z.infer<typeof chartFilterSchema>;