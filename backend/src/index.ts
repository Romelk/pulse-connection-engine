import express from 'express';
import cors from 'cors';
import { config } from './config';

// Import routes
import dashboardRoutes from './routes/dashboard.routes';
import machinesRoutes from './routes/machines.routes';
import alertsRoutes from './routes/alerts.routes';
import policiesRoutes from './routes/policies.routes';
import operationsRoutes from './routes/operations.routes';
import simulatorRoutes from './routes/simulator.routes';
import aiRoutes from './routes/ai.routes';
import scraperRoutes from './routes/scraper.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/scraper', scraperRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   OpsAssistant AI Backend Server                          ║
  ║   AI-Powered Operations Assistant for SME Manufacturing   ║
  ║                                                           ║
  ║   Server running on: http://localhost:${config.port}               ║
  ║   Frontend URL: ${config.frontendUrl}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
