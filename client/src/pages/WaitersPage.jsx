import React, { useState, useEffect } from 'react'

const API = '/api'

export default function WaitersPage() {
  const [waiters, setWaiters] = useState([])
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [editWaiter, setEditWaiter] = useState(null)
  const origin = window.location.origin

  async function load() {
    const data = await fetch(`${API}/waiters`).then(r => r.json())
    setWaiters(data)
  }

  useEffect(() => { load() }, [])

  async function addWaiter() {
    if (!name.trim() || !pin.trim()) return
    await fetch(`${API}/waiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin })
    })
    setName(''); setPin('')
    load()
  }

  async function saveEdit() {
    await fetch(`${API}/waiters/${editWaiter.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editWaiter)
    })
    setEditWaiter(null)
    load()
  }

  async function deleteWaiter(id) {
    if (!confirm('Удалить официанта?')) return
    await fetch(`${API}/waiters/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="menu-mgmt">
      <h1>Управление официантами</h1>

      {/* QR / link for waiter app */}
      <div className="waiter-link-card">
        <div>
          <h3>Приложение для официантов</h3>
          <p>Откройте эту ссылку на телефоне официанта:</p>
          <a href={`${origin}/waiter/`} target="_blank" rel="noreferrer" className="waiter-url">
            {origin}/waiter/
          </a>
        </div>
        <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(`${origin}/waiter/`); alert('Ссылка скопирована!') }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Скопировать
        </button>
      </div>

      {/* Add waiter */}
      <div className="mgmt-section">
        <h2>Добавить официанта</h2>
        <div className="waiter-add-row">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя официанта" />
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN (3–6 цифр)" maxLength={6} type="password" />
          <button onClick={addWaiter}>+ Добавить</button>
        </div>
      </div>

      {/* Waiters list */}
      <h2>Список официантов</h2>
      <table className="acc-table">
        <thead><tr><th>Имя</th><th>PIN</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody>
          {waiters.map(w => (
            <tr key={w.id}>
              {editWaiter?.id === w.id ? (
                <>
                  <td><input value={editWaiter.name} onChange={e => setEditWaiter(p => ({ ...p, name: e.target.value }))} /></td>
                  <td><input value={editWaiter.pin} onChange={e => setEditWaiter(p => ({ ...p, pin: e.target.value }))} type="text" style={{ width: 80 }} /></td>
                  <td>—</td>
                  <td>
                    <button className="icon-btn save" onClick={saveEdit}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button className="icon-btn" onClick={() => setEditWaiter(null)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td><strong>{w.name}</strong></td>
                  <td><span style={{ letterSpacing: 3, color: '#aaa' }}>{'•'.repeat(w.pin.length)}</span></td>
                  <td><span className="badge-active">Активен</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => setEditWaiter({ ...w })} title="Редактировать">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn" onClick={() => deleteWaiter(w.id)} title="Удалить">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {waiters.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>Официантов пока нет</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
