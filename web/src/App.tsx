import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from './api';

type Tx = {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

type Summary = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  byCategory: Array<{ category: string; total: number }>;
};

type Budget = {
  id: number;
  category: string;
  month: string;
  amount: number;
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('fincontrol_token') ?? '');
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [txs, resumo, orcamentos] = await Promise.all([
      api<Tx[]>(`/api/transactions?month=${month}`),
      api<Summary>(`/api/transactions/summary?month=${month}`),
      api<Budget[]>(`/api/budgets?month=${month}`),
    ]);
    setTransactions(txs);
    setSummary(resumo);
    setBudgets(orcamentos);
  }

  useEffect(() => {
    if (!token) return;
    load().catch((e: Error) => setError(e.message));
  }, [token, month]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const path = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };
      const data = await api<{ token: string }>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      localStorage.setItem('fincontrol_token', data.token);
      setToken(data.token);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function resetForm() {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await api(editingId ? `/api/transactions/${editingId}` : '/api/transactions', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          description,
          amount: Number(amount),
          type,
          category,
          date,
        }),
      });
      resetForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(tx: Tx) {
    setEditingId(tx.id);
    setDescription(tx.description);
    setAmount(String(tx.amount));
    setType(tx.type);
    setCategory(tx.category);
    setDate(tx.date);
  }

  async function remove(id: number) {
    try {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ category: budgetCategory, month, amount: Number(budgetAmount) }),
      });
      setBudgetCategory('');
      setBudgetAmount('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const separator = lines[0]?.includes(';') ? ';' : ',';
      let imported = 0;

      for (const line of lines.slice(1)) {
        const [desc, value, kind, cat, day] = line
          .split(separator)
          .map((field) => field.trim().replace(/^"|"$/g, ''));
        if (!desc || !value || !day || Number.isNaN(Number(value))) continue;
        await api('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            description: desc,
            amount: Number(value),
            type: kind === 'income' ? 'income' : 'expense',
            category: cat || 'Outros',
            date: day,
          }),
        });
        imported += 1;
      }

      await load();
      setMessage(`${imported} transação(ões) importada(s) de ${file.name}.`);
    } catch (e) {
      setError((e as Error).message);
    }

    event.target.value = '';
  }

  if (!token) {
    return (
      <main className="auth-page">
        <form className="card auth-card" onSubmit={handleAuth}>
          <h1>FinControl</h1>
          <p>Controle suas entradas, saídas e orçamentos.</p>
          {isRegister && (
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">{isRegister ? 'Criar conta' : 'Entrar'}</button>
          <button type="button" className="link" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Já tenho conta' : 'Criar conta'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>FinControl</h1>
          <span>Resumo mensal</span>
        </div>
        <div className="topbar-actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button
            type="button"
            className="link"
            onClick={() => {
              localStorage.removeItem('fincontrol_token');
              setToken('');
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      <section className="cards">
        <article className="card">
          <span>Entradas</span>
          <strong className="green">{money(summary?.income ?? 0)}</strong>
        </article>
        <article className="card">
          <span>Saídas</span>
          <strong className="red">{money(summary?.expense ?? 0)}</strong>
        </article>
        <article className="card">
          <span>Saldo</span>
          <strong>{money(summary?.balance ?? 0)}</strong>
        </article>
      </section>

      <section className="grid">
        <form className="card" onSubmit={saveTransaction}>
          <h2>{editingId ? 'Editar transação' : 'Nova transação'}</h2>
          <label>
            Descrição
            <input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <label>
            Valor
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
          </label>
          <label>
            Categoria
            <input value={category} onChange={(e) => setCategory(e.target.value)} required />
          </label>
          <label>
            Data
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Salvar alterações' : 'Adicionar'}</button>
            {editingId && (
              <button type="button" className="link" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <h2>Gastos por categoria</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.byCategory ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(summary?.byCategory.length ?? 0) === 0 && <p>Sem gastos neste mês.</p>}
        </div>
      </section>

      <section className="card">
        <h2>Orçamento por categoria · {month}</h2>
        <form className="budget-form" onSubmit={saveBudget}>
          <input
            placeholder="Categoria"
            value={budgetCategory}
            onChange={(e) => setBudgetCategory(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Limite (R$)"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            required
          />
          <button type="submit">Definir limite</button>
        </form>
        {budgets.map((budget) => {
          const spent = summary?.byCategory.find((item) => item.category === budget.category)?.total ?? 0;
          const exceeded = spent > budget.amount;
          return (
            <div className="budget-row" key={budget.id}>
              <span>{budget.category}</span>
              <span className={exceeded ? 'red' : ''}>
                {money(spent)} / {money(budget.amount)} {exceeded && '· ACIMA DO LIMITE'}
              </span>
            </div>
          );
        })}
        {budgets.length === 0 && <p>Nenhum limite definido.</p>}
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Transações ({transactions.length})</h2>
          <label className="file-label">
            Importar CSV
            <input type="file" accept=".csv,text/csv" onChange={(e) => void importCsv(e)} />
          </label>
        </div>
        {transactions.map((tx) => (
          <div className="tx" key={tx.id}>
            <div>
              <strong>{tx.description}</strong>
              <small>{tx.category} · {tx.date}</small>
            </div>
            <span className={tx.type === 'income' ? 'green' : 'red'}>
              {tx.type === 'income' ? '+' : '-'} {money(tx.amount)}
            </span>
            <button type="button" className="link" onClick={() => startEdit(tx)}>
              Editar
            </button>
            <button type="button" className="danger" onClick={() => void remove(tx.id)}>
              Excluir
            </button>
          </div>
        ))}
        {transactions.length === 0 && <p>Nenhuma transação neste mês.</p>}
      </section>
    </main>
  );
}
