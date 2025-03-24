import { 
  Chart, InsertChart, 
  Tier, InsertTier, 
  TierList, InsertTierList, 
  TierChart, InsertTierChart,
  ChartFilter
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // Chart operations
  getCharts(filter?: ChartFilter): Promise<Chart[]>;
  getChart(id: number): Promise<Chart | undefined>;
  createChart(chart: InsertChart): Promise<Chart>;
  deleteChart(id: number): Promise<boolean>;

  // Tier operations
  getTiers(): Promise<Tier[]>;
  getTier(id: number): Promise<Tier | undefined>;
  createTier(tier: InsertTier): Promise<Tier>;
  updateTier(id: number, tier: Partial<InsertTier>): Promise<Tier | undefined>;
  deleteTier(id: number): Promise<boolean>;

  // TierList operations
  getTierLists(): Promise<TierList[]>;
  getTierList(id: number): Promise<TierList | undefined>;
  createTierList(tierList: InsertTierList): Promise<TierList>;
  updateTierList(id: number, tierList: Partial<InsertTierList>): Promise<TierList | undefined>;
  deleteTierList(id: number): Promise<boolean>;

  // TierChart operations
  getTierCharts(tierListId: number): Promise<TierChart[]>;
  addChartToTier(tierChart: InsertTierChart): Promise<TierChart>;
  removeChartFromTier(id: number): Promise<boolean>;
  moveChartToTier(id: number, newTierId: number): Promise<TierChart | undefined>;

  // Utility operations
  getTierListWithCharts(tierListId: number): Promise<any>;
  clearTierList(tierListId: number): Promise<boolean>;
}

// Implement the storage interface with in-memory storage
export class MemStorage implements IStorage {
  private charts: Map<number, Chart>;
  private tiers: Map<number, Tier>;
  private tierLists: Map<number, TierList>;
  private tierCharts: Map<number, TierChart>;
  
  private chartId: number;
  private tierId: number;
  private tierListId: number;
  private tierChartId: number;

  constructor() {
    this.charts = new Map();
    this.tiers = new Map();
    this.tierLists = new Map();
    this.tierCharts = new Map();
    
    this.chartId = 1;
    this.tierId = 1;
    this.tierListId = 1;
    this.tierChartId = 1;

    // Initialize with default tiers
    this.initializeDefaultTiers();
  }

  private initializeDefaultTiers() {
    const defaultTiers = [
      { name: "Impossible", color: "#EF4444", position: 1 },
      { name: "Hard", color: "#F97316", position: 2 },
      { name: "Medium", color: "#EAB308", position: 3 },
      { name: "Easy", color: "#84CC16", position: 4 },
      { name: "Free", color: "#22C55E", position: 5 },
    ];

    defaultTiers.forEach(tier => {
      this.createTier({
        name: tier.name,
        color: tier.color,
        position: tier.position,
      });
    });
  }

  // Chart operations
  async getCharts(filter?: ChartFilter): Promise<Chart[]> {
    const charts = Array.from(this.charts.values());
    
    if (!filter) return charts;

    return charts.filter(chart => {
      // Filter by mode (singles or doubles)
      const hasCorrectMode = 
        (filter.mode === "singles" && chart.singlesLevels && chart.singlesLevels.length > 0) || 
        (filter.mode === "doubles" && chart.doublesLevels && chart.doublesLevels.length > 0);
      
      if (!hasCorrectMode) return false;

      // Filter by level range
      const levels = filter.mode === "singles" ? chart.singlesLevels : chart.doublesLevels;
      const withinLevelRange = levels?.some(level => 
        level >= filter.minLevel && level <= filter.maxLevel
      );
      
      if (!withinLevelRange) return false;

      // Filter by search term
      if (filter.search && filter.search.trim() !== "") {
        return chart.name.toLowerCase().includes(filter.search.toLowerCase());
      }

      return true;
    });
  }

  async getChart(id: number): Promise<Chart | undefined> {
    return this.charts.get(id);
  }

  async createChart(chart: InsertChart): Promise<Chart> {
    const id = this.chartId++;
    const newChart: Chart = { ...chart, id };
    this.charts.set(id, newChart);
    return newChart;
  }

