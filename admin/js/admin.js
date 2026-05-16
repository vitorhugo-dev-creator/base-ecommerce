/* ============================================================
   admin.js — Lógica do Painel Administrativo
   ============================================================ */

// ============================================================
// ESTADO
// ============================================================
let currentPage = 'dashboard';
let allAdminProducts = [];
let allAdminOrders = [];
let editingProductId = null;
let editingOrderId = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  await verifyAuth();
  await loadSidebarName();
  await loadDashboard();
});

async function verifyAuth() {
  try {
    const res = await fetch('/api/admin/check');
    const data = await res.json();
    if (!data.authenticated) window.location.href = '/admin/login';
  } catch {
    window.location.href = '/admin/login';
  }
}

async function loadSidebarName() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    const name = settings.store_name || 'Painel Admin';
    document.getElementById('sidebar-store-name').textContent = name;
    document.title = `Admin — ${name}`;
  } catch {}
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`section-${page}`)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  const titles = { dashboard: 'Dashboard', products: 'Produtos', orders: 'Pedidos', settings: 'Configurações' };
  document.getElementById('topbar-title').textContent = titles[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'products')  loadAdminProducts();
  if (page === 'orders')    loadAdminOrders();
  if (page === 'settings')  loadSettings();
  if (page === 'analytics') loadAnalytics();
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();

    document.getElementById('stat-orders').textContent   = data.totalOrders;
    document.getElementById('stat-revenue').textContent  = `R$ ${data.totalRevenue.toFixed(2).replace('.', ',')}`;
    document.getElementById('stat-products').textContent = data.totalProducts;
    document.getElementById('stat-pending').textContent  = data.pendingOrders;

    const tbody = document.getElementById('recent-orders-tbody');
    tbody.innerHTML = data.recentOrders.length
      ? data.recentOrders.map(o => `
          <tr>
            <td><code>${o.order_code}</code></td>
            <td>${o.customer_name}</td>
            <td>R$ ${o.total.toFixed(2).replace('.', ',')}</td>
            <td>${statusBadge(o.order_status)}</td>
            <td>${formatDate(o.created_at)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" class="empty-state">Nenhum pedido ainda.</td></tr>';
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ============================================================
// PRODUTOS
// ============================================================
async function loadAdminProducts() {
  try {
    const res = await fetch('/api/products?active=all');
    allAdminProducts = await res.json();
    renderAdminProducts(allAdminProducts);
  } catch (e) {
    console.error('Products error:', e);
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('products-tbody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum produto cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        ${p.image_url
          ? `<img src="${p.image_url}" class="image-preview" style="width:48px;height:48px">`
          : '<span style="color:var(--text-muted)">—</span>'
        }
      </td>
      <td>${p.name}</td>
      <td>${p.category || '—'}</td>
      <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
      <td>${p.promo_percent > 0 ? `<span class="badge badge-pending">-${p.promo_percent}%</span>` : '—'}</td>
      <td>${p.active ? '<span class="badge badge-active">Ativo</span>' : '<span class="badge badge-inactive">Inativo</span>'}</td>
      <td style="display:flex;gap:0.5rem">
        <button class="btn btn-sm" onclick="openProductModal(${p.id})">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function filterAdminProducts() {
  const q = document.getElementById('product-search').value.toLowerCase();
  const filtered = allAdminProducts.filter(p =>
    p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  );
  renderAdminProducts(filtered);
}

function openProductModal(id = null) {
  editingProductId = id;
  document.getElementById('product-modal-title').textContent = id ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('edit-product-id').value = id || '';

  // Limpar campos
  ['p-name','p-description','p-category','p-price','p-promo','p-tags'].forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
  document.getElementById('p-active').value = '1';
  document.getElementById('p-image-preview').style.display = 'none';

  if (id) {
    const p = allAdminProducts.find(x => x.id === id);
    if (p) {
      document.getElementById('p-name').value        = p.name || '';
      document.getElementById('p-description').value = p.description || '';
      document.getElementById('p-category').value    = p.category || '';
      document.getElementById('p-price').value       = p.price || '';
      document.getElementById('p-promo').value       = p.promo_percent || 0;
      document.getElementById('p-tags').value        = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
      document.getElementById('p-active').value      = p.active ? '1' : '0';
      if (p.image_url) {
        const prev = document.getElementById('p-image-preview');
        prev.src = p.image_url;
        prev.style.display = 'block';
      }
    }
  }

  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
  editingProductId = null;
}

function previewImage(input) {
  const prev = document.getElementById('p-image-preview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { prev.src = e.target.result; prev.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveProduct() {
  const name = document.getElementById('p-name').value.trim();
  if (!name) { showToast('Nome do produto é obrigatório', 'warning'); return; }

  const formData = new FormData();
  formData.append('name',         name);
  formData.append('description',  document.getElementById('p-description').value);
  formData.append('category',     document.getElementById('p-category').value);
  formData.append('price',        document.getElementById('p-price').value || 0);
  formData.append('promo_percent',document.getElementById('p-promo').value || 0);
  formData.append('tags',         document.getElementById('p-tags').value);
  formData.append('active',       document.getElementById('p-active').value);

  const imageFile = document.getElementById('p-image').files[0];
  if (imageFile) formData.append('image', imageFile);

  const extraFiles = document.getElementById('p-extra-images').files;
  for (const f of extraFiles) formData.append('extra_images', f);

  const url    = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
  const method = editingProductId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (data.success) {
      showToast(editingProductId ? 'Produto atualizado!' : 'Produto criado!', 'success');
      closeProductModal();
      loadAdminProducts();
    } else {
      showToast('Erro: ' + (data.error || 'Desconhecido'), 'error');
    }
  } catch (e) {
    showToast('Erro ao salvar produto', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Excluir este produto?')) return;
  try {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    showToast('Produto excluído', 'success');
    loadAdminProducts();
  } catch {
    showToast('Erro ao excluir', 'error');
  }
}

// ============================================================
// PEDIDOS
// ============================================================
async function loadAdminOrders() {
  try {
    const res = await fetch('/api/admin/orders');
    allAdminOrders = await res.json();
    renderAdminOrders(allAdminOrders);
  } catch (e) {
    console.error('Orders error:', e);
  }
}

function renderAdminOrders(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum pedido encontrado.</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><code>${o.order_code}</code></td>
      <td>${o.customer_name}</td>
      <td>R$ ${o.total.toFixed(2).replace('.', ',')}</td>
      <td>${paymentBadge(o.payment_status)}</td>
      <td>${statusBadge(o.order_status)}</td>
      <td>${formatDate(o.created_at)}</td>
      <td><button class="btn btn-sm" onclick="openOrderModal(${o.id})">Detalhes</button></td>
    </tr>
  `).join('');
}

