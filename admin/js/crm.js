/* ============================================================
   crm.js — CRM Analytics Logic
   ============================================================ */

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  await verifyAuth();
  await loadSidebarName();
  await loadAnalytics();

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

// ============================================================
// LOAD ANALYTICS
// ============================================================
async function loadAnalytics() {
  try {
    const res = await fetch('/api/admin/analytics');
    const data = await res.json();
    renderKPIs(data);
    renderMonthlyRevenue(data.monthlyRevenue);
    renderDailyOrders(data.dailyOrders);
    renderTopProducts(data.topProducts);
    renderPaymentMethods(data.paymentMethods);
    renderStatusRings(data.orderStatusDist, data.totalOrders);
    renderTopCustomers(data.topCustomers);
    renderProductPerformance(data.productPerformance);
  } catch (err) {
    console.error('Analytics error:', err);
    showToast('Erro ao carregar analytics', 'error');
  }
}

// ============================================================
// KPIs
// ============================================================
function renderKPIs(data) {
  const totalRevenue = (data.monthlyRevenue || []).reduce((s, m) => s + (m.revenue || 0), 0);
  const totalOrders = (data.orderStatusDist || []).reduce((s, d) => s + d.count, 0);
  const conversion = data.conversionRate
    ? ((data.conversionRate.paid / (data.conversionRate.paid + data.conversionRate.pending || 1)) * 100).toFixed(1) + '%'
    : '0%';

  document.getElementById('kpi-revenue').textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
  document.getElementById('kpi-orders').textContent = totalOrders;
  document.getElementById('kpi-products').textContent = data.productPerformance
    ? data.productPerformance.filter(p => p.units_sold > 0).length + '/' + data.productPerformance.length
    : '—';
  document.getElementById('kpi-avg').textContent = data.avgOrderValue?.avg
    ? `R$ ${data.avgOrderValue.avg.toFixed(2).replace('.', ',')}`
    : 'R$ 0,00';
  document.getElementById('kpi-conversion').textContent = conversion;
  document.getElementById('kpi-customers').textContent = (data.topCustomers || []).length || '—';
}

