import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import laptopRoutes from './routes/laptopRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/laptops', laptopRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
