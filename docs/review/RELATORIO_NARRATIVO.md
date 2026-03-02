# PF Advogados ERP — Relatorio Narrativo & Sugestoes de Melhoria

**Data**: 2026-03-02
**Autor**: Auditoria tecnica automatizada
**Formato**: Leitura corrida com diagnostico e recomendacoes por area

---

## Introducao

Este documento apresenta uma leitura completa do sistema PF Advogados ERP, cobrindo
cada camada da aplicacao — desde a arquitetura de frontend ate o modelo de dados,
passando por seguranca, experiencia do usuario e infraestrutura. Para cada area,
o texto descreve o estado atual, aponta os pontos fortes, identifica fragilidades
e propoe sugestoes concretas de melhoria.

O sistema foi construido sobre Next.js 16 com App Router, React 19, TypeScript strict,
Tailwind CSS v4 e Drizzle ORM. Conta com 35 rotas, 15 componentes compartilhados,
27 tabelas modeladas e 11 schemas de validacao. E um prototipo funcional ambicioso
e bem estruturado — mas que ainda opera inteiramente com dados em memoria e
autenticacao simulada.

---

## 1. Arquitetura Geral

### Estado atual

A aplicacao segue o padrao App Router do Next.js, com todas as rotas protegidas
dentro de um grupo `(dashboard)` que compartilha layout (sidebar + header). Cada
modulo de negocio tem seu proprio diretorio e, quando necessario, sub-rotas para
aprovacoes e detalhamento.

A separacao de responsabilidades esta clara: componentes de UI em `src/components/`,
server actions em `src/lib/actions/`, tipos e regras de aprovacao em `src/lib/approval/`,
schemas de validacao em `src/lib/schemas/`, e o modelo de dados em `src/lib/db/schema.ts`.

### Pontos fortes

A modularidade por dominio e notavel. Cada modulo (Leads, Propostas, Casos, Financeiro,
Contas a Pagar, Time Tracking) vive em seu proprio diretorio com suas proprias sub-rotas.
Isso facilita a navegacao do desenvolvedor e permite que equipes trabalhem em paralelo
sem conflitos constantes de merge.

O schema Drizzle com 27 tabelas demonstra maturidade de modelagem. As relacoes estao
bem definidas — um `case` (caso) referencia `client`, `proposal` e `user`, enquanto
`timeEntries`, `tasks`, `billingPlans` e `invoices` referenciam `case`. Isso cria um
grafo relacional coerente que espelha o fluxo real de um escritorio de advocacia.

### Sugestoes de melhoria

**Aproveitar melhor Server Components.** Hoje, quase todas as paginas usam
`"use client"` na primeira linha. Isso significa que o React envia todo o JavaScript
para o navegador, mesmo em paginas que poderiam ser renderizadas inteiramente no servidor.
A recomendacao e separar cada pagina em duas camadas:

- Um Server Component (a `page.tsx` em si) que faz o data fetch e passa dados como props.
- Um Client Component (ex: `leads-table.tsx`) que recebe os dados e gerencia interatividade.

Isso reduz o bundle enviado ao browser, melhora o tempo de First Contentful Paint e
permite cache automatico via RSC. A migracao pode ser gradual, modulo por modulo.

**Criar um barrel de re-export para server actions.** Hoje cada pagina importa
diretamente de `src/lib/actions/leads.ts`, `src/lib/actions/cases.ts`, etc. Um
arquivo `src/lib/actions/index.ts` que re-exporta tudo simplifica os imports e
permite refatorar internamente sem mudar os consumidores.

---

## 2. Seguranca

### Estado atual

A autenticacao usa NextAuth v5 com um provider mock de Credentials que retorna sempre
o mesmo usuario ("Fernando Brasil", role "socio") sem verificar credenciais. O sistema
tem suporte preparado para Azure AD — as variaveis de ambiente estao definidas no
`.env.example`, os callbacks JWT ja propagam `azureId` e `role`, e o tipo `next-auth.d.ts`
esta estendido. Porem, nenhum provider real esta conectado.

