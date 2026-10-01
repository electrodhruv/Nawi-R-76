import express, { Request, Response } from 'express';
import cors from 'cors';
import { dbPool } from './config/database';
import { metrologyRouter } from './routes/metrology.routes';
import { standardsRouter } from './routes/standards.routes';
import { evaluationsRouter } from './routes/evaluations.routes';
import { verificationRouter } from './routes/verification.routes';

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Root Service Information
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'NAWI-R76 Metrology Engine & Database Backend API',
    version: '1.0.0',
    standardsConformity: ['OIML R 76-1:2006 (E)', 'OIML R 76-2:2007 (E)', 'ISO/IEC 17025:2017'],
    endpoints: {
      health: '/api/health',
      metrology: '/api/metrology',
      standards: '/api/standards',
      evaluations: '/api/evaluations',
      verification: '/api/verification',
    },
    uptimeSeconds: process.uptime(),
  });
});

// Healthcheck & Database Connection Status endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await dbPool.query('SELECT NOW() as db_time, current_database() as db_name;');
    res.json({
      status: 'UP',
      service: 'NAWI-R76 Metrology Engine Backend',
      database: 'Connected',
      db_time: dbRes.rows[0].db_time,
      db_name: dbRes.rows[0].db_name,
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      status: 'PARTIAL',
      service: 'NAWI-R76 Metrology Engine Backend',
      database: 'Disconnected',
      notice: 'Fallback in-memory cache active for local evaluation testing.',
      error: err.message,
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount Specialized Domain Sub-Routers
app.use('/api/metrology', metrologyRouter);
app.use('/api/standards', standardsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/verification', verificationRouter);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`NAWI-R76 Metrology Engine Backend listening on port ${PORT}`);
    console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`Metrology:   http://localhost:${PORT}/api/metrology/calculate-turning-point`);
    console.log(`Standards:   http://localhost:${PORT}/api/standards`);
    console.log(`Evaluations: http://localhost:${PORT}/api/evaluations`);
    console.log(`=======================================================`);
  });
}

export default app;
