import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CashierPage from './pages/CashierPage.jsx'
import AccountingPage from './pages/AccountingPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import './style.css'

function Nav() {
  const loc = useLocation()
  return (
    <nav className="nav">
      <span className="nav-logo">☕ ЛаунжКасса</span>
      <div className="nav-links">
        <Link className={loc.pathname === '/' ? 'active' : ''} to="/">🧾 Касса</Link>
        <Link className={loc.pathname === '/accounting' ? 'active' : ''} to="/accounting">📊 Бухгалтерия</Link>
        <Link className={loc.pathname === '/menu' ? 'active' : ''} to="/menu">🍽 Меню</Link>
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
    </Routes>
  </BrowserRouter>
)