O middleware RBAC protege apenas 2 das 35 rotas (`/cofre` e `/configuracoes`). Todas
as demais rotas exigem autenticacao mas nao verificam o role do usuario.

### Vulnerabilidades criticas

A vulnerabilidade mais grave esta nas server actions de aprovacao. O `userRole` e
recebido como parametro do client-side — ou seja, qualquer usuario pode forjar uma
request passando `"socio"` como role e aprovar contas a pagar, titulos a receber ou
apontamentos de horas. Isso e uma escalacao de privilegio trivial.

O `AUTH_SECRET` no `.env.local` e uma string legivel (`p3ix0t0f3it3ir0adv0gad0s2025replaceme`)
em vez de um valor criptografico gerado com `openssl rand -base64 32`. Se esse secret
vazar, tokens JWT podem ser forjados externamente.

### Sugestoes de melhoria

**1) Ler o role do servidor, nunca do client.** Em cada server action, chamar
`const session = await auth()` e extrair o role de `session.user.role`. Remover
completamente o parametro `userRole` da interface publica das functions.

**2) Gerar um AUTH_SECRET forte imediatamente.** Executar `openssl rand -base64 32`
e substituir o valor no `.env.local`. Documentar no `.env.example` que este valor
NUNCA deve ser legivel por humanos.

**3) Expandir o RBAC middleware.** Rotas financeiras (`/financeiro`, `/contas-a-pagar`,
`/faturamento`) devem exigir roles `socio`, `admin` ou `financeiro`. Rotas de
aprovacao (`*/aprovacoes`) devem exigir `socio` ou `admin`. A rota `/workflows`
deve ser restrita a `socio` e `admin`. A expansao e simples — basta adicionar entradas
ao objeto `ROLE_ROUTES` no `middleware.ts`.

**4) Adicionar headers de seguranca.** O `next.config.ts` deve exportar `headers()`
com Content-Security-Policy, X-Frame-Options, X-Content-Type-Options e
Strict-Transport-Security. Isso bloqueia ataques comuns como clickjacking e
injection de scripts de terceiros.

**5) Implementar rate limiting.** No minimo, o endpoint de login deve ter um limite
de 5 tentativas por IP a cada 15 minutos. Server actions de mutacao (criar, aprovar,
excluir) devem ter um teto por sessao. O pacote `@upstash/ratelimit` e uma opcao
leve para MVP; para producao, considerar um API Gateway com rate limiting nativo.

**6) Enforced Zod em todas as server actions.** Os 11 schemas ja estao escritos —
basta adicionar `.parse(input)` no inicio de cada action. Isso previne injection
de campos inesperados e garante que tipos estejam corretos antes de tocar no banco.

---

## 3. Banco de Dados & Dados

### Estado atual

O schema Drizzle define 27 tabelas com relations completas, tipos exportados e
enums bem definidos. Drizzle Kit esta instalado como dev dependency. Entretanto,
nao ha conexao real com um banco PostgreSQL — nenhum pool configurado, nenhuma
migration gerada, nenhum seed de dados iniciais. Toda a aplicacao opera com
`useState` e arrays hardcoded que reiniciam a cada refresh do browser.

### Pontos fortes

O modelo de dados e impressionantemente maduro para a fase do projeto. A cadeia
relacional completa esta modelada: `leads → proposals → clients → cases → tasks →
timeEntries → preInvoices → invoices → arTitles → bankTransactions → reconciliationMatches`.
A tabela `auditLogs` com `tableName`, `recordId`, `action`, `before` e `after` (JSONB)
esta pronta para um audit trail completo. A tabela `rules` esta preparada para
o motor de workflows.

### Fragilidades

Nenhum index alem de PKs. Em producao, queries frequentes como "listar contas a pagar
pendentes por data de vencimento" ou "buscar leads por status e responsavel" serao
lentas sem indexes compostos.

Nao ha soft-delete. Toda exclusao e permanente. Para um ERP juridico, onde documentos
e registros podem precisar ser restaurados ou auditados, isso e um risco operacional.

