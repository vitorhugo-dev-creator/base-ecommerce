# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modular e-commerce boilerplate for small stores, built with Node.js + Express + SQLite. Single-file backend (server.js) with static frontend.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Development (nodemon auto-reload)
npm run build:store  # Build React SPA para produção (gera public-react/)
npm run dev:store    # Dev server React isolado (porta 5173)
npm start            # Production
```

Database auto-creates in `data/store.db` on first run.

## Architecture

### Backend (server.js)

All API routes and business logic live in a single file. Key patterns:

- **Auth**: bcrypt password hashing, express-session middleware
- **Database**: better-sqlite3 synchronous API with prepared statements
- **Image uploads**: multer + sharp for compression to 800x800 JPEG in `public/products/`
- **PIX payments**: QR code generation via qrcode library
- **Protected routes**: `requireAdmin` middleware checks `req.session.adminId`
- **SMTP**: nodemailer for admin order notifications

### Database Schema

- `store_settings` — key/value store for theme, WhatsApp, PIX key
- `admin_users` — username/password (default: admin/admin123)
- `products` — id, name, description, category, price, image_url, tags, promo_percent, active
- `product_images` — extra images per product with sort_order
- `orders` — id, order_code, customer info, items (JSON), total, payment/order status

### Frontend Structure (React SPA)

Frontend built with **React + React Router + Vite**. All apps live in `src/`:

| App | Route | Descrição |
|-----|-------|-----------|
| **Store** | `/vitordev`, `/vitordev/catalogo`, `/vitordev/rastreio` | Loja do cliente |
| **Admin** | `/vitordev/admin/*` | Painel (dashboard, produtos, pedidos, configurações) |
| **CRM** | `/vitordev/CRM` | Analytics / Command Center |

```
src/
├── store/           → Loja (Navbar, Hero, ProductGrid, ProductModal, CartDrawer, Footer)
│   ├── components/  → Navbar, Hero, ProductCard, ProductGrid, ProductModal, CartDrawer, ToastContainer, Footer
│   ├── pages/       → CatalogPage, TrackingPage
│   └── StoreContext.jsx
├── admin/           → Painel admin
│   ├── components/  → Sidebar
│   ├── hooks/      → useAuth
│   └── pages/       → Dashboard, Products, Orders, Settings, Login
├── crm/             → CRM Analytics
│   └── components/  → CrmHeader, CrmKPIs, CrmCharts, CrmRankings
└── styles/global.css → CSS compartilhado (variáveis, botões, cards, tables, CRM neon)
```

Build output → `public-react/`. Express serves it automatically if the directory exists.

### CRM Analytics (Command Center)

- `/api/admin/analytics` — mensal, produtos, status, pagamento, clientes, performance
- Neon aesthetic: `#00f5a0` green, `#00d4ff` cyan, `#ff2d78` pink, `#ffc200` yellow
- Bar charts, dot charts, donut, ring charts, horizontal bars, rank lists

## API Endpoints

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/products` | public |
| POST | `/api/orders` | public |
| GET | `/api/orders/track/:code` | public |
| GET | `/api/settings` | public |
| POST | `/api/admin/login` | - |
| GET | `/api/admin/check` | - |
| GET | `/api/admin/dashboard` | admin |
| POST/DELETE | `/api/admin/products` | admin |
| PUT | `/api/admin/orders/:id` | admin |
| GET | `/api/admin/analytics` | admin |

# Projeto: E-commerce de Produtos Feitos à Mão

## Propósito (WHY)
Este repositório contém uma plataforma de venda de produtos artesanais. O objetivo é permitir que clientes visualizem/comprem itens únicos e que o administrador gerencie o estoque e pedidos via Painel Admin.

## Arquitetura e Estrutura (WHAT)
O projeto utiliza arquivos existentes como base. Respeite os padrões de design e a estrutura de pastas atual:
- `/src/frontend`: Componentes da interface do usuário (React/Next.js/HTML).
- `/src/admin`: Interface do painel administrativo e rotas de gestão.
- `/src/backend` ou `/api`: Lógica de servidor e conexão com banco de dados.
- `/assets`: Imagens de produtos e identidade visual.

**Arquivos de Referência Críticos:**
- Consulte `schema.sql` ou `models/` antes de sugerir mudanças no banco de dados.
- Consulte `config.ts` ou `.env.example` para variáveis de ambiente.

## Fluxo de Trabalho (HOW)
Claude, você deve operar seguindo estas diretrizes:

### 1. Comandos de Execução Local
- **Instalar dependências:** `npm install` (ou verifique se há `bun.lockb` para usar `bun`)
- **Rodar projeto:** `npm run dev`
- **Build:** `npm run build`
- **Testes:** `npm test`

### 2. Desenvolvimento e Estilo
- **Consistência:** Antes de criar novos componentes, verifique os existentes em `/src/components` para manter o padrão visual "feito à mão/artesanal".
- **Linter/Format:** Não se preocupe com espaços ou aspas; eu rodarei o linter localmente. Foque na lógica e na funcionalidade.

### 3. Documentação Progressiva
Para detalhes específicos, peça para ler os arquivos abaixo em vez de eu explicar agora:
- `docs/setup-db.md`: Se precisar mexer no banco de dados local.
- `docs/admin-rules.md`: Regras de permissão do painel administrativo.

## Instruções de Resposta
- Ao sugerir mudanças, priorize a reutilização dos estilos CSS/Tailwind já presentes nos arquivos base.
- Sempre verifique se a rota do Admin está protegida por autenticação antes de sugerir novos recursos de gestão.

## Protocolo de Revisão (Bugs)
- Sempre comece rodando o linter/testes: `npm run lint` ou `npm test`.
- Identifique UM bug ou melhoria por vez.
- Antes de aplicar a correção, explique o que encontrou e peça permissão.
- Após corrigir, rode os testes novamente para garantir que nada quebrou.