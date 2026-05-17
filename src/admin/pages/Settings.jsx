import React, { useState, useEffect } from 'react'

const API_URL = 'https://base-ecommerce-production.up.railway.app'

function getToken() {
  return localStorage.getItem('admin_token')
}

function authHeader() {
  return { 'Authorization': `Bearer ${getToken()}` }
}

export default function Settings() {
  const [form, setForm] = useState({
    store_name: '', store_description: '', hero_title: '', hero_subtitle: '',
    store_whatsapp: '', store_pix_key: ''
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

  useEffect(() => {
    fetch(`${API_URL}/api/settings`).then(r => r.json()).then(s => setForm({
      store_name: s.store_name || '', store_description: s.store_description || '',
      hero_title: s.hero_title || '', hero_subtitle: s.hero_subtitle || '',
      store_whatsapp: s.store_whatsapp || '', store_pix_key: s.store_pix_key || ''
    }))
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form)
      })
      if (res.ok) showToast('Configuracoes salvas!')
      else showToast('Erro ao salvar', 'error')
    } catch { showToast('Erro de conexao', 'error') }
    setSaving(false)
  }

  async function changePassword() {
    const { current, newPass, confirm } = passwords
    if (!current) return showToast('Digite a senha atual', 'error')
    if (newPass.length < 6) return showToast('Nova senha: minimo 6 caracteres', 'error')
    if (newPass !== confirm) return showToast('As senhas nao coincidem', 'error')
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ current_password: current, new_password: newPass })
      })
      const data = await res.json()
      if (data.success) { showToast('Senha alterada!'); setPasswords({ current: '', newPass: '', confirm: '' }) }
      else showToast(data.error || 'Erro', 'error')
    } catch { showToast('Erro de conexao', 'error') }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', marginBottom: '1.75rem', fontWeight: 600 }}>Configuracoes da Loja</h3>
        <div className="form-grid">
          {[
            ['Nome da Loja', 'store_name', 'text'], ['WhatsApp (DDI+DDD+numero)', 'store_whatsapp', 'text'],
          ].map(([label, key, type]) => (
            <div key={key}><label>{label}</label><input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>
          ))}
          {[
            ['Descricao da Loja', 'store_description', 'text'], ['Titulo do Hero', 'hero_title', 'text'],
            ['Subtitulo do Hero', 'hero_subtitle', 'text'], ['Chave PIX', 'store_pix_key', 'text'],
          ].map(([label, key, type]) => (
            <div key={key} className="full"><label>{label}</label><input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>
          ))}
        </div>
        <button className="btn-primary" disabled={saving} onClick={saveSettings} style={{ marginTop: '1.75rem' }}>
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>

      <div className="card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', marginBottom: '1.75rem', fontWeight: 600 }}>Seguranca</h3>
        <div className="form-grid">
          <div className="full"><label>Senha Atual</label><input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="Digite sua senha atual" /></div>
          <div><label>Nova Senha</label><input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="Minimo 6 caracteres" /></div>
          <div><label>Confirmar Senha</label><input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repita a nova senha" /></div>
        </div>
        <button className="btn-primary" disabled={saving} onClick={changePassword} style={{ marginTop: '1.5rem' }}>Alterar Senha</button>
      </div>

      {toast && (
        <div className="toast-container" style={{ pointerEvents: 'auto' }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}