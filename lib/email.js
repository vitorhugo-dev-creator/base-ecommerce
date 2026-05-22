const nodemailer = require('nodemailer');
const { escapeHtml } = require('./helpers');

let mailTransport = null;

function initMail() {
  if (mailTransport) return mailTransport;
  try {
    if (process.env.SMTP_HOST) {
      mailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
    }
  } catch (e) {
    console.log('SMTP nao configurado — emails desativados');
  }
  return mailTransport;
}

async function sendOrderEmail(order, settings) {
  const transport = initMail();
  if (!transport) return;

  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0">${escapeHtml(i.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:center">${i.qty}x</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right">R$ ${i.price.toFixed(2).replace('.', ',')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right">R$ ${(i.price * i.qty).toFixed(2).replace('.', ',')}</td>
    </tr>`
  ).join('');

  const statusColors = { pending: '#ffc200', paid: '#00cc66', shipped: '#0099cc', delivered: '#33ff33', cancelled: '#ff4444' };
  const statusLabels = { pending: 'Aguardando pagamento', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;background:#111118;border:1px solid #2a2a3a;border-radius:8px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c 0%,#e5c76b 100%);padding:24px 32px">
        <h1 style="margin:0;font-size:1.4rem;color:#0a0a0f;letter-spacing:0.05em">${settings.store_name || 'Loja'}</h1>
        <p style="margin:4px 0 0;color:#1a1a00;font-size:0.85rem">Novo pedido registrado</p>
      </div>
      <div style="padding:28px 32px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding:16px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
          <div>
            <div style="font-size:0.72rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Codigo do Pedido</div>
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
            <div style="color:#e0e0e0;font-size:0.9rem">${escapeHtml(order.customer_name)}</div>
          </div>
          <div style="padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Contato</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${escapeHtml(order.customer_phone || order.customer_email || '-')}</div>
          </div>
          <div style="padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px;grid-column:1/-1">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Endereco</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${escapeHtml(order.customer_address || 'Nao informado')}</div>
          </div>
        </div>
        <h2 style="font-size:0.75rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Itens do Pedido</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#181825;border:1px solid #2a2a3a;border-radius:6px;overflow:hidden">
          <thead><tr style="background:#1e1e2e">
            <th style="padding:10px 12px;text-align:left;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em">Produto</th>
            <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em">Qtd</th>
            <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;text-align:right">Preco</th>
            <th style="padding:10px 12px;font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;text-align:right">Subtotal</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px;background:#1e1e2e;border:1px solid #2a2a3a;border-radius:6px;margin-bottom:20px">
          <span style="font-size:1rem;color:#e0e0e0;font-weight:600">Total</span>
          <span style="font-size:1.5rem;font-weight:800;color:#c9a84c">R$ ${order.total.toFixed(2).replace('.', ',')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px">
          <div style="flex:1;padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Forma de Pagamento</div>
            <div style="color:#e0e0e0;font-size:0.9rem;text-transform:uppercase">${order.payment_method || '-'}</div>
          </div>
          <div style="flex:1;padding:12px;background:#181825;border:1px solid #2a2a3a;border-radius:6px">
            <div style="font-size:0.68rem;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Data</div>
            <div style="color:#e0e0e0;font-size:0.9rem">${new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        ${order.notes ? `<div style="margin-top:16px;padding:12px;background:#181825;border:1px solid #ffc20040;border-radius:6px;border-left:3px solid #ffc200">
          <div style="font-size:0.68rem;color:#ffc200;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Observacoes</div>
          <div style="color:#e0e0e0;font-size:0.85rem">${escapeHtml(order.notes)}</div>
        </div>` : ''}
      </div>
      <div style="padding:16px 32px;background:#0c0c12;border-top:1px solid #2a2a3a;text-align:center">
        <span style="font-size:0.72rem;color:#6b6b8a">${settings.store_name || 'Loja'} — <a href="${process.env.BASE_URL || 'http://localhost:3002'}/admin" style="color:#c9a84c">Acessar painel</a></span>
      </div>
    </div></body></html>`;

  try {
    await transport.sendMail({
      from: `"${settings.store_name || 'Loja'} Store" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `Novo pedido ${order.order_code} — R$ ${order.total.toFixed(2).replace('.', ',')}`,
      html
    });
    console.log(`Email enviado para admin sobre pedido ${order.order_code}`);
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
  }
}

module.exports = { initMail, sendOrderEmail };
