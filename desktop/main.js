import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CashierPage from './pages/CashierPage.jsx'
import AccountingPage from './pages/AccountingPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import WaitersPage from './pages/WaitersPage.jsx'
import './style.css'

function Nav() {
  const loc = useLocation()
  return (
    <nav className="nav">
      <span className="nav-logo">HOS LOUNGE</span>
      <div className="nav-links">
        <Link className={loc.pathname === '/' ? 'active' : ''} to="/">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Касса
        </Link>
        <Link className={loc.pathname === '/accounting' ? 'active' : ''} to="/accounting">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Бухгалтерия
        </Link>
        <Link className={loc.pathname === '/menu' ? 'active' : ''} to="/menu">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          Меню
        </Link>
        <Link className={loc.pathname === '/waiters' ? 'active' : ''} to="/waiters">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Официанты
        </Link>
      </div>
    </nav>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Nav />
    <Routes>
      <Route path="/" element={<CashierPage />} />
      <Route path="/accounting" element={<AccountingPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/waiters" element={<WaitersPage />} />
    </Routes>
  </BrowserRouter>
)
