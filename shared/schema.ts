import { pgTable, text, serial, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the chart schema
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imagePath: text("image_path").notNull(),
  singlesLevels: jsonb("singles_levels").$type<number[]>(),
  doublesLevels: jsonb("doubles_levels").$type<number[]>(),
});

// Define the tier schema
export const tiers = pgTable("tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull(),
});

// Define the tier list schema
export const tierLists = pgTable("tier_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("singles"),
  createdAt: text("created_at").notNull(),
});

// Define the tier chart schema (junction table)
export const tierCharts = pgTable("tier_charts", {
  id: serial("id").primaryKey(),
  tierListId: integer("tier_list_id").notNull(),
  tierId: integer("tier_id").notNull(),
  chartId: integer("chart_id").notNull(),
});

// Create insert schemas for validation
export const insertChartSchema = createInsertSchema(charts);
export const insertTierSchema = createInsertSchema(tiers);
export const insertTierListSchema = createInsertSchema(tierLists);
export const insertTierChartSchema = createInsertSchema(tierCharts);

// Create custom schemas for frontend validation
export const chartUploadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  singlesLevels: z.array(z.number().min(1).max(26)).optional(),
  doublesLevels: z.array(z.number().min(1).max(28)).optional(),
  image: z.any().optional(),
});

// Custom schema for chart validation
export const chartFilterSchema = z.object({
  mode: z.enum(["singles", "doubles"]),
  level: z.number().min(1).max(28),
});

// Export types for use in the application
export type Chart = typeof charts.$inferSelect;
export type InsertChart = typeof charts.$inferInsert;
export type Tier = typeof tiers.$inferSelect;
export type InsertTier = typeof tiers.$inferInsert;
export type TierList = typeof tierLists.$inferSelect;
export type InsertTierList = typeof tierLists.$inferInsert;
export type TierChart = typeof tierCharts.$inferSelect;
export type InsertTierChart = typeof tierCharts.$inferInsert;
export type ChartUpload = z.infer<typeof chartUploadSchema>;
export type ChartFilter = z.infer<typeof chartFilterSchema>;
