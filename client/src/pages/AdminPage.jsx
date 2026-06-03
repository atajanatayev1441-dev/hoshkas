import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'

const ROLES = {
  ADMIN:      { label: 'Администратор', sub: 'Полный доступ',           color: '#9b59b6', grd: 'linear-gradient(135deg,#8e44ad,#6c3483)' },
  CASHIER:    { label: 'Касса',         sub: 'Приём заказов и оплата',  color: '#27ae60', grd: 'linear-gradient(135deg,#27ae60,#1e8449)' },
  ACCOUNTANT: { label: 'Бухгалтерия',   sub: 'Финансы и отчёты',       color: '#2980b9', grd: 'linear-gradient(135deg,#2980b9,#1a5276)' },
  MANAGER:    { label: 'Управляющий',   sub: 'Аналитика и зал',        color: '#e67e22', grd: 'linear-gradient(135deg,#e67e22,#b7770d)' },
  WAREHOUSE:  { label: 'Склад',         sub: 'Товары и поставки',      color: '#16a085', grd: 'linear-gradient(135deg,#16a085,#0e6655)' },
  WAITER:     { label: 'Официант',      sub: 'Работа со столами',      color: '#c0392b', grd: 'linear-gradient(135deg,#c0392b,#922b21)' },
}

const Icons = {
  Admin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1l3 6 6.5 1-4.75 4.6L18 20l-6-3.2L6 20l1.25-7.4L2.5 8l6.5-1z"/></svg>,
  Cashier: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Accountant: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/></svg>,
  Manager: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  Warehouse: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Waiter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Home: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Logout: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

const ROLE_ICONS = { ADMIN: Icons.Admin, CASHIER: Icons.Cashier, ACCOUNTANT: Icons.Accountant, MANAGER: Icons.Manager, WAREHOUSE: Icons.Warehouse, WAITER: Icons.Waiter }

const inp = {
  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit'
}

export default function AdminPage({ user, onLogout }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'CASHIER', active: true })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const data = await fetch(`${API}/auth/users`).then(r => r.json()).catch(() => [])
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openCreate(defaultRole = 'CASHIER') {
    setForm({ username: '', password: '', name: '', role: defaultRole, active: true })
    setError(''); setModal('create')
  }

  function openEdit(u) {
    setForm({ username: u.username, password: '', name: u.name, role: u.role, active: u.active })
    setError(''); setModal(u)
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
      setModal(null); loadUsers()
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
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 50%, #1a0533 0%, #0d0d1a 50%, #001a2e 100%)', fontFamily: 'Inter,system-ui,sans-serif' }}>
      {/* Декор */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,50,200,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Хедер */}
      <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#8e44ad,#6c3483)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(142,68,173,0.4)' }}>
            <Icons.Shield />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: '#c9a96e', textTransform: 'uppercase' }}>HOS LOUNGE</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Панель администратора</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e', padding: '7px 16px', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Home /> Сменить роль
          </button>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '7px 16px', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Logout /> Выйти
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 28px', maxWidth: 960, margin: '0 auto', position: 'relative' }}>
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Пользователи</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
              Всего: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{users.length}</span> · Активных: <span style={{ color: '#27ae60' }}>{users.filter(u => u.active).length}</span>
            </div>
          </div>
          <button onClick={() => openCreate()} style={{ background: 'linear-gradient(135deg,#c9a96e,#a07840)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 6px 20px rgba(201,169,110,0.35)' }}>
            <Icons.Plus /> Добавить
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 60 }}>Загрузка...</div>}

        {/* Секции по ролям */}
        {!loading && Object.entries(ROLES).map(([role, info]) => {
          const list = byRole[role] || []
          const RIcon = ROLE_ICONS[role]
          return (
            <div key={role} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12, overflow: 'hidden' }}>
              {/* Заголовок секции */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: info.grd, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 12px ${info.color}44`, flexShrink: 0 }}>
                  <RIcon />
                </div>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{info.label}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{info.sub}</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{list.length}</span>
                <button onClick={() => openCreate(role)} style={{ background: 'none', border: `1px solid ${info.color}44`, color: info.color, padding: '4px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  + Добавить
                </button>
              </div>

              {/* Пользователи */}
              {list.map((u, i) => (
                <div key={u.id} style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', opacity: u.active ? 1 : 0.4, transition: 'opacity .2s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${info.color}22`, border: `1.5px solid ${info.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, flexShrink: 0 }}>
                    <RIcon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{u.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 1 }}>@{u.username}</div>
                  </div>
                  {!u.active && <span style={{ fontSize: 11, color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,107,107,0.2)' }}>Отключён</span>}
                  <button onClick={() => toggleActive(u)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', padding: '5px 11px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {u.active ? 'Откл' : 'Вкл'}
                  </button>
                  <button onClick={() => openEdit(u)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icons.Edit /> Изменить
                  </button>
                  {u.username !== 'admin' && (
                    <button onClick={() => deleteUser(u.id)} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#e74c3c', padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icons.Trash />
                    </button>
                  )}
                </div>
              ))}

              {list.length === 0 && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                  Нет пользователей
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Модалка */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 24 }}>
              {modal === 'create' ? 'Новый пользователь' : `Редактировать: ${modal.name}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modal === 'create' && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><Icons.User /></div>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Логин" style={{ ...inp, paddingLeft: 38 }} autoFocus />
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><Icons.User /></div>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Имя" style={{ ...inp, paddingLeft: 38 }} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex' }}><Icons.Lock /></div>
                <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={modal === 'create' ? 'Пароль' : 'Новый пароль (необязательно)'} type="password" style={{ ...inp, paddingLeft: 38 }} />
              </div>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {Object.entries(ROLES).map(([r, info]) => (
                  <option key={r} value={r} style={{ background: '#13131f' }}>{info.label}</option>
                ))}
              </select>
              {modal !== 'create' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px 0' }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Активен
                </label>
              )}
            </div>

            {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 12, background: 'rgba(255,107,107,0.1)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'rgba(255,255,255,0.5)' }}>
                Отмена
              </button>
              <button onClick={save} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#c9a96e,#a07840)', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff', boxShadow: '0 6px 20px rgba(201,169,110,0.3)' }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
