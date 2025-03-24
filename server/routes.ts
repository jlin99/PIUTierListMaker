import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertChartSchema, chartFilterSchema, insertTierSchema, insertTierListSchema, insertTierChartSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Load the Pump It Up Phoenix data
const phoenixDataPath = path.join(process.cwd(), 'server/pump-phoenix.json');
let phoenixData: any = null;

try {
  const data = fs.readFileSync(phoenixDataPath, 'utf8');
  phoenixData = JSON.parse(data);
  console.log('Loaded Pump It Up Phoenix data successfully');
} catch (error) {
  console.error('Error loading Pump It Up Phoenix data:', error);
}

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
      const { mode, level } = req.query;
      
      // Validate query parameters
      let filter;
      if (mode) {
        const filterData: any = { mode };
        
        // Add level to filter if provided
        if (level) {
          filterData.level = parseInt(level as string);
        }
        
        const filterResult = chartFilterSchema.safeParse(filterData);
        
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

  // Load charts from Pump Phoenix JSON data
  app.post('/api/load-phoenix-data', async (_req: Request, res: Response) => {
    try {
      if (!phoenixData || !phoenixData.songs) {
        return res.status(500).json({ message: 'Phoenix data not loaded or corrupted' });
      }

      const charts = [];
      const songs = phoenixData.songs;

      for (const song of songs) {
        // Extract singles and doubles levels from charts
        const singlesLevels: number[] = [];
        const doublesLevels: number[] = [];

        if (song.charts) {
          for (const chart of song.charts) {
            if (chart.diffClass === "S" && chart.style === "solo") {
              singlesLevels.push(Number(chart.lvl));
            } else if (chart.diffClass === "D" && chart.style === "solo") {
              doublesLevels.push(Number(chart.lvl));
            }
          }
        }

        // Skip songs without any charts
        if (singlesLevels.length === 0 && doublesLevels.length === 0) {
          continue;
        }

        // Create chart data
        const chartData = {
          name: song.name,
          imagePath: song.jacket ? `/api/phoenix-jacket/${encodeURIComponent(song.jacket)}` : '',
          singlesLevels: singlesLevels.length > 0 ? singlesLevels : null,
          doublesLevels: doublesLevels.length > 0 ? doublesLevels : null
        };

        // Validate and create chart
        const result = insertChartSchema.safeParse(chartData);
        if (result.success) {
          const chart = await storage.createChart(result.data);
          charts.push(chart);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: `Successfully loaded ${charts.length} charts from Phoenix data`,
        charts 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Serve phoenix jacket images
  app.get('/api/phoenix-jacket/:filename', (req: Request, res: Response) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      // Default image path (fallback)
      const defaultImagePath = path.join(process.cwd(), 'public', 'default-chart.svg');
      
      // Extract the song name for display in the default image
      let songName = "Unknown";
      if (filename.startsWith('pump/')) {
        const jacketId = filename.replace('pump/', '').replace('.jpg', '');
        // Find song by jacket path
        const song = phoenixData?.songs?.find((s: any) => s.jacket === filename);
        if (song) {
          songName = song.name;
        }
      }
      
      // For now, we'll always use the default image
      // In a real implementation, you would serve the actual image files
      if (fs.existsSync(defaultImagePath)) {
        // Read SVG and update text content with song name if available
        let svgContent = fs.readFileSync(defaultImagePath, 'utf8');
        
        // Replace placeholder text with song name if found
        if (songName !== "Unknown") {
          // Simple text replacement - this is a basic approach
          // For more complex SVG manipulation, use a proper XML parser
          svgContent = svgContent.replace('>No Image<', `>${songName.substring(0, 15)}${songName.length > 15 ? '...' : ''}<`);
        }
        
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.send(svgContent);
      } else {
        return res.status(404).send('Default image not found');
      }
    } catch (error) {
      handleError(error as Error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
