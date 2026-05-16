/* ============================================================
   main.js — Lógica da loja pública
   Carrinho, modal de produto, checkout, settings
   ============================================================ */

// ============================================================
// ESTADO GLOBAL
// ============================================================
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let storeSettings = {};
let allProducts = [];
let currentCategory = null;

// ============================================================
// INICIALIZAÇÃO (index.html)
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  updateCartUI();
  if (document.getElementById('featured-products')) {
    await loadStoreConfig();
    await loadFeaturedProducts();
  }
});

// ============================================================
// SETTINGS
// ============================================================
async function loadStoreConfig() {
  try {
    const res = await fetch('/api/settings');
    storeSettings = await res.json();

    const name = storeSettings.store_name || 'Loja';
    document.title = name;
    if (document.getElementById('page-title'))       document.getElementById('page-title').textContent = name;
    if (document.getElementById('store-name-nav'))   document.getElementById('store-name-nav').textContent = name;
    if (document.getElementById('store-name-footer')) document.getElementById('store-name-footer').textContent = name;
    if (document.getElementById('hero-title'))       document.getElementById('hero-title').textContent = storeSettings.hero_title || name;
    if (document.getElementById('hero-subtitle'))    document.getElementById('hero-subtitle').textContent = storeSettings.hero_subtitle || '';

    // Aplicar cores do tema dinamicamente
    const root = document.documentElement;
    if (storeSettings.bg_color)      root.style.setProperty('--bg', storeSettings.bg_color);
    if (storeSettings.accent_color)  root.style.setProperty('--accent', storeSettings.accent_color);
    if (storeSettings.primary_color) root.style.setProperty('--text', storeSettings.primary_color);
  } catch (e) {
    console.warn('Não foi possível carregar configurações da loja');
  }
}

// ============================================================
// PRODUTOS
// ============================================================
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  try {
    const res = await fetch('/api/products?active=1');
    allProducts = await res.json();
    const recent = allProducts.slice(0, 8);
    container.innerHTML = recent.length
      ? recent.map(renderProductCard).join('')
      : '<div class="empty-state"><p>Nenhum produto cadastrado ainda.</p></div>';
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar produtos.</p></div>';
  }
}

async function loadAllProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;
  try {
    const res = await fetch('/api/products?active=1');
    allProducts = await res.json();
    buildCategoryFilters();
    renderProductGrid(allProducts);
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar produtos.</p></div>';
  }
}

function buildCategoryFilters() {
  const filtersEl = document.getElementById('category-filters');
  if (!filtersEl) return;
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.onclick = () => setCategory(cat, btn);
    filtersEl.appendChild(btn);
  });
}

function setCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterProducts();
}

function filterProducts() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  let filtered = allProducts;
  if (currentCategory) filtered = filtered.filter(p => p.category === currentCategory);
  if (search) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(search) ||
    (p.description || '').toLowerCase().includes(search) ||
    (Array.isArray(p.tags) ? p.tags.join(' ') : p.tags || '').toLowerCase().includes(search)
  );
  renderProductGrid(filtered);
}

function renderProductGrid(products) {
  const container = document.getElementById('products-grid');
  if (!container) return;
  container.innerHTML = products.length
    ? products.map(renderProductCard).join('')
    : '<div class="empty-state"><p>Nenhum produto encontrado.</p></div>';
}

function renderProductCard(p) {
  const finalPrice = p.promo_percent > 0
    ? p.price * (1 - p.promo_percent / 100)
    : p.price;
  const originalPriceHTML = p.promo_percent > 0
    ? `<span class="original-price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>`
    : '';
  const promoHTML = p.promo_percent > 0
    ? `<span class="badge-promo">-${p.promo_percent}%</span>`
    : '';
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:2rem">📦</div>`;

  return `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="product-card-image">${img}</div>
      <div class="product-card-info">
        <p class="product-card-name">${p.name}</p>
        <p class="product-card-category">${p.category || ''}</p>
        <p class="product-card-price">
          ${originalPriceHTML}
          R$ ${finalPrice.toFixed(2).replace('.', ',')}
          ${promoHTML}
        </p>
      </div>
    </div>
  `;
}

