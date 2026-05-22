require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { getDb } = require('./lib/db');
const { getSettings, generateOrderCode, saveImage, createPixPayload } = require('./lib/helpers');
const { sendOrderEmail, initMail } = require('./lib/email');

const app = express();
const PORT = process.env.PORT || 3002;

app.use((req, res, next) => {
  const origin = req.headers.origin
  let originOk = false
  if (origin) {
    try { const h = new URL(origin).hostname; originOk = h === 'localhost' || h.endsWith('.netlify.app') || h.endsWith('.railway.app') } catch {}
  }
  if (origin && originOk) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*')
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
});

const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const adminTokens = new Map();
const TOKEN_TTL = 24 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of adminTokens) {
    if (now - entry.created > TOKEN_TTL) adminTokens.delete(token);
  }
}, 60 * 60 * 1000);

['data', 'public/uploads', 'public/products'].forEach(dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const db = getDb();
initMail();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/products', express.static(path.join(__dirname, 'public/products')));
app.use('/admin-assets', express.static(path.join(__dirname, 'admin')));

const reactBuildPath = path.join(__dirname, 'public-react');
const reactBuildIndex = path.join(reactBuildPath, 'index.html');
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-troque-isso',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: isProduction ? 'none' : 'lax', secure: isProduction }
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    req.adminId = req.session.adminId
    return next()
  }
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const entry = adminTokens.get(token)
    if (entry) {
      if (Date.now() - entry.created > TOKEN_TTL) {
        adminTokens.delete(token)
        return res.status(401).json({ error: 'Token expirado', redirect: '/admin/login' })
      }
      req.adminId = entry.userId
      return next()
    }
  }
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Nao autenticado', redirect: '/admin/login' });
  }
  res.redirect('/admin/login');
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens sao permitidas'));
  }
});

app.get('/vitordev', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.redirect('/');
  res.redirect('/');
});
app.get('/vitordev/*', (req, res) => {
  if (fs.existsSync(reactBuildIndex)) return res.redirect(req.url.replace(/^\/vitordev/, '') || '/');
  res.redirect('/');
});

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

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
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
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }
  loginAttempts.set(ip, []);
  const token = uuidv4()
  adminTokens.set(token, { userId: user.id, created: Date.now() })
  res.json({ success: true, token });
});

app.post('/api/admin/logout', (req, res) => {
  if (req.session) req.session.destroy()
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    adminTokens.delete(authHeader.slice(7))
  }
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  const authenticated = !!(req.session && req.session.adminId) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') &&
     (() => { const e = adminTokens.get(req.headers.authorization.slice(7)); return e && Date.now() - e.created <= TOKEN_TTL; })())
  res.json({ authenticated });
});

