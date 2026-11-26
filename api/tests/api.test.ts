import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secret-de-teste';

const { app } = await import('../src/app.js');
const request = (await import('supertest')).default;

test('health check responde', async () => {
  const res = await request(app).get('/api/health').expect(200);
  assert.equal(res.body.ok, true);
});

test('registro e resumo financeiro com SQL agregado', async () => {
  const email = `fin${Date.now()}@teste.com`;
  const registered = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dev Finanças', email, password: 'senha123' })
    .expect(201);
  const token = registered.body.token as string;

  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'Salário', amount: 5000, type: 'income', category: 'Trabalho', date: '2026-11-05' })
    .expect(201);

  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'Aluguel', amount: 1500, type: 'expense', category: 'Moradia', date: '2026-11-10' })
    .expect(201);

  const summary = await request(app)
    .get('/api/transactions/summary?month=2026-11')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(summary.body.income, 5000);
  assert.equal(summary.body.expense, 1500);
  assert.equal(summary.body.balance, 3500);
  assert.equal(summary.body.byCategory[0].category, 'Moradia');

  await request(app).get('/api/transactions').expect(401);
});

test('orçamento mensal por categoria é criado e atualizado', async () => {
  const email = `budget${Date.now()}@teste.com`;
  const registered = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dev Orçamento', email, password: 'senha123' })
    .expect(201);
  const token = registered.body.token as string;

  const created = await request(app)
    .post('/api/budgets')
    .set('Authorization', `Bearer ${token}`)
    .send({ category: 'Moradia', month: '2026-11', amount: 2000 })
    .expect(201);
  assert.equal(created.body.category, 'Moradia');

  await request(app)
    .post('/api/budgets')
    .set('Authorization', `Bearer ${token}`)
    .send({ category: 'Moradia', month: '2026-11', amount: 1800 })
    .expect(200);

  const listed = await request(app)
    .get('/api/budgets?month=2026-11')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(listed.body.length, 1);
  assert.equal(listed.body[0].amount, 1800);

  await request(app).get('/api/budgets').expect(401);
});

