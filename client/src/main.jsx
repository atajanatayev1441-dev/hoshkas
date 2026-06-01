import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CashierPage from './pages/CashierPage.jsx'
import AccountingApp from './pages/AccountingApp.jsx'
import AccountingPage from './pages/AccountingPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import WaitersPage from './pages/WaitersPage.jsx'
import ManagerApp from './pages/ManagerApp.jsx'
import './style.css'

const NavIcon = {
  Cashier: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Accounting: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Menu: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Waiters: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Reports: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Manager: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><path d="M5 3h14l-1 7a6 6 0 0 1-12 0z"/></svg>,
}

function Nav() {
  const loc = useLocation()
  if (loc.pathname === '/accounting' || loc.pathname === '/manager') return null

  const links = [
    { to: '/', label: 'Касса', icon: <NavIcon.Cashier /> },
    { to: '/reports', label: 'Аналитика', icon: <NavIcon.Reports /> },
    { to: '/menu', label: 'Меню', icon: <NavIcon.Menu /> },
    { to: '/waiters', label: 'Официанты', icon: <NavIcon.Waiters /> },
    { to: '/accounting', label: 'Бухгалтерия', icon: <NavIcon.Accounting /> },
    { to: '/manager', label: 'Управляющий', icon: <NavIcon.Manager /> },
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
      </div>
    </nav>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Nav />
    <Routes>
      <Route path="/" element={<CashierPage />} />
      <Route path="/reports" element={<AccountingPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/waiters" element={<WaitersPage />} />
      <Route path="/accounting" element={<AccountingApp />} />
      <Route path="/manager" element={<ManagerApp />} />
    </Routes>
  </BrowserRouter>
)
