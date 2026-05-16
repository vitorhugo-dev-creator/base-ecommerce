require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const fs = require('fs');
const nodemailer = require('nodemailer');

// ============================================================
// INICIALIZAÇÃO
// ============================================================
const app = express();
const PORT = process.env.PORT || 3002;

// CORS - permitir origens do frontend com credentials
app.use((req, res, next) => {
  const origin = req.headers.origin
  // Permitir Netlify e localhost
  if (origin && (origin.includes('netlify.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
});

// Rate limiting simples em memória (5 tentativas/minuto por IP)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 5;

// Garantir que as pastas necessárias existam
['data', 'public/uploads', 'public/products'].forEach(dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ============================================================
// BANCO DE DADOS
// ============================================================
const db = new Database(process.env.DB_PATH || './data/store.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL NOT NULL DEFAULT 49.90,
    image_url TEXT,
    tags TEXT,
    promo_percent INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    UNIQUE(date)
  );
`);

// Criar admin padrão se não existir
const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Admin padrão criado — usuário: admin | senha: admin123');
}

// Inserir settings padrão se não existirem
const defaultSettings = {
  store_name: process.env.STORE_NAME || 'Minha Loja',
  store_whatsapp: process.env.STORE_WHATSAPP || '',
  store_pix_key: process.env.STORE_PIX_KEY || '',
  store_description: 'Bem-vindo à nossa loja!',
  hero_title: 'Descubra nossos produtos',
  hero_subtitle: 'Qualidade e estilo para você',
  primary_color: '#ffffff',
  accent_color: '#888888',
  bg_color: '#0a0a0a',
};
Object.entries(defaultSettings).forEach(([key, value]) => {
  const exists = db.prepare('SELECT key FROM store_settings WHERE key = ?').get(key);
  if (!exists) db.prepare('INSERT INTO store_settings (key, value) VALUES (?, ?)').run(key, value);
});

// ============================================================
// SMTP / EMAIL
// ============================================================
let mailTransport = null;
try {
  if (process.env.SMTP_HOST) {
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
} catch (e) {
  console.log('⚠ SMTP não configurado — emails desativados');
}

async function sendOrderEmail(order, settings) {
  if (!mailTransport) return;

  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:center">${i.qty}x</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right">R$ ${i.price.toFixed(2).replace('.', ',')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right">R$ ${(i.price * i.qty).toFixed(2).replace('.', ',')}</td>
    </tr>`
  ).join('');

  const statusColors = {
    pending: '#ffc200', paid: '#00cc66', shipped: '#0099cc',
    delivered: '#33ff33', cancelled: '#ff4444'
  };
  const statusLabels = {
    pending: 'Aguardando pagamento', paid: 'Pago', shipped: 'Enviado',
    delivered: 'Entregue', cancelled: 'Cancelado'
  };

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;background:#111118;border:1px solid #2a2a3a;border-radius:8px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c 0%,#e5c76b 100%);padding:24px 32px">
        <h1 style="margin:0;font-size:1.4rem;color:#0a0a0f;letter-spacing:0.05em">${settings.store_name || 'Loja'}</h1>
        <p style="margin:4px 0 0;color:#1a1a00;font-size:0.85rem">Novo pedido registrado</p>
      </div>

      <div style="padding:28px 32px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding:16px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
          <div>
            <div style="font-size:0.72rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Código do Pedido</div>
            <div style="font-size:1.2rem;font-weight:700;color:#c9a84c;letter-spacing:0.05em">${order.order_code}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.72rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Status</div>
            <div style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:0.75rem;font-weight:700;color:${statusColors[order.order_status] || '#e0e0e0'};background:${statusColors[order.order_status]}20">${statusLabels[order.order_status] || order.order_status}</div>
          </div>
        </div>

        <h2 style="font-size:0.75rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Dados do Cliente</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
          <div style="padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Nome</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${order.customer_name}</div>
          </div>
          <div style="padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Contato</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${order.customer_phone || order.customer_email || '—'}</div>
          </div>
          <div style="padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px;grid-column:1/-1">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Endereço</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${order.customer_address || 'Não informado'}</div>
          </div>
        </div>

        <h2 style="font-size:0.75rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Itens do Pedido</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#181825;border:1px solid #2a2a3a;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#1e1e2e">
              <th style="padding:10px 12px;text-align:left;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em">Produto</th>
              <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em">Qtd</th>
              <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;text-align:right">Preço</th>
              <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px;background:#1e1e2e;border:1px solid #2a2a3a;border-radius:6px;margin-bottom:20px">
          <span style="font-size:1rem;color:#e0e0e0;font-weight:600">Total</span>
          <span style="font-size:1.5rem;font-weight:800;color:#c9a84c">R$ ${order.total.toFixed(2).replace('.', ',')}</span>
        </div>

        <div style="display:flex;justify-content:space-between;gap:12px">
          <div style="flex:1;padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Forma de Pagamento</div>
            <div style="color:#e0e0e0;font-size:0.9rem;text-transform:uppercase">${order.payment_method || '—'}</div>
          </div>
          <div style="flex:1;padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Data</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        ${order.notes ? `
        <div style="margin-top:16px;padding:12px;background:#181825;border:1px solid #ffc20040;border-radius:6px;border-left:3px solid #ffc200">
          <div style="font-size:0.68rem;color:#ffc200;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Observações</div>
          <div style="color:#e0e0e0;font-size:0.85rem">${order.notes}</div>
        </div>` : ''}
      </div>

      <div style="padding:16px 32px;background:#0c0c12;border-top:1px solid #2a2a3a;text-align:center">
        <span style="font-size:0.72rem;color:#6b6b8a">${settings.store_name || 'Loja'} — <a href="${process.env.BASE_URL || 'http://localhost:3002'}/admin" style="color:#c9a84c">Acessar painel</a></span>
      </div>
    </div>
  </body>
  </html>`;

  try {
    await mailTransport.sendMail({
      from: `"${settings.store_name || 'Loja'} Store" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🛒 Novo pedido ${order.order_code} — ${order.customer_name} — R$ ${order.total.toFixed(2).replace('.', ',')}`,
      html
    });
    console.log(`📧 Email enviado para admin sobre pedido ${order.order_code}`);
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
  }
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir pasta pública (loja — fallback para HTML estático / uploads de produtos)
// ORDEM IMPORTA: public-react primeiro para sobrescrever o index.html do public
const reactBuildPath = path.join(__dirname, 'public-react');
if (fs.existsSync(reactBuildPath)) {
  app.use('/vitordev', express.static(reactBuildPath));
}
app.use(express.static(path.join(__dirname, 'public')));

// Servir assets do admin via prefixo /admin-assets
app.use('/admin-assets', express.static(path.join(__dirname, 'admin')));

const isProduction = process.env.NODE_ENV === 'production'
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-troque-isso',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction
  }
}));

