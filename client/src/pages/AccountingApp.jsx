import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = '/api'
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const DEPTS = ['БАР','ГОРЯЧИЙ ЦЕХ','МАНГАЛ','МУЧНОЙ ЦЕХ','ХОЛОДНЫЙ ЦЕХ']
const EXPENSE_CATEGORIES = {
  PURCHASE:'Закупка', SALARY:'Зарплата', RENT:'Аренда',
  UTILITIES:'Коммунальные', MARKETING:'Маркетинг', REPAIR:'Ремонт', OTHER:'Прочее'
}
const EXPENSE_COLORS = {
  PURCHASE:'#e67e22', SALARY:'#8e44ad', RENT:'#2980b9',
  UTILITIES:'#16a085', MARKETING:'#d35400', REPAIR:'#7f8c8d', OTHER:'#95a5a6'
}

function fmt(n) { return Number(n||0).toLocaleString('ru-RU',{maximumFractionDigits:0}) }
function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}) }
function fmtDateTime(d) { return new Date(d).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) }
function today() { return new Date().toISOString().slice(0,10) }
function monthStart() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

const card = { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e8e8e8', marginBottom:16 }
const inputSt = { border:'1.5px solid #e8e8e8', borderRadius:10, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit' }
const btnSt = (bg='#1a1a2e') => ({ background:bg, color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 })
const thSt = { background:'#f8f9fa', padding:'10px 14px', textAlign:'left', fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }
const tdSt = { padding:'10px 14px', borderTop:'1px solid #f0f0f0', fontSize:13 }

function Loader() { return <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Загрузка...</div> }
function Empty({text}) { return <div style={{textAlign:'center',padding:40,color:'#aaa',...card}}>{text}</div> }

// ─── MAIN ─────────────────────────────────────────────────────
export default function AccountingApp({ onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const navigate = useNavigate()
  const user = JSON.parse(sessionStorage.getItem('hos_user') || 'null')

  function logout() {
    sessionStorage.removeItem('hos_user')
    if (onLogout) onLogout()
    navigate('/login')
  }

  const tabs = [
    { key:'dashboard',        label:'Дашборд' },
    { key:'cashbook',         label:'Кассовая книга' },
    { key:'zreport',          label:'Z-Отчёты' },
    { key:'margin',           label:'Себестоимость и маржа' },
    { key:'reconciliation',   label:'Сверка склада' },
    { key:'detail',           label:'Детальный отчёт' },
    { key:'departments',      label:'По подразделениям' },
    { key:'staff',            label:'Отчёт по персоналу' },
    { key:'rejected',         label:'Отказные чеки' },
    { key:'dynamics',         label:'Динамика по месяцам' },
    { key:'pricecontrol',     label:'Контроль цен' },
    { key:'expenses',         label:'Расходы' },
    { key:'debts',            label:'Долги' },
    { key:'revisions',        label:'Ревизии' },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#f0f2f5',display:'flex',flexDirection:'column',fontFamily:'Inter,-apple-system,sans-serif'}}>
      <div style={{background:'#1a1a2e',color:'#fff',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:'#c9a96e',fontWeight:800,fontSize:15,letterSpacing:2,textTransform:'uppercase'}}>HOS LOUNGE</span>
          <span style={{width:1,height:16,background:'rgba(255,255,255,0.2)',display:'inline-block'}}/>
          <span style={{color:'rgba(255,255,255,0.6)',fontSize:13}}>Бухгалтерия</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>navigate('/login')} style={{background:'rgba(201,169,110,0.2)',border:'1px solid rgba(201,169,110,0.4)',color:'#c9a96e',padding:'6px 14px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Главное меню
          </button>
          <button onClick={logout} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            Выйти ({user?.name || user?.username})
          </button>
        </div>
      </div>
      <div style={{background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 24px',display:'flex',overflowX:'auto',flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{border:'none',background:'none',padding:'14px 16px',fontSize:13,fontWeight:tab===t.key?700:400,color:tab===t.key?'#1a1a2e':'#888',borderBottom:`2px solid ${tab===t.key?'#c9a96e':'transparent'}`,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflow:'auto'}}>
        {tab==='dashboard'       && <Dashboard />}
        {tab==='cashbook'        && <CashBook />}
        {tab==='zreport'         && <ZReports />}
        {tab==='margin'          && <MarginReport />}
        {tab==='reconciliation'  && <StockReconciliation />}
        {tab==='detail'          && <DetailReport />}
        {tab==='departments'     && <DepartmentsReport />}
        {tab==='staff'           && <StaffReport />}
        {tab==='rejected'        && <RejectedReport />}
        {tab==='dynamics'        && <MonthlyDynamics />}
        {tab==='pricecontrol'    && <PriceControl />}
        {tab==='expenses'        && <Expenses />}
        {tab==='debts'           && <Debts />}
        {tab==='revisions'       && <Revisions />}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [hist, setHist] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())

  useEffect(()=>{load()},[from,to])

  async function load() {
    setLoading(true)
    const [s,h,d] = await Promise.all([
      fetch(`${API}/accounting/full-summary?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>({})),
      fetch(`${API}/historical/summary?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>({})),
      fetch(`${API}/debts`).then(r=>r.json()).catch(()=>[])
    ])
    setSummary(s); setHist(h); setDebts(d.filter(x=>x.status==='UNPAID')); setLoading(false)
  }

  if (loading) return <Loader />

  const revenue = (summary?.revenue||0) + (hist?.totalRevenue||0)
  const orders = (summary?.totalOrders||0) + (hist?.totalOrders||0)
  const cash = (summary?.byCash||0) + (hist?.byCash||0)
  const cardAmt = (summary?.byCard||0) + (hist?.byCard||0)
  const expenses = summary?.totalExpenses||0
  const profit = revenue - expenses
  const avg = orders>0 ? revenue/orders : 0
  const totalDebt = debts.reduce((s,d)=>s+d.amount,0)

  const cards = [
    {label:'Выручка',value:`${fmt(revenue)} TMT`,color:'#27ae60',bg:'#eafaf1'},
    {label:'Расходы',value:`${fmt(expenses)} TMT`,color:'#e74c3c',bg:'#fdf0ef'},
    {label:'Прибыль',value:`${fmt(profit)} TMT`,color:profit>=0?'#2980b9':'#e74c3c',bg:profit>=0?'#eaf4fb':'#fdf0ef'},
    {label:'Заказов',value:orders,color:'#8e44ad',bg:'#f5eefa'},
    {label:'Наличные',value:`${fmt(cash)} TMT`,color:'#f39c12',bg:'#fff8ec'},
    {label:'Карта',value:`${fmt(cardAmt)} TMT`,color:'#16a085',bg:'#e8f8f5'},
    {label:'Средний чек',value:`${fmt(avg)} TMT`,color:'#7f8c8d',bg:'#f8f9fa'},
    {label:'Долгов',value:`${fmt(totalDebt)} TMT`,color:'#e67e22',bg:'#fef9e7'},
  ]

  return (
    <div style={{padding:24,maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:20,fontWeight:700,color:'#1a1a2e'}}>Сводка</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {[['Сегодня',today(),today()],['Неделя',new Date(Date.now()-6*86400000).toISOString().slice(0,10),today()],['Месяц',monthStart(),today()]].map(([l,f,t])=>(
            <button key={l} onClick={()=>{setFrom(f);setTo(t)}} style={{border:'1.5px solid #e8e8e8',background:'#fff',borderRadius:20,padding:'5px 14px',fontSize:12,cursor:'pointer',fontFamily:'inherit',color:'#555'}}>{l}</button>
          ))}
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputSt}} />
          <span style={{color:'#aaa'}}>—</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputSt}} />
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:14,marginBottom:24}}>
        {cards.map(c=>(
          <div key={c.label} style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',borderLeft:`4px solid ${c.color}`}}>
            <div style={{fontSize:11,color:'#888',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* График по дням */}
      {hist?.byDay?.length > 0 && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Выручка по дням</div>
          <DayChart data={hist.byDay} />
        </div>
      )}

      {/* Расходы по категориям */}
      {summary?.expenseByCategory && Object.keys(summary.expenseByCategory).length>0 && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Расходы по категориям</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            {Object.entries(summary.expenseByCategory).map(([cat,amt])=>(
              <div key={cat} style={{background:EXPENSE_COLORS[cat]+'18',border:`1px solid ${EXPENSE_COLORS[cat]}40`,borderRadius:10,padding:'8px 14px'}}>
                <div style={{fontSize:11,color:EXPENSE_COLORS[cat],fontWeight:600}}>{EXPENSE_CATEGORIES[cat]}</div>
                <div style={{fontSize:16,fontWeight:700,color:'#1a1a2e'}}>{fmt(amt)} TMT</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length>0 && (
        <div style={card}>
          <div style={{fontWeight:700,marginBottom:14,color:'#e74c3c',fontSize:14}}>Непогашенные долги ({debts.length})</div>
          {debts.slice(0,5).map(d=>(
            <div key={d.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#fdf0ef',borderRadius:10,marginBottom:6}}>
              <div>
                <div style={{fontWeight:600}}>{d.clientName}</div>
                <div style={{fontSize:12,color:'#888'}}>{d.phone} · {fmtDate(d.createdAt)}</div>
              </div>
              <div style={{fontWeight:700,color:'#e74c3c'}}>{fmt(d.amount)} TMT</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DayChart({data}) {
  const max = Math.max(...data.map(d=>d.revenue),1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,overflowX:'auto'}}>
      {data.map(d=>(
        <div key={d.date} title={`${fmtDate(d.date)}: ${fmt(d.revenue)} TMT (${d.orders} заказов)`}
          style={{flex:'0 0 auto',width:28,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <div style={{width:'100%',background:`rgba(201,169,110,${0.3+(d.revenue/max)*0.7})`,borderRadius:'4px 4px 0 0',height:`${Math.max((d.revenue/max)*64,2)}px`,transition:'height .3s'}}/>
          <span style={{fontSize:9,color:'#aaa',whiteSpace:'nowrap'}}>{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ДЕТАЛЬНЫЙ ОТЧЁТ ──────────────────────────────────────────
function DetailReport() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [from, setFrom] = useState('2026-04-13')
  const [to, setTo] = useState(today())
  const [payType, setPayType] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[from,to,payType])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({from,to})
    if (payType) params.set('payType',payType)
    const res = await fetch(`${API}/historical/orders?${params}`).then(r=>r.json()).catch(()=>({orders:[],totalRevenue:0,count:0}))
    setOrders(res.orders||[]); setTotal(res.totalRevenue||0); setCount(res.count||0); setLoading(false)
  }

  return (
    <div style={{padding:24,maxWidth:1200,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Детальный отчёт по продажам</div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputSt} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputSt} />
        <select value={payType} onChange={e=>setPayType(e.target.value)} style={{...inputSt,width:160}}>
          <option value="">Все типы оплаты</option>
          <option value="CASH">Наличные</option>
          <option value="CARD">Карта</option>
        </select>
        <div style={{marginLeft:'auto',display:'flex',gap:10}}>
          <div style={{background:'#eafaf1',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#27ae60',border:'1px solid #abebc6',fontSize:14}}>
            Выручка: {fmt(total)} TMT
          </div>
          <div style={{background:'#eaf4fb',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#2980b9',border:'1px solid #a9cce3',fontSize:14}}>
            Чеков: {count}
          </div>
          <button onClick={()=>exportToExcel(orders.map(o=>({num:o.orderNumber||o.id,date:fmtDT(o.createdAt),table:o.tableNumber||'—',cashier:o.cashierName||'—',pay:o.paymentType,total:fmt(o.total)})),`детальный_отчёт_${from}_${to}`,[{key:'num',label:'№'},{key:'date',label:'Дата'},{key:'table',label:'Стол'},{key:'cashier',label:'Кассир'},{key:'pay',label:'Оплата'},{key:'total',label:'Сумма (TMT)'}])} style={{display:'flex',alignItems:'center',gap:6,background:'#217346',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Excel
          </button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          {orders.length===0 ? <Empty text="Нет чеков за выбранный период" /> : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr>
                  {['№','Дата','Зал / Стол','Кассир / Официант','Сумма','Оплата','Источник'].map(h=>(
                    <th key={h} style={thSt}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id} style={{borderTop:'1px solid #f0f0f0'}}>
                    <td style={{...tdSt,fontWeight:700,color:'#1a1a2e'}}>#{o.number}</td>
                    <td style={{...tdSt,color:'#666'}}>{fmtDateTime(o.date||o.createdAt)}</td>
                    <td style={tdSt}>{[o.hall,o.tableNumber].filter(Boolean).join(' / ')||'—'}</td>
                    <td style={tdSt}>{o.waiter||o.cashier||'—'}</td>
                    <td style={{...tdSt,fontWeight:700,color:'#27ae60'}}>{fmt(o.total)} TMT</td>
                    <td style={tdSt}>
                      <span style={{background:(o.payType||o.paymentType)==='CARD'?'#ebf5fb':'#eafaf1',color:(o.payType||o.paymentType)==='CARD'?'#2980b9':'#27ae60',borderRadius:6,padding:'3px 8px',fontSize:12,fontWeight:600}}>
                        {(o.payType||o.paymentType)==='CARD'?'Карта':'Наличные'}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{background:'#f5eefa',color:'#8e44ad',borderRadius:6,padding:'3px 8px',fontSize:12,fontWeight:600}}>
                        {o.source||'ATLANT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ПО ПОДРАЗДЕЛЕНИЯМ ────────────────────────────────────────
function DepartmentsReport() {
  const [data, setData] = useState([])
  const [from, setFrom] = useState('2026-04-13')
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[from,to])

  async function load() {
    setLoading(true)
    // Get dynamics data grouped by dept
    const res = await fetch(`${API}/dynamics?year=2026`).then(r=>r.json()).catch(()=>[])
    setData(res); setLoading(false)
  }

  // Group by dept
  const byDept = {}
  for (const d of data) {
    if (!byDept[d.dept]) byDept[d.dept] = { dept:d.dept, total:0, items:[] }
    byDept[d.dept].total += d.total
    byDept[d.dept].items.push(d)
  }

  return (
    <div style={{padding:24,maxWidth:1100,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Продажи по подразделениям</div>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputSt} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputSt} />
        <button onClick={load} style={btnSt()}>Загрузить</button>
      </div>

      {loading ? <Loader /> : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {Object.values(byDept).map(dept=>(
            <div key={dept.dept} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:16,color:'#1a1a2e'}}>{dept.dept}</div>
                <div style={{fontWeight:700,color:'#27ae60',fontSize:16}}>{fmt(dept.total)} шт. продано</div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={thSt}>Блюдо</th>
                    <th style={thSt}>Группа</th>
                    {MONTHS.map(m=><th key={m} style={{...thSt,textAlign:'center'}}>{m.slice(0,3)}</th>)}
                    <th style={{...thSt,textAlign:'center'}}>Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.items.filter(i=>i.total>0).slice(0,20).map(item=>(
                    <tr key={item.id} style={{borderTop:'1px solid #f0f0f0'}}>
                      <td style={{...tdSt,fontWeight:500}}>{item.itemName}</td>
                      <td style={{...tdSt,color:'#888',fontSize:12}}>{item.group}</td>
                      {MONTH_KEYS.map(k=>(
                        <td key={k} style={{...tdSt,textAlign:'center',color:item[k]>0?'#1a1a2e':'#ddd'}}>
                          {item[k]>0?item[k]:'—'}
                        </td>
                      ))}
                      <td style={{...tdSt,textAlign:'center',fontWeight:700,color:'#c9a96e'}}>{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {Object.keys(byDept).length===0 && <Empty text="Нет данных. Импортируйте данные из ATLANT." />}
        </div>
      )}
    </div>
  )
}

// ─── ОТЧЁТ ПО ПЕРСОНАЛУ ───────────────────────────────────────
function StaffReport() {
  const [data, setData] = useState([])
  const [from, setFrom] = useState('2026-04-13')
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[from,to])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/historical/summary?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>({}))
    setData(res.byWaiter||[]); setLoading(false)
  }

  const total = data.reduce((s,w)=>s+w.revenue,0)

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Отчёт по персоналу</div>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputSt} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputSt} />
        <button onClick={load} style={btnSt()}>Загрузить</button>
        {total>0 && <div style={{marginLeft:'auto',background:'#eafaf1',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#27ae60',border:'1px solid #abebc6'}}>Итого: {fmt(total)} TMT</div>}
      </div>

      {loading ? <Loader /> : data.length===0 ? <Empty text="Нет данных за период" /> : (
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['#','Сотрудник','Чеков','Выручка','Средний чек','Доля'].map(h=><th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((w,i)=>(
                <tr key={i} style={{borderTop:'1px solid #f0f0f0'}}>
                  <td style={{...tdSt,color:'#aaa',fontWeight:700}}>{i+1}</td>
                  <td style={{...tdSt,fontWeight:600}}>{w.waiter||'—'}</td>
                  <td style={tdSt}>{w.orders}</td>
                  <td style={{...tdSt,fontWeight:700,color:'#27ae60'}}>{fmt(w.revenue)} TMT</td>
                  <td style={tdSt}>{fmt(w.orders>0?w.revenue/w.orders:0)} TMT</td>
                  <td style={tdSt}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,background:'#f0f0f0',borderRadius:4,height:6,overflow:'hidden'}}>
                        <div style={{width:`${total>0?(w.revenue/total)*100:0}%`,background:'#c9a96e',height:'100%',borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:12,color:'#888',minWidth:36}}>{total>0?Math.round(w.revenue/total*100):0}%</span>
                    </div>
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

// ─── ОТКАЗНЫЕ ЧЕКИ ────────────────────────────────────────────
function RejectedReport() {
  const [orders, setOrders] = useState([])
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[from,to])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/orders?status=CANCELLED&from=${from}&to=${to}&limit=200`).then(r=>r.json()).catch(()=>[])
    setOrders(Array.isArray(res)?res:[]); setLoading(false)
  }

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Отказные чеки</div>
      <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputSt} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputSt} />
        <button onClick={load} style={btnSt()}>Загрузить</button>
        {orders.length>0 && <div style={{marginLeft:'auto',background:'#fdf0ef',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#e74c3c',border:'1px solid #f5c6c6'}}>Отказных: {orders.length}</div>}
      </div>
      {loading ? <Loader /> : orders.length===0 ? <Empty text="Отказных чеков нет" /> : (
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['№','Дата','Стол','Официант','Состав','Сумма'].map(h=><th key={h} style={thSt}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id} style={{borderTop:'1px solid #f0f0f0'}}>
                  <td style={{...tdSt,fontWeight:700}}>#{o.number}</td>
                  <td style={{...tdSt,color:'#666'}}>{fmtDateTime(o.createdAt)}</td>
                  <td style={tdSt}>{o.tableNumber||'—'}</td>
                  <td style={tdSt}>{o.waiterName||'—'}</td>
                  <td style={{...tdSt,color:'#888',fontSize:12,maxWidth:300}}>{(o.items||[]).map(i=>`${i.name}×${i.quantity}`).join(', ')}</td>
                  <td style={{...tdSt,fontWeight:700,color:'#e74c3c'}}>{fmt(o.total)} TMT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── ДИНАМИКА ПО МЕСЯЦАМ (как в ATLANT) ──────────────────────
function MonthlyDynamics() {
  const [data, setData] = useState([])
  const [dept, setDept] = useState('')
  const [year, setYear] = useState(2026)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[dept,year])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({year})
    if (dept) params.set('dept',dept)
    const res = await fetch(`${API}/dynamics?${params}`).then(r=>r.json()).catch(()=>[])
    setData(Array.isArray(res)?res:[]); setLoading(false)
  }

  const filtered = data.filter(d=>!search||d.itemName.toLowerCase().includes(search.toLowerCase()))
  const totalByMonth = MONTH_KEYS.map(k=>filtered.reduce((s,d)=>s+(d[k]||0),0))
  const grandTotal = filtered.reduce((s,d)=>s+(d.total||0),0)

  return (
    <div style={{padding:24,maxWidth:1400,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Динамика продаж по месяцам</div>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <select value={dept} onChange={e=>setDept(e.target.value)} style={{...inputSt,minWidth:200}}>
          <option value="">Все подразделения</option>
          {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setYear(y=>y-1)} style={{...inputSt,cursor:'pointer',padding:'8px 12px'}}>‹</button>
          <span style={{fontWeight:700,fontSize:16,minWidth:50,textAlign:'center'}}>{year}</span>
          <button onClick={()=>setYear(y=>y+1)} style={{...inputSt,cursor:'pointer',padding:'8px 12px'}}>›</button>
        </div>
        <input placeholder="Поиск по блюду..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputSt,minWidth:200}} />
        {grandTotal>0 && <div style={{marginLeft:'auto',background:'#eafaf1',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#27ae60',border:'1px solid #abebc6'}}>Всего продано: {grandTotal} шт.</div>}
      </div>

      {loading ? <Loader /> : filtered.length===0 ? <Empty text="Нет данных. Импортируйте данные из ATLANT." /> : (
        <div style={{background:'#fff',borderRadius:16,overflow:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={{...thSt,position:'sticky',left:0,background:'#f8f9fa',zIndex:2,minWidth:200}}>Блюдо</th>
                <th style={{...thSt,minWidth:120}}>Подразделение</th>
                <th style={{...thSt,minWidth:100}}>Группа</th>
                {MONTHS.map(m=><th key={m} style={{...thSt,textAlign:'center',minWidth:60}}>{m.slice(0,3)}</th>)}
                <th style={{...thSt,textAlign:'center',minWidth:70}}>Итого</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item=>(
                <tr key={item.id} style={{borderTop:'1px solid #f0f0f0'}}>
                  <td style={{...tdSt,fontWeight:500,position:'sticky',left:0,background:'#fff',zIndex:1}}>{item.itemName}</td>
                  <td style={{...tdSt,color:'#888'}}>{item.dept}</td>
                  <td style={{...tdSt,color:'#aaa',fontSize:11}}>{item.group}</td>
                  {MONTH_KEYS.map(k=>(
                    <td key={k} style={{...tdSt,textAlign:'center',color:item[k]>0?'#1a1a2e':'#ddd',background:item[k]>0?`rgba(201,169,110,${Math.min(item[k]/20,0.3)})`:'transparent'}}>
                      {item[k]>0?item[k]:'—'}
                    </td>
                  ))}
                  <td style={{...tdSt,textAlign:'center',fontWeight:700,color:'#c9a96e'}}>{item.total}</td>
                </tr>
              ))}
              <tr style={{borderTop:'2px solid #e8e8e8',background:'#f8f9fa'}}>
                <td style={{...tdSt,fontWeight:700,position:'sticky',left:0,background:'#f8f9fa'}}>ИТОГО</td>
                <td style={tdSt}/>
                <td style={tdSt}/>
                {totalByMonth.map((t,i)=>(
                  <td key={i} style={{...tdSt,textAlign:'center',fontWeight:700,color:t>0?'#c9a96e':'#ddd'}}>{t>0?t:'—'}</td>
                ))}
                <td style={{...tdSt,textAlign:'center',fontWeight:800,color:'#c9a96e',fontSize:14}}>{grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── КОНТРОЛЬ ЦЕН ─────────────────────────────────────────────
function PriceControl() {
  const [items, setItems] = useState([])
  const [dept, setDept] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{load()},[])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/costs`).then(r=>r.json()).catch(()=>[])
    setItems(Array.isArray(res)?res:[]); setLoading(false)
  }

  const filtered = items.filter(i=>{
    if (search && !i.item?.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{padding:24,maxWidth:1100,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Контроль формирования цен</div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input placeholder="Поиск по блюду..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inputSt,minWidth:220}} />
        <button onClick={load} style={btnSt()}>Обновить</button>
        {filtered.length>0 && <span style={{color:'#888',fontSize:13}}>{filtered.length} позиций</span>}
      </div>

      {loading ? <Loader /> : filtered.length===0 ? <Empty text="Нет данных о себестоимости" /> : (
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Блюдо','Категория','Себестоимость (A)','Цена по меню (D)','Наценка (D-A)','Наценка %'].map(h=><th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(i=>{
                const cost = i.costPrice||0
                const price = i.item?.price||0
                const markup = price - cost
                const markupPct = cost>0 ? Math.round((markup/cost)*100) : null
                return (
                  <tr key={i.id} style={{borderTop:'1px solid #f0f0f0'}}>
                    <td style={{...tdSt,fontWeight:600}}>{i.item?.name||'—'}</td>
                    <td style={{...tdSt,color:'#888',fontSize:12}}>{i.item?.category?.name||'—'}</td>
                    <td style={tdSt}>{cost>0?`${fmt(cost)} TMT`:'—'}</td>
                    <td style={{...tdSt,fontWeight:700,color:'#c9a96e'}}>{price>0?`${fmt(price)} TMT`:'—'}</td>
                    <td style={{...tdSt,fontWeight:700,color:markup>0?'#27ae60':'#e74c3c'}}>{price>0&&cost>0?`${fmt(markup)} TMT`:'—'}</td>
                    <td style={tdSt}>
                      {markupPct!==null && (
                        <span style={{background:markupPct>100?'#eafaf1':markupPct>50?'#fff8ec':'#fdf0ef',color:markupPct>100?'#27ae60':markupPct>50?'#f39c12':'#e74c3c',borderRadius:6,padding:'3px 8px',fontSize:12,fontWeight:600}}>
                          {markupPct}%
                        </span>
                      )}
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

// ─── РАСХОДЫ ──────────────────────────────────────────────────
function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({amount:'',category:'PURCHASE',description:'',date:today()})
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[from,to])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/expenses?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setExpenses(Array.isArray(res)?res:[]); setLoading(false)
  }

  async function add() {
    if (!form.amount) return
    await fetch(`${API}/expenses`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setForm({amount:'',category:'PURCHASE',description:'',date:today()}); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить?')) return
    await fetch(`${API}/expenses/${id}`,{method:'DELETE'}); load()
  }

  const total = expenses.reduce((s,e)=>s+e.amount,0)

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Расходы</div>
        <button style={btnSt()} onClick={()=>setShowForm(!showForm)}>+ Добавить</button>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputSt} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputSt} />
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>exportToExcel(expenses.map(e=>({date:fmtDate(e.date),cat:EXPENSE_CATEGORIES[e.category]||e.category,desc:e.description||'',amount:fmt(e.amount)})),`расходы_${from}_${to}`,[{key:'date',label:'Дата'},{key:'cat',label:'Категория'},{key:'desc',label:'Описание'},{key:'amount',label:'Сумма (TMT)'}])} style={{display:'flex',alignItems:'center',gap:5,background:'#217346',color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Excel
          </button>
          <div style={{background:'#fdf0ef',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#e74c3c',border:'1px solid #f5c6c6'}}>Итого: {fmt(total)} TMT</div>
        </div>
      </div>

      {showForm && (
        <div style={{...card}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <input type="number" placeholder="Сумма (TMT)" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={{...inputSt,width:'100%'}} />
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{...inputSt,width:'100%'}} />
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...inputSt,width:'100%'}}>
              {Object.entries(EXPENSE_CATEGORIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...inputSt,width:'100%'}} />
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={add} style={btnSt('#27ae60')}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={btnSt('#888')}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {expenses.length===0 && <Empty text="Расходов нет за выбранный период" />}
          {expenses.map(e=>(
            <div key={e.id} style={{background:'#fff',borderRadius:12,padding:'14px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:14}}>
              <div style={{background:EXPENSE_COLORS[e.category]+'18',color:EXPENSE_COLORS[e.category],borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>
                {EXPENSE_CATEGORIES[e.category]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:'#1a1a2e'}}>{e.description||'—'}</div>
                <div style={{fontSize:12,color:'#aaa'}}>{fmtDateTime(e.date)}</div>
              </div>
              <div style={{fontWeight:700,fontSize:16,color:'#e74c3c',whiteSpace:'nowrap'}}>{fmt(e.amount)} TMT</div>
              <button onClick={()=>del(e.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:18,padding:'0 4px'}}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ДОЛГИ ────────────────────────────────────────────────────
function Debts() {
  const [debts, setDebts] = useState([])
  const [filter, setFilter] = useState('UNPAID')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({clientName:'',phone:'',amount:'',description:''})
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load()},[])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/debts`).then(r=>r.json()).catch(()=>[])
    setDebts(Array.isArray(res)?res:[]); setLoading(false)
  }

  async function add() {
    if (!form.clientName||!form.amount) return
    await fetch(`${API}/debts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setForm({clientName:'',phone:'',amount:'',description:''}); setShowForm(false); load()
  }

  async function pay(id) {
    if (!confirm('Отметить как оплаченный?')) return
    await fetch(`${API}/debts/${id}/pay`,{method:'PUT'}); load()
  }

  async function del(id) {
    if (!confirm('Удалить?')) return
    await fetch(`${API}/debts/${id}`,{method:'DELETE'}); load()
  }

  const filtered = debts.filter(d=>filter==='ALL'||d.status===filter)
  const totalUnpaid = debts.filter(d=>d.status==='UNPAID').reduce((s,d)=>s+d.amount,0)

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Долги клиентов</div>
        <button style={btnSt('#e74c3c')} onClick={()=>setShowForm(!showForm)}>+ Добавить долг</button>
      </div>

      <div style={{background:'#fdf0ef',borderRadius:12,padding:'12px 18px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#e74c3c',fontWeight:600}}>Всего непогашено:</span>
        <span style={{color:'#e74c3c',fontWeight:800,fontSize:20}}>{fmt(totalUnpaid)} TMT</span>
      </div>

      {showForm && (
        <div style={{...card}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <input placeholder="Имя клиента *" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} style={{...inputSt,width:'100%'}} />
            <input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...inputSt,width:'100%'}} />
            <input type="number" placeholder="Сумма (TMT) *" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={{...inputSt,width:'100%'}} />
            <input placeholder="Описание" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...inputSt,width:'100%'}} />
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={add} style={btnSt('#e74c3c')}>Сохранить</button>
            <button onClick={()=>setShowForm(false)} style={btnSt('#888')}>Отмена</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['UNPAID','Непогашенные'],['PAID','Оплаченные'],['ALL','Все']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{border:`1.5px solid ${filter===k?'#1a1a2e':'#e8e8e8'}`,background:filter===k?'#1a1a2e':'#fff',color:filter===k?'#fff':'#555',borderRadius:20,padding:'6px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:filter===k?600:400}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.length===0 && <Empty text="Долгов нет" />}
          {filtered.map(d=>(
            <div key={d.id} style={{background:'#fff',borderRadius:12,padding:'14px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:14}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{d.clientName}</div>
                <div style={{fontSize:12,color:'#888'}}>{d.phone&&`📞 ${d.phone} · `}{fmtDate(d.createdAt)}{d.description&&` · ${d.description}`}</div>
                {d.paidAt&&<div style={{fontSize:12,color:'#27ae60'}}>✓ Оплачено {fmtDate(d.paidAt)}</div>}
              </div>
              <div style={{fontWeight:700,fontSize:18,color:d.status==='PAID'?'#27ae60':'#e74c3c'}}>{fmt(d.amount)} TMT</div>
              <div style={{display:'flex',gap:6}}>
                {d.status==='UNPAID'&&<button onClick={()=>pay(d.id)} style={{...btnSt('#27ae60'),padding:'6px 12px',fontSize:12}}>Оплачен</button>}
                <button onClick={()=>del(d.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:18}}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── РЕВИЗИИ ──────────────────────────────────────────────────
function Revisions() {
  const [revisions, setRevisions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({cashIn:'',cashOut:'',cardTotal:'',expenses:'',notes:'',createdBy:'',date:today()})
  const [autoData, setAutoData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{load();loadAuto()},[])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/revisions`).then(r=>r.json()).catch(()=>[])
    setRevisions(Array.isArray(res)?res:[]); setLoading(false)
  }

  async function loadAuto() {
    const t = today()
    const [s,h] = await Promise.all([
      fetch(`${API}/accounting/full-summary?from=${t}&to=${t}`).then(r=>r.json()).catch(()=>({})),
      fetch(`${API}/historical/summary?from=${t}&to=${t}`).then(r=>r.json()).catch(()=>({}))
    ])
    setAutoData({
      cash: Math.round((s.byCash||0)+(h.byCash||0)),
      card: Math.round((s.byCard||0)+(h.byCard||0)),
      expenses: Math.round(s.totalExpenses||0)
    })
    setForm(f=>({...f, cardTotal:String(Math.round((s.byCard||0)+(h.byCard||0))), expenses:String(Math.round(s.totalExpenses||0)) }))
  }

  async function add() {
    await fetch(`${API}/revisions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('Удалить ревизию?')) return
    await fetch(`${API}/revisions/${id}`,{method:'DELETE'}); load()
  }

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Ревизии</div>
        <button style={btnSt('#2980b9')} onClick={()=>setShowForm(!showForm)}>+ Новая ревизия</button>
      </div>

      {showForm && (
        <div style={{...card}}>
          {autoData && (
            <div style={{background:'#eaf4fb',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#2980b9'}}>
              Данные из системы за сегодня: наличные {fmt(autoData.cash)} TMT · карта {fmt(autoData.card)} TMT · расходы {fmt(autoData.expenses)} TMT
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {[
              ['Наличных получено (TMT)','cashIn'],['Наличных выдано (TMT)','cashOut'],
              ['Оплат картой (TMT)','cardTotal'],['Расходы (TMT)','expenses'],
              ['Провёл ревизию','createdBy'],['Дата','date','date']
            ].map(([label,key,type])=>(
              <div key={key}>
                <div style={{fontSize:12,color:'#888',marginBottom:4}}>{label}</div>
                <input type={type||'number'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{...inputSt,width:'100%'}} />
              </div>
            ))}
          </div>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Заметки..." rows={2}
            style={{...inputSt,width:'100%',resize:'none',marginBottom:12}} />
          <div style={{background:'#f8f9fa',borderRadius:10,padding:'12px 16px',marginBottom:14}}>
            <div style={{fontSize:13,color:'#888',marginBottom:4}}>Остаток наличных в кассе:</div>
            <div style={{fontSize:22,fontWeight:700,color:'#1a1a2e'}}>
              {fmt((parseFloat(form.cashIn)||0)-(parseFloat(form.cashOut)||0)-(parseFloat(form.expenses)||0))} TMT
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={add} style={btnSt('#2980b9')}>Сохранить ревизию</button>
            <button onClick={()=>setShowForm(false)} style={btnSt('#888')}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {revisions.length===0 && <Empty text="Ревизий ещё не было" />}
          {revisions.map(r=>{
            const остаток = r.cashIn - r.cashOut - r.expenses
            return (
              <div key={r.id} style={{...card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>{fmtDate(r.date)}</div>
                    {r.createdBy&&<div style={{fontSize:12,color:'#888'}}>Провёл: {r.createdBy}</div>}
                  </div>
                  <button onClick={()=>del(r.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:20}}>×</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
                  {[
                    {label:'Наличных получено',val:r.cashIn,color:'#27ae60'},
                    {label:'Наличных выдано',val:r.cashOut,color:'#e74c3c'},
                    {label:'Оплат картой',val:r.cardTotal,color:'#2980b9'},
                    {label:'Расходы',val:r.expenses,color:'#e67e22'},
                    {label:'Остаток в кассе',val:остаток,color:остаток>=0?'#1a1a2e':'#e74c3c'},
                  ].map(item=>(
                    <div key={item.label} style={{background:'#f8f9fa',borderRadius:10,padding:'10px 14px'}}>
                      <div style={{fontSize:11,color:'#aaa',marginBottom:2}}>{item.label}</div>
                      <div style={{fontWeight:700,color:item.color}}>{fmt(item.val)} TMT</div>
                    </div>
                  ))}
                </div>
                {r.notes&&<div style={{marginTop:10,fontSize:13,color:'#666',background:'#f8f9fa',borderRadius:8,padding:'8px 12px'}}>{r.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── EXCEL УТИЛИТА ────────────────────────────────────────────
function exportToExcel(data, filename, headers) {
  const escape = v => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g,'""')}"`
    return s
  }
  const rows = [headers.map(h => h.label)]
  data.forEach(row => rows.push(headers.map(h => escape(row[h.key]))))
  const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

function ExcelBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:6, background:'#217346', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(33,115,70,0.3)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
      Выгрузить Excel
    </button>
  )
}

const cardSt = { background:'#fff', borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e8e8e8' }
const thSt2 = { padding:'10px 12px', textAlign:'left', fontWeight:700, fontSize:12, color:'#888', borderBottom:'2px solid #e8e8e8', whiteSpace:'nowrap' }
const tdSt2 = { padding:'10px 12px', fontSize:13, borderBottom:'1px solid #f0f0f0' }

// ─── КАССОВАЯ КНИГА ──────────────────────────────────────────
function CashBook() {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [from, setFrom] = React.useState(new Date().toISOString().slice(0,10))
  const [to, setTo] = React.useState(new Date().toISOString().slice(0,10))
  const [expanded, setExpanded] = React.useState({})

  async function load() {
    setLoading(true)
    const d = await fetch(`/api/cashbook?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>null)
    setData(d); setLoading(false)
  }
  React.useEffect(()=>{ load() },[])

  function doExcel() {
    if (!data) return
    const rows = []
    data.days.forEach(day => {
      rows.push({ date: day.date, type: '', desc: `Остаток на начало дня`, amount: fmt(day.openBalance), balance: '' })
      day.entries.forEach(e => rows.push({ date: fmtDT(e.time), type: e.type==='IN'?'Приход':'Расход', desc: e.desc, amount: fmt(e.amount), balance: '' }))
      rows.push({ date: day.date, type: '', desc: `Остаток на конец дня`, amount: fmt(day.closeBalance), balance: '' })
    })
    exportToExcel(rows, `кассовая_книга_${from}_${to}`, [
      {key:'date',label:'Дата/Время'},{key:'type',label:'Тип'},{key:'desc',label:'Описание'},{key:'amount',label:'Сумма (TMT)'}
    ])
  }

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Кассовая книга</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <span style={{color:'#aaa'}}>—</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <button onClick={load} style={{background:'#1a1a2e',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Показать</button>
          {data && <ExcelBtn onClick={doExcel}/>}
        </div>
      </div>

      {loading && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Загрузка...</div>}
      {data && !loading && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:20}}>
            {[
              {label:'Текущий остаток',value:`${fmt(data.currentBalance)} TMT`,color:'#27ae60'},
              {label:'Итого приход',value:`${fmt(data.days.reduce((s,d)=>s+d.totalIn,0))} TMT`,color:'#2980b9'},
              {label:'Итого расход',value:`${fmt(data.days.reduce((s,d)=>s+d.totalOut,0))} TMT`,color:'#e74c3c'},
              {label:'Дней',value:data.days.length,color:'#8e44ad'},
            ].map(c=>(
              <div key={c.label} style={cardSt}>
                <div style={{fontSize:11,color:'#aaa',fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{c.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:c.color}}>{c.value}</div>
              </div>
            ))}
          </div>

          {data.days.map(day=>(
            <div key={day.date} style={{...cardSt,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setExpanded(e=>({...e,[day.date]:!e[day.date]}))}>
                <div style={{fontWeight:700,fontSize:14,color:'#1a1a2e'}}>{fmtDate(day.date)}</div>
                <div style={{display:'flex',gap:16,alignItems:'center',fontSize:13}}>
                  <span style={{color:'#27ae60'}}>+{fmt(day.totalIn)}</span>
                  <span style={{color:'#e74c3c'}}>-{fmt(day.totalOut)}</span>
                  <span style={{color:'#1a1a2e',fontWeight:700}}>Остаток: {fmt(day.closeBalance)} TMT</span>
                  <span style={{color:'#aaa'}}>{expanded[day.date]?'▲':'▼'}</span>
                </div>
              </div>
              {expanded[day.date] && (
                <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
                  <thead><tr>
                    <th style={thSt2}>Время</th><th style={thSt2}>Тип</th><th style={thSt2}>Описание</th><th style={{...thSt2,textAlign:'right'}}>Сумма (TMT)</th>
                  </tr></thead>
                  <tbody>
                    <tr><td style={tdSt2} colSpan={3}><span style={{color:'#888'}}>Остаток на начало дня</span></td><td style={{...tdSt2,textAlign:'right',fontWeight:700}}>{fmt(day.openBalance)}</td></tr>
                    {day.entries.map((e,i)=>(
                      <tr key={i}>
                        <td style={tdSt2}>{fmtDT(e.time)}</td>
                        <td style={tdSt2}><span style={{background:e.type==='IN'?'#eafaf1':'#fdf2f2',color:e.type==='IN'?'#27ae60':'#e74c3c',padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:600}}>{e.type==='IN'?'Приход':'Расход'}</span></td>
                        <td style={tdSt2}>{e.desc}</td>
                        <td style={{...tdSt2,textAlign:'right',fontWeight:600,color:e.type==='IN'?'#27ae60':'#e74c3c'}}>{e.type==='IN'?'+':'-'}{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    <tr><td style={tdSt2} colSpan={3}><span style={{color:'#888'}}>Остаток на конец дня</span></td><td style={{...tdSt2,textAlign:'right',fontWeight:800,color:'#1a1a2e'}}>{fmt(day.closeBalance)}</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {data.days.length===0 && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Нет данных за выбранный период</div>}
        </>
      )}
    </div>
  )
}

// ─── Z-ОТЧЁТЫ ─────────────────────────────────────────────────
function ZReports() {
  const [shifts, setShifts] = React.useState([])
  const [selected, setSelected] = React.useState(null)
  const [report, setReport] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(()=>{
    fetch('/api/shifts').then(r=>r.json()).then(d=>setShifts(Array.isArray(d)?d:[])).catch(()=>{})
  },[])

  async function loadReport(id) {
    setLoading(true); setSelected(id)
    const d = await fetch(`/api/shifts/${id}/zreport`).then(r=>r.json()).catch(()=>null)
    setReport(d); setLoading(false)
  }

  function doExcel() {
    if (!report) return
    exportToExcel(report.topItems, `z_отчёт_смена_${selected}`, [
      {key:'name',label:'Блюдо'},{key:'qty',label:'Кол-во'},{key:'total',label:'Сумма (TMT)'}
    ])
  }

  function printReport() {
    if (!report) return
    const s = report.shift
    const w = window.open('','_blank','width=400,height=600')
    w.document.write(`<html><body style="font-family:monospace;font-size:12px;padding:16px">
      <div style="text-align:center"><b>HOS LOUNGE</b><br>Z-ОТЧЁТ<br>Смена #${s.id}</div><hr>
      <div>Кассир: ${s.cashierName}</div>
      <div>Открыта: ${fmtDT(s.openedAt)}</div>
      <div>Закрыта: ${fmtDT(s.closedAt)}</div><hr>
      <div>Чеков: ${report.orders}</div>
      <div>Наличными: ${fmt(report.totalCash)} TMT (${report.cashOrders} чеков)</div>
      <div>Картой: ${fmt(report.totalCard)} TMT (${report.cardOrders} чеков)</div>
      <div>Итого: ${fmt(report.totalRevenue)} TMT</div>
      <div>Расходы: ${fmt(report.totalExpenses)} TMT</div>
      <div>Прибыль: ${fmt(report.profit)} TMT</div>
      <div>Средний чек: ${fmt(report.avgCheck)} TMT</div><hr>
      <div><b>ТОП БЛЮД:</b></div>
      ${report.topItems.map(i=>`<div>${i.name}: ${i.qty} шт — ${fmt(i.total)} TMT</div>`).join('')}
      <hr><div style="text-align:center">${new Date().toLocaleString('ru-RU')}</div>
    </body></html>`)
    w.document.close(); w.print()
  }

  return (
    <div style={{padding:24,display:'flex',gap:20}}>
      <div style={{width:280,flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:700,color:'#1a1a2e',marginBottom:14}}>Смены</div>
        {shifts.map(s=>(
          <div key={s.id} onClick={()=>loadReport(s.id)}
            style={{...cardSt,marginBottom:8,cursor:'pointer',borderColor:selected===s.id?'#c9a96e':'#e8e8e8',background:selected===s.id?'#fdf8f0':'#fff'}}>
            <div style={{fontWeight:700,fontSize:13,color:'#1a1a2e'}}>Смена #{s.id} · {s.cashierName}</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:3}}>{fmtDT(s.openedAt)}</div>
            <span style={{display:'inline-block',marginTop:5,padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:s.status==='CLOSED'?'#eafaf1':'#fff8ec',color:s.status==='CLOSED'?'#27ae60':'#e67e22'}}>{s.status==='CLOSED'?'Закрыта':'Открыта'}</span>
          </div>
        ))}
      </div>

      <div style={{flex:1}}>
        {loading && <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Загрузка...</div>}
        {!loading && !report && <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Выберите смену</div>}
        {!loading && report && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:17,fontWeight:700,color:'#1a1a2e'}}>Z-Отчёт · Смена #{report.shift.id}</div>
              <div style={{display:'flex',gap:8}}>
                <ExcelBtn onClick={doExcel}/>
                <button onClick={printReport} style={{display:'flex',alignItems:'center',gap:6,background:'#1a1a2e',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Печать
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10,marginBottom:16}}>
              {[
                {l:'Выручка',v:`${fmt(report.totalRevenue)} TMT`,c:'#27ae60'},
                {l:'Наличные',v:`${fmt(report.totalCash)} TMT`,c:'#2980b9'},
                {l:'Карта',v:`${fmt(report.totalCard)} TMT`,c:'#8e44ad'},
                {l:'Чеков',v:report.orders,c:'#e67e22'},
                {l:'Средний чек',v:`${fmt(report.avgCheck)} TMT`,c:'#16a085'},
                {l:'Расходы',v:`${fmt(report.totalExpenses)} TMT`,c:'#e74c3c'},
                {l:'Прибыль',v:`${fmt(report.profit)} TMT`,c:report.profit>=0?'#27ae60':'#e74c3c'},
              ].map(c=>(
                <div key={c.l} style={cardSt}>
                  <div style={{fontSize:11,color:'#aaa',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>{c.l}</div>
                  <div style={{fontSize:17,fontWeight:800,color:c.c}}>{c.v}</div>
                </div>
              ))}
            </div>
            <div style={cardSt}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:'#1a1a2e'}}>Топ блюд</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={thSt2}>Блюдо</th><th style={{...thSt2,textAlign:'right'}}>Кол-во</th><th style={{...thSt2,textAlign:'right'}}>Сумма</th></tr></thead>
                <tbody>{report.topItems.map((i,idx)=>(
                  <tr key={i.name}><td style={tdSt2}><span style={{color:'#c9a96e',fontWeight:700,marginRight:8}}>#{idx+1}</span>{i.name}</td><td style={{...tdSt2,textAlign:'right'}}>×{i.qty}</td><td style={{...tdSt2,textAlign:'right',fontWeight:600}}>{fmt(i.total)} TMT</td></tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── СЕБЕСТОИМОСТЬ И МАРЖА ────────────────────────────────────
function MarginReport() {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [from, setFrom] = React.useState(new Date(Date.now()-30*86400000).toISOString().slice(0,10))
  const [to, setTo] = React.useState(new Date().toISOString().slice(0,10))
  const [sort, setSort] = React.useState('revenue')

  async function load() {
    setLoading(true)
    const d = await fetch(`/api/accounting/margin?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>null)
    setData(d); setLoading(false)
  }
  React.useEffect(()=>{ load() },[])

  function doExcel() {
    if (!data) return
    exportToExcel(data.items, `маржа_${from}_${to}`, [
      {key:'name',label:'Блюдо'},{key:'qty',label:'Кол-во'},{key:'avgPrice',label:'Цена ср.'},{key:'avgCost',label:'Себест. ср.'},{key:'revenue',label:'Выручка'},{key:'cost',label:'Себестоимость'},{key:'margin',label:'Маржа'},{key:'marginPct',label:'Маржа %'}
    ])
  }

  const sorted = data?.items ? [...data.items].sort((a,b)=> sort==='margin'?b.margin-a.margin : sort==='pct'?b.marginPct-a.marginPct : b.revenue-a.revenue) : []

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Себестоимость и маржа</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <span style={{color:'#aaa'}}>—</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <button onClick={load} style={{background:'#1a1a2e',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Показать</button>
          {data && <ExcelBtn onClick={doExcel}/>}
        </div>
      </div>
      {loading && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Загрузка...</div>}
      {data && !loading && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:20}}>
            {[
              {l:'Выручка',v:`${fmt(data.totalRevenue)} TMT`,c:'#27ae60'},
              {l:'Себестоимость',v:`${fmt(data.totalCost)} TMT`,c:'#e74c3c'},
              {l:'Валовая прибыль',v:`${fmt(data.totalMargin)} TMT`,c:'#2980b9'},
              {l:'Маржинальность',v:`${fmt(data.marginPct)}%`,c:'#8e44ad'},
            ].map(c=>(
              <div key={c.l} style={cardSt}>
                <div style={{fontSize:11,color:'#aaa',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>{c.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:c.c}}>{c.v}</div>
              </div>
            ))}
          </div>
          <div style={cardSt}>
            <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
              <span style={{fontSize:13,color:'#888'}}>Сортировка:</span>
              {[['revenue','По выручке'],['margin','По марже'],['pct','По марже %']].map(([k,l])=>(
                <button key={k} onClick={()=>setSort(k)} style={{background:sort===k?'#1a1a2e':'#f5f5f5',color:sort===k?'#fff':'#555',border:'none',borderRadius:7,padding:'5px 12px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={thSt2}>Блюдо</th>
                <th style={{...thSt2,textAlign:'right'}}>Кол-во</th>
                <th style={{...thSt2,textAlign:'right'}}>Цена ср.</th>
                <th style={{...thSt2,textAlign:'right'}}>Себест.</th>
                <th style={{...thSt2,textAlign:'right'}}>Выручка</th>
                <th style={{...thSt2,textAlign:'right'}}>Маржа</th>
                <th style={{...thSt2,textAlign:'right'}}>Маржа %</th>
              </tr></thead>
              <tbody>{sorted.map(i=>{
                const pct = i.marginPct
                const barColor = pct>60?'#27ae60':pct>30?'#f39c12':'#e74c3c'
                return (
                  <tr key={i.name}>
                    <td style={tdSt2}>{i.name}</td>
                    <td style={{...tdSt2,textAlign:'right'}}>×{i.qty}</td>
                    <td style={{...tdSt2,textAlign:'right'}}>{fmt(i.avgPrice)}</td>
                    <td style={{...tdSt2,textAlign:'right',color:'#e74c3c'}}>{fmt(i.avgCost)}</td>
                    <td style={{...tdSt2,textAlign:'right',fontWeight:600}}>{fmt(i.revenue)}</td>
                    <td style={{...tdSt2,textAlign:'right',color:i.margin>=0?'#27ae60':'#e74c3c',fontWeight:600}}>{fmt(i.margin)}</td>
                    <td style={{...tdSt2,textAlign:'right'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                        <div style={{width:50,height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                          <div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:'100%',background:barColor,borderRadius:3}}/>
                        </div>
                        <span style={{color:barColor,fontWeight:600,minWidth:36}}>{fmt(pct)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── СВЕРКА СКЛАДА ────────────────────────────────────────────
function StockReconciliation() {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [from, setFrom] = React.useState(new Date(Date.now()-30*86400000).toISOString().slice(0,10))
  const [to, setTo] = React.useState(new Date().toISOString().slice(0,10))
  const [filter, setFilter] = React.useState('all')

  async function load() {
    setLoading(true)
    const d = await fetch(`/api/accounting/stock-reconciliation?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setData(Array.isArray(d)?d:[]); setLoading(false)
  }
  React.useEffect(()=>{ load() },[])

  function doExcel() {
    if (!data) return
    exportToExcel(data, `сверка_склада_${from}_${to}`, [
      {key:'name',label:'Товар'},{key:'unit',label:'Ед.'},{key:'expectedConsumption',label:'Ожидаемое списание'},{key:'actualWriteoff',label:'Фактическое списание'},{key:'diff',label:'Расхождение'},{key:'currentStock',label:'Остаток на складе'}
    ])
  }

  const filtered = (data||[]).filter(i => {
    if (filter==='issues') return Math.abs(i.diff) > 0.01
    if (filter==='ok') return Math.abs(i.diff) <= 0.01
    return true
  })

  const issues = (data||[]).filter(i=>Math.abs(i.diff)>0.01).length

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>Сверка склада с продажами</div>
          {issues>0 && <div style={{fontSize:13,color:'#e74c3c',marginTop:4}}>⚠ Расхождений: {issues}</div>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <span style={{color:'#aaa'}}>—</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:'inherit'}}/>
          <button onClick={load} style={{background:'#1a1a2e',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Показать</button>
          {data && <ExcelBtn onClick={doExcel}/>}
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['all','Все'],['issues','Расхождения'],['ok','Без расхождений']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{background:filter===k?'#1a1a2e':'#f5f5f5',color:filter===k?'#fff':'#555',border:'none',borderRadius:7,padding:'6px 14px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
        ))}
      </div>
      {loading && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Загрузка...</div>}
      {!loading && data && (
        <div style={cardSt}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={thSt2}>Товар</th>
              <th style={{...thSt2,textAlign:'right'}}>Ожид. списание</th>
              <th style={{...thSt2,textAlign:'right'}}>Факт. списание</th>
              <th style={{...thSt2,textAlign:'right'}}>Расхождение</th>
              <th style={{...thSt2,textAlign:'right'}}>Остаток</th>
              <th style={thSt2}>Статус</th>
            </tr></thead>
            <tbody>{filtered.map(i=>{
              const hasDiff = Math.abs(i.diff) > 0.01
              return (
                <tr key={i.id} style={{background:hasDiff?'#fff8f8':'transparent'}}>
                  <td style={tdSt2}><b>{i.name}</b> <span style={{color:'#aaa',fontSize:11}}>{i.unit}</span></td>
                  <td style={{...tdSt2,textAlign:'right'}}>{fmt(i.expectedConsumption)}</td>
                  <td style={{...tdSt2,textAlign:'right'}}>{fmt(i.actualWriteoff)}</td>
                  <td style={{...tdSt2,textAlign:'right',fontWeight:700,color:hasDiff?(i.diff>0?'#e74c3c':'#e67e22'):'#27ae60'}}>
                    {i.diff>0?'+':''}{fmt(i.diff)}
                  </td>
                  <td style={{...tdSt2,textAlign:'right'}}>{fmt(i.currentStock)}</td>
                  <td style={tdSt2}>
                    {!hasDiff && <span style={{background:'#eafaf1',color:'#27ae60',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600}}>OK</span>}
                    {hasDiff && i.diff>0 && <span style={{background:'#fdf2f2',color:'#e74c3c',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600}}>Перерасход</span>}
                    {hasDiff && i.diff<0 && <span style={{background:'#fff8ec',color:'#e67e22',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600}}>Недосписание</span>}
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
          {filtered.length===0 && <div style={{textAlign:'center',padding:30,color:'#aaa'}}>Нет данных</div>}
        </div>
      )}
    </div>
  )
}
