import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertChartSchema, chartFilterSchema, insertTierSchema, insertTierListSchema, insertTierChartSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler middleware
  const handleError = (err: any, res: Response) => {
    console.error(err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: fromZodError(err).message });
    }
    res.status(500).json({ message: err.message || 'Internal server error' });
  };

  // Chart routes
  app.get('/api/charts', async (req: Request, res: Response) => {
    try {
      const { mode, minLevel, maxLevel, search } = req.query;
      
      // Validate query parameters
      let filter;
      if (mode) {
        const filterResult = chartFilterSchema.safeParse({
          mode,
          minLevel: minLevel ? parseInt(minLevel as string) : 1,
          maxLevel: maxLevel ? parseInt(maxLevel as string) : mode === 'singles' ? 26 : 28,
          search
        });
        
        if (!filterResult.success) {
          return res.status(400).json({ message: fromZodError(filterResult.error).message });
        }
        
        filter = filterResult.data;
      }
      
      const charts = await storage.getCharts(filter);
      return res.json(charts);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get('/api/charts/:id', async (req: Request, res: Response) => {
    try {
      const chart = await storage.getChart(parseInt(req.params.id));
      if (!chart) {
        return res.status(404).json({ message: 'Chart not found' });
      }
      return res.json(chart);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post('/api/charts', upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { name, singlesLevels, doublesLevels } = req.body;
      
      // Parse JSON strings from form data
      let parsedSinglesLevels;
      let parsedDoublesLevels;
      
      if (singlesLevels) {
        parsedSinglesLevels = JSON.parse(singlesLevels);
      }
      
      if (doublesLevels) {
        parsedDoublesLevels = JSON.parse(doublesLevels);
      }
      
      // Get file path
      const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
      
      // Validate chart data
      const chartData = {
        name,
        imagePath,
        singlesLevels: parsedSinglesLevels,
        doublesLevels: parsedDoublesLevels
      };
      
      const result = insertChartSchema.safeParse(chartData);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const chart = await storage.createChart(result.data);
      return res.status(201).json(chart);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete('/api/charts/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteChart(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Chart not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Tier routes
  app.get('/api/tiers', async (_req: Request, res: Response) => {
    try {
      const tiers = await storage.getTiers();
      return res.json(tiers);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get('/api/tiers/:id', async (req: Request, res: Response) => {
    try {
      const tier = await storage.getTier(parseInt(req.params.id));
      if (!tier) {
        return res.status(404).json({ message: 'Tier not found' });
      }
      return res.json(tier);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post('/api/tiers', async (req: Request, res: Response) => {
    try {
      const result = insertTierSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const tier = await storage.createTier(result.data);
      return res.status(201).json(tier);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put('/api/tiers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertTierSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const tier = await storage.updateTier(id, result.data);
      if (!tier) {
        return res.status(404).json({ message: 'Tier not found' });
      }
      return res.json(tier);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete('/api/tiers/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteTier(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Tier not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  // TierList routes
  app.get('/api/tierlists', async (_req: Request, res: Response) => {
    try {
      const tierLists = await storage.getTierLists();
      return res.json(tierLists);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get('/api/tierlists/:id', async (req: Request, res: Response) => {
    try {
      const tierList = await storage.getTierListWithCharts(parseInt(req.params.id));
      if (!tierList) {
        return res.status(404).json({ message: 'Tier list not found' });
      }
      return res.json(tierList);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post('/api/tierlists', async (req: Request, res: Response) => {
    try {
      const tierListData = {
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      
      const result = insertTierListSchema.safeParse(tierListData);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const tierList = await storage.createTierList(result.data);
      return res.status(201).json(tierList);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put('/api/tierlists/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertTierListSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const tierList = await storage.updateTierList(id, result.data);
      if (!tierList) {
        return res.status(404).json({ message: 'Tier list not found' });
      }
      return res.json(tierList);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete('/api/tierlists/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteTierList(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Tier list not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post('/api/tierlists/:id/clear', async (req: Request, res: Response) => {
    try {
      const success = await storage.clearTierList(parseInt(req.params.id));
      return res.json({ success });
    } catch (error) {
      handleError(error, res);
    }
  });

  // TierChart routes
  app.post('/api/tiercharts', async (req: Request, res: Response) => {
    try {
      const result = insertTierChartSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }
      
      const tierChart = await storage.addChartToTier(result.data);
      return res.status(201).json(tierChart);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete('/api/tiercharts/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.removeChartFromTier(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Chart assignment not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put('/api/tiercharts/:id/move/:tierId', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const newTierId = parseInt(req.params.tierId);
      
      const tierChart = await storage.moveChartToTier(id, newTierId);
      if (!tierChart) {
        return res.status(404).json({ message: 'Chart assignment not found' });
      }
      return res.json(tierChart);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Folder upload route
  app.post('/api/upload-folder', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const chartsData = req.body.chartsData;
      
      if (!files || !chartsData) {
        return res.status(400).json({ message: 'No files or chart data provided' });
      }
      
      const parsedChartsData = JSON.parse(chartsData);
      const charts = [];
      
      for (const chartData of parsedChartsData) {
        const result = insertChartSchema.safeParse(chartData);
        
        if (result.success) {
          const chart = await storage.createChart(result.data);
          charts.push(chart);
        }
      }
      
      return res.status(201).json({ charts });
    } catch (error) {
      handleError(error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