A tabela `auditLogs` existe no schema mas nunca e populada. Os server actions de
aprovacao fazem apenas `console.log`. Em producao, cada mutacao (criar, editar,
excluir, aprovar, rejeitar) precisa gerar uma entrada no audit log.

### Sugestoes de melhoria

**1) Conectar o banco em etapas.** Criar `src/lib/db/index.ts` com um pool de conexao
que le `DATABASE_URL` do `.env.local`. Usar `drizzle-kit generate` para gerar a
primeira migration. Usar `drizzle-kit push` para aplicar em um PostgreSQL local
(via Docker Compose). Criar um script de seed com: 1 tenant, roles basicos
(socio, admin, advogado, financeiro), 1 usuario admin, e categorias iniciais.

**2) Migrar modulo por modulo.** Nao tentar substituir todo o mock de uma vez.
Comecar pelo modulo de Leads (mais simples, sem aprovacao), depois Casos, depois
Contas a Pagar (que envolve aprovacao). Cada migracao segue o padrao:
`page.tsx` (server component com fetch) → `leads-table.tsx` (client component com UI).

**3) Adicionar indexes estrategicos.** No schema Drizzle, usar `.index()` em:
- `leads`: `status`, `temperature`, `responsibleId`
- `cases`: `clientId`, `status`, `responsibleId`
- `accountsPayable`: `approvalStatus`, `dueDate`, `supplierId`
- `timeEntries`: `caseId`, `userId`, `date`, `approvalStatus`
- `arTitles`: `clientId`, `status`, `dueDate`
- `auditLogs`: `tableName`, `createdAt`

**4) Implementar soft-delete global.** Adicionar `deletedAt` (timestamp, nullable) nas
tabelas de negocio. Criar um helper `withActive(query)` que adiciona
`WHERE deletedAt IS NULL` automaticamente. Server actions de "excluir" devem fazer
`UPDATE SET deletedAt = now()` em vez de `DELETE`. Apenas admins podem ver e
restaurar registros soft-deleted.

**5) Popular audit logs em cada mutacao.** Criar um helper:
```
logAudit({ table, recordId, action, userId, before?, after? })
```
Chamar em toda server action de create/update/delete/approve/reject. O `before`
e o estado anterior (para updates), e `after` e o novo estado. Dados sensiveis
(email, CPF/CNPJ) devem ser mascarados no log.

---

## 4. Sistema de Aprovacoes

### Estado atual

O modulo de aprovacoes e um dos mais bem arquitetados do sistema. Ele define uma
authority matrix (`APPROVAL_AUTHORITY`) que mapeia qual role pode aprovar cada tipo
de entidade (payable, receivable, time_entry). Transition maps definem os caminhos
validos de status — por exemplo, um payable pode ir de `pendente` para `aprovado` ou
`rejeitado`, de `aprovado` para `agendado`, e de `agendado` para `pago`.

Quatro componentes UI compartilhados (`ApprovalBadge`, `ApprovalActions`,
`ApprovalDialog`, `BatchApprovalBar`) sao reutilizados em 9 paginas do sistema,
cobrindo Contas a Pagar, Financeiro (Contas a Receber) e Time Tracking.

A pagina `/aprovacoes` funciona como hub centralizado que agrega pendencias de
todos os modulos em uma unica tela.

### Pontos fortes

A separacao entre tipos (`approval/types.ts`), logica de negocio (`approval/actions.ts`)
e componentes de UI (`components/approval/`) e exemplar. Adicionar um novo modulo
ao sistema de aprovacoes requer apenas: definir um novo `ApprovalEntityType`, adicionar
ao `APPROVAL_AUTHORITY`, criar transition map, e usar os componentes existentes na
nova pagina.

Os transition maps previnem transicoes invalidas. Um titulo `pago` nao pode voltar
a `pendente`. Um time entry `faturado` nao pode ser rejeitado. Essas regras de
negocio estao codificadas de forma declarativa e sao faceis de auditar.

### Sugestoes de melhoria

