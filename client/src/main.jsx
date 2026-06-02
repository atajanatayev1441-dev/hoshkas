import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import CashierPage from './pages/CashierPage.jsx'
import AccountingApp from './pages/AccountingApp.jsx'
import AccountingPage from './pages/AccountingPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import WaitersPage from './pages/WaitersPage.jsx'
import ManagerApp from './pages/ManagerApp.jsx'
import WarehousePage from './pages/WarehousePage.jsx'
import './style.css'

const NavIcon = {
  Cashier:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Accounting: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Menu:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Waiters:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Reports:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Manager:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><path d="M5 3h14l-1 7a6 6 0 0 1-12 0z"/></svg>,
  Warehouse:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Lock:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Logout:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// ─── CASHIER LOGIN ────────────────────────────────────────────
function CashierLogin({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (pin.length < 3) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/cashiers/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      if (!res.ok) { setError('Неверный PIN'); setPin(''); setLoading(false); return }
      const cashier = await res.json()
      onLogin(cashier)
    } catch { setError('Ошибка соединения') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'40px 36px', width:'100%', maxWidth:340, boxShadow:'0 24px 64px rgba(0,0,0,0.3)', textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'#888', marginBottom:4, textTransform:'uppercase' }}>HOS LOUNGE</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#1a1a2e', marginBottom:6 }}>Касса</div>
        <p style={{ fontSize:13, color:'#aaa', marginBottom:24 }}>Введите PIN кассира</p>
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:16 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width:12, height:12, borderRadius:'50%', border:'2px solid', borderColor: i<pin.length?'#1a1a2e':'#ddd', background: i<pin.length?'#1a1a2e':'transparent', transition:'all .15s' }} />
          ))}
        </div>
        {error && <p style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{error}</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => pin.length < 6 && setPin(p=>p+d)}
              style={{ background:'#f5f5f5', border:'none', borderRadius:10, height:52, fontSize:20, fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all .1s' }}>
              {d}
            </button>
          ))}
          <button onClick={() => setPin('')} style={{ background:'#fff0f0', border:'none', borderRadius:10, height:52, fontSize:13, fontWeight:600, color:'#e74c3c', cursor:'pointer', fontFamily:'inherit' }}>C</button>
          <button onClick={() => pin.length < 6 && setPin(p=>p+'0')} style={{ background:'#f5f5f5', border:'none', borderRadius:10, height:52, fontSize:20, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>0</button>
          <button onClick={() => setPin(p=>p.slice(0,-1))} style={{ background:'#f5f5f5', border:'none', borderRadius:10, height:52, fontSize:18, cursor:'pointer', fontFamily:'inherit' }}>⌫</button>
        </div>
        <button onClick={handleLogin} disabled={pin.length<3||loading}
          style={{ width:'100%', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.7:1 }}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

// ─── SHIFT BANNER ─────────────────────────────────────────────
function ShiftBanner({ cashier, shift, onOpenShift, onCloseShift }) {
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [openCash, setOpenCash] = useState('')
  const [closeCash, setCloseCash] = useState('')
  const [loading, setLoading] = useState(false)

  async function openShift() {
    setLoading(true)
    try {
      const res = await fetch('/api/shifts/open', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ cashierName: cashier.name, cashierPin: cashier.pin, openCash: parseFloat(openCash||0) })
      })
      const s = await res.json()
      if (res.ok) { onOpenShift(s); setShowOpen(false); setOpenCash('') }
      else alert(s.error)
    } catch(e) { alert(e.message) }
    setLoading(false)
  }

  async function closeShift() {
    if (!shift) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/${shift.id}/close`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ closeCash: parseFloat(closeCash||0) })
      })
      const s = await res.json()
      if (res.ok) { onCloseShift(s); setShowClose(false); setCloseCash('') }
    } catch(e) { alert(e.message) }
    setLoading(false)
  }

  const shiftDuration = shift ? Math.floor((Date.now() - new Date(shift.openedAt).getTime()) / 60000) : 0

  return (
    <>
      <div style={{ background: shift ? '#eafaf1' : '#fff8ec', borderBottom:'1px solid', borderColor: shift?'#a9dfbf':'#f9ca8b', padding:'6px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background: shift?'#27ae60':'#e67e22', display:'inline-block' }} />
          {shift
            ? <span style={{ color:'#27ae60', fontWeight:600 }}>Смена открыта · {cashier.name} · {shiftDuration < 60 ? `${shiftDuration} мин` : `${Math.floor(shiftDuration/60)}ч ${shiftDuration%60}м`}</span>
            : <span style={{ color:'#e67e22', fontWeight:600 }}>Смена не открыта · {cashier.name}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!shift && <button onClick={()=>setShowOpen(true)} style={{ background:'#27ae60', color:'#fff', border:'none', borderRadius:8, padding:'4px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Открыть смену</button>}
          {shift && <button onClick={()=>setShowClose(true)} style={{ background:'#e74c3c', color:'#fff', border:'none', borderRadius:8, padding:'4px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Закрыть смену</button>}
        </div>
      </div>

      {/* Open shift modal */}
      {showOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Открыть смену</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>Кассир: <b>{cashier.name}</b></div>
            <label style={{ fontSize:13, color:'#555', display:'block', marginBottom:6 }}>Наличных в кассе на начало смены (TMT)</label>
            <input type="number" value={openCash} onChange={e=>setOpenCash(e.target.value)} placeholder="0"
              style={{ border:'1.5px solid #e8e8e8', borderRadius:10, padding:'10px 14px', fontSize:15, outline:'none', width:'100%', marginBottom:16, fontFamily:'inherit', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={openShift} disabled={loading} style={{ flex:1, background:'#27ae60', color:'#fff', border:'none', borderRadius:10, padding:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? '...' : 'Открыть'}
              </button>
              <button onClick={()=>setShowOpen(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Close shift modal */}
      {showClose && shift && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Закрыть смену</div>
            <div style={{ background:'#f8f9fa', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'#888' }}>Открыта в:</span><span style={{ fontWeight:600 }}>{new Date(shift.openedAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'#888' }}>Наличных на старте:</span><span style={{ fontWeight:600 }}>{shift.openCash} TMT</span></div>
            </div>
            <label style={{ fontSize:13, color:'#555', display:'block', marginBottom:6 }}>Наличных в кассе на конец смены (TMT)</label>
            <input type="number" value={closeCash} onChange={e=>setCloseCash(e.target.value)} placeholder="0"
              style={{ border:'1.5px solid #e8e8e8', borderRadius:10, padding:'10px 14px', fontSize:15, outline:'none', width:'100%', marginBottom:16, fontFamily:'inherit', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeShift} disabled={loading} style={{ flex:1, background:'#e74c3c', color:'#fff', border:'none', borderRadius:10, padding:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? '...' : 'Закрыть смену'}
              </button>
              <button onClick={()=>setShowClose(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── APP ──────────────────────────────────────────────────────
function App() {
  const [cashier, setCashier] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cashier')) } catch { return null }
  })
  const [shift, setShift] = useState(null)

  useEffect(() => {
    if (cashier) {
      fetch('/api/shifts/current').then(r=>r.json()).then(s => setShift(s)).catch(()=>{})
    }
  }, [cashier])

  function handleLogin(c) {
    sessionStorage.setItem('cashier', JSON.stringify(c))
    setCashier(c)
  }

  function handleLogout() {
    sessionStorage.removeItem('cashier')
    setCashier(null); setShift(null)
  }

  if (!cashier) return <CashierLogin onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <Nav cashier={cashier} onLogout={handleLogout} />
      <ShiftBanner cashier={cashier} shift={shift} onOpenShift={setShift} onCloseShift={() => setShift(null)} />
      <Routes>
        <Route path="/" element={<CashierPage shift={shift} cashier={cashier} />} />
        <Route path="/reports" element={<AccountingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/waiters" element={<WaitersPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/accounting" element={<AccountingApp />} />
        <Route path="/manager" element={<ManagerApp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

function Nav({ cashier, onLogout }) {
  const loc = useLocation()
  if (loc.pathname === '/accounting' || loc.pathname === '/manager') return null

  const links = [
    { to:'/', label:'Касса', icon:<NavIcon.Cashier /> },
    { to:'/reports', label:'Аналитика', icon:<NavIcon.Reports /> },
    { to:'/menu', label:'Меню', icon:<NavIcon.Menu /> },
    { to:'/warehouse', label:'Склад', icon:<NavIcon.Warehouse /> },
    { to:'/waiters', label:'Официанты', icon:<NavIcon.Waiters /> },
    { to:'/accounting', label:'Бухгалтерия', icon:<NavIcon.Accounting /> },
    { to:'/manager', label:'Управляющий', icon:<NavIcon.Manager /> },
  ]

  return (
    <nav className="nav">
      <span className="nav-logo">HOS LOUNGE</span>
      <div className="nav-links">
        {links.map(l => (
          <Link key={l.to} className={loc.pathname === l.to ? 'active' : ''} to={l.to}>
            {l.icon}{l.label}
          </Link>
        ))}
        <button onClick={onLogout} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'rgba(255,255,255,0.7)', padding:'6px 12px', borderRadius:6, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
          <NavIcon.Logout /> {cashier?.name}
        </button>
      </div>
    </nav>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
