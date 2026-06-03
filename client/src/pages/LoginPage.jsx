import React, { useState, useEffect } from 'react'

const API = '/api'

const ROLES = {
  ADMIN:      { label: 'Администратор', sub: 'Полный контроль системы',    color: '#9b59b6', grd: 'linear-gradient(135deg,#8e44ad,#6c3483)' },
  CASHIER:    { label: 'Касса',         sub: 'Приём заказов и оплата',      color: '#27ae60', grd: 'linear-gradient(135deg,#27ae60,#1e8449)' },
  ACCOUNTANT: { label: 'Бухгалтерия',   sub: 'Финансовый учёт и отчёты',   color: '#2980b9', grd: 'linear-gradient(135deg,#2980b9,#1a5276)' },
  MANAGER:    { label: 'Управляющий',   sub: 'Аналитика и контроль зала',   color: '#e67e22', grd: 'linear-gradient(135deg,#e67e22,#b7770d)' },
  WAREHOUSE:  { label: 'Склад',         sub: 'Учёт товаров и поставок',     color: '#16a085', grd: 'linear-gradient(135deg,#16a085,#0e6655)' },
  WAITER:     { label: 'Официант',      sub: 'Работа с заказами столов',    color: '#c0392b', grd: 'linear-gradient(135deg,#c0392b,#922b21)' },
}

const Icons = {
  Admin: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 1l3 6 6.5 1-4.75 4.6L18 20l-6-3.2L6 20l1.25-7.4L2.5 8l6.5-1z"/>
    </svg>
  ),
  Cashier: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <path d="M9 8h6M9 11h4"/>
    </svg>
  ),
  Accountant: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <path d="M2 20h20"/>
    </svg>
  ),
  Manager: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      <path d="M16 4l2 2-2 2M20 6h-4"/>
    </svg>
  ),
  Warehouse: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Waiter: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

const ROLE_ICONS = { ADMIN: Icons.Admin, CASHIER: Icons.Cashier, ACCOUNTANT: Icons.Accountant, MANAGER: Icons.Manager, WAREHOUSE: Icons.Warehouse, WAITER: Icons.Waiter }

// ─── INIT SCREEN ──────────────────────────────────────────────
function InitScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
    <Bg>
      <Card>
        <Logo />
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#8e44ad,#6c3483)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 8px 24px rgba(142,68,173,0.4)' }}>
            <Icons.Admin />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Первый запуск</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Создайте пароль администратора</div>
        </div>
        <Field icon={<Icons.Lock />} type={showPwd ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Пароль администратора"
          right={<button onClick={() => setShowPwd(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}>{showPwd ? <Icons.EyeOff /> : <Icons.Eye />}</button>} />
        <Field icon={<Icons.Lock />} type="password" value={confirm} onChange={setConfirm} placeholder="Повторите пароль" onEnter={init} />
        {error && <Err>{error}</Err>}
        <Btn onClick={init} loading={loading} grd="linear-gradient(135deg,#8e44ad,#6c3483)" shadow="rgba(142,68,173,0.4)">
          Создать администратора
        </Btn>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 14 }}>Логин: <b style={{ color: 'rgba(255,255,255,0.5)' }}>admin</b></div>
      </Card>
    </Bg>
  )
}

// ─── ROLE SELECT ──────────────────────────────────────────────
function RoleSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <Bg>
      <div style={{ width: '100%', maxWidth: 620, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <Logo />
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}>Добро пожаловать</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Выберите вашу роль для входа в систему</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(172px,1fr))', gap: 14 }}>
          {Object.entries(ROLES).map(([role, info]) => {
            const RIcon = ROLE_ICONS[role]
            const isHov = hovered === role
            return (
              <button key={role} onClick={() => onSelect(role)}
                onMouseEnter={() => setHovered(role)} onMouseLeave={() => setHovered(null)}
                style={{ background: isHov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isHov ? info.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '24px 16px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all .2s', transform: isHov ? 'translateY(-3px)' : 'none', boxShadow: isHov ? `0 12px 32px ${info.color}33` : 'none', fontFamily: 'inherit' }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: isHov ? info.grd : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHov ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all .2s', boxShadow: isHov ? `0 8px 20px ${info.color}55` : 'none' }}>
                  <RIcon />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{info.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{info.sub}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Bg>
  )
}

// ─── LOGIN FORM ───────────────────────────────────────────────
function LoginForm({ role, onBack, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const info = ROLES[role]
  const RIcon = ROLE_ICONS[role]

  async function login() {
    if (!username || !password) return
    setLoading(true); setError('')
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    if (data.user.role !== role) { setError(`Этот аккаунт — ${ROLES[data.user.role]?.label || data.user.role}`); setLoading(false); return }
    onLogin(data.user)
    setLoading(false)
  }

  return (
    <Bg>
      <Card>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', transition: 'color .15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
          <Icons.ArrowLeft /> Назад
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: info.grd, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: `0 8px 24px ${info.color}55` }}>
            <RIcon />
          </div>
          <Logo />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{info.label}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{info.sub}</div>
        </div>
        <Field icon={<Icons.User />} value={username} onChange={setUsername} placeholder="Логин" autoFocus />
        <Field icon={<Icons.Lock />} type={showPwd ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Пароль" onEnter={login}
          right={<button onClick={() => setShowPwd(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}>{showPwd ? <Icons.EyeOff /> : <Icons.Eye />}</button>} />
        {error && <Err>{error}</Err>}
        <Btn onClick={login} loading={loading} disabled={!username || !password} grd={info.grd} shadow={info.color + '55'}>
          Войти
        </Btn>
      </Card>
    </Bg>
  )
}

// ─── SHARED UI ────────────────────────────────────────────────
function Bg({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 20% 50%, #1a0533 0%, #0d0d1a 50%, #001a2e 100%)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Декоративные орбы */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,50,200,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
      {children}
    </div>
  )
}

function Logo() {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 4, color: '#c9a96e', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>HOS LOUNGE</div>
}

function Field({ icon, type = 'text', value, onChange, placeholder, onEnter, right, autoFocus }) {
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex', pointerEvents: 'none' }}>{icon}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 42px 12px 42px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }}
        onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      {right && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>{right}</div>}
    </div>
  )
}

function Btn({ onClick, children, loading, disabled, grd, shadow }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ width: '100%', background: disabled || loading ? 'rgba(255,255,255,0.1)' : grd, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, color: '#fff', cursor: disabled || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8, boxShadow: disabled || loading ? 'none' : `0 8px 24px ${shadow}`, transition: 'all .2s', letterSpacing: 0.3 }}>
      {loading ? 'Загрузка...' : children}
    </button>
  )
}

function Err({ children }) {
  return <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 8, textAlign: 'center', background: 'rgba(255,107,107,0.1)', borderRadius: 8, padding: '8px 12px' }}>{children}</div>
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [initialized, setInitialized] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)

  useEffect(() => {
    fetch(`${API}/auth/status`).then(r => r.json()).then(d => setInitialized(d.initialized)).catch(() => setInitialized(true))
  }, [])

  if (initialized === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>...</div>
    </div>
  )

  if (!initialized) return <InitScreen onDone={() => setInitialized(true)} />
  if (!selectedRole) return <RoleSelect onSelect={setSelectedRole} />
  return <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} onLogin={onLogin} />
}