**1) Corrigir a vulnerabilidade de role (prioridade maxima).** Como descrito na
secao de seguranca, o `userRole` nao pode vir do client. Esta e a correcao mais
urgente de todo o sistema.

**2) Adicionar aprovacao em cascata.** Para valores acima de um threshold (ex: R$ 50.000),
exigir duas aprovacoes (socio + admin). Isso pode ser implementado adicionando um
campo `approvalLevel` e `requiredApprovals` na authority matrix.

**3) Registrar historico de aprovacao.** Cada acao de aprovar/rejeitar deve gerar
um registro com: quem aprovou, quando, de qual status para qual, e o comentario
(no caso de rejeicao). Isso alimenta o audit log e permite rastrear a cadeia
de decisao.

**4) Notificar o aprovador.** Quando uma nova entidade entra no status `pendente`,
o sistema deve notificar os usuarios com role de aprovador. Inicialmente por badge
no header; futuramente por email ou integração com Teams/Slack.

**5) Adicionar faturamento ao sistema de aprovacao.** Pre-faturas (`preInvoices`)
ja estao modeladas no schema com status `draft`, `review`, `approved`, `invoiced`.
Criar o mesmo padrao de aprovacao que ja existe para payable/receivable/time_entry.

---

## 5. CRM & Pipeline Comercial

### Estado atual

O modulo de Leads tem uma unica pagina com lista agrupada por status (pipeline),
usando o pattern de collapsible groups com `ChevronRight`. Os dados sao hardcoded
em `INITIAL_LEADS` dentro do proprio componente. A conversao de lead para proposta
e simulada — a pagina de propostas tem um editor de 4 tabs (Dados, Escopo, Valores,
Preview) com um fluxo de aprovacao dedicado.

A cadeia conceitual e: Lead → Proposta → (Aprovacao) → Cliente + Caso.

### Sugestoes de melhoria

**1) Implementar a conversao real Lead → Proposta.** Hoje o fluxo e simulado.
A proposta deveria herdar os dados do lead (empresa, contato, email) automaticamente,
e o lead deveria ter seu status atualizado para `proposta_enviada` quando a proposta
for criada.

**2) Implementar a conversao Proposta → Caso.** A pagina de aprovacao de proposta
ja tem o botao "Aprovar & Gerar Caso", mas a acao e mock. Ao aprovar, o sistema
deveria: (a) criar um registro de `client` se nao existir, (b) criar um `case`
vinculado ao client e a proposta, (c) criar um `billingPlan` com os parametros
da proposta, e (d) atualizar o status do lead para `ganho`.

**3) Dashboard CRM mais rico.** O dashboard atual tem um funil horizontal basico.
Considerar adicionar: valor total por estagio do pipeline, taxa de conversao
(leads ganhos / leads totais), tempo medio por estagio, e top leads por valor
estimado.

**4) Atividades e follow-ups.** O schema ja tem a tabela `meetings` vinculada a leads.
Implementar uma timeline de atividades no detalhe do lead — calls, emails, reunioes,
anotacoes. O Fireflies API Key no `.env.example` sugere integracao futura com
transcricao de reunioes.

---

## 6. Modulo Financeiro

### Estado atual

O financeiro esta dividido em cinco areas: Contas a Receber (`/financeiro`), Contas a
Pagar (`/contas-a-pagar`), Faturamento (`/faturamento`), Fluxo de Caixa
(`/fluxo-de-caixa`) e Conciliacao Bancaria (`/conciliacao-bancaria`). Cada um tem
sua propria UI com dados mock. O sistema de aprovacao cobre payables e receivables.

O Cofre dos Socios (`/cofre`) agrega dados de rentabilidade por socio — distribuicoes,
horas faturadas, resultado por caso. E protegido por RBAC (socio/admin).

### Pontos fortes

A cadeia completa de faturamento esta modelada no schema:
`billingPlan → preInvoice → invoice → arTitle → bankTransaction → reconciliationMatch`.
Isso permite rastrear desde o plano de cobranca ate a conciliacao bancaria.

