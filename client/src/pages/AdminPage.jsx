import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'

const ROLES = {
  ADMIN:      { label: 'Администратор', icon: '⚙️', color: '#8e44ad' },
  CASHIER:    { label: 'Касса',         icon: '🖥️', color: '#27ae60' },
  ACCOUNTANT: { label: 'Бухгалтерия',   icon: '📊', color: '#2980b9' },
  MANAGER:    { label: 'Управляющий',   icon: '👔', color: '#e67e22' },
  WAREHOUSE:  { label: 'Склад',         icon: '📦', color: '#16a085' },
  WAITER:     { label: 'Официант',      icon: '🍽️', color: '#c0392b' },
}

const inp = { border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }

export default function AdminPage({ user, onLogout }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | {user}
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'CASHIER' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const data = await fetch(`${API}/auth/users`).then(r => r.json()).catch(() => [])
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ username: '', password: '', name: '', role: 'CASHIER' })
    setError('')
    setModal('create')
  }

  function openEdit(u) {
    setForm({ username: u.username, password: '', name: u.name, role: u.role, active: u.active })
    setError('')
    setModal(u)
  }

  async function save() {
    setSaving(true); setError('')
    try {
      if (modal === 'create') {
        if (!form.username || !form.password || !form.name) { setError('Заполните все поля'); setSaving(false); return }
        const res = await fetch(`${API}/auth/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); setSaving(false); return }
      } else {
        const body = { name: form.name, role: form.role, active: form.active }
        if (form.password) body.password = form.password
        const res = await fetch(`${API}/auth/users/${modal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); setSaving(false); return }
      }
      setModal(null)
      loadUsers()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  async function deleteUser(id) {
    if (!confirm('Удалить пользователя?')) return
    await fetch(`${API}/auth/users/${id}`, { method: 'DELETE' })
    loadUsers()
  }

  async function toggleActive(u) {
    await fetch(`${API}/auth/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !u.active }) })
    loadUsers()
  }

  const byRole = Object.keys(ROLES).reduce((acc, r) => { acc[r] = users.filter(u => u.role === r); return acc }, {})

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', fontFamily: 'system-ui,sans-serif' }}>
      {/* Хедер */}
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#c9a96e', fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>HOS LOUNGE</span>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>⚙️ Администратор</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Сменить роль
          </button>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Управление пользователями</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Всего: {users.length} · Активных: {users.filter(u => u.active).length}</div>
          </div>
          <button onClick={openCreate} style={{ background: '#c9a96e', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Добавить
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>Загрузка...</div>}

        {/* Карточки по ролям */}
        {!loading && Object.entries(ROLES).map(([role, info]) => {
          const list = byRole[role] || []
          return (
            <div key={role} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: list.length ? '1px solid rgba(255,255,255,0.07)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{info.icon}</span>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{info.label}</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{list.length}</span>
                <button onClick={() => { setForm({ username: '', password: '', name: '', role }); setError(''); setModal('create') }}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Добавить
                </button>
              </div>
              {list.map(u => (
                <div key={u.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: u.active ? 1 : 0.45 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: info.color + '33', border: `2px solid ${info.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{info.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{u.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>@{u.username}</div>
                  </div>
                  {!u.active && <span style={{ fontSize: 11, color: '#e74c3c', background: 'rgba(231,76,60,0.15)', padding: '2px 8px', borderRadius: 6 }}>Отключён</span>}
                  <button onClick={() => toggleActive(u)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {u.active ? 'Откл' : 'Вкл'}
                  </button>
                  <button onClick={() => openEdit(u)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Изменить
                  </button>
                  {u.username !== 'admin' && (
                    <button onClick={() => deleteUser(u.id)} style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Модалка */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>
              {modal === 'create' ? 'Новый пользователь' : `Изменить: ${modal.name}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modal === 'create' && (
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Логин" style={inp} autoFocus />
              )}
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Имя" style={inp} />
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={modal === 'create' ? 'Пароль' : 'Новый пароль (необязательно)'} type="password" style={inp} />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, background: '#fff' }}>
                {Object.entries(ROLES).map(([r, info]) => (
                  <option key={r} value={r}>{info.icon} {info.label}</option>
                ))}
              </select>
              {modal !== 'create' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Активен
                </label>
              )}
            </div>

            {error && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f5f5f5', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
                Отмена
              </button>
              <button onClick={save} disabled={saving} style={{ flex: 2, background: '#1a1a2e', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
