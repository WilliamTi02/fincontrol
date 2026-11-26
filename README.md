# FinControl — controle financeiro Full Stack

Projeto de portfólio: registre entradas e saídas e veja um resumo por categoria calculado no banco.

**Stack:** React + TypeScript (Vite) · Node.js + Express + TypeScript · SQLite (`node:sqlite`) · JWT · Zod · SQL agregado (`SUM`, `GROUP BY`) · testes com `node:test`.

## O que já funciona

- Cadastro/login com bcrypt e JWT.
- CRUD de transações com edição no front: descrição, valor, tipo, categoria e data.
- Filtro por tipo e por mês (`?type=expense&month=2026-11`).
- Endpoint `/api/transactions/summary`: total de entradas, saídas, saldo e gastos por categoria usando `SUM` e `GROUP BY`.
- Dashboard com cartões de resumo e gráfico de barras com Recharts.
- Importação de CSV (separador `,` ou `;`).
- Orçamento mensal por categoria com alerta quando o gasto passa do limite.
- 3 testes automatizados da API.

## Como rodar

```bash
# API
cd api
npm install
copy .env.example .env
npm run dev        # http://localhost:4001

# Front (outro terminal)
cd web
npm install
npm run dev        # http://localhost:5174
```

Testes:

```bash
cd api
npm test
```

## Status e bullets do currículo

As tarefas principais já foram implementadas. Veja `TODO.md` para o que foi feito, o formato do CSV, o que ficou opcional e os bullets prontos para o currículo com números reais.

Para treinar a entrevista, leia `..\GUIA_ENTREVISTA.md` e responda em voz alta as perguntas deste projeto.