function filterAdminOrders() {
  const q = document.getElementById('order-search').value.toLowerCase();
  const filtered = allAdminOrders.filter(o =>
    o.order_code.toLowerCase().includes(q) ||
    o.customer_name.toLowerCase().includes(q) ||
    (o.customer_email || '').toLowerCase().includes(q)
  );
  renderAdminOrders(filtered);
}

function openOrderModal(id) {
  editingOrderId = id;
  const o = allAdminOrders.find(x => x.id === id);
  if (!o) return;

  document.getElementById('order-modal-code').textContent = o.order_code;
  document.getElementById('order-modal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
      <div>
        <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.25rem">Cliente</p>
        <p>${o.customer_name}</p>
      </div>
      <div>
        <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.25rem">Contato</p>
        <p>${o.customer_phone || o.customer_email || '—'}</p>
      </div>
      <div>
        <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.25rem">Endereço</p>
        <p>${o.customer_address || '—'}</p>
      </div>
      <div>
        <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.25rem">Pagamento</p>
        <p>${o.payment_method || '—'}</p>
      </div>
    </div>

    <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;margin-bottom:0.75rem">Itens</p>
    <table style="margin-bottom:1.5rem">
      <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${o.items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.qty}</td>
            <td>R$ ${i.price.toFixed(2).replace('.', ',')}</td>
            <td>R$ ${(i.price * i.qty).toFixed(2).replace('.', ',')}</td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="3" style="font-weight:bold">Total</td>
          <td style="font-weight:bold;color:var(--accent)">R$ ${o.total.toFixed(2).replace('.', ',')}</td>
        </tr>
      </tbody>
    </table>

    <div class="form-grid">
      <div class="form-group">
        <label>Status do Pedido</label>
        <select id="edit-order-status">
          <option value="pending"   ${o.order_status==='pending'   ? 'selected' : ''}>Aguardando</option>
          <option value="paid"      ${o.order_status==='paid'      ? 'selected' : ''}>Pago</option>
          <option value="shipped"   ${o.order_status==='shipped'   ? 'selected' : ''}>Enviado</option>
          <option value="delivered" ${o.order_status==='delivered' ? 'selected' : ''}>Entregue</option>
          <option value="cancelled" ${o.order_status==='cancelled' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status do Pagamento</label>
        <select id="edit-payment-status">
          <option value="pending" ${o.payment_status==='pending' ? 'selected' : ''}>Aguardando</option>
          <option value="paid"    ${o.payment_status==='paid'    ? 'selected' : ''}>Pago</option>
          <option value="failed"  ${o.payment_status==='failed'  ? 'selected' : ''}>Falhou</option>
        </select>
      </div>
    </div>

    ${o.notes ? `<p style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem">Obs: ${o.notes}</p>` : ''}
  `;

  document.getElementById('order-modal').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('open');
  editingOrderId = null;
}

async function saveOrderStatus() {
  if (!editingOrderId) return;
  const order_status   = document.getElementById('edit-order-status').value;
  const payment_status = document.getElementById('edit-payment-status').value;

  try {
    const res = await fetch(`/api/admin/orders/${editingOrderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status, payment_status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Pedido atualizado!', 'success');
      closeOrderModal();
      loadAdminOrders();
    }
  } catch {
    showToast('Erro ao atualizar pedido', 'error');
  }
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    Object.entries(settings).forEach(([key, value]) => {
      const el = document.getElementById(`set-${key}`);
      if (el) el.value = value;
    });
  } catch {}
}

