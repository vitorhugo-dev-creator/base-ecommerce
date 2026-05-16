# 📦 Base E-commerce — Boilerplate Modular

Boilerplate de e-commerce leve para pequenas lojas, construído com Node.js + Express + SQLite.

---

## 🗂 Estrutura

```
base-ecommerce/
├── admin/
│   ├── css/
│   │   ├── admin.css       → estilos do dashboard
│   │   └── login.css       → estilos da tela de login
│   ├── js/
│   │   └── admin.js        → toda a lógica do painel
│   ├── admin.html          → dashboard (HTML apenas estrutura)
│   └── admin-login.html    → página de login
│
├── public/
│   ├── css/
│   │   └── style.css       → estilos da loja (customize as variáveis :root)
│   ├── js/
│   │   └── main.js         → carrinho, modal, checkout, settings
│   ├── uploads/            → banners e logos
│   ├── products/           → imagens comprimidas dos produtos (geradas pelo sharp)
│   ├── index.html          → home
│   ├── catalogo.html       → catálogo com filtros
│   └── order-status.html   → rastreio de pedidos
│
├── data/                   → banco SQLite (gerado automaticamente)
├── .env                    → configurações sensíveis
├── server.js               → backend completo
├── Dockerfile
├── docker-compose.yml
├── loja.conf               → config Nginx (template)
└── instalacao-completa.sh  → instalador automático no VPS
```

---

## 🚀 Início rápido (local)

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar .env
cp .env .env.local
# Edite o .env conforme necessário

# 3. Rodar em desenvolvimento
npm run dev

# Acesse:
# Loja:  http://localhost:3002
# Admin: http://localhost:3002/admin
# Login: admin / admin123
```

---

## 🖥 Deploy no VPS (Ubuntu)

```bash
# 1. Clone ou copie os arquivos para o VPS
# 2. Dê permissão ao script
chmod +x instalacao-completa.sh

# 3. Rode como root
sudo ./instalacao-completa.sh
```

O script instala Node, Nginx, PM2 e configura tudo automaticamente.

---

## 🎨 Personalizar para novo cliente

Só precisa alterar **3 coisas**:

1. **`.env`** — nome da loja, WhatsApp, PIX, SESSION_SECRET
2. **`public/css/style.css`** — variáveis `:root` (cores, fontes)
3. **Nginx** — domínio no `loja.conf`

---

## ⚙️ Variáveis de ambiente (.env)

| Variável           | Descrição                              |
|--------------------|----------------------------------------|
| `PORT`             | Porta do servidor (padrão: 3002)       |
| `STORE_NAME`       | Nome da loja                           |
| `STORE_WHATSAPP`   | Número com DDI (ex: 5547999999999)     |
| `STORE_PIX_KEY`    | Chave PIX                              |
| `SESSION_SECRET`   | Chave de sessão (gerar aleatório)      |
| `DB_PATH`          | Caminho do banco SQLite                |

---

## 🔌 API

| Método | Rota                        | Descrição              |
|--------|-----------------------------|------------------------|
| GET    | `/api/products`             | Listar produtos        |
| GET    | `/api/products/:id`         | Produto por ID         |
| POST   | `/api/orders`               | Criar pedido           |
| GET    | `/api/orders/track/:code`   | Rastrear pedido        |
| GET    | `/api/settings`             | Configurações públicas |
| POST   | `/api/admin/login`          | Login admin            |
| GET    | `/api/admin/dashboard`      | Stats do dashboard     |
| POST   | `/api/admin/products`       | Criar produto (admin)  |
| PUT    | `/api/admin/products/:id`   | Editar produto (admin) |
| DELETE | `/api/admin/products/:id`   | Excluir produto (admin)|
| GET    | `/api/admin/orders`         | Listar pedidos (admin) |
| PUT    | `/api/admin/orders/:id`     | Atualizar status       |
| PUT    | `/api/admin/settings`       | Salvar configurações   |

---

## 📝 Licença

Uso privado — boilerplate pessoal para projetos freelance.
