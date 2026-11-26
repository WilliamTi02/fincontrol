import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { budgetsRouter } from './routes/budgets.js';
import { transactionsRouter } from './routes/transactions.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fincontrol-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