  async deleteChart(id: number): Promise<boolean> {
    return this.charts.delete(id);
  }

  // Tier operations
  async getTiers(): Promise<Tier[]> {
    return Array.from(this.tiers.values()).sort((a, b) => a.position - b.position);
  }

  async getTier(id: number): Promise<Tier | undefined> {
    return this.tiers.get(id);
  }

  async createTier(tier: InsertTier): Promise<Tier> {
    const id = this.tierId++;
    const newTier: Tier = { ...tier, id };
    this.tiers.set(id, newTier);
    return newTier;
  }

  async updateTier(id: number, tier: Partial<InsertTier>): Promise<Tier | undefined> {
    const existingTier = this.tiers.get(id);
    if (!existingTier) return undefined;

    const updatedTier: Tier = { ...existingTier, ...tier };
    this.tiers.set(id, updatedTier);
    return updatedTier;
  }

  async deleteTier(id: number): Promise<boolean> {
    return this.tiers.delete(id);
  }

  // TierList operations
  async getTierLists(): Promise<TierList[]> {
    return Array.from(this.tierLists.values());
  }

  async getTierList(id: number): Promise<TierList | undefined> {
    return this.tierLists.get(id);
  }

  async createTierList(tierList: InsertTierList): Promise<TierList> {
    const id = this.tierListId++;
    const newTierList: TierList = { ...tierList, id };
    this.tierLists.set(id, newTierList);
    return newTierList;
  }

  async updateTierList(id: number, tierList: Partial<InsertTierList>): Promise<TierList | undefined> {
    const existingTierList = this.tierLists.get(id);
    if (!existingTierList) return undefined;

    const updatedTierList: TierList = { ...existingTierList, ...tierList };
    this.tierLists.set(id, updatedTierList);
    return updatedTierList;
  }

  async deleteTierList(id: number): Promise<boolean> {
    // Also delete associated tier charts
    Array.from(this.tierCharts.values())
      .filter(tc => tc.tierListId === id)
      .forEach(tc => this.tierCharts.delete(tc.id));
      
    return this.tierLists.delete(id);
  }

  // TierChart operations
  async getTierCharts(tierListId: number): Promise<TierChart[]> {
    return Array.from(this.tierCharts.values())
      .filter(tc => tc.tierListId === tierListId);
  }

  async addChartToTier(tierChart: InsertTierChart): Promise<TierChart> {
    const id = this.tierChartId++;
    const newTierChart: TierChart = { ...tierChart, id };
    this.tierCharts.set(id, newTierChart);
    return newTierChart;
  }

  async removeChartFromTier(id: number): Promise<boolean> {
    return this.tierCharts.delete(id);
  }

  async moveChartToTier(id: number, newTierId: number): Promise<TierChart | undefined> {
    const tierChart = this.tierCharts.get(id);
    if (!tierChart) return undefined;

    const updatedTierChart: TierChart = { ...tierChart, tierId: newTierId };
    this.tierCharts.set(id, updatedTierChart);
    return updatedTierChart;
  }

  // Utility operations
  async getTierListWithCharts(tierListId: number): Promise<any> {
    const tierList = this.tierLists.get(tierListId);
    if (!tierList) return null;

    const tiers = await this.getTiers();
    const tierCharts = Array.from(this.tierCharts.values())
      .filter(tc => tc.tierListId === tierListId);
    
    const result = {
      ...tierList,
      tiers: await Promise.all(tiers.map(async tier => {
        const chartsInTier = tierCharts
          .filter(tc => tc.tierId === tier.id)
          .map(tc => tc.chartId);
        
        const charts = await Promise.all(
          chartsInTier.map(chartId => this.getChart(chartId))
        );
        
        return {
          ...tier,
          charts: charts.filter(Boolean),
        };
      })),
    };

    return result;
  }

  async clearTierList(tierListId: number): Promise<boolean> {
    // Delete all tier charts for this tier list
    const tierCharts = Array.from(this.tierCharts.values())
      .filter(tc => tc.tierListId === tierListId);
    
    for (const tc of tierCharts) {
      this.tierCharts.delete(tc.id);
    }
    
    return true;
  }
}

export const storage = new MemStorage();