// ============================================================
// MONTHLY REVENUE BAR CHART
// ============================================================
function renderMonthlyRevenue(monthly) {
  const container = document.getElementById('monthly-revenue-chart');
  if (!container) return;

  if (!monthly || monthly.length === 0) {
    container.innerHTML = '<div class="empty-state">Sem dados de faturamento</div>';
    return;
  }

  const maxRev = Math.max(...monthly.map(m => m.revenue || 0));
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  container.innerHTML = monthly.map((m, i) => {
    const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
    const label = months[parseInt(m.month) - 1] || m.month;
    const val = `R$ ${m.revenue.toFixed(2).replace('.', ',')}`;
    return `
      <div class="bar-group">
        <div class="bar-wrap">
          <div class="bar" style="height:${pct}%;background:linear-gradient(180deg,#00f5a0,rgba(0,245,160,0.2))"
               data-tooltip="${val}"></div>
        </div>
        <span class="bar-label">${label}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// DAILY ORDERS LINE CHART
// ============================================================
function renderDailyOrders(daily) {
  const container = document.getElementById('daily-orders-chart');
  if (!container) return;

  if (!daily || daily.length === 0) {
    container.innerHTML = '<div class="empty-state">Sem dados de pedidos</div>';
    return;
  }

  const maxOrd = Math.max(...daily.map(d => d.orders || 0));

  container.innerHTML = daily.map(d => {
    const pct = maxOrd > 0 ? (d.orders / maxOrd) * 100 : 0;
    const day = d.day ? d.day.split('-').pop() : '';
    return `
      <div class="line-dot" title="${d.day}: ${d.orders} pedidos | R$ ${(d.revenue||0).toFixed(2).replace('.',',')}">
        <div style="height:${pct}%;display:flex;align-items:flex-end;width:100%">
          <div class="line-bar" style="height:100%"></div>
        </div>
        <span class="line-date">${day}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// TOP PRODUCTS RANK LIST
// ============================================================
function renderTopProducts(products) {
  const container = document.getElementById('top-products-list');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum produto vendido</div>';
    return;
  }

  const maxQty = Math.max(...products.map(p => p.total_qty || 0));

  container.innerHTML = products.map((p, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
    const barPct = maxQty > 0 ? ((p.total_qty || 0) / maxQty * 100) : 0;
    return `
      <div class="rank-item">
        <div class="rank-num ${rankClass}">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-name">${p.name || '—'}</div>
          <div class="rank-meta">${p.total_qty || 0} unidades · ${p.order_count || 0} pedidos</div>
        </div>
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${barPct}%"></div>
        </div>
        <div class="rank-value">R$ ${(p.total_revenue || 0).toFixed(2).replace('.', ',')}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// PAYMENT METHODS DONUT
// ============================================================
function renderPaymentMethods(methods) {
  const container = document.getElementById('payment-donut');
  const legend = document.getElementById('payment-legend');
  if (!container) return;

  if (!methods || methods.length === 0) {
    container.innerHTML = '<div class="empty-state">Sem dados</div>';
    return;
  }

  const total = methods.reduce((s, m) => s + m.count, 0);
  const colors = ['#00f5a0', '#00d4ff', '#a855f7', '#ffc200', '#ff2d78'];
  const labels = { pix: 'PIX', whatsapp: 'WhatsApp', card: 'Cartão', bank_transfer: 'Transferência', _default: 'Outro' };

  let cumulative = 0;
  const circumference = 2 * Math.PI * 46;
  const circles = methods.map((m, i) => {
    const pct = total > 0 ? m.count / total : 0;
    const dash = circumference * pct;
    const gap = circumference * cumulative;
    cumulative += pct;
    const color = colors[i % colors.length];
    const label = labels[m.payment_method] || labels._default;
    return `<circle class="donut-ring" cx="70" cy="70" r="46"
      stroke="${color}"
      stroke-dasharray="${dash} ${circumference}"
      stroke-dashoffset="${-gap}"
      style="transition-delay:${i * 0.15}s"
    />`;
  }).join('');

  container.style.position = 'relative';
  container.innerHTML = `
    <svg class="donut-svg" viewBox="0 0 140 140">${circles}</svg>
  `;

  legend.innerHTML = methods.map((m, i) => {
    const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) + '%' : '0%';
    const color = colors[i % colors.length];
    const label = labels[m.payment_method] || m.payment_method || 'Outro';
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-label">${label}</span>
        <span class="legend-count">${m.count}x</span>
        <span class="legend-pct">${pct}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// STATUS RINGS
// ============================================================
function renderStatusRings(statuses, totalOrders) {
  const container = document.getElementById('status-rings');
  if (!container) return;

  const config = {
    pending:   { color: '#ffc200', label: 'Aguardando' },
    paid:      { color: '#00f5a0', label: 'Pago' },
    shipped:   { color: '#00d4ff', label: 'Enviado' },
    delivered: { color: '#4ade80', label: 'Entregue' },
    cancelled: { color: '#ff2d78', label: 'Cancelado' },
  };

  const map = {};
  (statuses || []).forEach(s => { map[s.order_status] = s.count; });

  container.innerHTML = Object.entries(config).map(([key, cfg]) => {
    const count = map[key] || 0;
    const pct = totalOrders > 0 ? count / totalOrders : 0;
    const r = 28;
    const circ = 2 * Math.PI * r;
    const fill = pct * circ;
    return `
      <div class="status-ring">
        <svg class="ring-svg" viewBox="0 0 72 72">
          <circle class="ring-bg" cx="36" cy="36" r="${r}"/>
          <circle class="ring-fill" cx="36" cy="36" r="${r}"
            stroke="${cfg.color}"
            stroke-dasharray="${fill} ${circ}"
            stroke-dashoffset="${circ * 0.25}"
          />
        </svg>
        <div class="ring-count" style="color:${cfg.color}">${count}</div>
        <div class="ring-label" style="color:${cfg.color}">${cfg.label}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// TOP CUSTOMERS
// ============================================================
function renderTopCustomers(customers) {
  const container = document.getElementById('top-customers-list');
  if (!container) return;

  if (!customers || customers.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum cliente registrado</div>';
    return;
  }

  const maxSpent = Math.max(...customers.map(c => c.total_spent || 0));

  container.innerHTML = customers.map((c, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
    const barPct = maxSpent > 0 ? ((c.total_spent || 0) / maxSpent * 100) : 0;
    const lastOrder = c.last_order ? new Date(c.last_order).toLocaleDateString('pt-BR') : '—';
    return `
      <div class="rank-item">
        <div class="rank-num ${rankClass}">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-name">${c.customer_name || '—'}</div>
          <div class="rank-meta">${c.order_count || 0} pedidos · última: ${lastOrder}</div>
        </div>
        <div class="rank-bar-wrap">
          <div class="rank-bar" style="width:${barPct};background:linear-gradient(90deg,#c9a84c,#e5c76b)"></div>
        </div>
        <div class="rank-value">R$ ${(c.total_spent || 0).toFixed(2).replace('.', ',')}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// PRODUCT PERFORMANCE
// ============================================================
function renderProductPerformance(products) {
  const container = document.getElementById('product-performance-chart');
  if (!container) return;

  const sorted = (products || []).filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxRev = sorted[0]?.revenue || 0;
  const colors = ['#00f5a0', '#00d4ff', '#a855f7', '#ffc200', '#ff2d78', '#4ade80', '#c9a84c', '#60a5fa'];

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhuma venda registrada</div>';
    return;
  }

  container.innerHTML = sorted.map((p, i) => {
    const pct = maxRev > 0 ? (p.revenue / maxRev * 100) : 0;
    const color = colors[i % colors.length];
    return `
      <div class="hbar-item">
        <div class="hbar-label" title="${p.name}">${p.name || '—'}</div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="hbar-value">R$ ${p.revenue.toFixed(2).replace('.', ',')}</div>
      </div>
    `;
  }).join('');
}