async function saveSettings() {
  const fields = ['store_name','store_description','hero_title','hero_subtitle','store_whatsapp','store_pix_key','bg_color','accent_color'];
  const body = {};
  fields.forEach(f => {
    const el = document.getElementById(`set-${f}`);
    if (el) body[f] = el.value;
  });

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Configurações salvas!', 'success');
      loadSidebarName();
    }
  } catch {
    showToast('Erro ao salvar configurações', 'error');
  }
}

async function changePassword() {
  const newPass = document.getElementById('new-password').value;
  if (!newPass || newPass.length < 6) { showToast('Senha deve ter no mínimo 6 caracteres', 'warning'); return; }
  // Implementar rota se necessário
  showToast('Funcionalidade: implemente /api/admin/change-password');
}

// ============================================================
// AUTH
// ============================================================
async function doLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function statusBadge(status) {
  const map = { pending: 'badge-pending', paid: 'badge-paid', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
  const labels = { pending: 'Aguardando', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };
  return `<span class="badge ${map[status] || ''}">${labels[status] || status}</span>`;
}

function paymentBadge(status) {
  const map = { pending: 'badge-pending', paid: 'badge-paid', failed: 'badge-failed' };
  const labels = { pending: 'Aguardando', paid: 'Pago', failed: 'Falhou' };
  return `<span class="badge ${map[status] || ''}">${labels[status] || status}</span>`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast${type ? ' toast-' + type : ''}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ============================================================
// ANALYTICS / CRM
// ============================================================
async function loadAnalytics() {
  try {
    const res = await fetch('/api/admin/analytics');
    const data = await res.json();
    renderAnalyticsKPIs(data);
    renderAnalyticsMonthly(data.monthlyRevenue);
    renderAnalyticsDaily(data.dailyOrders);
    renderAnalyticsTopProducts(data.topProducts);
    renderAnalyticsPaymentDonut(data.paymentMethods);
    renderAnalyticsStatusRings(data.orderStatusDist, data);
    renderAnalyticsTopCustomers(data.topCustomers);
    renderAnalyticsHbars(data.productPerformance);
  } catch (err) {
    console.error('Analytics error:', err);
  }
}

function renderAnalyticsKPIs(data) {
  const container = document.getElementById('analytics-kpi-grid');
  if (!container) return;
  const totalRevenue = (data.monthlyRevenue || []).reduce((s, m) => s + (m.revenue || 0), 0);
  const totalOrders = (data.orderStatusDist || []).reduce((s, d) => s + d.count, 0);
  const conv = data.conversionRate
    ? ((data.conversionRate.paid / (data.conversionRate.paid + data.conversionRate.pending || 1)) * 100).toFixed(1) + '%'
    : '0%';
  const avg = data.avgOrderValue?.avg ? `R$ ${data.avgOrderValue.avg.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  container.innerHTML = `
    <div class="analytics-kpi-card analytics-kpi-primary">
      <div class="analytics-kpi-label">Faturamento</div>
      <div class="analytics-kpi-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
      <div class="analytics-kpi-sub">últimos 12 meses</div>
    </div>
    <div class="analytics-kpi-card">
      <div class="analytics-kpi-label">Pedidos</div>
      <div class="analytics-kpi-value">${totalOrders}</div>
      <div class="analytics-kpi-sub">total registrados</div>
    </div>
    <div class="analytics-kpi-card">
      <div class="analytics-kpi-label">Ticket Médio</div>
      <div class="analytics-kpi-value">${avg}</div>
      <div class="analytics-kpi-sub">por pedido pago</div>
    </div>
    <div class="analytics-kpi-card">
      <div class="analytics-kpi-label">Conversão</div>
      <div class="analytics-kpi-value">${conv}</div>
      <div class="analytics-kpi-sub">pagos / total</div>
    </div>
    <div class="analytics-kpi-card">
      <div class="analytics-kpi-label">PIX</div>
      <div class="analytics-kpi-value">${(data.paymentMethods || []).find(m => m.payment_method === 'pix')?.count || 0}</div>
      <div class="analytics-kpi-sub">pagamentos</div>
    </div>
    <div class="analytics-kpi-card">
      <div class="analytics-kpi-label">WhatsApp</div>
      <div class="analytics-kpi-value">${(data.paymentMethods || []).find(m => m.payment_method === 'whatsapp')?.count || 0}</div>
      <div class="analytics-kpi-sub">pagamentos</div>
    </div>
  `;
}

function renderAnalyticsMonthly(monthly) {
  const container = document.getElementById('analytics-monthly-chart');
  if (!container) return;
  if (!monthly || monthly.length === 0) { container.innerHTML = '<div class="empty-state">Sem dados</div>'; return; }
  const max = Math.max(...monthly.map(m => m.revenue || 0));
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  container.innerHTML = monthly.map(m => {
    const pct = max > 0 ? (m.revenue / max) * 100 : 0;
    return `
      <div class="analytics-bar-group">
        <div class="analytics-bar-wrap">
          <div class="analytics-bar" style="height:${pct}%" title="R$ ${m.revenue.toFixed(2).replace('.', ',')}"></div>
        </div>
        <span class="analytics-bar-label">${months[parseInt(m.month) - 1] || m.month}</span>
      </div>
    `;
  }).join('');
}

function renderAnalyticsDaily(daily) {
  const container = document.getElementById('analytics-daily-chart');
  if (!container) return;
  if (!daily || daily.length === 0) { container.innerHTML = '<div class="empty-state">Sem dados</div>'; return; }
  const max = Math.max(...daily.map(d => d.orders || 0));
  container.innerHTML = daily.map(d => {
    const pct = max > 0 ? (d.orders / max) * 100 : 0;
    return `
      <div class="analytics-dot-col">
        <div style="height:${pct}%;display:flex;align-items:flex-end;width:100%">
          <div class="analytics-dot" style="height:100%"></div>
        </div>
        <span class="analytics-dot-date">${d.day ? d.day.split('-').pop() : ''}</span>
      </div>
    `;
  }).join('');
}

function renderAnalyticsTopProducts(products) {
  const container = document.getElementById('analytics-top-products');
  if (!container) return;
  if (!products || products.length === 0) { container.innerHTML = '<div class="empty-state">Nenhuma venda</div>'; return; }
  const max = Math.max(...products.map(p => p.total_qty || 0));
  container.innerHTML = products.slice(0, 6).map((p, i) => {
    const cls = i === 0 ? 'analytics-rank-1' : i === 1 ? 'analytics-rank-2' : i === 2 ? 'analytics-rank-3' : 'analytics-rank-default';
    return `
      <div class="analytics-rank-item">
        <div class="analytics-rank-num ${cls}">${i + 1}</div>
        <div class="analytics-rank-info">
          <div class="analytics-rank-name">${p.name || '—'}</div>
          <div class="analytics-rank-meta">${p.total_qty || 0} un · ${p.order_count || 0} ped</div>
        </div>
        <div class="analytics-rank-bar-wrap"><div class="analytics-rank-bar" style="width:${max > 0 ? (p.total_qty / max * 100) : 0}%"></div></div>
        <div class="analytics-rank-value">R$ ${(p.total_revenue || 0).toFixed(2).replace('.', ',')}</div>
      </div>
    `;
  }).join('');
}

function renderAnalyticsPaymentDonut(methods) {
  const donut = document.getElementById('analytics-payment-donut');
  const legend = document.getElementById('analytics-payment-legend');
  if (!donut) return;
  if (!methods || methods.length === 0) { donut.innerHTML = '<div class="empty-state">Sem dados</div>'; return; }
  const total = methods.reduce((s, m) => s + m.count, 0);
  const colors = ['#c9a84c', '#00d4ff', '#a855f7', '#00f5a0', '#ff2d78'];
  const labels = { pix: 'PIX', whatsapp: 'WhatsApp', _default: 'Outro' };
  let cum = 0;
  const circ = 2 * Math.PI * 48;
  donut.innerHTML = `<svg class="analytics-donut-svg" viewBox="0 0 120 120">` +
    methods.map((m, i) => {
      const pct = total > 0 ? m.count / total : 0;
      const dash = circ * pct;
      const gap = circ * cum;
      cum += pct;
      return `<circle class="analytics-donut-ring" cx="60" cy="60" r="48" stroke="${colors[i % colors.length]}" stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${-gap}" style="transition-delay:${i * 0.1}s"/>`;
    }).join('') + '</svg>';
  legend.innerHTML = methods.map((m, i) => {
    const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) + '%' : '0%';
    return `
      <div class="analytics-legend-item">
        <span class="analytics-legend-dot" style="background:${colors[i % colors.length]}"></span>
        <span class="analytics-legend-label">${labels[m.payment_method] || labels._default}</span>
        <span class="analytics-legend-pct">${pct}</span>
      </div>
    `;
  }).join('');
}

