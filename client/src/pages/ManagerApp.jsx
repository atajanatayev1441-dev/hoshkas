import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
function fmt(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) }
function fmtTime(d) { return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) }

const Icon = {
  Dashboard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Receipt: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Trophy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><path d="M5 3h14l-1 7a6 6 0 0 1-12 0z"/><path d="M5 3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h.5M19 3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-.5"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Tables: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Logout: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  TrendUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Cash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>,
  Card: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Star: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

function Loader() {
  return <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>Загрузка...</div>
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{text}</div>
}

function safeWS(onMessage) {
  try {
    const ws = new WebSocket(WS_URL)
    ws.onmessage = onMessage
    ws.onerror = () => {}
    return ws
  } catch (e) {
    return null
  }
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/manager/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (!res.ok) { setError('Неверный пароль'); setLoading(false); return }
      onLogin()
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '44px 40px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#1a1a2e,#2d2d4e)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#c9a96e' }}>
            <Icon.Trophy />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>HOS LOUNGE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>Управляющий</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 6 }}>Панель управления</div>
        </div>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Пароль"
          type="password"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ border: '1.5px solid #e8e8e8', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none', width: '100%', marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        {error && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d4e)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function ManagerApp() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('mgr_auth') === 'true')
  const [tab, setTab] = useState('dashboard')
  const navigate = useNavigate()

  function handleLogin() { sessionStorage.setItem('mgr_auth', 'true'); setAuth(true) }
  function logout() { sessionStorage.removeItem('mgr_auth'); setAuth(false); navigate('/login') }

  if (!auth) return <LoginScreen onLogin={handleLogin} />

  const tabs = [
    { key: 'dashboard', label: 'Дашборд', icon: <Icon.Dashboard /> },
    { key: 'receipts', label: 'Чеки', icon: <Icon.Receipt /> },
    { key: 'waiters', label: 'Официанты', icon: <Icon.Trophy /> },
    { key: 'tables', label: 'Столы', icon: <Icon.Tables /> },
    { key: 'analytics', label: 'Аналитика', icon: <Icon.Chart /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ background: '#1a1a2e', color: '#fff', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#c9a96e', fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>HOS LOUNGE</span>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Панель управляющего</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Главное меню
          </button>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Icon.Logout /> Выйти
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ border: 'none', background: 'none', padding: '15px 20px', fontSize: 13.5, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#1a1a2e' : '#888', borderBottom: `2px solid ${tab === t.key ? '#c9a96e' : 'transparent'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .2s' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'receipts' && <Receipts />}
        {tab === 'waiters' && <WaiterRating />}
        {tab === 'tables' && <ActiveTables />}
        {tab === 'analytics' && <Analytics />}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    load()
    const ws = safeWS((e) => {
      try {
        const { event } = JSON.parse(e.data)
        if (['order_accepted', 'new_order', 'order_opened', 'order_cancelled'].includes(event)) load()
      } catch {}
    })
    const interval = setInterval(load, 60000)
    return () => { try { ws?.close() } catch {} ; clearInterval(interval) }
  }, [])

  async function load() {
    try {
      const d = await fetch(`${API}/manager/dashboard`).then(r => r.json())
      setData(d)
      setLastUpdate(new Date())
    } catch {}
    setLoading(false)
  }

  if (loading) return <Loader />
  if (!data) return <Empty text="Не удалось загрузить данные" />

  const cards = [
    { label: 'Выручка сегодня', value: `${fmt(data.revenue)} TMT`, icon: <Icon.TrendUp />, color: '#27ae60', bg: '#eafaf1' },
    { label: 'Заказов закрыто', value: data.orderCount, icon: <Icon.Receipt />, color: '#2980b9', bg: '#eaf4fb' },
    { label: 'Средний чек', value: `${fmt(data.avgCheck)} TMT`, icon: <Icon.Chart />, color: '#8e44ad', bg: '#f5eefa' },
    { label: 'Наличные', value: `${fmt(data.byCash)} TMT`, icon: <Icon.Cash />, color: '#f39c12', bg: '#fff8ec' },
    { label: 'Карта', value: `${fmt(data.byCard)} TMT`, icon: <Icon.Card />, color: '#c9a96e', bg: '#fdf6ec' },
    { label: 'Столов открыто', value: data.openCount, icon: <Icon.Tables />, color: '#1a1a2e', bg: '#f0f2f5' },
  ]

  const peakHour = (data.byHour || []).reduce((max, h) => h.orders > max.orders ? h : max, { orders: 0, hour: 0 })

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Сводка за сегодня</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdate && <span style={{ fontSize: 12, color: '#aaa' }}>Обновлено в {fmtTime(lastUpdate)}</span>}
          <button onClick={load} style={{ background: 'none', border: '1.5px solid #e8e8e8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', fontFamily: 'inherit' }}>
            <Icon.Refresh /> Обновить
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: c.color }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {data.alerts && data.alerts.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
            <div style={{ fontWeight: 700, marginBottom: 14, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Icon.Alert /> Внимание ({data.alerts.length})
            </div>
            {data.alerts.map((a, i) => (
              <div key={i} style={{ background: '#fdf0ef', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: '#c0392b', border: '1px solid #fbd5d5' }}>
                {a.message}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, color: '#1a1a2e', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Trophy /> Топ позиций сегодня
          </div>
          {(data.topItems || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < (data.topItems.length - 1) ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#f39c12' : i === 1 ? '#95a5a6' : '#cd7f32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{fmt(item.revenue)} TMT</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{item.qty} шт.</div>
              </div>
            </div>
          ))}
          {(!data.topItems || data.topItems.length === 0) && <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>Нет данных</div>}
        </div>
      </div>

      {data.byHour && data.byHour.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><Icon.Chart /> Загруженность по часам</div>
            {peakHour.orders > 0 && <span style={{ fontSize: 12, color: '#f39c12', fontWeight: 600, background: '#fff8ec', padding: '4px 10px', borderRadius: 20 }}>Пик: {peakHour.hour}:00 — {peakHour.orders} заказов</span>}
          </div>
          <HourChart data={data.byHour} />
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: '#1a1a2e', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Receipt /> Последние чеки</div>
        {(data.recentOrders || []).slice(0, 8).map(o => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#aaa', minWidth: 36 }}>#{o.number}</span>
            <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.Clock />{fmtTime(o.createdAt)}</span>
            <span style={{ fontSize: 13, color: '#555' }}>Стол {o.tableNumber || '—'}</span>
            <span style={{ fontSize: 13, color: '#888', flex: 1 }}>{o.waiterName || '—'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{fmt(o.total)} TMT</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: o.paymentType === 'CASH' ? '#eafaf1' : '#eaf4fb', color: o.paymentType === 'CASH' ? '#27ae60' : '#2980b9' }}>
              {o.paymentType === 'CASH' ? 'Нал' : 'Карта'}
            </span>
          </div>
        ))}
        {(!data.recentOrders || data.recentOrders.length === 0) && <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>Нет заказов сегодня</div>}
      </div>
    </div>
  )
}

function HourChart({ data }) {
  const maxOrders = Math.max(...data.map(h => h.orders), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
      {data.map(h => (
        <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            title={`${h.hour}:00 — ${h.orders} заказов`}
            style={{ width: '100%', background: h.orders > 0 ? `rgba(201,169,110,${0.3 + (h.orders / maxOrders) * 0.7})` : '#f0f0f0', borderRadius: '4px 4px 0 0', height: `${Math.max((h.orders / maxOrders) * 80, h.orders > 0 ? 8 : 2)}px`, transition: 'height .3s' }}
          />
          <span style={{ fontSize: 9, color: '#aaa' }}>{h.hour}</span>
        </div>
      ))}
    </div>
  )
}

// ─── RECEIPTS ─────────────────────────────────────────────────
function Receipts() {
  const today = new Date().toISOString().slice(0, 10)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [newIds, setNewIds] = useState([])
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  useEffect(() => {
    load()
    const ws = safeWS((e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'order_accepted') {
          setOrders(prev => [data, ...prev])
          setNewIds(prev => [data.id, ...prev])
          setTimeout(() => setNewIds(prev => prev.filter(id => id !== data.id)), 5000)
        }
      } catch {}
    })
    return () => { try { ws?.close() } catch {} }
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetch(`${API}/manager/orders?from=${from}&to=${to}`).then(r => r.json())
      setOrders(data)
    } catch {}
    setLoading(false)
  }

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Receipt /> Чеки</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ color: '#aaa' }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={load} style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Refresh /> Загрузить
          </button>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d4e)', borderRadius: 16, padding: '16px 24px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Итого', value: `${fmt(totalRevenue)} TMT`, color: '#c9a96e' },
          { label: 'Чеков', value: orders.length, color: '#fff' },
          { label: 'Средний чек', value: `${fmt(orders.length > 0 ? totalRevenue / orders.length : 0)} TMT`, color: '#fff' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.map(o => (
            <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${newIds.includes(o.id) ? '#c9a96e' : '#e8e8e8'}`, transition: 'border-color .5s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', minWidth: 46 }}>#{o.number}</span>
                <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.Clock />{fmtTime(o.createdAt)}</span>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Стол {o.tableNumber || '—'}</span>
                {o.waiterName && <span style={{ fontSize: 13, color: '#888' }}>{o.waiterName}</span>}
                <div style={{ flex: 1, fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(o.items || []).map(i => `${i.name} ×${i.quantity}`).join(' · ')}
                </div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: o.paymentType === 'CASH' ? '#eafaf1' : '#eaf4fb', color: o.paymentType === 'CASH' ? '#27ae60' : '#2980b9', whiteSpace: 'nowrap' }}>
                  {o.paymentType === 'CASH' ? 'Наличные' : 'Карта'}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', whiteSpace: 'nowrap' }}>{fmt(o.total)} TMT</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <Empty text="Нет чеков за выбранный период" />}
        </div>
      )}
    </div>
  )
}

// ─── WAITER RATING ────────────────────────────────────────────
function WaiterRating() {
  const today = new Date().toISOString().slice(0, 10)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetch(`${API}/manager/waiter-stats?from=${from}&to=${to}`).then(r => r.json())
      setStats(data)
    } catch {}
    setLoading(false)
  }

  const medals = ['#f39c12', '#95a5a6', '#cd7f32']

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Trophy /> Рейтинг официантов</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ color: '#aaa' }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={load} style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Refresh /> Загрузить
          </button>
        </div>
      </div>

      {loading ? <Loader /> : stats.length === 0 ? <Empty text="Нет данных за период" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stats.map((w, i) => (
            <div key={w.id} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${i === 0 ? '#f39c12' : '#e8e8e8'}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: medals[i] || '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', boxShadow: i < 3 ? `0 4px 12px ${medals[i]}60` : 'none' }}>
                {i < 3 ? <Icon.Star /> : <span style={{ fontWeight: 800, fontSize: 15 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 4 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Лучшая позиция: {w.topItem}</div>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Выручка', value: `${fmt(w.revenue)} TMT`, color: '#27ae60' },
                  { label: 'Заказов', value: w.orders, color: '#2980b9' },
                  { label: 'Средний чек', value: `${fmt(w.avgCheck)} TMT`, color: '#8e44ad' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ACTIVE TABLES ────────────────────────────────────────────
function ActiveTables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const ws = safeWS(() => load())
    const interval = setInterval(load, 30000)
    return () => { try { ws?.close() } catch {}; clearInterval(interval) }
  }, [])

  async function load() {
    try {
      const d = await fetch(`${API}/manager/dashboard`).then(r => r.json())
      setTables(d.activeTables || [])
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Tables /> Активные столы</div>
        <button onClick={load} style={{ background: 'none', border: '1.5px solid #e8e8e8', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#888', fontFamily: 'inherit' }}>
          <Icon.Refresh /> Обновить
        </button>
      </div>

      {loading ? <Loader /> : tables.length === 0 ? <Empty text="Все столы свободны" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {tables.map(t => {
            const isLong = t.minutesOpen > 120
            const isPending = t.status === 'PENDING'
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${isPending ? '#e67e22' : isLong ? '#e74c3c' : '#e8e8e8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Стол {t.tableNumber}</div>
                  <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: isPending ? '#fff8ec' : '#eaf4fb', color: isPending ? '#e67e22' : '#2980b9' }}>
                    {isPending ? 'Ждёт расчёта' : 'Открыт'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon.Clock /> {t.waiterName || '—'} · {fmtTime(t.createdAt)}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(t.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>{fmt(t.total)} TMT</span>
                  <span style={{ fontSize: 12, color: isLong ? '#e74c3c' : '#aaa', fontWeight: isLong ? 700 : 400 }}>
                    {t.minutesOpen < 60 ? `${t.minutesOpen} мин` : `${Math.floor(t.minutesOpen / 60)}ч ${t.minutesOpen % 60}м`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── ANALYTICS ────────────────────────────────────────────────
function Analytics() {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const d = await fetch(`${API}/accounting/full-summary?from=${from}&to=${to}`).then(r => r.json())
      setData(d)
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Chart /> Аналитика</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            ['Сегодня', today, today],
            ['Неделя', new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), today],
            ['Месяц', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, today]
          ].map(([l, f, t]) => (
            <button key={l} onClick={() => { setFrom(f); setTo(t); setTimeout(load, 50) }}
              style={{ border: '1.5px solid #e8e8e8', background: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#888', fontWeight: 500 }}>
              {l}
            </button>
          ))}
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ color: '#aaa' }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={load} style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Refresh /> Загрузить
          </button>
        </div>
      </div>

      {loading ? <Loader /> : data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Выручка', value: `${fmt(data.revenue)} TMT`, color: '#27ae60', border: '#27ae60' },
              { label: 'Расходы', value: `${fmt(data.totalExpenses)} TMT`, color: '#e74c3c', border: '#e74c3c' },
              { label: 'Прибыль', value: `${fmt(data.profit)} TMT`, color: data.profit >= 0 ? '#2980b9' : '#e74c3c', border: data.profit >= 0 ? '#2980b9' : '#e74c3c' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8', borderLeft: `4px solid ${c.border}` }}>
                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {data.byDay && data.byDay.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
              <div style={{ fontWeight: 700, marginBottom: 14, color: '#1a1a2e', fontSize: 14 }}>Выручка по дням</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Дата', 'Заказов', 'Наличные', 'Карта', 'Итого'].map(h => (
                      <th key={h} style={{ background: '#f8f9fa', padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.byDay.map(d => (
                    <tr key={d.date} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 14 }}>{fmtDate(d.date)}</td>
                      <td style={{ padding: '11px 14px', color: '#888', fontSize: 14 }}>{d.orders}</td>
                      <td style={{ padding: '11px 14px', fontSize: 14 }}>{fmt(d.cash || 0)} TMT</td>
                      <td style={{ padding: '11px 14px', fontSize: 14 }}>{fmt(d.card || 0)} TMT</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#27ae60', fontSize: 14 }}>{fmt(d.revenue)} TMT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
