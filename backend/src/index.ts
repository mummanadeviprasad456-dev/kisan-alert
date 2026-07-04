import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Serve local uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// ─── Request Logging ─────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Root ────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Kisan Alert API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// ─── Error Handler ───────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  🌾 ════════════════════════════════════════════
     Kisan Alert API Server
     Running on http://localhost:${PORT}
     Health: http://localhost:${PORT}/api/health
  🌾 ════════════════════════════════════════════
  `);
});

export default app;