app.put('/api/admin/password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter minimo 6 caracteres' });
  }
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.adminId);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(403).json({ error: 'Senha atual incorreta' });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hash, req.adminId);
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const allowed = {
    store_name: 'string', store_description: 'string', hero_title: 'string',
    hero_subtitle: 'string', store_whatsapp: 'string', store_pix_key: 'string', store_city: 'string',
    bg_color: 'string', accent_color: 'string'
  };
  const updates = {};
  for (const [key, type] of Object.entries(allowed)) {
    if (req.body[key] !== undefined) {
      if (type === 'string') updates[key] = String(req.body[key]).slice(0, 1000);
      else if (type === 'number') updates[key] = parseFloat(req.body[key]) || 0;
    }
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

app.get('/api/products', (req, res) => {
  const { category, search, active } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (active !== 'all') { query += ' AND active = 1'; }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (name LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC';

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  const countQuery = query.replace(/SELECT \* FROM products/, 'SELECT COUNT(*) as total FROM products').split(' ORDER BY')[0];
  const { total } = db.prepare(countQuery).get(...params);

  const products = db.prepare(query + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
  products.forEach(p => {
    p.extra_images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(p.id);
    p.tags = p.tags ? p.tags.split(',') : [];
  });
  res.json({ products, total, page, limit });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });
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
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Preco invalido' });
    }
    if (req.files?.image) {
      const filename = `${uuidv4()}.jpg`;
      image_url = await saveImage(req.files.image[0].buffer, filename);
    }
    const result = db.prepare(`
      INSERT INTO products (name, description, category, price, image_url, tags, promo_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      category,
      parsedPrice,
      image_url,
      tags,
      parseInt(promo_percent) || 0
    );
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
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Preco invalido' });
    }
    let image_url = req.body.current_image;
    if (req.files?.image) {
      const filename = `${uuidv4()}.jpg`;
      image_url = await saveImage(req.files.image[0].buffer, filename);
    }
    db.prepare(`
      UPDATE products SET name=?, description=?, category=?, price=?, image_url=?, tags=?, promo_percent=?, active=?
      WHERE id=?
    `).run(
      name,
      description,
      category,
      parsedPrice,
      image_url,
      tags,
      parseInt(promo_percent) || 0,
      String(active) === '1' ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalido' });
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

app.get('/api/track', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO page_views (date, views) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET views = views + 1').run(today);
  res.json({ ok: true });
});

app.get('/api/public/stats', (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const subscribers = db.prepare("SELECT COUNT(*) as count FROM newsletter WHERE active=1").get().count;
    const last30days = db.prepare("SELECT SUM(views) as views FROM page_views WHERE date >= date('now', '-30 days')").get().views || 0;
    res.json({ totalOrders, subscribers, last30days });
  } catch {
    res.json({ totalOrders: 0, subscribers: 0, last30days: 0 });
  }
});

app.get('/api/public/analytics', (req, res) => {
  try {
    const rawOrders = db.prepare('SELECT id, items, created_at, order_status, payment_method FROM orders ORDER BY created_at DESC').all();

    const productMap = {};
    for (const order of rawOrders) {
      try {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, total_qty: 0 };
          productMap[item.name].total_qty += item.qty || 0;
        }
      } catch {}
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);

    const dailyOrders = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders
      FROM orders WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day
    `).all();

    const orderStatusDist = db.prepare(`
      SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status ORDER BY count DESC
    `).all();

    const paymentMethods = db.prepare(`
      SELECT payment_method, COUNT(*) as count FROM orders GROUP BY payment_method ORDER BY count DESC
    `).all();

    const allProducts = db.prepare('SELECT id, name, category FROM products WHERE active=1').all();
    const productPerf = allProducts.map(p => {
      let unitsSold = 0;
      for (const order of rawOrders) {
        try {
          const items = JSON.parse(order.items || '[]');
          for (const item of items) {
            if (item.name === p.name) { unitsSold += item.qty || 0; }
          }
        } catch {}
      }
      return { name: p.name, category: p.category, units_sold: unitsSold };
    }).sort((a, b) => b.units_sold - a.units_sold);

    res.json({
      topProducts: topProducts || [],
      orderStatusDist: orderStatusDist || [],
      paymentMethods: paymentMethods || [],
      dailyOrders: dailyOrders || [],
      productPerformance: productPerf || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/track/:code', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(req.params.code);
  if (!order) return res.status(404).json({ error: 'Pedido nao encontrado' });
  order.items = JSON.parse(order.items);
  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, items, payment_method, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });
    const ALLOWED_PAYMENT_METHODS = ['pix', 'whatsapp', 'card', 'bank_transfer', 'money'];
    if (payment_method && !ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ error: 'Forma de pagamento invalida' });
    }
    const itemIds = items.map(i => i.id).filter(Boolean);
    const placeholders = itemIds.map(() => '?').join(',');
    const dbProducts = itemIds.length > 0
      ? db.prepare(`SELECT id, price, name, promo_percent FROM products WHERE id IN (${placeholders})`).all(...itemIds)
        .reduce((map, p) => { map[p.id] = p; return map; }, {})
      : {};
    for (const item of items) {
      if (!item.qty || item.qty < 1) return res.status(400).json({ error: 'Dados do item invalidos' });
      const dbProduct = dbProducts[item.id];
      if (!dbProduct) return res.status(400).json({ error: `Produto nao encontrado: ${item.name}` });
      if (Math.abs(item.price - dbProduct.price) > 0.01) {
        return res.status(400).json({ error: `Preco invalido para ${item.name}` });
      }
      if ((item.promo_percent || 0) !== (dbProduct.promo_percent || 0)) {
        return res.status(400).json({ error: `Desconto invalido para ${item.name}` });
      }
    }
    const order_code = generateOrderCode();
    const total = items.reduce((sum, item) => {
      const dbProduct = dbProducts[item.id];
      const promo = dbProduct.promo_percent || 0;
      const itemPrice = promo > 0 ? item.price * (1 - promo / 100) : item.price;
      return sum + (itemPrice * item.qty);
    }, 0);

    db.prepare(`
      INSERT INTO orders (order_code, customer_name, customer_email, customer_phone, customer_address, items, total, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_code,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      JSON.stringify(items),
      total,
      payment_method,
      notes
    );

    let pixQR = null;
    if (payment_method === 'pix') {
      const settings = getSettings();
      if (settings.store_pix_key) {
        const pixPayload = createPixPayload(settings.store_pix_key, total, settings.store_name || 'Loja', settings.store_city || 'Cidade');
        pixQR = await QRCode.toDataURL(pixPayload);
      }
    }

    res.json({ success: true, order_code, total, pixQR });

    try {
      const newOrder = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(order_code);
      newOrder.items = JSON.parse(newOrder.items);
      sendOrderEmail(newOrder, getSettings());
    } catch (emailErr) {
      console.error('Erro ao enviar email:', emailErr.message);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const { total } = db.prepare('SELECT COUNT(*) as total FROM orders').get();
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  orders.forEach(o => { o.items = JSON.parse(o.items); });

  res.json({ orders, total, page, limit, pages: Math.ceil(total / limit) });
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

app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const totalRevenue = db.prepare("SELECT SUM(total) as sum FROM orders WHERE payment_status='paid'").get().sum || 0;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE active=1").get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status='pending'").get().count;
  const recentOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5").all();
  recentOrders.forEach(o => { o.items = JSON.parse(o.items); });
  res.json({ totalOrders, totalRevenue, totalProducts, pendingOrders, recentOrders });
});

app.get('/api/admin/analytics', requireAdmin, (req, res) => {
  try {
    const monthlyRevenue = db.prepare(`
      SELECT strftime('%Y', created_at) as year, strftime('%m', created_at) as month,
             SUM(total) as revenue, COUNT(*) as orders
      FROM orders WHERE payment_status = 'paid' AND created_at >= date('now', '-12 months')
      GROUP BY year, month ORDER BY year, month
    `).all();

    const rawOrders = db.prepare('SELECT id, items FROM orders').all();
    const productMap = {};
    for (const order of rawOrders) {
      try {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, total_qty: 0, total_revenue: 0, order_count: 0 };
          productMap[item.name].total_qty += (item.qty || 0);
          productMap[item.name].total_revenue += (item.qty || 0) * (item.price || 0);
          productMap[item.name].order_count += 1;
        }
      } catch {}
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);

    const dailyOrders = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders, SUM(total) as revenue
      FROM orders WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day
    `).all();

    const avgOrderValue = db.prepare(`SELECT AVG(total) as avg, MIN(total) as min, MAX(total) as max FROM orders WHERE payment_status = 'paid'`).get();
    const conversionRate = db.prepare(`SELECT COUNT(CASE WHEN payment_status='paid' THEN 1 END) as paid, COUNT(CASE WHEN payment_status='pending' THEN 1 END) as pending FROM orders`).get();
    const orderStatusDist = db.prepare(`SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status ORDER BY count DESC`).all();
    const paymentMethods = db.prepare(`SELECT payment_method, COUNT(*) as count, SUM(total) as total FROM orders GROUP BY payment_method ORDER BY count DESC`).all();

    const topCustomers = db.prepare(`
      SELECT customer_name, customer_email, customer_phone, COUNT(*) as order_count, SUM(total) as total_spent, MAX(created_at) as last_order
      FROM orders GROUP BY customer_email ORDER BY total_spent DESC LIMIT 10
    `).all();

    const allProducts = db.prepare('SELECT id, name, category, price, active FROM products WHERE active=1').all();
    const productPerf = allProducts.map(p => {
      let unitsSold = 0, revenue = 0;
      for (const order of rawOrders) {
        try {
          const items = JSON.parse(order.items || '[]');
          for (const item of items) {
            if (item.name === p.name) { unitsSold += (item.qty || 0); revenue += (item.qty || 0) * (item.price || 0); }
          }
        } catch {}
      }
      return { name: p.name, category: p.category, price: p.price, units_sold: unitsSold, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      monthlyRevenue: monthlyRevenue || [], topProducts: topProducts || [],
      orderStatusDist: orderStatusDist || [], paymentMethods: paymentMethods || [],
      dailyOrders: dailyOrders || [], avgOrderValue: avgOrderValue || { avg: 0, min: 0, max: 0 },
      conversionRate: conversionRate || { paid: 0, pending: 0 }, topCustomers: topCustomers || [],
      productPerformance: productPerf || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (fs.existsSync(reactBuildPath)) {
  app.use(express.static(reactBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  const settings = getSettings();
  console.log(`\n ${settings.store_name} rodando na porta ${PORT}`);
  console.log(`   → Loja:  http://localhost:${PORT}`);
  console.log(`   → Admin: http://localhost:${PORT}/admin\n`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} ja esta em uso. Escolha outra porta em .env`);
  } else {
    console.error('Erro ao iniciar servidor:', err.message);
  }
  process.exit(1);
});
