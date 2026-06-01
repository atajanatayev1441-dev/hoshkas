import React, { useState, useEffect } from 'react'

const API = '/api'
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
function fmtTime(d) { return new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/accounting/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
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
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Логин"
            style={{ border:'1.5px solid #e8e8e8', borderRadius:10, padding:'12px 14px', fontSize:15, outline:'none' }} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" type="password"
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={{ border:'1.5px solid #e8e8e8', borderRadius:10, padding:'12px 14px', fontSize:15, outline:'none' }} />
          {error && <div style={{ color:'#e74c3c', fontSize:13, textAlign:'center' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading||!username||!password}
            style={{ background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, padding:'14px', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?0.6:1 }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function AccountingApp() {
  const [user, setUser] = useState(() => sessionStorage.getItem('acc_user'))
  const [tab, setTab] = useState('dashboard')

  function logout() { sessionStorage.removeItem('acc_user'); setUser(null) }
  function handleLogin(u) { sessionStorage.setItem('acc_user', u); setUser(u) }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', display:'flex', flexDirection:'column' }}>
      {/* Header */}
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

      {/* Nav */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', padding:'0 24px', display:'flex', gap:4, overflowX:'auto' }}>
        {[
          { key:'dashboard', label:'Дашборд' },
          { key:'expenses',  label:'Расходы' },
          { key:'debts',     label:'Долги' },
          { key:'revisions', label:'Ревизии' },
          { key:'reports',   label:'Отчёты' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ border:'none', background:'none', padding:'16px 16px 14px', fontSize:14, fontWeight:tab===t.key?700:400, color:tab===t.key?'#1a1a2e':'#888', borderBottom: tab===t.key?'2px solid #1a1a2e':'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto' }}>
        {tab === 'dashboard'  && <Dashboard />}
        {tab === 'expenses'   && <Expenses />}
        {tab === 'debts'      && <Debts />}
        {tab === 'revisions'  && <Revisions />}
        {tab === 'reports'    && <Reports />}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const [summary, setSummary] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [s, d] = await Promise.all([
      fetch(`${API}/accounting/full-summary?from=${today}&to=${today}`).then(r=>r.json()),
      fetch(`${API}/debts`).then(r=>r.json())
    ])
    setSummary(s)
    setDebts(d.filter(d=>d.status==='UNPAID'))
    setLoading(false)
  }

  if (loading) return <Loader />

  const cards = [
    { label:'Выручка сегодня', value:`${fmt(summary.revenue)} TMT`, color:'#27ae60', icon:'' },
    { label:'Расходы сегодня', value:`${fmt(summary.totalExpenses)} TMT`, color:'#e74c3c', icon:'' },
    { label:'Прибыль сегодня', value:`${fmt(summary.profit)} TMT`, color: summary.profit>=0?'#2980b9':'#e74c3c', icon:'' },
    { label:'Заказов', value:summary.totalOrders, color:'#8e44ad', icon:'' },
    { label:'Наличные', value:`${fmt(summary.byCash)} TMT`, color:'#f39c12', icon:'' },
    { label:'Карта', value:`${fmt(summary.byCard)} TMT`, color:'#16a085', icon:'' },
    { label:'Долгов', value:`${fmt(summary.totalDebts)} TMT`, color:'#e67e22', icon:'' },
    { label:'Средний чек', value:`${fmt(summary.avgCheck)} TMT`, color:'#7f8c8d', icon:'' },
  ]

  return (
    <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:20, color:'#1a1a2e' }}>Сводка за сегодня</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16, marginBottom:28 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${c.color}` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Расходы по категориям */}
      {Object.keys(summary.expenseByCategory).length > 0 && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ fontWeight:700, marginBottom:14, color:'#1a1a2e' }}>Расходы по категориям</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {Object.entries(summary.expenseByCategory).map(([cat, amt]) => (
              <div key={cat} style={{ background:EXPENSE_CATEGORIES[cat]?.color+'18', border:`1px solid ${EXPENSE_CATEGORIES[cat]?.color}40`, borderRadius:10, padding:'8px 14px' }}>
                <div style={{ fontSize:12, color:EXPENSE_CATEGORIES[cat]?.color, fontWeight:600 }}>{EXPENSE_CATEGORIES[cat]?.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a1a2e' }}>{fmt(amt)} TMT</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Активные долги */}
      {debts.length > 0 && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:700, marginBottom:14, color:'#e74c3c' }}> Непогашенные долги ({debts.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {debts.slice(0,5).map(d => (
              <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#fdf0ef', borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600, color:'#1a1a2e' }}>{d.clientName}</div>
                  <div style={{ fontSize:12, color:'#888' }}>{d.phone} · {fmtDate(d.createdAt)}</div>
                </div>
                <div style={{ fontWeight:700, color:'#e74c3c', fontSize:16 }}>{fmt(d.amount)} TMT</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── EXPENSES ─────────────────────────────────────────────────
function Expenses() {
  const today = new Date().toISOString().slice(0, 10)
  const [expenses, setExpenses] = useState([])
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [form, setForm] = useState({ amount:'', category:'PURCHASE', description:'', date:today })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/expenses?from=${from}&to=${to}`).then(r=>r.json())
    setExpenses(data)
    setLoading(false)
  }

  async function addExpense() {
    if (!form.amount || !form.category) return
    await fetch(`${API}/expenses`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ amount:'', category:'PURCHASE', description:'', date:today })
    setShowForm(false)
    load()
  }

  async function deleteExpense(id) {
    if (!confirm('Удалить расход?')) return
    await fetch(`${API}/expenses/${id}`, { method:'DELETE' })
    load()
  }

  const total = expenses.reduce((s,e)=>s+e.amount, 0)

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e' }}> Расходы</div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Добавить
        </button>
      </div>

      {/* Date filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputStyle} />
        <span style={{ color:'#888' }}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputStyle} />
        <div style={{ background:'#fff', borderRadius:10, padding:'8px 16px', fontWeight:700, color:'#e74c3c', border:'1px solid #f5c6c6' }}>
          Итого: {fmt(total)} TMT
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14, color:'#1a1a2e' }}>Новый расход</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <input placeholder="Сумма (TMT)" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={inputStyle} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputStyle} />
          </div>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...inputStyle, width:'100%', marginBottom:12}}>
            {Object.entries(EXPENSE_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input placeholder="Описание (необязательно)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...inputStyle, width:'100%', marginBottom:14}} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addExpense} style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, cursor:'pointer' }}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={{ background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer' }}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {expenses.length === 0 && <Empty text="Расходов нет за выбранный период" />}
          {expenses.map(e => (
            <div key={e.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ background:EXPENSE_CATEGORIES[e.category]?.color+'18', color:EXPENSE_CATEGORIES[e.category]?.color, borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                {EXPENSE_CATEGORIES[e.category]?.label}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'#1a1a2e' }}>{e.description || '—'}</div>
                <div style={{ fontSize:12, color:'#aaa' }}>{fmtTime(e.date)}</div>
              </div>
              <div style={{ fontWeight:700, fontSize:16, color:'#e74c3c', whiteSpace:'nowrap' }}>{fmt(e.amount)} TMT</div>
              <button onClick={()=>deleteExpense(e.id)} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:18, padding:'0 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DEBTS ────────────────────────────────────────────────────
function Debts() {
  const today = new Date().toISOString().slice(0, 10)
  const [debts, setDebts] = useState([])
  const [filter, setFilter] = useState('UNPAID')
  const [form, setForm] = useState({ clientName:'', phone:'', amount:'', description:'' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/debts`).then(r=>r.json())
    setDebts(data)
    setLoading(false)
  }

  async function addDebt() {
    if (!form.clientName || !form.amount) return
    await fetch(`${API}/debts`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({ clientName:'', phone:'', amount:'', description:'' })
    setShowForm(false)
    load()
  }

  async function payDebt(id) {
    if (!confirm('Отметить как оплаченный?')) return
    await fetch(`${API}/debts/${id}/pay`, { method:'PUT' })
    load()
  }

  async function deleteDebt(id) {
    if (!confirm('Удалить запись о долге?')) return
    await fetch(`${API}/debts/${id}`, { method:'DELETE' })
    load()
  }

  const filtered = debts.filter(d => filter === 'ALL' || d.status === filter)
  const totalUnpaid = debts.filter(d=>d.status==='UNPAID').reduce((s,d)=>s+d.amount,0)

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e' }}>📋 Долги клиентов</div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ background:'#e74c3c', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Добавить долг
        </button>
      </div>

      <div style={{ background:'#fdf0ef', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:'#e74c3c', fontWeight:600 }}>Всего непогашено:</span>
        <span style={{ color:'#e74c3c', fontWeight:800, fontSize:20 }}>{fmt(totalUnpaid)} TMT</span>
      </div>

      {showForm && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14 }}>Новый долг</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <input placeholder="Имя клиента *" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} style={inputStyle} />
            <input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inputStyle} />
            <input placeholder="Сумма (TMT) *" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={inputStyle} />
            <input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addDebt} style={{ background:'#e74c3c', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, cursor:'pointer' }}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={{ background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer' }}>Отмена</button>
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

      {loading ? <Loader /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.length === 0 && <Empty text="Долгов нет" />}
          {filtered.map(d => (
            <div key={d.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:15 }}>{d.clientName}</div>
                <div style={{ fontSize:12, color:'#888' }}>{d.phone && `📞 ${d.phone} · `}{fmtDate(d.createdAt)}{d.description && ` · ${d.description}`}</div>
                {d.paidAt && <div style={{ fontSize:12, color:'#27ae60' }}>✓ Оплачено {fmtDate(d.paidAt)}</div>}
              </div>
              <div style={{ fontWeight:700, fontSize:18, color:d.status==='PAID'?'#27ae60':'#e74c3c' }}>{fmt(d.amount)} TMT</div>
              <div style={{ display:'flex', gap:6 }}>
                {d.status === 'UNPAID' && (
                  <button onClick={()=>payDebt(d.id)}
                    style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    Оплачен
                  </button>
                )}
                <button onClick={()=>deleteDebt(d.id)} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:18 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── REVISIONS ────────────────────────────────────────────────
function Revisions() {
  const today = new Date().toISOString().slice(0, 10)
  const [revisions, setRevisions] = useState([])
  const [form, setForm] = useState({ cashIn:'', cashOut:'', cardTotal:'', expenses:'', notes:'', createdBy:'', date:today })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoData, setAutoData] = useState(null)

  useEffect(() => { load(); loadAutoData() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/revisions`).then(r=>r.json())
    setRevisions(data)
    setLoading(false)
  }

  async function loadAutoData() {
    const s = await fetch(`${API}/accounting/full-summary?from=${today}&to=${today}`).then(r=>r.json())
    setAutoData(s)
    setForm(f => ({ ...f, cardTotal: String(Math.round(s.byCard||0)), expenses: String(Math.round(s.totalExpenses||0)) }))
  }

  async function addRevision() {
    await fetch(`${API}/revisions`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setShowForm(false)
    load()
  }

  async function deleteRevision(id) {
    if (!confirm('Удалить ревизию?')) return
    await fetch(`${API}/revisions/${id}`, { method:'DELETE' })
    load()
  }

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e' }}>🔍 Ревизии</div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ background:'#2980b9', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Новая ревизия
        </button>
      </div>

      {showForm && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:4, color:'#1a1a2e' }}>Ревизия за {form.date}</div>
          {autoData && (
            <div style={{ background:'#eaf4fb', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#2980b9' }}>
               Данные из системы: выручка {fmt(autoData.revenue)} TMT · наличные {fmt(autoData.byCash)} TMT · карта {fmt(autoData.byCard)} TMT
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Наличных получено (TMT)</div>
              <input type="number" value={form.cashIn} onChange={e=>setForm({...form,cashIn:e.target.value})} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Наличных выдано (TMT)</div>
              <input type="number" value={form.cashOut} onChange={e=>setForm({...form,cashOut:e.target.value})} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Оплат картой (TMT)</div>
              <input type="number" value={form.cardTotal} onChange={e=>setForm({...form,cardTotal:e.target.value})} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Расходы (TMT)</div>
              <input type="number" value={form.expenses} onChange={e=>setForm({...form,expenses:e.target.value})} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Провёл ревизию</div>
              <input value={form.createdBy} onChange={e=>setForm({...form,createdBy:e.target.value})} style={inputStyle} placeholder="Имя" />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Дата</div>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inputStyle} />
            </div>
          </div>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Заметки..." rows={2}
            style={{ ...inputStyle, width:'100%', resize:'vertical', marginBottom:14 }} />
          {/* Итог ревизии */}
          <div style={{ background:'#f8f9fa', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
            <div style={{ fontSize:13, color:'#888', marginBottom:4 }}>Остаток наличных в кассе:</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e' }}>
              {fmt((parseFloat(form.cashIn)||0) - (parseFloat(form.cashOut)||0) - (parseFloat(form.expenses)||0))} TMT
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addRevision} style={{ background:'#2980b9', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, cursor:'pointer' }}>Сохранить ревизию</button>
            <button onClick={()=>setShowForm(false)} style={{ background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer' }}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {revisions.length === 0 && <Empty text="Ревизий ещё не было" />}
          {revisions.map(r => {
            const остаток = r.cashIn - r.cashOut - r.expenses
            return (
              <div key={r.id} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, color:'#1a1a2e' }}>Ревизия {fmtDate(r.date)}</div>
                    {r.createdBy && <div style={{ fontSize:12, color:'#888' }}>Провёл: {r.createdBy}</div>}
                  </div>
                  <button onClick={()=>deleteRevision(r.id)} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:20 }}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                  {[
                    { label:'Наличных получено', val:r.cashIn, color:'#27ae60' },
                    { label:'Наличных выдано', val:r.cashOut, color:'#e74c3c' },
                    { label:'Оплат картой', val:r.cardTotal, color:'#2980b9' },
                    { label:'Расходы', val:r.expenses, color:'#e67e22' },
                    { label:'Остаток в кассе', val:остаток, color:остаток>=0?'#1a1a2e':'#e74c3c' },
                  ].map(item => (
                    <div key={item.label} style={{ background:'#f8f9fa', borderRadius:10, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, color:'#aaa', marginBottom:2 }}>{item.label}</div>
                      <div style={{ fontWeight:700, color:item.color }}>{fmt(item.val)} TMT</div>
                    </div>
                  ))}
                </div>
                {r.notes && <div style={{ marginTop:10, fontSize:13, color:'#666', background:'#f8f9fa', borderRadius:8, padding:'8px 12px' }}>{r.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── REPORTS ──────────────────────────────────────────────────
function Reports() {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(() => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(today)
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const [s, e] = await Promise.all([
      fetch(`${API}/accounting/full-summary?from=${from}&to=${to}`).then(r=>r.json()),
      fetch(`${API}/expenses?from=${from}&to=${to}`).then(r=>r.json())
    ])
    setSummary(s); setExpenses(e)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function setRange(type) {
    const d = new Date()
    if (type==='today') { setFrom(today); setTo(today) }
    if (type==='week') { const f=new Date(d); f.setDate(d.getDate()-6); setFrom(f.toISOString().slice(0,10)); setTo(today) }
    if (type==='month') { setFrom(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`); setTo(today) }
  }

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', marginBottom:20 }}> Отчёты</div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        {[['today','Сегодня'],['week','7 дней'],['month','Месяц']].map(([k,l])=>(
          <button key={k} onClick={()=>setRange(k)}
            style={{ border:'1.5px solid #e8e8e8', background:'#fff', color:'#555', borderRadius:20, padding:'6px 16px', fontSize:13, cursor:'pointer' }}>{l}</button>
        ))}
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputStyle} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputStyle} />
        <button onClick={load} style={{ background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Загрузить</button>
        <button onClick={()=>window.open(`${API}/export/orders/excel?from=${from}&to=${to}`,'_blank')}
          style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Excel</button>
      </div>

      {loading ? <Loader /> : summary && (
        <>
          {/* P&L */}
          <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16, color:'#1a1a2e' }}>P&L — Прибыли и убытки</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {[
                { label:'Выручка', val:summary.revenue, color:'#27ae60' },
                { label:'Расходы', val:summary.totalExpenses, color:'#e74c3c' },
                { label:'Прибыль', val:summary.profit, color:summary.profit>=0?'#2980b9':'#e74c3c' },
              ].map(c=>(
                <div key={c.label} style={{ background:'#f8f9fa', borderRadius:12, padding:'16px 18px', borderLeft:`4px solid ${c.color}` }}>
                  <div style={{ fontSize:13, color:'#888', marginBottom:6 }}>{c.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:c.color }}>{fmt(c.val)} TMT</div>
                </div>
              ))}
            </div>
          </div>

          {/* По дням */}
          {summary.byDay.length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:20 }}>
              <div style={{ fontWeight:700, marginBottom:14 }}>Выручка по дням</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #f0f0f0' }}>
                    {['Дата','Заказов','Наличные','Карта','Итого'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#888', fontWeight:600, fontSize:12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.byDay.map(d=>(
                    <tr key={d.date} style={{ borderBottom:'1px solid #f5f5f5' }}>
                      <td style={{ padding:'10px 12px', fontWeight:600 }}>{fmtDate(d.date)}</td>
                      <td style={{ padding:'10px 12px', color:'#888' }}>{d.orders}</td>
                      <td style={{ padding:'10px 12px' }}>{fmt(d.cash)} TMT</td>
                      <td style={{ padding:'10px 12px' }}>{fmt(d.card)} TMT</td>
                      <td style={{ padding:'10px 12px', fontWeight:700 }}>{fmt(d.revenue)} TMT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Расходы по категориям */}
          {expenses.length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight:700, marginBottom:14 }}>Расходы по категориям</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #f0f0f0' }}>
                    {['Категория','Кол-во','Сумма'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#888', fontWeight:600, fontSize:12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.expenseByCategory).map(([cat,amt])=>(
                    <tr key={cat} style={{ borderBottom:'1px solid #f5f5f5' }}>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ background:EXPENSE_CATEGORIES[cat]?.color+'18', color:EXPENSE_CATEGORIES[cat]?.color, borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600 }}>
                          {EXPENSE_CATEGORIES[cat]?.label}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', color:'#888' }}>{expenses.filter(e=>e.category===cat).length}</td>
                      <td style={{ padding:'10px 12px', fontWeight:700, color:'#e74c3c' }}>{fmt(amt)} TMT</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop:'2px solid #f0f0f0' }}>
                    <td colSpan={2} style={{ padding:'10px 12px', fontWeight:700 }}>Итого расходов</td>
                    <td style={{ padding:'10px 12px', fontWeight:700, color:'#e74c3c' }}>{fmt(summary.totalExpenses)} TMT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────────────
const inputStyle = { border:'1.5px solid #e8e8e8', borderRadius:10, padding:'10px 12px', fontSize:14, outline:'none', width:'100%', fontFamily:'inherit' }
function Loader() { return <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Загрузка...</div> }
function Empty({ text }) { return <div style={{ textAlign:'center', padding:40, color:'#aaa', background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>{text}</div> }
