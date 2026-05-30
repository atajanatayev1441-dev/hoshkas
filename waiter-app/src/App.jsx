import React, { useState } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import OrderPage from './pages/OrderPage.jsx'

export default function App() {
  const [waiter, setWaiter] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('waiter')) } catch { return null }
  })

  function handleLogin(w) {
    sessionStorage.setItem('waiter', JSON.stringify(w))
    setWaiter(w)
  }

  function handleLogout() {
    sessionStorage.removeItem('waiter')
    setWaiter(null)
  }

  if (!waiter) return <LoginPage onLogin={handleLogin} />
  return <OrderPage waiter={waiter} onLogout={handleLogout} />
}
