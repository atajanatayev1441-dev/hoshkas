import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import CashierPage from './pages/CashierPage.jsx'
import AccountingApp from './pages/AccountingApp.jsx'
import AccountingPage from './pages/AccountingPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import WaitersPage from './pages/WaitersPage.jsx'
import ManagerApp from './pages/ManagerApp.jsx'
import WarehousePage from './pages/WarehousePage.jsx'
import RecipePage from './pages/RecipePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import './style.css'

const ROLE_ROUTES = {
  ADMIN:      '/admin',
  CASHIER:    '/cashier',
  ACCOUNTANT: '/accounting',
  MANAGER:    '/manager',
  WAREHOUSE:  '/warehouse',
  WAITER:     '/waiters',
}

const NavIcon = {
  Cashier:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Accounting: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Menu:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Waiters:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Reports:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Manager:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><path d="M5 3h14l-1 7a6 6 0 0 1-12 0z"/></svg>,
  Warehouse:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Recipe:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Logout:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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
        body: JSON.stringify({ cashierName: cashier.name, openCash: parseFloat(openCash||0) })
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

      {showOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Открыть смену</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>Кассир: <b>{cashier.name}</b></div>
            <label style={{ fontSize:13, color:'#555', display:'block', marginBottom:6 }}>Наличных в кассе (TMT)</label>
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

      {showClose && shift && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Закрыть смену</div>
            <div style={{ background:'#f8f9fa', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'#888' }}>Открыта в:</span><span style={{ fontWeight:600 }}>{new Date(shift.openedAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#888' }}>Наличных на старте:</span><span style={{ fontWeight:600 }}>{shift.openCash} TMT</span></div>
            </div>
            <label style={{ fontSize:13, color:'#555', display:'block', marginBottom:6 }}>Наличных в кассе сейчас (TMT)</label>
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

// ─── NAV ──────────────────────────────────────────────────────
function Nav({ user, onLogout }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const noNav = ['/accounting', '/manager', '/admin', '/login']
  if (noNav.includes(loc.pathname)) return null

  const links = [
    { to:'/cashier', label:'Касса', icon:<NavIcon.Cashier /> },
    { to:'/reports', label:'Аналитика', icon:<NavIcon.Reports /> },
    { to:'/menu', label:'Меню', icon:<NavIcon.Menu /> },
    { to:'/warehouse', label:'Склад', icon:<NavIcon.Warehouse /> },
    { to:'/recipes', label:'Калькуляция', icon:<NavIcon.Recipe /> },
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
        <button onClick={() => { onLogout(); navigate('/login') }} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'rgba(255,255,255,0.7)', padding:'6px 12px', borderRadius:6, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
          <NavIcon.Logout /> {user?.name}
        </button>
      </div>
    </nav>
  )
}

// ─── APP ──────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('hos_user')) } catch { return null }
  })
  const [shift, setShift] = useState(null)

  useEffect(() => {
    if (user?.role === 'CASHIER') {
      fetch('/api/shifts/current').then(r => r.json()).then(s => setShift(s)).catch(() => {})
    }
  }, [user])

  function handleLogin(u) {
    sessionStorage.setItem('hos_user', JSON.stringify(u))
    setUser(u)
  }

  function handleLogout() {
    sessionStorage.removeItem('hos_user')
    setUser(null)
    setShift(null)
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} shift={shift} setShift={setShift} onLogin={handleLogin} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

function AppRoutes({ user, shift, setShift, onLogin, onLogout }) {
  const navigate = useNavigate()

  // Не залогинен — на логин
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={(u) => {
          onLogin(u)
          navigate(ROLE_ROUTES[u.role] || '/cashier')
        }} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <>
      <Nav user={user} onLogout={onLogout} />
      {user.role === 'CASHIER' && (
        <ShiftBanner cashier={user} shift={shift} onOpenShift={setShift} onCloseShift={() => setShift(null)} />
      )}
      <Routes>
        <Route path="/login" element={<Navigate to={ROLE_ROUTES[user.role] || '/cashier'} />} />
        <Route path="/admin" element={user.role === 'ADMIN' ? <AdminPage user={user} onLogout={onLogout} /> : <Navigate to="/login" />} />
        <Route path="/cashier" element={<CashierPage shift={shift} cashier={user} />} />
        <Route path="/" element={<Navigate to={ROLE_ROUTES[user.role] || '/cashier'} />} />
        <Route path="/reports" element={<AccountingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/waiters" element={<WaitersPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/recipes" element={<RecipePage />} />
        <Route path="/accounting" element={<AccountingApp onLogout={onLogout} />} />
        <Route path="/manager" element={<ManagerApp onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to={ROLE_ROUTES[user.role] || '/cashier'} />} />
      </Routes>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