function renderAnalyticsStatusRings(statuses, data) {
  const container = document.getElementById('analytics-status-rings');
  if (!container) return;
  const total = (data.orderStatusDist || []).reduce((s, d) => s + d.count, 0) || 1;
  const map = {};
  (statuses || []).forEach(s => { map[s.order_status] = s.count; });
  const cfg = [
    { key: 'pending',   color: '#ffc200', label: 'Aguard.' },
    { key: 'paid',      color: '#00cc66', label: 'Pago' },
    { key: 'shipped',   color: '#0099cc', label: 'Enviado' },
    { key: 'delivered', color: '#33ff33', label: 'Entregue' },
    { key: 'cancelled', color: '#ff4444', label: 'Cancel.' },
  ];
  container.innerHTML = cfg.map(c => {
    const count = map[c.key] || 0;
    const pct = count / total;
    const r = 22;
    const circ = 2 * Math.PI * r;
    const fill = pct * circ;
    return `
      <div class="analytics-status-ring">
        <svg class="analytics-ring-svg" viewBox="0 0 56 56">
          <circle class="analytics-ring-bg" cx="28" cy="28" r="${r}"/>
          <circle class="analytics-ring-fill" cx="28" cy="28" r="${r}" stroke="${c.color}" stroke-dasharray="${fill} ${circ}" stroke-dashoffset="${circ * 0.25}"/>
        </svg>
        <div class="analytics-ring-count" style="color:${c.color}">${count}</div>
        <div class="analytics-ring-label" style="color:${c.color}">${c.label}</div>
      </div>
    `;
  }).join('');
}

