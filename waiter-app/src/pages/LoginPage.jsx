import React, { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (pin.length < 3) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waiters/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      if (!res.ok) { setError('Неверный PIN'); setPin(''); setLoading(false); return }
      const waiter = await res.json()
      onLogin(waiter)
    } catch {
      setError('Ошибка соединения')
    }
    setLoading(false)
  }

  function addDigit(d) {
    if (pin.length >= 6) return
    setPin(p => p + d)
  }

  function delDigit() { setPin(p => p.slice(0, -1)) }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">HOS LOUNGE</div>
        <p className="login-sub">Введите PIN для входа</p>

        <div className="pin-dots">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

        <div className="numpad">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} className="num-btn" onClick={() => addDigit(String(d))}>{d}</button>
          ))}
          <button className="num-btn clear" onClick={() => setPin('')}>C</button>
          <button className="num-btn" onClick={() => addDigit('0')}>0</button>
          <button className="num-btn del" onClick={delDigit}>⌫</button>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={pin.length < 3 || loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}
