import React, { useState, useEffect, useRef } from 'react'

const API = '/api'
const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
const MONTHS_FULL = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DEPARTMENTS = { BAR: 'Бар', KITCHEN: 'Кухня', GRILL: 'Мангал', OTHER: 'Прочее' }
const DEP_COLOR = { BAR:'#3498db', KITCHEN:'#e67e22', GRILL:'#e74c3c', OTHER:'#95a5a6' }
const EXPENSE_CATEGORIES = {
  PURCHASE:  { label: 'Закупка', color: '#e67e22' },
  SALARY:    { label: 'Зарплата', color: '#8e44ad' },
  RENT:      { label: 'Аренда', color: '#2980b9' },
  UTILITIES: { label: 'Коммунальные', color: '#16a085' },
  MARKETING: { label: 'Маркетинг', color: '#d35400' },
  REPAIR:    { label: 'Ремонт', color: '#7f8c8d' },
  OTHER:     { label: 'Прочее', color: '#95a5a6' },
}

function fmt(n) { return Number(n||0).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU') }
function fmtDateTime(d) { return new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) }
function today() { return new Date().toISOString().slice(0,10) }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) }

const inputSt = { border:'1.5px solid #e8e8e8', borderRadius:10, padding:'10px 12px', fontSize:14, outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' }
const btnPrimary = { background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }
const btnDanger = { background:'#e74c3c', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }
const btnSuccess = { background:'#27ae60', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }
const btnGhost = { background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, cursor:'pointer' }
const card = { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:16 }

function Loader() { return <div style={{display:'flex',justifyContent:'center',padding:40}}><div style={{width:32,height:32,border:'3px solid #eee',borderTop:'3px solid #1a1a2e',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /></div> }
function Empty({text}) { return <div style={{textAlign:'center',padding:40,color:'#aaa',fontSize:14}}>{text||'Нет данных'}</div> }

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/accounting/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) })
      if (!res.ok) { setError('Неверный логин или пароль'); setLoading(false); return }
      const data = await res.json()
      onLogin(data.username)
    } catch { setError('Ошибка соединения') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:3, color:'#888', marginBottom:4 }}>HOS LOUNGE</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#1a1a2e' }}>Бухгалтерия</div>
          <div style={{ fontSize:13, color:'#aaa', marginTop:4 }}>Только для уполномоченных лиц</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Логин" style={inputSt} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" type="password"
            onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={inputSt} />
          {error && <div style={{ color:'#e74c3c', fontSize:13, textAlign:'center' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading||!username||!password} style={{...btnPrimary, opacity:loading||!username||!password?0.6:1}}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────
const TABS = [
  { key:'dashboard',   label:'Дашборд' },
  { key:'orders',      label:'Детальный отчёт' },
  { key:'departments', label:'По подразделениям' },
  { key:'staff',       label:'Отчёт по персоналу' },
  { key:'monthly',     label:'Динамика по месяцам' },
  { key:'pricecontrol',label:'Контроль цен' },
  { key:'expenses',    label:'Расходы' },
  { key:'debts',       label:'Долги' },
  { key:'revisions',   label:'Ревизии' },
  { key:'stock',       label:'Склад' },
]

export default function AccountingApp() {
  const [user, setUser] = useState(() => sessionStorage.getItem('acc_user'))
  const [tab, setTab] = useState('dashboard')

  function logout() { sessionStorage.removeItem('acc_user'); setUser(null) }
  function handleLogin(u) { sessionStorage.setItem('acc_user', u); setUser(u) }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', display:'flex', flexDirection:'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * {box-sizing:border-box}`}</style>
      <div style={{ background:'#1a1a2e', color:'#fff', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:56, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontWeight:800, fontSize:16, letterSpacing:1 }}>HOS LOUNGE</span>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Бухгалтерия</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{user}</span>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:8, fontSize:13, cursor:'pointer' }}>Выйти</button>
        </div>
      </div>
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', padding:'0 16px', display:'flex', gap:2, overflowX:'auto', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ border:'none', background:'none', padding:'15px 14px 13px', fontSize:13, fontWeight:tab===t.key?700:400, color:tab===t.key?'#1a1a2e':'#888', borderBottom:tab===t.key?'2px solid #1a1a2e':'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'auto' }}>
        {tab === 'dashboard'    && <Dashboard />}
        {tab === 'orders'       && <OrdersReport />}
        {tab === 'departments'  && <DepartmentsReport />}
        {tab === 'staff'        && <StaffReport />}
        {tab === 'monthly'      && <MonthlyDynamics />}
        {tab === 'pricecontrol' && <PriceControl />}
        {tab === 'expenses'     && <Expenses />}
        {tab === 'debts'        && <Debts />}
        {tab === 'revisions'    && <Revisions />}
        {tab === 'stock'        && <Stock />}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const t = today()
    const [s, d] = await Promise.all([
      fetch(`${API}/accounting/full-summary?from=${t}&to=${t}`).then(r=>r.json()),
      fetch(`${API}/debts`).then(r=>r.json())
    ])
    setSummary(s); setDebts(d.filter(x=>x.status==='UNPAID')); setLoading(false)
  }

  if (loading) return <Loader />

  const cards = [
    { label:'Выручка сегодня',  value:`${fmt(summary.revenue)} TMT`,       color:'#27ae60' },
    { label:'Расходы сегодня',  value:`${fmt(summary.totalExpenses)} TMT`,  color:'#e74c3c' },
    { label:'Прибыль сегодня',  value:`${fmt(summary.profit)} TMT`,         color: summary.profit>=0?'#2980b9':'#e74c3c' },
    { label:'Заказов',          value: summary.totalOrders,                 color:'#8e44ad' },
    { label:'Наличные',         value:`${fmt(summary.byCash)} TMT`,         color:'#f39c12' },
    { label:'Карта',            value:`${fmt(summary.byCard)} TMT`,         color:'#16a085' },
    { label:'Активных долгов',  value:`${fmt(summary.totalDebts)} TMT`,     color:'#e67e22' },
    { label:'Средний чек',      value:`${fmt(summary.avgCheck)} TMT`,       color:'#7f8c8d' },
  ]

  return (
    <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:20, color:'#1a1a2e' }}>Сводка за сегодня</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14, marginBottom:24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${c.color}` }}>
            <div style={{ fontSize:12, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      {Object.keys(summary.expenseByCategory||{}).length > 0 && (
        <div style={card}>
          <div style={{ fontWeight:700, marginBottom:14, color:'#1a1a2e' }}>Расходы по категориям</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {Object.entries(summary.expenseByCategory).map(([cat, amt]) => (
              <div key={cat} style={{ background:EXPENSE_CATEGORIES[cat]?.color+'18', border:`1px solid ${EXPENSE_CATEGORIES[cat]?.color}40`, borderRadius:10, padding:'8px 14px' }}>
                <div style={{ fontSize:11, color:EXPENSE_CATEGORIES[cat]?.color, fontWeight:600 }}>{EXPENSE_CATEGORIES[cat]?.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e' }}>{fmt(amt)} TMT</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {debts.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight:700, marginBottom:14, color:'#e74c3c' }}>Непогашенные долги ({debts.length})</div>
          {debts.slice(0,5).map(d => (
            <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#fdf0ef', borderRadius:10, marginBottom:6 }}>
              <div>
                <div style={{ fontWeight:600, color:'#1a1a2e' }}>{d.clientName}</div>
                <div style={{ fontSize:12, color:'#888' }}>{d.phone} · {fmtDate(d.createdAt)}</div>
              </div>
              <div style={{ fontWeight:700, color:'#e74c3c', fontSize:16 }}>{fmt(d.amount)} TMT</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ORDERS REPORT ────────────────────────────────────────────
function OrdersReport() {
  const [orders, setOrders] = useState([])
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [from, to, status])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ from, to })
    if (status) params.set('status', status)
    const data = await fetch(`${API}/accounting/orders?${params}`).then(r=>r.json()).catch(()=>[])
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const total = orders.filter(o=>o.status==='PAID').reduce((s,o)=>s+o.total, 0)
  const cancelled = orders.filter(o=>o.status==='CANCELLED').length

  return (
    <div style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'#1a1a2e' }}>Детальный отчёт по продажам</div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt, width:150}} />
        <span style={{ color:'#888' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt, width:150}} />
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{...inputSt, width:160}}>
          <option value="">Все статусы</option>
          <option value="PAID">Оплаченные</option>
          <option value="CANCELLED">Отказные</option>
          <option value="OPEN">Открытые</option>
        </select>
        <div style={{ display:'flex', gap:10, marginLeft:'auto' }}>
          <div style={{ background:'#eafaf1', borderRadius:10, padding:'8px 14px', fontWeight:700, color:'#27ae60', border:'1px solid #abebc6' }}>Выручка: {fmt(total)} TMT</div>
          {cancelled > 0 && <div style={{ background:'#fdf0ef', borderRadius:10, padding:'8px 14px', fontWeight:700, color:'#e74c3c', border:'1px solid #f5c6c6' }}>Отказных: {cancelled}</div>}
        </div>
      </div>
      {loading ? <Loader /> : (
        <>
          {orders.length === 0 && <Empty text="Нет заказов за выбранный период" />}
          <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            {orders.length > 0 && (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8f9fa' }}>
                    {['№ чека','Дата / время','Стол','Официант','Позиций','Сумма','Оплата','Статус'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <React.Fragment key={o.id}>
                      <tr onClick={() => setExpanded(expanded===o.id ? null : o.id)}
                        style={{ borderBottom:'1px solid #f5f5f5', cursor:'pointer', background: expanded===o.id?'#f8f9fa':'#fff' }}>
                        <td style={{ padding:'10px 12px', fontWeight:600, color:'#1a1a2e' }}>#{o.number}</td>
                        <td style={{ padding:'10px 12px', color:'#666' }}>{fmtDateTime(o.createdAt)}</td>
                        <td style={{ padding:'10px 12px' }}>{o.tableNumber || '—'}</td>
                        <td style={{ padding:'10px 12px' }}>{o.waiterName || '—'}</td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>{o.items?.length || 0}</td>
                        <td style={{ padding:'10px 12px', fontWeight:700, color:'#27ae60' }}>{fmt(o.total)} TMT</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background: o.paymentType==='CARD'?'#ebf5fb':'#eafaf1', color:o.paymentType==='CARD'?'#2980b9':'#27ae60', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>
                            {o.paymentType==='CARD' ? 'Карта' : 'Нал'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background:o.status==='PAID'?'#eafaf1':o.status==='CANCELLED'?'#fdf0ef':'#fef9e7', color:o.status==='PAID'?'#27ae60':o.status==='CANCELLED'?'#e74c3c':'#f39c12', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>
                            {o.status==='PAID'?'Оплачен':o.status==='CANCELLED'?'Отказной':o.status==='OPEN'?'Открыт':'В процессе'}
                          </span>
                        </td>
                      </tr>
                      {expanded===o.id && o.items?.length > 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding:'0 16px 12px 32px', background:'#f8f9fa' }}>
                            <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>Состав заказа:</div>
                            {o.items.map(i => (
                              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #eee', fontSize:13 }}>
                                <span>{i.name} × {i.quantity}</span>
                                <span style={{ fontWeight:600 }}>{fmt(i.price * i.quantity)} TMT</span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── DEPARTMENTS ──────────────────────────────────────────────
function DepartmentsReport() {
  const [data, setData] = useState(null)
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/accounting/by-department?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>({}))
    setData(d); setLoading(false)
  }

  const total = data ? Object.values(data).reduce((s,v)=>s+v, 0) : 0

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'#1a1a2e' }}>Продажи по подразделениям</div>
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt, width:150}} />
        <span style={{ color:'#888' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt, width:150}} />
      </div>
      {loading ? <Loader /> : data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
            {Object.entries(DEPARTMENTS).map(([key, name]) => {
              const val = data[key] || 0
              const pct = total > 0 ? Math.round(val/total*100) : 0
              return (
                <div key={key} style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderTop:`4px solid ${DEP_COLOR[key]}` }}>
                  <div style={{ fontSize:12, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{name}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:DEP_COLOR[key], marginBottom:8 }}>{fmt(val)} TMT</div>
                  <div style={{ background:'#f0f2f5', borderRadius:6, height:8, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:DEP_COLOR[key], borderRadius:6 }} />
                  </div>
                  <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{pct}% от общего</div>
                </div>
              )
            })}
          </div>
          <div style={card}>
            <div style={{ fontWeight:700, marginBottom:16 }}>Итого за период</div>
            {Object.entries(DEPARTMENTS).filter(([k])=>data[k]).map(([key, name]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:DEP_COLOR[key] }} />
                  <span style={{ fontWeight:500 }}>{name}</span>
                </div>
                <span style={{ fontWeight:700, color:DEP_COLOR[key] }}>{fmt(data[key])} TMT</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontWeight:800, fontSize:16 }}>
              <span>Всего</span>
              <span style={{ color:'#1a1a2e' }}>{fmt(total)} TMT</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── STAFF REPORT ─────────────────────────────────────────────
function StaffReport() {
  const [data, setData] = useState([])
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/accounting/staff-report?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setData(Array.isArray(d) ? d : []); setLoading(false)
  }

  const totalRev = data.reduce((s,w)=>s+w.revenue, 0)

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'#1a1a2e' }}>Отчёт по персоналу</div>
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt, width:150}} />
        <span style={{ color:'#888', lineHeight:'40px' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt, width:150}} />
      </div>
      {loading ? <Loader /> : data.length === 0 ? <Empty text="Нет данных за период" /> : (
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['#','Сотрудник','Заказов','Выручка','Средний чек','Доля'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((w,i) => {
                const pct = totalRev > 0 ? Math.round(w.revenue/totalRev*100) : 0
                return (
                  <tr key={w.name} style={{ borderBottom:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'12px 16px', color:'#888' }}>{i+1}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#1a1a2e' }}>{w.name}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center' }}>{w.orders}</td>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#27ae60' }}>{fmt(w.revenue)} TMT</td>
                    <td style={{ padding:'12px 16px', color:'#666' }}>{fmt(w.avgCheck)} TMT</td>
                    <td style={{ padding:'12px 16px', minWidth:140 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, background:'#f0f2f5', borderRadius:4, height:8 }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:'#2980b9', borderRadius:4 }} />
                        </div>
                        <span style={{ fontSize:12, color:'#888', minWidth:28 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#f8f9fa', fontWeight:700 }}>
                <td colSpan={2} style={{ padding:'12px 16px', color:'#1a1a2e' }}>ИТОГО</td>
                <td style={{ padding:'12px 16px', textAlign:'center' }}>{data.reduce((s,w)=>s+w.orders,0)}</td>
                <td style={{ padding:'12px 16px', color:'#27ae60' }}>{fmt(totalRev)} TMT</td>
                <td style={{ padding:'12px 16px', color:'#666' }}>{data.length ? fmt(Math.round(totalRev/data.reduce((s,w)=>s+w.orders,0))) : 0} TMT</td>
                <td style={{ padding:'12px 16px' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── MONTHLY DYNAMICS ─────────────────────────────────────────
function MonthlyDynamics() {
  const [data, setData] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [year])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/accounting/monthly?year=${year}`).then(r=>r.json()).catch(()=>[])
    setData(Array.isArray(d) ? d : []); setLoading(false)
  }

  const maxRev = Math.max(...data.map(m=>m.revenue), 1)
  const totalYear = data.reduce((s,m)=>s+m.revenue, 0)
  const totalOrders = data.reduce((s,m)=>s+m.orders, 0)

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Динамика продаж по месяцам</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>setYear(y=>y-1)} style={{ border:'1px solid #e8e8e8', background:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
          <span style={{ fontWeight:700, fontSize:16, minWidth:50, textAlign:'center' }}>{year}</span>
          <button onClick={()=>setYear(y=>y+1)} style={{ border:'1px solid #e8e8e8', background:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>›</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:14, marginBottom:24 }}>
        <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:'4px solid #27ae60' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>ВЫРУЧКА ЗА ГОД</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#27ae60' }}>{fmt(totalYear)} TMT</div>
        </div>
        <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:'4px solid #8e44ad' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>ЗАКАЗОВ ЗА ГОД</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#8e44ad' }}>{totalOrders}</div>
        </div>
        <div style={{ flex:1, background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:'4px solid #2980b9' }}>
          <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>СРЕДНИЙ ЧЕК</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#2980b9' }}>{fmt(totalOrders ? Math.round(totalYear/totalOrders) : 0)} TMT</div>
        </div>
      </div>
      {loading ? <Loader /> : (
        <>
          {/* Bar chart */}
          <div style={{ ...card, padding:'20px 20px 12px' }}>
            <div style={{ fontWeight:600, marginBottom:16, color:'#1a1a2e' }}>График выручки</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:160 }}>
              {data.map((m,i) => {
                const h = maxRev > 0 ? Math.round((m.revenue/maxRev)*140) : 0
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    {m.revenue > 0 && <div style={{ fontSize:10, color:'#888', textAlign:'center', lineHeight:1.2 }}>{Math.round(m.revenue/1000)}k</div>}
                    <div title={`${MONTHS_FULL[i]}: ${fmt(m.revenue)} TMT`}
                      style={{ width:'100%', height:h||2, background:m.revenue>0?'#1a1a2e':'#eee', borderRadius:'4px 4px 0 0', minHeight:2, transition:'height 0.3s' }} />
                    <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{MONTHS[i]}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Table */}
          <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Месяц','Выручка','Заказов','Средний чек'].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((m,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f5f5f5', background: m.orders>0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'11px 16px', fontWeight:500, color: m.orders>0?'#1a1a2e':'#bbb' }}>{MONTHS_FULL[i]}</td>
                    <td style={{ padding:'11px 16px', fontWeight:700, color: m.revenue>0?'#27ae60':'#ccc' }}>{m.revenue>0 ? `${fmt(m.revenue)} TMT` : '—'}</td>
                    <td style={{ padding:'11px 16px', color: m.orders>0?'#555':'#ccc' }}>{m.orders || '—'}</td>
                    <td style={{ padding:'11px 16px', color: m.avgCheck>0?'#555':'#ccc' }}>{m.avgCheck>0 ? `${fmt(m.avgCheck)} TMT` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── PRICE CONTROL ────────────────────────────────────────────
function PriceControl() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editCost, setEditCost] = useState('')
  const [editDep, setEditDep] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/accounting/price-control`).then(r=>r.json()).catch(()=>[])
    setItems(Array.isArray(d) ? d : []); setLoading(false)
  }

  async function save(id) {
    await fetch(`${API}/accounting/price-control/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ costPrice: parseFloat(editCost||0), department: editDep })
    })
    setEditId(null); load()
  }

  function startEdit(item) {
    setEditId(item.id); setEditCost(item.costPrice||''); setEditDep(item.department||'KITCHEN')
  }

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Контроль формирования цен</div>
        <input placeholder="Поиск по блюду или категории..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputSt, width:280}} />
      </div>
      {loading ? <Loader /> : (
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['Блюдо','Категория','Подразделение','Себестоимость','Цена меню','Наценка','Прибыль',''].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontWeight:600, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'10px 14px', fontWeight:500, color:'#1a1a2e' }}>{item.name}</td>
                  <td style={{ padding:'10px 14px', color:'#666', fontSize:12 }}>{item.category}</td>
                  <td style={{ padding:'10px 14px' }}>
                    {editId===item.id ? (
                      <select value={editDep} onChange={e=>setEditDep(e.target.value)} style={{...inputSt, width:110, padding:'4px 8px', fontSize:12}}>
                        {Object.entries(DEPARTMENTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : (
                      <span style={{ background:DEP_COLOR[item.department]+'20', color:DEP_COLOR[item.department], borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>
                        {DEPARTMENTS[item.department]||item.department}
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {editId===item.id ? (
                      <input type="number" value={editCost} onChange={e=>setEditCost(e.target.value)} style={{...inputSt, width:90, padding:'4px 8px', fontSize:13}} placeholder="0" />
                    ) : (
                      <span style={{ color: item.costPrice>0?'#e67e22':'#bbb' }}>{item.costPrice>0 ? `${fmt(item.costPrice)} TMT` : '—'}</span>
                    )}
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:'#1a1a2e' }}>{fmt(item.price)} TMT</td>
                  <td style={{ padding:'10px 14px' }}>
                    {item.markup !== null ? (
                      <span style={{ background: item.markup>=50?'#eafaf1':'#fef9e7', color:item.markup>=50?'#27ae60':'#e67e22', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:700 }}>
                        {item.markup}%
                      </span>
                    ) : <span style={{ color:'#ccc' }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color: item.profit>0?'#27ae60':'#ccc' }}>
                    {item.profit !== null ? `${fmt(item.profit)} TMT` : '—'}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {editId===item.id ? (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>save(item.id)} style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12 }}>Сохранить</button>
                        <button onClick={()=>setEditId(null)} style={{ background:'#f5f5f5', color:'#555', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12 }}>Отмена</button>
                      </div>
                    ) : (
                      <button onClick={()=>startEdit(item)} style={{ background:'none', border:'1px solid #e8e8e8', color:'#555', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12 }}>Изменить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── EXPENSES ─────────────────────────────────────────────────
function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [form, setForm] = useState({ amount:'', category:'PURCHASE', description:'', date:today() })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/expenses?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setExpenses(Array.isArray(data) ? data : []); setLoading(false)
  }

  async function addExpense() {
    if (!form.amount || !form.category) return
    await fetch(`${API}/expenses`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ amount:'', category:'PURCHASE', description:'', date:today() }); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить расход?')) return
    await fetch(`${API}/expenses/${id}`, { method:'DELETE' }); load()
  }

  const total = expenses.reduce((s,e)=>s+e.amount, 0)
  const byCategory = {}
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category]||0) + e.amount })

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Расходы</div>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Добавить</button>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt, width:150}} />
        <span style={{ color:'#888' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt, width:150}} />
        <div style={{ background:'#fdf0ef', borderRadius:10, padding:'8px 16px', fontWeight:700, color:'#e74c3c', border:'1px solid #f5c6c6', marginLeft:'auto' }}>
          Итого: {fmt(total)} TMT
        </div>
      </div>
      {Object.keys(byCategory).length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {Object.entries(byCategory).map(([cat, amt]) => (
            <div key={cat} style={{ background:EXPENSE_CATEGORIES[cat]?.color+'15', border:`1px solid ${EXPENSE_CATEGORIES[cat]?.color}40`, borderRadius:8, padding:'6px 12px' }}>
              <span style={{ fontSize:12, color:EXPENSE_CATEGORIES[cat]?.color, fontWeight:600 }}>{EXPENSE_CATEGORIES[cat]?.label}: </span>
              <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e' }}>{fmt(amt)} TMT</span>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontWeight:600, marginBottom:14, color:'#1a1a2e' }}>Новый расход</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <input placeholder="Сумма (TMT)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={inputSt} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputSt} />
          </div>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...inputSt, marginBottom:12}}>
            {Object.entries(EXPENSE_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...inputSt, marginBottom:14}} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addExpense} style={btnSuccess}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {expenses.length === 0 && <Empty text="Расходов нет за выбранный период" />}
          {expenses.map(e => (
            <div key={e.id} style={{ background:'#fff', borderRadius:12, padding:'13px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:EXPENSE_CATEGORIES[e.category]?.color+'18', color:EXPENSE_CATEGORIES[e.category]?.color, borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                {EXPENSE_CATEGORIES[e.category]?.label}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, color:'#1a1a2e' }}>{e.description || '—'}</div>
                <div style={{ fontSize:12, color:'#aaa' }}>{fmtDate(e.date)}</div>
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:'#e74c3c', whiteSpace:'nowrap' }}>{fmt(e.amount)} TMT</div>
              <button onClick={()=>del(e.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DEBTS ────────────────────────────────────────────────────
function Debts() {
  const [debts, setDebts] = useState([])
  const [filter, setFilter] = useState('UNPAID')
  const [form, setForm] = useState({ clientName:'', phone:'', amount:'', description:'' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/debts`).then(r=>r.json()).catch(()=>[])
    setDebts(Array.isArray(d) ? d : []); setLoading(false)
  }

  async function addDebt() {
    if (!form.clientName || !form.amount) return
    await fetch(`${API}/debts`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ clientName:'', phone:'', amount:'', description:'' }); setShowForm(false); load()
  }

  async function payDebt(id) {
    if (!confirm('Отметить как оплаченный?')) return
    await fetch(`${API}/debts/${id}/pay`, { method:'PUT' }); load()
  }

  async function del(id) {
    if (!confirm('Удалить?')) return
    await fetch(`${API}/debts/${id}`, { method:'DELETE' }); load()
  }

  const filtered = debts.filter(d => filter === 'ALL' || d.status === filter)
  const totalUnpaid = debts.filter(d=>d.status==='UNPAID').reduce((s,d)=>s+d.amount,0)

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Долги клиентов</div>
        <button onClick={()=>setShowForm(!showForm)} style={btnDanger}>+ Добавить долг</button>
      </div>
      {totalUnpaid > 0 && (
        <div style={{ background:'#fdf0ef', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', justifyContent:'space-between' }}>
          <span style={{ color:'#e74c3c', fontWeight:600 }}>Всего непогашено:</span>
          <span style={{ color:'#e74c3c', fontWeight:800, fontSize:18 }}>{fmt(totalUnpaid)} TMT</span>
        </div>
      )}
      {showForm && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>Новый долг</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <input placeholder="Имя клиента *" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} style={inputSt} />
            <input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inputSt} />
            <input placeholder="Сумма (TMT) *" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={inputSt} />
            <input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={inputSt} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addDebt} style={btnDanger}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['UNPAID','Непогашенные'],['PAID','Оплаченные'],['ALL','Все']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{ border:`1.5px solid ${filter===k?'#1a1a2e':'#e8e8e8'}`, background:filter===k?'#1a1a2e':'#fff', color:filter===k?'#fff':'#555', borderRadius:20, padding:'6px 16px', fontSize:13, cursor:'pointer', fontWeight:filter===k?600:400 }}>
            {l}
          </button>
        ))}
      </div>
      {loading ? <Loader /> : filtered.length === 0 ? <Empty text="Нет записей" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(d => (
            <div key={d.id} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'#1a1a2e' }}>{d.clientName}</div>
                <div style={{ fontSize:12, color:'#888' }}>{d.phone||'—'} · {fmtDate(d.createdAt)}{d.paidAt?' · Оплачен '+fmtDate(d.paidAt):''}</div>
                {d.description && <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{d.description}</div>}
              </div>
              <div style={{ fontWeight:700, color: d.status==='PAID'?'#27ae60':'#e74c3c', fontSize:16 }}>{fmt(d.amount)} TMT</div>
              <span style={{ background:d.status==='PAID'?'#eafaf1':'#fdf0ef', color:d.status==='PAID'?'#27ae60':'#e74c3c', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:600 }}>
                {d.status==='PAID'?'Оплачен':'Долг'}
              </span>
              {d.status==='UNPAID' && <button onClick={()=>payDebt(d.id)} style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:600 }}>Оплачен</button>}
              <button onClick={()=>del(d.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── REVISIONS ────────────────────────────────────────────────
function Revisions() {
  const [revisions, setRevisions] = useState([])
  const [form, setForm] = useState({ cashIn:'', cashOut:'', cardTotal:'', expenses:'', notes:'', createdBy:'', date:today() })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/revisions`).then(r=>r.json()).catch(()=>[])
    setRevisions(Array.isArray(d) ? d : []); setLoading(false)
  }

  async function add() {
    await fetch(`${API}/revisions`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ cashIn:'', cashOut:'', cardTotal:'', expenses:'', notes:'', createdBy:'', date:today() }); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить ревизию?')) return
    await fetch(`${API}/revisions/${id}`, { method:'DELETE' }); load()
  }

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Ревизии / Кассовые смены</div>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Новая ревизия</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>Новая ревизия</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <input placeholder="Наличные получено" type="number" value={form.cashIn} onChange={e=>setForm({...form,cashIn:e.target.value})} style={inputSt} />
            <input placeholder="Наличные выдано" type="number" value={form.cashOut} onChange={e=>setForm({...form,cashOut:e.target.value})} style={inputSt} />
            <input placeholder="Оплата картой" type="number" value={form.cardTotal} onChange={e=>setForm({...form,cardTotal:e.target.value})} style={inputSt} />
            <input placeholder="Расходы за смену" type="number" value={form.expenses} onChange={e=>setForm({...form,expenses:e.target.value})} style={inputSt} />
            <input placeholder="Кассир" value={form.createdBy} onChange={e=>setForm({...form,createdBy:e.target.value})} style={inputSt} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputSt} />
          </div>
          <input placeholder="Примечания" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...inputSt, marginBottom:14}} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={add} style={btnSuccess}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : revisions.length === 0 ? <Empty text="Ревизий нет" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {revisions.map(r => {
            const balance = (r.cashIn||0) + (r.cardTotal||0) - (r.cashOut||0) - (r.expenses||0)
            return (
              <div key={r.id} style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#1a1a2e' }}>{fmtDate(r.date)}</div>
                    {r.createdBy && <div style={{ fontSize:12, color:'#888' }}>Кассир: {r.createdBy}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontWeight:800, fontSize:18, color: balance>=0?'#27ae60':'#e74c3c' }}>{fmt(balance)} TMT</span>
                    <button onClick={()=>del(r.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:18 }}>×</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {[['Нал получено', r.cashIn, '#27ae60'], ['Нал выдано', r.cashOut, '#e74c3c'], ['Карта', r.cardTotal, '#2980b9'], ['Расходы', r.expenses, '#e67e22']].map(([l,v,c])=>(
                    <div key={l} style={{ background:'#f8f9fa', borderRadius:8, padding:'6px 12px' }}>
                      <div style={{ fontSize:11, color:'#888' }}>{l}</div>
                      <div style={{ fontWeight:700, color:c }}>{fmt(v)} TMT</div>
                    </div>
                  ))}
                </div>
                {r.notes && <div style={{ marginTop:10, fontSize:13, color:'#888', fontStyle:'italic' }}>{r.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── STOCK ────────────────────────────────────────────────────
function Stock() {
  const [subtab, setSubtab] = useState('products')
  const subtabs = [
    { key:'products',    label:'Товары на складе' },
    { key:'arrivals',    label:'Поступления' },
    { key:'writeoffs',   label:'Списания' },
    { key:'inventory',   label:'Инвентаризация' },
    { key:'suppliers',   label:'Поставщики' },
  ]
  return (
    <div style={{ padding:'16px 24px 0', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:16, color:'#1a1a2e' }}>Склад</div>
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid #e8e8e8', marginBottom:20 }}>
        {subtabs.map(t => (
          <button key={t.key} onClick={()=>setSubtab(t.key)}
            style={{ border:'none', background:'none', padding:'10px 14px 8px', fontSize:13, fontWeight:subtab===t.key?700:400, color:subtab===t.key?'#1a1a2e':'#888', borderBottom:subtab===t.key?'2px solid #1a1a2e':'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
      {subtab === 'products'  && <StockProducts />}
      {subtab === 'arrivals'  && <StockArrivals />}
      {subtab === 'writeoffs' && <StockWriteoffs />}
      {subtab === 'inventory' && <StockInventory />}
      {subtab === 'suppliers' && <Suppliers />}
    </div>
  )
}

function StockProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', unit:'кг', costPrice:'', minStock:'', department:'KITCHEN' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/stock/products`).then(r=>r.json()).catch(()=>[])
    setProducts(Array.isArray(d) ? d : []); setLoading(false)
  }

  async function add() {
    if (!form.name) return
    await fetch(`${API}/stock/products`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ name:'', unit:'кг', costPrice:'', minStock:'', department:'KITCHEN' }); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить товар?')) return
    await fetch(`${API}/stock/products/${id}`, { method:'DELETE' }); load()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Добавить товар</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontWeight:600, marginBottom:12 }}>Новый товар</div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:10, marginBottom:12 }}>
            <input placeholder="Название *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inputSt} />
            <input placeholder="Ед. изм." value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={inputSt} />
            <input placeholder="Цена за ед." type="number" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})} style={inputSt} />
            <input placeholder="Мин. запас" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} style={inputSt} />
            <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} style={inputSt}>
              {Object.entries(DEPARTMENTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={add} style={btnSuccess}>Добавить</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : products.length === 0 ? <Empty text="Нет товаров на складе" /> : (
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['Товар','Подразделение','Ед.изм.','Цена за ед.','На складе','Мин. запас','Статус',''].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontWeight:600, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const low = p.minStock > 0 && p.currentStock < p.minStock
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f5f5f5', background:low?'#fffbf0':'#fff' }}>
                    <td style={{ padding:'10px 14px', fontWeight:500, color:'#1a1a2e' }}>{p.name}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:DEP_COLOR[p.department]+'20', color:DEP_COLOR[p.department], borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>{DEPARTMENTS[p.department]||p.department}</span></td>
                    <td style={{ padding:'10px 14px', color:'#666' }}>{p.unit}</td>
                    <td style={{ padding:'10px 14px', color:'#e67e22', fontWeight:600 }}>{p.costPrice > 0 ? `${fmt(p.costPrice)} TMT` : '—'}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:low?'#e74c3c':'#1a1a2e' }}>{p.currentStock} {p.unit}</td>
                    <td style={{ padding:'10px 14px', color:'#888' }}>{p.minStock > 0 ? `${p.minStock} ${p.unit}` : '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      {low ? <span style={{ background:'#fdf0ef', color:'#e74c3c', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>Мало</span>
                           : <span style={{ background:'#eafaf1', color:'#27ae60', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>Норма</span>}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={()=>del(p.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:18 }}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StockArrivals() {
  const [arrivals, setArrivals] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [form, setForm] = useState({ supplierId:'', invoiceNum:'', notes:'', date:today(), items:[{ productId:'', quantity:'', price:'', total:'' }] })

  useEffect(() => { load(); loadMeta() }, [from, to])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/stock/arrivals?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setArrivals(Array.isArray(d) ? d : []); setLoading(false)
  }

  async function loadMeta() {
    const [p,s] = await Promise.all([
      fetch(`${API}/stock/products`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/stock/suppliers`).then(r=>r.json()).catch(()=>[])
    ])
    setProducts(Array.isArray(p)?p:[]); setSuppliers(Array.isArray(s)?s:[])
  }

  function updateItem(i, field, val) {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    if (field==='quantity'||field==='price') {
      items[i].total = (parseFloat(items[i].quantity||0) * parseFloat(items[i].price||0)).toFixed(2)
    }
    setForm({...form, items})
  }

  async function save() {
    const validItems = form.items.filter(i=>i.productId&&i.quantity)
    if (!validItems.length) return
    await fetch(`${API}/stock/arrivals`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, items:validItems}) })
    setForm({ supplierId:'', invoiceNum:'', notes:'', date:today(), items:[{ productId:'', quantity:'', price:'', total:'' }] })
    setShowForm(false); load()
  }

  const grandTotal = arrivals.reduce((s,a)=>s+a.totalAmount,0)

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt, width:150}} />
        <span style={{ color:'#888' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt, width:150}} />
        <div style={{ marginLeft:'auto', background:'#fff3e0', borderRadius:10, padding:'8px 14px', fontWeight:700, color:'#e67e22' }}>Итого: {fmt(grandTotal)} TMT</div>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Новое поступление</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontWeight:600, marginBottom:12 }}>Новое поступление товаров</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            <select value={form.supplierId} onChange={e=>setForm({...form,supplierId:e.target.value})} style={inputSt}>
              <option value="">Поставщик (не обяз.)</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder="№ накладной" value={form.invoiceNum} onChange={e=>setForm({...form,invoiceNum:e.target.value})} style={inputSt} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputSt} />
            <input placeholder="Примечания" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={inputSt} />
          </div>
          <div style={{ fontWeight:600, marginBottom:8, fontSize:13 }}>Позиции:</div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
              <select value={item.productId} onChange={e=>updateItem(i,'productId',e.target.value)} style={inputSt}>
                <option value="">Выберите товар</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
              <input placeholder="Кол-во" type="number" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} style={inputSt} />
              <input placeholder="Цена" type="number" value={item.price} onChange={e=>updateItem(i,'price',e.target.value)} style={inputSt} />
              <input placeholder="Итого" value={item.total} readOnly style={{...inputSt, background:'#f8f9fa', color:'#e67e22', fontWeight:600}} />
              <button onClick={()=>setForm({...form, items:form.items.filter((_,j)=>j!==i)})} style={{ background:'none', border:'1px solid #eee', borderRadius:8, padding:'0 10px', cursor:'pointer', color:'#ccc', fontSize:18 }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={()=>setForm({...form, items:[...form.items, { productId:'', quantity:'', price:'', total:'' }]})} style={{ background:'#f0f2f5', color:'#555', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:13 }}>+ Добавить строку</button>
            <button onClick={save} style={btnSuccess}>Сохранить поступление</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : arrivals.length === 0 ? <Empty text="Нет поступлений за период" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {arrivals.map(a => (
            <div key={a.id} style={card}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, color:'#1a1a2e' }}>{fmtDate(a.date)} {a.invoiceNum && `— Накл. №${a.invoiceNum}`}</div>
                  {a.supplier && <div style={{ fontSize:12, color:'#888' }}>Поставщик: {a.supplier.name}</div>}
                  {a.notes && <div style={{ fontSize:12, color:'#aaa' }}>{a.notes}</div>}
                </div>
                <div style={{ fontWeight:800, fontSize:16, color:'#e67e22' }}>{fmt(a.totalAmount)} TMT</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {a.items.map(i => (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0', borderBottom:'1px solid #f5f5f5' }}>
                    <span>{i.product?.name} <span style={{ color:'#888' }}>× {i.quantity} {i.product?.unit}</span></span>
                    <span style={{ fontWeight:600 }}>{fmt(i.total)} TMT <span style={{ color:'#888', fontWeight:400 }}>({fmt(i.price)} TMT/{i.product?.unit})</span></span>
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

function StockWriteoffs() {
  const [writeoffs, setWriteoffs] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reason:'', notes:'', items:[{ productId:'', quantity:'', reason:'' }] })

  useEffect(() => { load(); fetch(`${API}/stock/products`).then(r=>r.json()).then(d=>setProducts(Array.isArray(d)?d:[])) }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/stock/writeoffs`).then(r=>r.json()).catch(()=>[])
    setWriteoffs(Array.isArray(d)?d:[]); setLoading(false)
  }

  async function save() {
    const validItems = form.items.filter(i=>i.productId&&i.quantity)
    if (!validItems.length) return
    await fetch(`${API}/stock/writeoffs`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, items:validItems}) })
    setForm({ reason:'', notes:'', items:[{ productId:'', quantity:'', reason:'' }] }); setShowForm(false); load()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={()=>setShowForm(!showForm)} style={btnDanger}>+ Оформить списание</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontWeight:600, marginBottom:12 }}>Списание товаров</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <input placeholder="Причина списания" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={inputSt} />
            <input placeholder="Примечания" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={inputSt} />
          </div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr auto', gap:8, marginBottom:8 }}>
              <select value={item.productId} onChange={e=>{const its=[...form.items]; its[i]={...its[i],productId:e.target.value}; setForm({...form,items:its})}} style={inputSt}>
                <option value="">Выберите товар</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit})</option>)}
              </select>
              <input placeholder="Кол-во" type="number" value={item.quantity} onChange={e=>{const its=[...form.items]; its[i]={...its[i],quantity:e.target.value}; setForm({...form,items:its})}} style={inputSt} />
              <input placeholder="Причина" value={item.reason} onChange={e=>{const its=[...form.items]; its[i]={...its[i],reason:e.target.value}; setForm({...form,items:its})}} style={inputSt} />
              <button onClick={()=>setForm({...form, items:form.items.filter((_,j)=>j!==i)})} style={{ background:'none', border:'1px solid #eee', borderRadius:8, padding:'0 10px', cursor:'pointer', color:'#ccc', fontSize:18 }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={()=>setForm({...form, items:[...form.items, { productId:'', quantity:'', reason:'' }]})} style={{ background:'#f0f2f5', color:'#555', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:13 }}>+ Добавить строку</button>
            <button onClick={save} style={btnDanger}>Сохранить списание</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : writeoffs.length === 0 ? <Empty text="Нет списаний" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {writeoffs.map(w => (
            <div key={w.id} style={card}>
              <div style={{ fontWeight:700, marginBottom:6, color:'#e74c3c' }}>{fmtDate(w.date)} {w.reason && `— ${w.reason}`}</div>
              {w.notes && <div style={{ fontSize:12, color:'#aaa', marginBottom:8 }}>{w.notes}</div>}
              {w.items.map(i => (
                <div key={i.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0', borderBottom:'1px solid #f5f5f5' }}>
                  <span>{i.product?.name} {i.reason && <span style={{ color:'#aaa' }}>({i.reason})</span>}</span>
                  <span style={{ fontWeight:600, color:'#e74c3c' }}>− {i.quantity} {i.product?.unit}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StockInventory() {
  const [inventories, setInventories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')

  useEffect(() => { load(); fetch(`${API}/stock/products`).then(r=>r.json()).then(d=>{ const p=Array.isArray(d)?d:[]; setProducts(p); setItems(p.map(pr=>({ productId:pr.id, expected:pr.currentStock, actual:'', name:pr.name, unit:pr.unit }))) }) }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/stock/inventories`).then(r=>r.json()).catch(()=>[])
    setInventories(Array.isArray(d)?d:[]); setLoading(false)
  }

  async function save() {
    const validItems = items.filter(i=>i.actual!=='')
    if (!validItems.length) return
    await fetch(`${API}/stock/inventories`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ notes, items:validItems }) })
    setShowForm(false); load()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Новая инвентаризация</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontWeight:600, marginBottom:12 }}>Инвентаризация склада</div>
          <input placeholder="Примечания" value={notes} onChange={e=>setNotes(e.target.value)} style={{...inputSt, marginBottom:14}} />
          <div style={{ background:'#f8f9fa', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#e8e8e8' }}>
                  {['Товар','Ед.','По системе','Фактически','Расхождение'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item,i) => {
                  const diff = item.actual!=='' ? parseFloat(item.actual) - item.expected : null
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding:'8px 12px', fontWeight:500 }}>{item.name}</td>
                      <td style={{ padding:'8px 12px', color:'#888' }}>{item.unit}</td>
                      <td style={{ padding:'8px 12px', color:'#666' }}>{item.expected}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <input type="number" placeholder="Введите факт" value={item.actual}
                          onChange={e=>{ const its=[...items]; its[i]={...its[i],actual:e.target.value}; setItems(its) }}
                          style={{ border:'1.5px solid #e8e8e8', borderRadius:8, padding:'5px 8px', width:100, fontSize:13, outline:'none' }} />
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:700, color: diff===null?'#ccc':diff>0?'#27ae60':diff<0?'#e74c3c':'#888' }}>
                        {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={save} style={btnSuccess}>Сохранить инвентаризацию</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : inventories.length === 0 ? <Empty text="Нет инвентаризаций" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {inventories.map(inv => (
            <div key={inv.id} style={card}>
              <div style={{ fontWeight:700, marginBottom:8, color:'#1a1a2e' }}>Инвентаризация от {fmtDateTime(inv.date)}</div>
              {inv.notes && <div style={{ fontSize:12, color:'#aaa', marginBottom:8 }}>{inv.notes}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, fontSize:13, fontWeight:600, color:'#888', padding:'6px 0', borderBottom:'1px solid #eee', marginBottom:4 }}>
                <span>Товар</span><span>Ожидалось</span><span>Фактически</span><span>Расхождение</span>
              </div>
              {inv.items.map(i => (
                <div key={i.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, fontSize:13, padding:'5px 0', borderBottom:'1px solid #f5f5f5' }}>
                  <span>{i.product?.name}</span>
                  <span style={{ color:'#666' }}>{i.expected} {i.product?.unit}</span>
                  <span style={{ fontWeight:600 }}>{i.actual} {i.product?.unit}</span>
                  <span style={{ fontWeight:700, color:i.diff>0?'#27ae60':i.diff<0?'#e74c3c':'#888' }}>{i.diff>0?`+${i.diff}`:i.diff}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch(`${API}/stock/suppliers`).then(r=>r.json()).catch(()=>[])
    setSuppliers(Array.isArray(d)?d:[]); setLoading(false)
  }

  async function add() {
    if (!form.name) return
    await fetch(`${API}/stock/suppliers`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ name:'', phone:'' }); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить поставщика?')) return
    await fetch(`${API}/stock/suppliers/${id}`, { method:'DELETE' }); load()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={()=>setShowForm(!showForm)} style={btnPrimary}>+ Добавить поставщика</button>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ display:'flex', gap:10 }}>
            <input placeholder="Название *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inputSt} />
            <input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inputSt} />
            <button onClick={add} style={btnSuccess}>Добавить</button>
            <button onClick={()=>setShowForm(false)} style={btnGhost}>Отмена</button>
          </div>
        </div>
      )}
      {loading ? <Loader /> : suppliers.length === 0 ? <Empty text="Нет поставщиков" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {suppliers.map(s => (
            <div key={s.id} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:600, color:'#1a1a2e' }}>{s.name}</div>
                {s.phone && <div style={{ fontSize:12, color:'#888' }}>{s.phone}</div>}
              </div>
              <button onClick={()=>del(s.id)} style={{ background:'none', border:'none', color:'#ddd', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
