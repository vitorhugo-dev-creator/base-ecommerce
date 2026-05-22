import React, { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('admin_token')
}

function authHeader() {
  return { 'Authorization': `Bearer ${getToken()}` }
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', category: '', price: 0, tags: '', promo_percent: '0', active: '1', current_image: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadProducts() }, [])

  function loadProducts() {
    fetch(`${API_URL}/api/products?active=all&limit=200`).then(r => { if (!r.ok) throw r; return r.json() }).then(d => setProducts(d.products || d)).catch(() => setToast({ msg: 'Erro ao carregar produtos', type: 'error' }))
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  function openNew() { setEditProduct(null); setForm({ name: '', description: '', category: '', price: '', tags: '', promo_percent: '0', active: '1', current_image: '' }); setShowModal(true) }
  function openEdit(p) { setEditProduct(p); setForm({ name: p.name, description: p.description || '', category: p.category || '', price: p.price, tags: (p.tags || []).join(', '), promo_percent: p.promo_percent || '0', active: p.active ? '1' : '0', current_image: p.image_url || '' }); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditProduct(null) }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveProduct() {
    if (!form.name.trim()) return showToast('Nome é obrigatório', 'error')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (k !== '_img') fd.append(k, v) })
      if (form._img) fd.append('image', form._img.get('image'))
      const res = await fetch(editProduct ? `${API_URL}/api/admin/products/${editProduct.id}` : `${API_URL}/api/admin/products`, { method: editProduct ? 'PUT' : 'POST', body: fd, headers: authHeader() })
      const data = await res.json()
      if (data.success) { loadProducts(); closeModal(); showToast('Produto salvo!') }
      else showToast(data.error || 'Erro', 'error')
    } catch { showToast('Erro de conexão', 'error') }
    setSaving(false)
  }

  async function deleteProduct(id) {
    if (!confirm('Excluir este produto?')) return
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}`, { method: 'DELETE', headers: authHeader() })
      if (!res.ok) throw new Error('Erro ao excluir')
      loadProducts()
      showToast('Produto excluído')
    } catch { showToast('Erro ao excluir produto', 'error') }
  }

  return (
    <div>
      <div className="toolbar">
        <input type="text" className="search-input" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={openNew}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Produto
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Imagem</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Promo</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ width: 56 }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-xs)' }} /> : <div style={{ width: 48, height: 48, background: 'var(--bg)', borderRadius: 'var(--radius-xs)' }} />}
                </td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{p.category || '—'}</td>
                <td style={{ fontWeight: 600 }}>R$ {p.price.toFixed(2).replace('.', ',')}</td>
                <td>{p.promo_percent > 0 ? <span className="badge badge-pending">−{p.promo_percent}%</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>{p.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(p)}>Editar</button>
                    <button className="btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div style={{ padding: '1.5rem 2rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', marginBottom: '1.5rem' }}>{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <div className="form-grid">
                <div className="full"><label>Nome *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Camiseta Oversized Preta" /></div>
                <div className="full"><label>Descrição</label><textarea rows="3" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do produto" /></div>
                <div><label>Categoria</label><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Camisetas" /></div>
                <div><label>Preço (R$)</label><input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="49.90" /></div>
                <div><label>Desconto (%)</label><input type="number" value={form.promo_percent} onChange={e => setForm(p => ({ ...p, promo_percent: e.target.value }))} placeholder="0" /></div>
                <div><label>Tags (separadas por vírgula)</label><input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="rock, estampada" /></div>
                <div><label>Status</label>
                  <select value={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.value }))}>
                    <option value="1">Ativo</option><option value="0">Inativo</option>
                  </select>
                </div>
                <div className="full"><label>Imagem</label><input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const t = new FormData(); t.append('image', f); setForm(p => ({ ...p, _img: t })) } }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn-ghost" onClick={closeModal}>Cancelar</button>
                <button className="btn-primary" disabled={saving} onClick={saveProduct}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container" style={{ pointerEvents: 'auto' }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}