Quatro tipos de billing estao previstos: `mensal_fixo`, `hora_trabalhada`, `exito`
e `hibrido`. O schema de `billingPlans` tem campos para todos eles (valor mensal,
taxa horaria, horas incluidas, taxa de excedente, percentual de exito).

### Sugestoes de melhoria

**1) Implementar o "Engine de Faturamento".** A pagina de faturamento tem um botao
"Rodar Engine" que e mock. O engine real deveria: (a) para cada caso ativo, buscar o
billing plan, (b) calcular o valor do periodo (fixo, ou horas * taxa), (c) aplicar
impostos (ISS, PIS, COFINS — a `taxRate` ja esta no schema), (d) gerar pre-faturas
para revisao, (e) apos aprovacao, emitir NFSe via integracao (variaveis `NFSE_PROVIDER_*`
ja no `.env.example`).

**2) Fluxo de caixa projetado.** O grafico atual mostra dados mock. O fluxo de caixa
real deveria agregar: receitas previstas (AR com status `open`), despesas previstas
(AP com status `aprovado` ou `agendado`), e receitas/despesas realizadas (baixadas).
O schema ja tem `cashflowDaily` que pode ser populado por um job diario.

**3) Conciliacao bancaria automatica.** O modulo de conciliacao tem UI de matching
manual. Considerar: (a) importacao de extrato bancario via OFX/CSV, (b) matching
automatico por valor + data + referencia, (c) sugestoes de match com score de
confianca, (d) conciliacao em lote.

**4) DRE e balancete.** A pagina de contabilidade e placeholder. Implementar um
DRE (Demonstracao do Resultado do Exercicio) que agrega receitas e despesas por
centro de custo, e um balancete que cruza com os planos de contas.

---

## 7. Experiencia do Usuario (UI/UX)

### Estado atual

O design system e consistente: tokens CSS bem definidos (`pf-blue`, `pf-black`, `pf-grey`),
tipografia Inter para UI e JetBrains Mono para valores numericos, e um pattern
de PageHeader + Toolbar + Table replicado em todas as paginas de listagem.

A sidebar dual-panel (80px rail + 256px expandivel) e sofisticada, com favoritos
persistidos em localStorage, busca de modulos, e agrupamento por categorias.

### Fragilidades

Nao ha componentes base reutilizaveis para Button, Input, Select e Modal. Cada pagina
repete as mesmas classes Tailwind inline para botoes (`rounded-md bg-pf-blue px-3 py-1.5
font-sans text-xs font-bold text-white...`) e inputs (`border border-pf-grey/20
bg-pf-grey/5 p-2 text-sm...`). Isso cria risco de inconsistencia visual e torna
refatoracoes globais trabalhosas.

A aplicacao nao e responsiva. A sidebar e fixa em 80px/256px, as tabelas nao tem
scroll horizontal, e nao ha breakpoints para telas menores que 1024px. Em um tablet
ou celular, a interface e inutilizavel.

Nao ha error boundaries (`error.tsx`), loading states (`loading.tsx`) ou paginas
404 customizadas. Se uma pagina falhar, o usuario ve a tela de erro padrao do Next.js.
Se a navegacao for lenta, nao ha feedback visual.

### Sugestoes de melhoria

**1) Criar um kit de componentes base.** Priorizar:
- `Button` com variants (primary, secondary, ghost, danger) e sizes (sm, md)
- `Input` com label, placeholder, error state e icon slot
- `Select` com opcoes e estado controlado
- `Modal`/`Dialog` com overlay, focus trap e animacao de entrada
- `Badge` unificando os patterns de status que ja existem

Esses 5 componentes eliminam 80% da repeticao de classes inline e garantem
consistencia visual mesmo quando novos desenvolvedores entram no projeto.

**2) Tornar a sidebar responsiva.** Abaixo de `lg` (1024px), a sidebar deve
colapsar em um hamburger menu com drawer. O content area deve ocupar 100%
da largura. Tabelas devem ter `overflow-x-auto` para scroll horizontal.

