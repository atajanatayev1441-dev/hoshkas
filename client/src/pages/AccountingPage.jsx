import React, { useState, useEffect } from 'react'

const API = '/api'

function fmt(n) { return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) }

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
    setSummary(s)
    setOrders(o)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function exportExcel() {
    window.open(`${API}/export/orders/excel?from=${from}&to=${to}`, '_blank')
  }

  function setRange(days) {
    const d = new Date()
    setTo(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() - days + 1)
    setFrom(d.toISOString().slice(0, 10))
  }

  return (
    <div className="accounting">
      <div className="acc-header">
        <h1>Бухгалтерия</h1>
        <div className="date-row">
          <button onClick={() => { setRange(1); setTimeout(load, 50) }}>Сегодня</button>
          <button onClick={() => { setRange(7); setTimeout(load, 50) }}>7 дней</button>
          <button onClick={() => { setRange(30); setTimeout(load, 50) }}>30 дней</button>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <span>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          <button className="load-btn" onClick={load}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Загрузить
          </button>
          <button className="export-btn" onClick={exportExcel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Excel
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <p>Загружаем данные...</p>
        </div>
      )}

      {summary && (
        <>
          <div className="summary-cards">
            <div className="s-card">
              <span className="s-label">Выручка</span>
              <span className="s-value">{fmt(summary.totalRevenue)} <small>TMT</small></span>
            </div>
            <div className="s-card">
              <span className="s-label">Заказов</span>
              <span className="s-value">{summary.totalOrders}</span>
            </div>
            <div className="s-card">
              <span className="s-label">Средний чек</span>
              <span className="s-value">{fmt(summary.avgCheck)} <small>TMT</small></span>
            </div>
            <div className="s-card">
              <span className="s-label">Наличные</span>
              <span className="s-value">{fmt(summary.byCash)} <small>TMT</small></span>
            </div>
            <div className="s-card">
              <span className="s-label">Карта</span>
              <span className="s-value">{fmt(summary.byCard)} <small>TMT</small></span>
            </div>
          </div>

          <div className="acc-tabs">
            <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>
              По дням
            </button>
            <button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>
              Топ позиций
            </button>
            <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
              Все заказы
            </button>
          </div>

          {tab === 'summary' && (
            <table className="acc-table">
              <thead><tr><th>Дата</th><th>Заказов</th><th>Выручка</th></tr></thead>
              <tbody>
                {summary.byDay.map(d => (
                  <tr key={d.date}>
                    <td>{new Date(d.date).toLocaleDateString('ru-RU')}</td>
                    <td>{d.orders}</td>
                    <td>{fmt(d.revenue)} TMT</td>
                  </tr>
                ))}
                {summary.byDay.length === 0 && <tr><td colSpan={3} style={{textAlign:'center',color:'#888'}}>Нет данных</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'items' && (
            <table className="acc-table">
              <thead><tr><th>#</th><th>Позиция</th><th>Кол-во</th><th>Выручка</th></tr></thead>
              <tbody>
                {summary.topItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{color:'#aaa'}}>{i + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.revenue)} TMT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'orders' && (
            <table className="acc-table">
              <thead><tr><th>#</th><th>Время</th><th>Стол</th><th>Оплата</th><th>Состав</th><th>Сумма</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.number}</td>
                    <td>{new Date(o.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{o.tableNumber || '—'}</td>
                    <td>
                      {o.paymentType === 'CASH'
                        ? <span className="badge-cash">Наличные</span>
                        : <span className="badge-card">Карта</span>}
                    </td>
                    <td className="items-cell">{o.items.map(i => `${i.name}×${i.quantity}`).join(', ')}</td>
                    <td><strong>{fmt(o.total)} TMT</strong></td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>Нет заказов за период</td></tr>}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
