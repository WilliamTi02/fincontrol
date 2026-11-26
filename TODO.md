# FinControl — status e bullets do currículo

## Concluído

- [x] Rodar API, front e testes localmente sem erro.
- [x] Explicar a query `SUM`/`GROUP BY` do endpoint `/summary`.
- [x] Edição de transação no front (Form → `PATCH /api/transactions/:id`).
- [x] Gráfico de barras com Recharts.
- [x] Importação de CSV (separador `,` ou `;`).
- [x] Orçamento mensal por categoria com alerta de limite excedido.
- [x] 3 testes automatizados da API (resumo agregado, orçamento, autenticação).
- [x] Build de produção da API e do front.

## Ainda pendente (opcional)

- [ ] Trocar SQLite por PostgreSQL.
- [ ] Deploy e link da demo no README.
- [ ] Autenticação com refresh token.

## Formato do CSV de importação

```csv
descricao,valor,tipo,categoria,data
Aluguel,1500,expense,Moradia,2026-11-10
Salario,5000,income,Trabalho,2026-11-05
```

## Bullets para o currículo — já com números reais

1. "Desenvolvi aplicação Full Stack de controle financeiro com React, TypeScript, Node.js/Express e SQL: CRUD de transações, edição, autenticação JWT e dashboard responsivo. https://github.com/WilliamTi02/fincontrol"
2. "Implementei **11 endpoints** REST e consultas agregadas com `SUM` e `GROUP BY` para calcular saldo e gastos por categoria, movendo o cálculo para o banco de dados."
3. "Criei gráfico com Recharts, importação de CSV e orçamento mensal por categoria com alerta de limite excedido."
4. "Escrevi **3 testes automatizados** da API cobrindo autenticação, agregação financeira e persistência de orçamentos."

> Só use estes bullets quando você conseguir abrir o repositório e mostrar cada item. Treine com o `GUIA_ENTREVISTA.md`.
