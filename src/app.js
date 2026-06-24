import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from './modules/auth/auth.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import marketRoutes from './modules/market-data/market.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import portfolioRoutes from './modules/portfolio/portfolio.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use("/api/health", healthRoutes);


app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
