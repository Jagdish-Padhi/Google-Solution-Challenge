import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
// import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, '../uploads');

// const corsOptions = {
// 	origin: true,
// 	credentials: true,
// };

// app.use(
// 	helmet({
// 		crossOriginOpenerPolicy: { policy: 'unsafe-none' },
// 	}),
// );
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDirectory));

app.use(process.env.API_PREFIX || '/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
