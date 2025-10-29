import express from 'express';
import cors from 'cors';
import imagesRoutes from './routes/images.routes.js';
import { metrics, incRequests } from './metrics.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics: count every incoming HTTP request
app.use((req, res, next) => {
  incRequests();
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Expose simple in-memory metrics
app.get('/metrics', (req, res) => {
  res.json({
    http: { requestsTotal: metrics.http.requestsTotal },
    images: { bytesTotal: metrics.images.bytesTotal },
  });
});

app.use('/', imagesRoutes);

export default app;