function renderAnalyticsTopCustomers(customers) {
  const container = document.getElementById('analytics-top-customers');
  if (!container) return;
  if (!customers || customers.length === 0) { container.innerHTML = '<div class="empty-state">Nenhum cliente</div>'; return; }
  const max = Math.max(...customers.map(c => c.total_spent || 0));
  container.innerHTML = customers.slice(0, 5).map((c, i) => {
    const cls = i === 0 ? 'analytics-rank-1' : i === 1 ? 'analytics-rank-2' : i === 2 ? 'analytics-rank-3' : 'analytics-rank-default';
    return `
      <div class="analytics-rank-item">
        <div class="analytics-rank-num ${cls}">${i + 1}</div>
        <div class="analytics-rank-info">
          <div class="analytics-rank-name">${c.customer_name || '—'}</div>
          <div class="analytics-rank-meta">${c.order_count || 0} pedidos</div>
        </div>
        <div class="analytics-rank-bar-wrap"><div class="analytics-rank-bar" style="width:${max > 0 ? (c.total_spent / max * 100) : 0}%"></div></div>
        <div class="analytics-rank-value">R$ ${(c.total_spent || 0).toFixed(2).replace('.', ',')}</div>
      </div>
    `;
  }).join('');
}

function renderAnalyticsHbars(products) {
  const container = document.getElementById('analytics-perf-bars');
  if (!container) return;
  const sorted = (products || []).filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 7);
  const max = sorted[0]?.revenue || 0;
  const colors = ['#c9a84c', '#00d4ff', '#a855f7', '#00f5a0', '#ff2d78', '#ffc200', '#60a5fa'];
  if (sorted.length === 0) { container.innerHTML = '<div class="empty-state">Sem vendas</div>'; return; }
  container.innerHTML = sorted.map((p, i) => `
    <div class="analytics-hbar-item">
      <div class="analytics-hbar-label" title="${p.name}">${p.name || '—'}</div>
      <div class="analytics-hbar-track"><div class="analytics-hbar-fill" style="width:${max > 0 ? (p.revenue / max * 100) : 0}%;background:${colors[i % colors.length]}"></div></div>
      <div class="analytics-hbar-value">R$ ${p.revenue.toFixed(2).replace('.', ',')}</div>
    </div>
  `).join('');
}
