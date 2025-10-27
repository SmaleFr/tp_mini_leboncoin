import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import env from './config/env.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import { uploadDir } from './config/paths.js';

const app = express();

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadDir));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