// ============================================================
// HELPERS
// ============================================================
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  // Para rotas API, retorna JSON (SPA); para páginas legado, redirect
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Não autenticado', redirect: '/vitordev/admin/login' });
  }
  res.redirect('/vitordev/admin/login');
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM store_settings').all();
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

function generateOrderCode() {
  return 'PED-' + Date.now().toString(36).toUpperCase();
}

// Upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

async function saveImage(buffer, filename, folder = 'products') {
  const outputPath = path.join(__dirname, 'public', folder, filename);
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  return `/${folder}/${filename}`;
}

// ============================================================
// ROTAS — PÁGINAS (React SPA em /vitordev/*)
// ============================================================
const reactBuildIndex = path.join(reactBuildPath, 'index.html');

app.get('/vitordev', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.sendFile(reactBuildIndex);
  res.redirect('/');
});
app.get('/vitordev/*', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.sendFile(reactBuildIndex);
  res.redirect('/');
});

// Fallback — páginas antigas do public (se não houver build React)
app.get('/', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.sendFile(reactBuildIndex);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/catalogo', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.sendFile(reactBuildIndex);
  res.sendFile(path.join(__dirname, 'public', 'catalogo.html'));
});
app.get('/rastreio', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.sendFile(reactBuildIndex);
  res.sendFile(path.join(__dirname, 'public', 'order-status.html'));
});

// Admin legado (mantido para compatibilidade)
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'admin-login.html')));
app.get('/admin', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'admin', 'admin.html')));
app.get('/admin/analytics', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'admin', 'crm.html')));
app.get('/admin/*', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'admin', 'admin.html')));

// ============================================================
// API — AUTH
// ============================================================
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];

  // Limpa tentativas antigas
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Credenciais requeridas' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    recent.push(now);
    loginAttempts.set(ip, recent);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  loginAttempts.set(ip, []);
  req.session.adminId = user.id;
  res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.put('/api/admin/password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter mínimo 6 caracteres' });
  }
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.adminId);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(403).json({ error: 'Senha atual incorreta' });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hash, req.session.adminId);
  res.json({ success: true });
});

