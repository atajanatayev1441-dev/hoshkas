import React, { useState, useEffect, useRef } from 'react'
import { printReceipt } from '../utils/printer.js'

const API = '/api'
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`

export default function CashierPage() {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [comment, setComment] = useState('')
  const [paymentType, setPaymentType] = useState('CASH')
  const [loading, setLoading] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [pendingOrders, setPendingOrders] = useState([])
  const [activeTab, setActiveTab] = useState('cashier') // 'cashier' | 'queue'
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptPayment, setAcceptPayment] = useState({})
  const audioRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(data => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
    loadPending()
    connectWS()
    return () => wsRef.current?.close()
  }, [])

  function connectWS() {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data)
      if (event === 'new_order') {
        setPendingOrders(prev => [data, ...prev])
        playNotification()
      }
      if (event === 'order_cancelled') {
        setPendingOrders(prev => prev.filter(o => o.id !== data.id))
      }
    }
    ws.onclose = () => setTimeout(connectWS, 3000)
  }

  function playNotification() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  async function loadPending() {
    const orders = await fetch(`${API}/orders/pending`).then(r => r.json())
    setPendingOrders(orders)
  }

  const currentItems = (() => {
    if (search.trim()) {
      return categories.flatMap(c => c.items).filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    return categories.find(c => c.id === activeCategory)?.items ?? []
  })()

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id)
      if (existing) return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === itemId)
      if (existing?.quantity > 1) return prev.map(c => c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.itemId !== itemId)
    })
  }

  function clearCart() { setCart([]); setTableNumber(''); setComment('') }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  async function handleSubmit() {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, comment, items: cart, paymentType })
      })
      const order = await res.json()
      setLastOrder(order)
      await printReceipt(order)
      clearCart()
    } catch (e) { alert('Ошибка: ' + e.message) }
    setLoading(false)
  }

  async function acceptOrder(order) {
    setAcceptingId(order.id)
    try {
      const pt = acceptPayment[order.id] || 'CASH'
      const res = await fetch(`${API}/orders/${order.id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: pt })
      })
      const accepted = await res.json()
      setPendingOrders(prev => prev.filter(o => o.id !== order.id))
      setLastOrder(accepted)
      await printReceipt(accepted)
    } catch (e) { alert('Ошибка: ' + e.message) }
    setAcceptingId(null)
  }

  async function cancelOrder(id) {
    await fetch(`${API}/orders/${id}/cancel`, { method: 'PUT' })
    setPendingOrders(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="cashier-wrap">
      {/* Tabs */}
      <div className="cashier-tabs">
        <button className={activeTab === 'cashier' ? 'active' : ''} onClick={() => setActiveTab('cashier')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Касса
        </button>
        <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Заказы от официантов
          {pendingOrders.length > 0 && <span className="badge-count">{pendingOrders.length}</span>}
        </button>
      </div>

      {/* CASHIER TAB */}
      {activeTab === 'cashier' && (
        <div className="cashier">
          <div className="menu-panel">
            <div className="search-bar">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input type="text" placeholder="Поиск блюда..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {!search && (
              <div className="categories">
                {categories.map(c => (
                  <button key={c.id} className={activeCategory === c.id ? 'cat-btn active' : 'cat-btn'} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
                ))}
              </div>
            )}
            <div className="items-grid">
              {currentItems.map(item => (
                <button key={item.id} className="item-card" onClick={() => addToCart(item)}>
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">{item.price} TMT</span>
                </button>
              ))}
            </div>
          </div>

          <div className="cart-panel">
            <div className="cart-header">
              <h2>Заказ</h2>
              <input type="text" placeholder="Стол / зона" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="table-input" />
            </div>
            <div className="cart-items">
              {cart.length === 0 && (
                <div className="empty-cart">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  <p>Выберите позиции из меню</p>
                </div>
              )}
              {cart.map(item => (
                <div key={item.itemId} className="cart-item">
                  <span className="cart-name">{item.name}</span>
                  <div className="cart-controls">
                    <button onClick={() => removeFromCart(item.itemId)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addToCart({ id: item.itemId, name: item.name, price: item.price })}>+</button>
                  </div>
                  <span className="cart-sum">{(item.price * item.quantity).toFixed(0)} TMT</span>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <textarea placeholder="Комментарий..." value={comment} onChange={e => setComment(e.target.value)} rows={2} />
              <div className="payment-row">
                <button className={paymentType === 'CASH' ? 'pay-btn active' : 'pay-btn'} onClick={() => setPaymentType('CASH')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                  Наличные
                </button>
                <button className={paymentType === 'CARD' ? 'pay-btn active' : 'pay-btn'} onClick={() => setPaymentType('CARD')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Карта
                </button>
              </div>
              <div className="total-row">
                <span>Итого:</span>
                <span className="total-amount">{total.toFixed(0)} TMT</span>
              </div>
              <button className="submit-btn" onClick={handleSubmit} disabled={cart.length === 0 || loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {loading ? 'Оформляем...' : 'Принять и распечатать чек'}
              </button>
              {cart.length > 0 && (
                <button className="clear-btn" onClick={clearCart}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Очистить
                </button>
              )}
            </div>
            {lastOrder && (
              <div className="last-order">
                <span>✓ Заказ #{lastOrder.number} — {lastOrder.total.toFixed(0)} TMT</span>
                <button onClick={() => printReceipt(lastOrder)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Напечатать
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="queue-panel">
          {pendingOrders.length === 0 && (
            <div className="queue-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p>Нет новых заказов от официантов</p>
            </div>
          )}
          {pendingOrders.map(order => (
            <div key={order.id} className="pending-card">
              <div className="pending-header">
                <div className="pending-info">
                  <span className="pending-waiter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {order.waiterName || 'Официант'}
                  </span>
                  <span className="pending-table">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    Стол {order.tableNumber || '—'}
                  </span>
                  <span className="pending-time">{new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="pending-total">{order.total.toFixed(0)} TMT</span>
              </div>
              <div className="pending-items">
                {order.items.map((item, i) => (
                  <span key={i} className="pending-item">{item.name} ×{item.quantity}</span>
                ))}
              </div>
              {order.comment && <p className="pending-comment">💬 {order.comment}</p>}
              <div className="pending-actions">
                <div className="payment-row" style={{ flex: 1 }}>
                  <button
                    className={(acceptPayment[order.id] || 'CASH') === 'CASH' ? 'pay-btn active' : 'pay-btn'}
                    onClick={() => setAcceptPayment(p => ({ ...p, [order.id]: 'CASH' }))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                    Наличные
                  </button>
                  <button
                    className={(acceptPayment[order.id] || 'CASH') === 'CARD' ? 'pay-btn active' : 'pay-btn'}
                    onClick={() => setAcceptPayment(p => ({ ...p, [order.id]: 'CARD' }))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Карта
                  </button>
                </div>
                <button className="accept-btn" onClick={() => acceptOrder(order)} disabled={acceptingId === order.id}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {acceptingId === order.id ? '...' : 'Принять'}
                </button>
                <button className="decline-btn" onClick={() => cancelOrder(order.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
