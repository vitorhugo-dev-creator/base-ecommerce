const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

let db = null;

function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || './data/store.db';
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initSchema();
  seedDefaults();
  return db;
}

function initSchema() {
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
}

function seedDefaults() {
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hash);
    console.log('Admin padrao criado — usuario: admin | senha: admin123');
  }

  const defaultSettings = {
    store_name: process.env.STORE_NAME || 'Minha Loja',
    store_whatsapp: process.env.STORE_WHATSAPP || '',
    store_pix_key: process.env.STORE_PIX_KEY || '',
    store_city: process.env.STORE_CITY || '',
    store_description: 'Bem-vindo a nossa loja!',
    hero_title: 'Descubra nossos produtos',
    hero_subtitle: 'Qualidade e estilo para voce',
    primary_color: '#ffffff',
    accent_color: '#888888',
    bg_color: '#0a0a0a',
  };

  Object.entries(defaultSettings).forEach(([key, value]) => {
    const exists = db.prepare('SELECT key FROM store_settings WHERE key = ?').get(key);
    if (!exists) db.prepare('INSERT INTO store_settings (key, value) VALUES (?, ?)').run(key, value);
  });
}

module.exports = { getDb };