// CRM Analytics público (sem auth — dados agregados/anônimos)
app.get('/api/public/analytics', (req, res) => {
  try {
    const rawOrders = db.prepare('SELECT id, items, created_at, order_status, payment_method, total, customer_name, customer_email FROM orders ORDER BY created_at DESC').all();

    const productMap = {};
    for (const order of rawOrders) {
      try {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, total_qty: 0, total_revenue: 0 };
          productMap[item.name].total_qty += item.qty || 0;
          productMap[item.name].total_revenue += (item.qty || 0) * (item.price || 0);
        }
      } catch {}
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);

    const monthlyRevenue = db.prepare(`
      SELECT strftime('%Y', created_at) as year, strftime('%m', created_at) as month,
             SUM(total) as revenue, COUNT(*) as orders
      FROM orders WHERE payment_status = 'paid' AND created_at >= date('now', '-12 months')
      GROUP BY year, month ORDER BY year, month
    `).all();

    const dailyOrders = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders, SUM(total) as revenue
      FROM orders WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day
    `).all();

    const avgOrderValue = db.prepare(`
      SELECT AVG(total) as avg, MIN(total) as min, MAX(total) as max FROM orders WHERE payment_status = 'paid'
    `).get();

    const conversionRate = db.prepare(`
      SELECT COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
             COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending FROM orders
    `).get();

    const orderStatusDist = db.prepare(`
      SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status ORDER BY count DESC
    `).all();

    const paymentMethods = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total FROM orders GROUP BY payment_method ORDER BY count DESC
    `).all();

    const topCustomers = db.prepare(`
      SELECT customer_name, customer_email, COUNT(*) as order_count, SUM(total) as total_spent
      FROM orders GROUP BY customer_email ORDER BY total_spent DESC LIMIT 10
    `).all();

    const allProducts = db.prepare('SELECT id, name, category, price FROM products WHERE active=1').all();
    const productPerf = allProducts.map(p => {
      let unitsSold = 0, revenue = 0;
      for (const order of rawOrders) {
        try {
          const items = JSON.parse(order.items || '[]');
          for (const item of items) {
            if (item.name === p.name) { unitsSold += item.qty || 0; revenue += (item.qty || 0) * (item.price || 0); }
          }
        } catch {}
      }
      return { name: p.name, category: p.category, price: p.price, units_sold: unitsSold, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      monthlyRevenue: monthlyRevenue || [],
      topProducts: topProducts || [],
      orderStatusDist: orderStatusDist || [],
      paymentMethods: paymentMethods || [],
      dailyOrders: dailyOrders || [],
      avgOrderValue: avgOrderValue || { avg: 0, min: 0, max: 0 },
      conversionRate: conversionRate || { paid: 0, pending: 0 },
      topCustomers: topCustomers || [],
      productPerformance: productPerf || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.adminId) });
});

// ============================================================
// API — SETTINGS
// ============================================================
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const allowed = {
    store_name: 'string', store_description: 'string', hero_title: 'string',
    hero_subtitle: 'string', store_whatsapp: 'string', store_pix_key: 'string',
    bg_color: 'string', accent_color: 'string'
  };

  const updates = {};
  for (const [key, type] of Object.entries(allowed)) {
    if (req.body[key] !== undefined) {
      if (type === 'string') updates[key] = String(req.body[key]).slice(0, 1000);
      else if (type === 'number') updates[key] = parseFloat(req.body[key]) || 0;
    }
  }

  // Troca de senha (via /api/admin/password separate)
  if (req.body.new_password && String(req.body.new_password).length >= 6) {
    const hash = bcrypt.hashSync(String(req.body.new_password), 10);
    db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hash, req.session.adminId);
  }

  if (Object.keys(updates).length > 0) {
    const stmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
    const update = db.transaction((data) => {
      Object.entries(data).forEach(([k, v]) => stmt.run(k, v));
    });
    update(updates);
  }

  res.json({ success: true });
});

// ============================================================
// API — PRODUTOS
// ============================================================
app.get('/api/products', (req, res) => {
  const { category, search, active } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (active !== 'all') { query += ' AND active = 1'; }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (name LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY created_at DESC';
  const products = db.prepare(query).all(...params);

  // Buscar imagens extras
  products.forEach(p => {
    p.extra_images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(p.id);
    p.tags = p.tags ? p.tags.split(',') : [];
  });

  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  product.extra_images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id);
  product.tags = product.tags ? product.tags.split(',') : [];
  res.json(product);
});