// ============================================================
// MODAL DE PRODUTO
// ============================================================
function openModal(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;

  const finalPrice = p.promo_percent > 0
    ? p.price * (1 - p.promo_percent / 100)
    : p.price;

  document.getElementById('modal-img').src    = p.image_url || '';
  document.getElementById('modal-img').alt    = p.name;
  document.getElementById('modal-name').textContent     = p.name;
  document.getElementById('modal-category').textContent = p.category || '';
  document.getElementById('modal-desc').textContent     = p.description || '';
  document.getElementById('modal-price').innerHTML      = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;

  document.getElementById('modal-add-cart').onclick = () => {
    addToCart(p);
    closeModal();
    toggleCart(true);
  };

  const waBtn = document.getElementById('modal-whatsapp');
  if (storeSettings.store_whatsapp) {
    const msg = encodeURIComponent(`Olá! Tenho interesse no produto: *${p.name}* — R$ ${finalPrice.toFixed(2).replace('.', ',')}`);
    waBtn.onclick = () => window.open(`https://wa.me/${storeSettings.store_whatsapp}?text=${msg}`, '_blank');
    waBtn.style.display = '';
  } else {
    waBtn.style.display = 'none';
  }

  document.getElementById('product-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// CARRINHO
// ============================================================
function addToCart(product) {
  const finalPrice = product.promo_percent > 0
    ? product.price * (1 - product.promo_percent / 100)
    : product.price;

  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, price: finalPrice, image: product.image_url, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`"${product.name}" adicionado ao carrinho`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
  document.querySelectorAll('#cart-total').forEach(el => el.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`);

  const containers = document.querySelectorAll('#cart-items');
  containers.forEach(container => {
    if (cart.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Seu carrinho está vazio.</p></div>';
      return;
    }
    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        ${item.image
          ? `<img class="cart-item-image" src="${item.image}" alt="${item.name}">`
          : `<div class="cart-item-image" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted)">📦</div>`
        }
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</p>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, +1)">+</button>
          </div>
        </div>
        <button class="cart-remove" onclick="removeFromCart(${item.id})" title="Remover">×</button>
      </div>
    `).join('');
  });
}

function toggleCart(forceOpen) {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (forceOpen === true || (!isOpen && forceOpen !== false)) {
    drawer.classList.add('open');
    backdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function showCheckout() {
  if (cart.length === 0) { showToast('Seu carrinho está vazio!'); return; }
  document.getElementById('checkout-section').classList.add('hidden');
  document.getElementById('checkout-form-section').classList.remove('hidden');
}

function cancelCheckout() {
  document.getElementById('checkout-section').classList.remove('hidden');
  document.getElementById('checkout-form-section').classList.add('hidden');
}

async function submitOrder() {
  const name = document.getElementById('c-name')?.value.trim();
  if (!name) { showToast('Informe seu nome'); return; }

  const body = {
    customer_name:    name,
    customer_email:   document.getElementById('c-email')?.value.trim(),
    customer_phone:   document.getElementById('c-phone')?.value.trim(),
    customer_address: document.getElementById('c-address')?.value.trim(),
    payment_method:   document.getElementById('c-payment')?.value,
    notes:            document.getElementById('c-notes')?.value.trim(),
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      cart = [];
      saveCart();
      updateCartUI();
      cancelCheckout();
      toggleCart(false);

      let msg = `✅ Pedido realizado!\nCódigo: ${data.order_code}`;
      if (data.pixQR) msg += '\n\nPIX QR gerado — verifique seu e-mail ou WhatsApp.';
      alert(msg);

      if (storeSettings.store_whatsapp && body.payment_method === 'whatsapp') {
        const waMsg = encodeURIComponent(`Olá! Fiz um pedido: *${data.order_code}* — Total: R$ ${data.total.toFixed(2).replace('.', ',')}`);
        window.open(`https://wa.me/${storeSettings.store_whatsapp}?text=${waMsg}`, '_blank');
      }
    }
  } catch (e) {
    showToast('Erro ao processar pedido. Tente novamente.');
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
