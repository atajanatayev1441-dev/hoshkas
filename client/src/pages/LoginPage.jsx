import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'

const ROLES = {
  ADMIN:      { label: 'Администратор', icon: '⚙️', color: '#8e44ad', route: '/admin' },
  CASHIER:    { label: 'Касса',         icon: '🖥️', color: '#27ae60', route: '/' },
  ACCOUNTANT: { label: 'Бухгалтерия',   icon: '📊', color: '#2980b9', route: '/accounting' },
  MANAGER:    { label: 'Управляющий',   icon: '👔', color: '#e67e22', route: '/manager' },
  WAREHOUSE:  { label: 'Склад',         icon: '📦', color: '#16a085', route: '/warehouse' },
  WAITER:     { label: 'Официант',      icon: '🍽️', color: '#c0392b', route: '/waiter-login' },
}

const inp = { border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit' })

// ─── INIT SCREEN ──────────────────────────────────────────────
function InitScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function init() {
    if (password.length < 4) return setError('Минимум 4 символа')
    if (password !== confirm) return setError('Пароли не совпадают')
    setLoading(true); setError('')
    const res = await fetch(`${API}/auth/init`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onDone()
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>HOS LOUNGE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Первый запуск</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>Создайте пароль администратора</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль администратора" type="password" style={inp} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Повторите пароль" type="password" onKeyDown={e => e.key === 'Enter' && init()} style={inp} />
        </div>
        {error && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button onClick={init} disabled={loading || !password || !confirm} style={btn('#1a1a2e')}>
          {loading ? 'Создание...' : 'Создать администратора'}
        </button>
        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16 }}>Логин: <b>admin</b></div>
      </div>
    </div>
  )
}

// ─── ROLE SELECT ──────────────────────────────────────────────
function RoleSelect({ onSelect }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: 24 }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>HOS LOUNGE</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Добро пожаловать</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Выберите вашу роль для входа</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, width: '100%', maxWidth: 560 }}>
        {Object.entries(ROLES).map(([role, info]) => (
          <button key={role} onClick={() => onSelect(role)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '24px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .15s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = info.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'none' }}>
            <span style={{ fontSize: 30 }}>{info.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{info.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── LOGIN FORM ───────────────────────────────────────────────
function LoginForm({ role, onBack, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const info = ROLES[role]

  async function login() {
    if (!username || !password) return
    setLoading(true); setError('')
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    if (data.user.role !== role) { setError(`Этот аккаунт имеет роль "${ROLES[data.user.role]?.label || data.user.role}"`); setLoading(false); return }
    onLogin(data.user)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          ← Назад
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{info.icon}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>HOS LOUNGE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{info.label}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Логин" style={inp} autoFocus />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" type="password" onKeyDown={e => e.key === 'Enter' && login()} style={inp} />
        </div>
        {error && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button onClick={login} disabled={loading || !username || !password} style={btn(info.color)}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [initialized, setInitialized] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)

  useEffect(() => {
    fetch(`${API}/auth/status`).then(r => r.json()).then(d => setInitialized(d.initialized)).catch(() => setInitialized(true))
  }, [])

  if (initialized === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
      <div style={{ color: '#fff', fontSize: 14 }}>Загрузка...</div>
    </div>
  )

  if (!initialized) return <InitScreen onDone={() => setInitialized(true)} />
  if (!selectedRole) return <RoleSelect onSelect={setSelectedRole} />
  return <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} onLogin={onLogin} />
}