app.post('/api/admin/products', requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'extra_images', maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, description, category, price, tags, promo_percent } = req.body;
    let image_url = null;

    if (req.files?.image) {
      const filename = `${uuidv4()}.jpg`;
      image_url = await saveImage(req.files.image[0].buffer, filename);
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, category, price, image_url, tags, promo_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, category, parseFloat(price), image_url, tags, parseInt(promo_percent) || 0);

    const productId = result.lastInsertRowid;

    if (req.files?.extra_images) {
      for (let i = 0; i < req.files.extra_images.length; i++) {
        const filename = `${uuidv4()}.jpg`;
        const url = await saveImage(req.files.extra_images[i].buffer, filename);
        db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)').run(productId, url, i);
      }
    }

    res.json({ success: true, id: productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, category, price, tags, promo_percent, active } = req.body;
    let image_url = req.body.current_image;

    if (req.files?.image) {
      const filename = `${uuidv4()}.jpg`;
      image_url = await saveImage(req.files.image[0].buffer, filename);
    }

    db.prepare(`
      UPDATE products SET name=?, description=?, category=?, price=?, image_url=?, tags=?, promo_percent=?, active=?
      WHERE id=?
    `).run(name, description, category, parseFloat(price), image_url, tags, parseInt(promo_percent) || 0, active === '1' ? 1 : 0, req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============================================================
// API — NEWSLETTER
// ============================================================
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  try {
    db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(email);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

app.get('/api/admin/newsletter', requireAdmin, (req, res) => {
  const subscribers = db.prepare('SELECT * FROM newsletter WHERE active=1 ORDER BY created_at DESC').all();
  res.json(subscribers);
});

// ============================================================
// API — PAGE VIEWS (analytics)
// ============================================================
app.get('/api/track', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO page_views (date, views) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET views = views + 1').run(today);
  res.json({ ok: true });
});

app.get('/api/public/stats', (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare("SELECT SUM(total) as sum FROM orders WHERE payment_status='paid'").get().sum || 0;
    const subscribers = db.prepare("SELECT COUNT(*) as count FROM newsletter WHERE active=1").get().count;
    const last30days = db.prepare("SELECT SUM(views) as views FROM page_views WHERE date >= date('now', '-30 days')").get().views || 0;
    res.json({ totalOrders, totalRevenue, subscribers, last30days });
  } catch {
    res.json({ totalOrders: 0, totalRevenue: 0, subscribers: 0, last30days: 0 });
  }
});

// ============================================================
// API — PEDIDOS
// ============================================================
app.get('/api/orders/track/:code', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(req.params.code);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  order.items = JSON.parse(order.items);
  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, items, payment_method, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });
    for (const item of items) {
      if (!item.price || item.price <= 0 || !item.qty || item.qty < 1) return res.status(400).json({ error: 'Dados do item invalidos' });
    }
    const order_code = generateOrderCode();
    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    db.prepare(`
      INSERT INTO orders (order_code, customer_name, customer_email, customer_phone, customer_address, items, total, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_code, customer_name, customer_email, customer_phone, customer_address, JSON.stringify(items), total, payment_method, notes);

    let pixQR = null;
    if (payment_method === 'pix') {
      const settings = getSettings();
      if (settings.store_pix_key) {
        pixQR = await QRCode.toDataURL(`PIX:${settings.store_pix_key}:${total.toFixed(2)}`);
      }
    }

    res.json({ success: true, order_code, total, pixQR });

    // Enviar email para admin
    const newOrder = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(order_code);
    newOrder.items = JSON.parse(newOrder.items);
    const currentSettings = getSettings();
    sendOrderEmail(newOrder, currentSettings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  orders.forEach(o => { o.items = JSON.parse(o.items); });
  res.json(orders);
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { order_status, payment_status } = req.body;
  const ALLOWED_ORDER = ['pending','paid','shipped','delivered','cancelled'];
  const ALLOWED_PAYMENT = ['pending','paid','refunded'];
  if (order_status && !ALLOWED_ORDER.includes(order_status)) return res.status(400).json({ error: 'Status invalido' });
  if (payment_status && !ALLOWED_PAYMENT.includes(payment_status)) return res.status(400).json({ error: 'Status pagamento invalido' });
  db.prepare(`
    UPDATE orders SET order_status=COALESCE(?,order_status), payment_status=COALESCE(?,payment_status), updated_at=datetime('now') WHERE id=?
  `).run(order_status || null, payment_status || null, req.params.id);
  res.json({ success: true });
});

// ============================================================
// API — DASHBOARD
// ============================================================
app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const totalRevenue = db.prepare("SELECT SUM(total) as sum FROM orders WHERE payment_status='paid'").get().sum || 0;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE active=1").get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status='pending'").get().count;

  const recentOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5").all();
  recentOrders.forEach(o => { o.items = JSON.parse(o.items); });

  res.json({ totalOrders, totalRevenue, totalProducts, pendingOrders, recentOrders });
});

// ============================================================
// API — ANALYTICS / CRM
// ============================================================
app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  try {
    // Faturamento mensal (últimos 12 meses)
    const monthlyRevenue = db.prepare(`
      SELECT
        strftime('%Y', created_at) as year,
        strftime('%m', created_at) as month,
        SUM(total) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE payment_status = 'paid'
      AND created_at >= date('now', '-12 months')
      GROUP BY year, month
      ORDER BY year, month
    `).all();

    // Produtos mais vendidos
    const rawOrders = db.prepare(`
      SELECT id, items FROM orders
    `).all();

    const productMap = {};
    for (const order of rawOrders) {
      try {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (!productMap[item.name]) {
            productMap[item.name] = { name: item.name, total_qty: 0, total_revenue: 0, order_count: 0 };
          }
          productMap[item.name].total_qty += (item.qty || 0);
          productMap[item.name].total_revenue += (item.qty || 0) * (item.price || 0);
          productMap[item.name].order_count += 1;
        }
      } catch {}
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    // Pedidos por dia (últimos 30 dias)
    const dailyOrders = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders, SUM(total) as revenue
      FROM orders WHERE created_at >= date('now', '-30 days')
      GROUP BY day ORDER BY day
    `).all();

    // Ticket médio
    const avgOrderValue = db.prepare(`
      SELECT AVG(total) as avg, MIN(total) as min, MAX(total) as max
      FROM orders WHERE payment_status = 'paid'
    `).get();

    // Taxa de conversão (pagos vs pendentes)
    const conversionRate = db.prepare(`
      SELECT
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending
      FROM orders
    `).get();

    // Status dos pedidos
    const orderStatusDist = db.prepare(`
      SELECT order_status, COUNT(*) as count
      FROM orders GROUP BY order_status ORDER BY count DESC
    `).all();

    // Métodos de pagamento
    const paymentMethods = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM orders GROUP BY payment_method ORDER BY count DESC
    `).all();

    // Top clientes
    const topCustomers = db.prepare(`
      SELECT customer_name, customer_email, customer_phone,
        COUNT(*) as order_count,
        SUM(total) as total_spent,
        MAX(created_at) as last_order
      FROM orders GROUP BY customer_email
      ORDER BY total_spent DESC LIMIT 10
    `).all();

    // Performance de produtos
    const allProducts = db.prepare('SELECT id, name, category, price, active FROM products WHERE active=1').all();
    const productPerf = allProducts.map(p => {
      let unitsSold = 0;
      let revenue = 0;
      for (const order of rawOrders) {
        try {
          const items = JSON.parse(order.items || '[]');
          for (const item of items) {
            if (item.name === p.name) {
              unitsSold += (item.qty || 0);
              revenue += (item.qty || 0) * (item.price || 0);
            }
          }
        } catch {}
      }
      return { name: p.name, category: p.category, price: p.price, units_sold: unitsSold, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      monthlyRevenue: monthlyRevenue || [],
      topProducts: topProducts || [],
      orderStatusDist: orderStatusDist || [],
      paymentMethods: paymentMethods || [],
      dailyOrders: dailyOrders || [],
      avgOrderValue: avgOrderValue || { avg: 0, min: 0, max: 0 },
      conversionRate: conversionRate || { paid: 0, pending: 0 },
      topCustomers: topCustomers || [],
      productPerformance: productPerf || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  const settings = getSettings();
  console.log(`\n🚀 ${settings.store_name} rodando na porta ${PORT}`);
  console.log(`   → Loja:  http://localhost:${PORT}`);
  console.log(`   → Admin: http://localhost:${PORT}/admin\n`);
});
