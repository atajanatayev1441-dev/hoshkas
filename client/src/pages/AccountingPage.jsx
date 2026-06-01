import React, { useState, useEffect } from 'react'

const API = '/api'
function fmt(n) { return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) }

const Icon = {
  BarChart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Cash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>,
  Card: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Orders: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Revenue: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Avg: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
}

export default function AccountingPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('summary')

  async function load() {
    setLoading(true)
    const [s, o] = await Promise.all([
      fetch(`${API}/analytics/summary?from=${from}&to=${to}`).then(r => r.json()),
      fetch(`${API}/orders?from=${from}&to=${to}&status=PAID&limit=500`).then(r => r.json())
    ])
    setSummary(s); setOrders(o); setLoading(false)
  }

  useEffect(() => { load() }, [])

  function setRange(days) {
    const d = new Date()
    setTo(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() - days + 1)
    setFrom(d.toISOString().slice(0, 10))
  }

  const tabs = [
    { key: 'summary', label: 'По дням' },
    { key: 'items', label: 'Топ позиций' },
    { key: 'orders', label: 'Заказы' },
  ]

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto', overflowY: 'auto', height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>
          <Icon.BarChart />
          Аналитика
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['Сегодня', 1], ['7 дней', 7], ['30 дней', 30]].map(([l, d]) => (
            <button key={l} onClick={() => { setRange(d); setTimeout(load, 50) }}
              style={{ border: '1.5px solid var(--border)', background: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon.Calendar />{l}
            </button>
          ))}
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={load}
            style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Refresh /> Загрузить
          </button>
          <button onClick={() => window.open(`${API}/export/orders/excel?from=${from}&to=${to}`, '_blank')}
            style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Download /> Excel
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60, color: 'var(--text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Загружаем данные...
        </div>
      )}

      {summary && !loading && (
        <>
          {/* Карточки */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { icon: <Icon.Revenue />, label: 'Выручка', value: `${fmt(summary.totalRevenue)} TMT`, color: 'var(--green)', border: 'var(--green)' },
              { icon: <Icon.Orders />, label: 'Заказов', value: summary.totalOrders, color: 'var(--blue)', border: 'var(--blue)' },
              { icon: <Icon.Avg />, label: 'Средний чек', value: `${fmt(summary.avgCheck)} TMT`, color: 'var(--purple)', border: 'var(--purple)' },
              { icon: <Icon.Cash />, label: 'Наличные', value: `${fmt(summary.byCash)} TMT`, color: 'var(--orange)', border: 'var(--orange)' },
              { icon: <Icon.Card />, label: 'Карта', value: `${fmt(summary.byCard)} TMT`, color: 'var(--accent)', border: 'var(--accent)' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', borderLeft: `4px solid ${c.border}`, transition: 'box-shadow .2s' }}>
                <div style={{ color: c.color, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Табы */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ border: `1.5px solid ${tab === t.key ? 'var(--brand)' : 'var(--border)'}`, background: tab === t.key ? 'var(--brand)' : '#fff', color: tab === t.key ? '#fff' : 'var(--text-muted)', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Таблицы */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            {tab === 'summary' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Дата', 'Заказов', 'Выручка'].map(h => (
                    <th key={h} style={{ background: 'var(--bg)', padding: '12px 18px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {summary.byDay.map(d => (
                    <tr key={d.date} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 18px', fontSize: 14, fontWeight: 500 }}>{new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: 'var(--text-muted)' }}>{d.orders}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{fmt(d.revenue)} TMT</td>
                    </tr>
                  ))}
                  {summary.byDay.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Нет данных</td></tr>}
                </tbody>
              </table>
            )}

            {tab === 'items' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['#', 'Позиция', 'Кол-во', 'Выручка'].map(h => (
                    <th key={h} style={{ background: 'var(--bg)', padding: '12px 18px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {summary.topItems.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: 'var(--text-muted)' }}>{item.qty} шт.</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{fmt(item.revenue)} TMT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'orders' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['№', 'Время', 'Стол', 'Оплата', 'Состав', 'Сумма'].map(h => (
                    <th key={h} style={{ background: 'var(--bg)', padding: '12px 18px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>#{o.number}</td>
                      <td style={{ padding: '11px 18px', fontSize: 13, color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '11px 18px', fontSize: 14 }}>{o.tableNumber || '—'}</td>
                      <td style={{ padding: '11px 18px' }}>
                        {o.paymentType === 'CASH'
                          ? <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Наличные</span>
                          : <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Карта</span>}
                      </td>
                      <td style={{ padding: '11px 18px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>{o.items.map(i => `${i.name}×${i.quantity}`).join(', ')}</td>
                      <td style={{ padding: '11px 18px', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{fmt(o.total)} TMT</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Нет заказов за период</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
