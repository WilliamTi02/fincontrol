import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

type TxRow = {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

const createSchema = z.object({
  description: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
});

const updateSchema = createSchema.partial();

transactionsRouter.get('/', (req: AuthedRequest, res) => {
  const type = String(req.query.type ?? '');
  const month = String(req.query.month ?? '');
  let sql = 'SELECT id, description, amount, type, category, date FROM transactions WHERE user_id = ?';
  const params: unknown[] = [req.userId];

  if (type === 'income' || type === 'expense') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (/^\d{4}-\d{2}$/.test(month)) {
    sql += ' AND date LIKE ?';
    params.push(`${month}%`);
  }
  sql += ' ORDER BY date DESC, id DESC';

  res.json(db.prepare(sql).all(...params));
});

transactionsRouter.get('/summary', (req: AuthedRequest, res) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE user_id = ? AND date LIKE ?
  `).get(req.userId, `${month}%`) as { income: number; expense: number };

  const byCategory = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE user_id = ? AND date LIKE ? AND type = 'expense'
    GROUP BY category
    ORDER BY total DESC
  `).all(req.userId, `${month}%`);

  res.json({
    month,
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
    byCategory,
  });
});

transactionsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const { description, amount, type, category, date } = parsed.data;
  const result = db.prepare(`
    INSERT INTO transactions (user_id, description, amount, type, category, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, description, amount, type, category, date);

  res.status(201).json({ id: Number(result.lastInsertRowid), description, amount, type, category, date });
});

transactionsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }

  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(id, req.userId) as TxRow | undefined;
  if (!current) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }

  const data = parsed.data;
  const merged = {
    description: data.description ?? current.description,
    amount: data.amount ?? current.amount,
    type: data.type ?? current.type,
    category: data.category ?? current.category,
    date: data.date ?? current.date,
  };

  db.prepare(`
    UPDATE transactions SET description = ?, amount = ?, type = ?, category = ?, date = ?
    WHERE id = ? AND user_id = ?
  `).run(merged.description, merged.amount, merged.type, merged.category, merged.date, id, req.userId);

  res.json({ id, ...merged });
});

transactionsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.userId);

  if (!result.changes) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }

  res.status(204).send();
});
