import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

type BudgetRow = {
  id: number;
  category: string;
  month: string;
  amount: number;
};

const budgetSchema = z.object({
  category: z.string().min(1).max(60),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Use AAAA-MM'),
  amount: z.number().positive(),
});

budgetsRouter.get('/', (req: AuthedRequest, res) => {
  const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
  const budgets = db.prepare(`
    SELECT id, category, month, amount FROM budgets
    WHERE user_id = ? AND month = ?
    ORDER BY category
  `).all(req.userId, month);
  res.json(budgets);
});

budgetsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const { category, month, amount } = parsed.data;
  const existing = db.prepare(`
    SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?
  `).get(req.userId, category, month) as { id: number } | undefined;

  if (existing) {
    db.prepare('UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?')
      .run(amount, existing.id, req.userId);
    res.json({ id: existing.id, category, month, amount });
    return;
  }

  const result = db.prepare(`
    INSERT INTO budgets (user_id, category, month, amount) VALUES (?, ?, ?, ?)
  `).run(req.userId, category, month, amount);

  res.status(201).json({ id: Number(result.lastInsertRowid), category, month, amount });
});

budgetsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const result = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.userId);

  if (!result.changes) {
    res.status(404).json({ error: 'Orçamento não encontrado' });
    return;
  }

  res.status(204).send();
});