**3) Adicionar error.tsx e loading.tsx.** Um `error.tsx` no grupo `(dashboard)` com
mensagem amigavel em portugues e botao "Tentar novamente" (que chama `reset()`).
Um `loading.tsx` com skeleton layout que espelha a estrutura de PageHeader + Table.
Esses dois arquivos cobrem todos os modulos de uma vez como fallback global.

**4) Dark mode.** O design system baseado em tokens CSS facilita: basta definir
valores alternativos dentro de `@media (prefers-color-scheme: dark)` ou um toggle
manual com classe no `<html>`. As cores atuais (`pf-blue`, `pf-black`, `pf-grey`,
`background`) precisariam de variantes dark.

**5) Acessibilidade basica.** Adicionar: skip-to-content link no layout, `aria-label`
em todos os botoes de icone (varios botoes hoje tem apenas o icone sem texto acessivel),
focus visible em todos os elementos interativos, e contraste WCAG AA (4.5:1) em
todos os textos.

---

## 8. Qualidade de Codigo & Testes

### Estado atual

O projeto usa TypeScript strict, ESLint com `eslint-config-next`, mas nao tem
Prettier, nenhum test runner instalado, e zero testes automatizados de qualquer tipo.
Nao ha pipelines de CI/CD.

### Impacto

Sem testes, cada mudanca no codigo e um risco. Refatorar o sistema de aprovacoes
(que e o mais critico) sem testes e como trocar o motor de um aviao em voo. A
ausencia de CI/CD significa que erros de tipo, lint e build so sao descobertos
quando o desenvolvedor executa manualmente.

### Sugestoes de melhoria

**1) Instalar Vitest como test runner.** Vitest integra naturalmente com o ecossistema
Vite/Next.js, suporta TypeScript out of the box, e tem sintaxe familiar (describe/it/expect).
Comecar com testes para:
- `canUserApprove()` — testar todas combinacoes role x entity type
- Transition maps — verificar que transicoes invalidas sao rejeitadas
- `approveEntity` / `rejectEntity` — com mock de sessao

**2) Configurar GitHub Actions CI.** Um workflow simples com 4 steps:
`npm ci → npx tsc --noEmit → npm run lint → npm test → npx next build`.
Rodar em PRs e push para main. Bloquear merge se falhar.

**3) Adicionar Prettier.** Com config: `tabWidth: 4`, `printWidth: 120`,
`singleQuote: false`, `trailingComma: "all"`. Rodar como check no CI.
Formatacao consistente reduz diffs desnecessarios em PRs.

**4) Testes e2e com Playwright.** Apos os testes unitarios, adicionar fluxos
end-to-end para os caminhos criticos: login → criar lead → enviar proposta →
aprovar → gerar caso. Isso valida a integracao entre modulos.

---

## 9. Infraestrutura & Deploy

### Estado atual

Nao ha Dockerfile, docker-compose, pipelines CI/CD, estrategia de backup,
separacao de ambientes (staging/production), health check, logging estruturado
ou APM. O projeto roda exclusivamente em `npm run dev` local.

### Sugestoes de melhoria

**1) Docker Compose para desenvolvimento.** Um `docker-compose.yml` com dois
servicos: `app` (Next.js) e `db` (PostgreSQL). Volume persistente para dados do
banco. Comando unico `docker compose up` para subir todo o ambiente.

**2) Dockerfile multi-stage para producao.** Tres stages: `deps` (instala dependencias),
`build` (compila Next.js), `runner` (imagem minima com output standalone).
Resultado: imagem de ~150MB com tudo necessario para rodar.

**3) Logging com Pino ou Winston.** Substituir `console.log` por um logger estruturado
que emite JSON com timestamp, level, module, e context. Em desenvolvimento, formatar
com cores. Em producao, enviar para um agregador (Datadog, Grafana Loki, ou ate
CloudWatch).

**4) Sentry para error tracking.** O SDK do Sentry para Next.js captura erros no
client e no server automaticamente, com stack traces, breadcrumbs e context do
usuario. Integracao em 15 minutos.

