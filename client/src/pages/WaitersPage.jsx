import React, { useState, useEffect } from 'react'

const API = '/api'

const Icon = {
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Copy: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Link: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Key: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

export default function WaitersPage() {
  const [waiters, setWaiters] = useState([])
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [editWaiter, setEditWaiter] = useState(null)
  const [copied, setCopied] = useState(false)
  const origin = window.location.origin
  const waiterUrl = `${origin}/waiter/`

  async function load() {
    const data = await fetch(`${API}/waiters`).then(r => r.json())
    setWaiters(data)
  }

  useEffect(() => { load() }, [])

  async function addWaiter() {
    if (!name.trim() || !pin.trim()) return
    await fetch(`${API}/waiters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pin }) })
    setName(''); setPin(''); load()
  }

  async function saveEdit() {
    await fetch(`${API}/waiters/${editWaiter.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editWaiter) })
    setEditWaiter(null); load()
  }

  async function deleteWaiter(id) {
    if (!confirm('Удалить официанта?')) return
    await fetch(`${API}/waiters/${id}`, { method: 'DELETE' }); load()
  }

  function copyLink() {
    navigator.clipboard.writeText(waiterUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto', overflowY: 'auto', height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Icon.Users />
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Официанты</span>
        <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
          {waiters.length} чел.
        </span>
      </div>

      {/* Ссылка на приложение */}
      <div style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginBottom: 6, letterSpacing: 0.5 }}>
            <Icon.Link />
            Приложение для официантов
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Откройте на телефоне официанта:</p>
          <a href={waiterUrl} target="_blank" rel="noreferrer"
            style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, textDecoration: 'none', wordBreak: 'break-all' }}>
            {waiterUrl}
          </a>
        </div>
        <button onClick={copyLink}
          style={{ background: 'var(--accent)', color: 'var(--brand)', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(201,169,110,0.3)', transition: 'all .2s' }}>
          {copied ? <Icon.Check /> : <Icon.Copy />}
          {copied ? 'Скопировано!' : 'Скопировать'}
        </button>
      </div>

      {/* Добавить официанта */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <Icon.Plus />
          Добавить официанта
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя официанта"
              style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 13px 9px 36px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%' }} />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icon.User /></span>
          </div>
          <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN (3–6 цифр)" maxLength={6} type="password"
              style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 13px 9px 36px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && addWaiter()} />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icon.Key /></span>
          </div>
          <button onClick={addWaiter}
            style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            <Icon.Plus /> Добавить
          </button>
        </div>
      </div>

      {/* Список официантов */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <thead>
          <tr>
            {['Официант', 'PIN', 'Статус', 'Действия'].map(h => (
              <th key={h} style={{ background: 'var(--bg)', padding: '11px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {waiters.map(w => (
            <tr key={w.id}>
              {editWaiter?.id === w.id ? (
                <>
                  <td style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                    <input value={editWaiter.name} onChange={e => setEditWaiter(p => ({ ...p, name: e.target.value }))}
                      style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                  </td>
                  <td style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                    <input value={editWaiter.pin} onChange={e => setEditWaiter(p => ({ ...p, pin: e.target.value }))} type="text"
                      style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: 80 }} />
                  </td>
                  <td style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>—</td>
                  <td style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                    <button style={{ background: 'none', border: '1.5px solid #b7e4c7', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--green)', display: 'inline-flex', marginRight: 4 }} onClick={saveEdit}><Icon.Check /></button>
                    <button style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }} onClick={() => setEditWaiter(null)}><Icon.X /></button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ letterSpacing: 4, color: 'var(--text-muted)', fontSize: 16 }}>{'•'.repeat(w.pin.length)}</span>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Активен</span>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <button style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', marginRight: 6, transition: 'all .15s' }} onClick={() => setEditWaiter({ ...w })}><Icon.Edit /></button>
                    <button style={{ background: 'none', border: '1.5px solid #fbd5d5', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--red)', display: 'inline-flex', transition: 'all .15s' }} onClick={() => deleteWaiter(w.id)}><Icon.Trash /></button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {waiters.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40, fontSize: 14 }}>Официантов пока нет</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
