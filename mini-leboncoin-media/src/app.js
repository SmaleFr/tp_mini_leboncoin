import express from 'express';
import cors from 'cors';
import imagesRoutes from './routes/images.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/', imagesRoutes);

export default app;