**5) Health check endpoint.** Criar `/api/health` que verifica: conexao com banco
(ping), versao da app, e uptime. Util para load balancers e monitoring.

---

## 10. Observacoes sobre Multi-tenancy

O sistema atual e single-tenant. Nao ha coluna `tenantId` em nenhuma tabela,
nenhum filtro de tenant nas queries, e nenhum conceito de organizacao ou workspace.

Para um ERP SaaS que atenda multiplos escritorios, multi-tenancy e eventual mas
nao imediato. A recomendacao e:

**Fase 1 (agora):** Nao implementar multi-tenancy ainda. Focar em corrigir seguranca,
conectar banco, e entregar valor para o primeiro cliente (PF Advogados). Tentar
abstrair tenant muito cedo adiciona complexidade sem retorno.

**Fase 2 (quando houver segundo cliente):** Adicionar `tenantId` (UUID) em todas
as tabelas de negocio. Criar middleware que injeta o tenant no context da request
a partir do dominio ou do JWT. Todas as queries automaticamente filtram por tenant
via helper `withTenant(query, tenantId)`.

**Fase 3 (escala):** Avaliar se shared-DB com row-level security e suficiente ou
se schema-per-tenant ou DB-per-tenant sao necessarios. Para a maioria dos escritorios
de advocacia (< 100 usuarios), shared-DB com RLS e mais que suficiente.

---

## 11. Roadmap Sugerido

### Mes 1 — Fundacao Segura

Foco: corrigir os 5 riscos P0 e estabelecer baseline de qualidade.

- Corrigir role em server actions (ler da sessao)
- Gerar AUTH_SECRET criptografico
- Instalar Vitest + testes do modulo de aprovacao
- Configurar GitHub Actions CI (lint + type-check + test + build)
- Criar error.tsx e loading.tsx no grupo (dashboard)
- Adicionar CSP e security headers
- Expandir RBAC middleware

### Mes 2 — Conexao com Banco

Foco: sair do mock e operar com dados reais.

- Configurar PostgreSQL local via Docker Compose
- Gerar migrations com Drizzle Kit
- Criar seeds com dados iniciais
- Migrar Leads para dados reais (primeiro modulo)
- Migrar Casos para dados reais
- Migrar Contas a Pagar para dados reais (com aprovacao)
- Implementar audit logs reais

### Mes 3 — Autenticacao & Faturamento

Foco: autenticacao real e motor de faturamento.

- Implementar Azure AD provider
- Mapear groups do Azure AD para roles
- Implementar engine de faturamento (billing plans → pre-faturas)
- Integrar emissao de NFSe (via provider externo)
- Fluxo de caixa com dados reais

### Mes 4 — Polimento & Deploy

Foco: experiencia do usuario e infraestrutura de producao.

- Kit de componentes base (Button, Input, Select, Modal)
- Responsividade mobile (sidebar + tabelas)
- Dockerfile multi-stage
- Deploy em staging (Vercel ou Azure)
- Sentry para error tracking
- Logging estruturado

---

## Conclusao

O PF Advogados ERP e um prototipo funcional que demonstra visao de produto e
maturidade de modelagem. A cadeia completa de um escritorio de advocacia esta
representada — do lead ao caso, do apontamento de horas a fatura, da conciliacao
bancaria ao cofre dos socios.

O caminho de prototipo para produto e claro: corrigir seguranca (1-2 semanas),
conectar banco (2-3 semanas), autenticacao real (1 semana), e polimento (ongoing).
A arquitetura modular facilita cada passo — nao e necessario reescrever nada,
apenas preencher os "TODOs" que o proprio codigo ja aponta.

O principal risco nao e tecnico — e o tempo. Cada semana com dados mock e auth
simulada e uma semana em que o sistema nao pode ser testado por usuarios reais.
A recomendacao e priorizar o caminho mais curto para um MVP testavel: seguranca
basica → banco real → auth real → deploy em staging → feedback de usuarios.
