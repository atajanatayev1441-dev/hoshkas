import React, { useState, useEffect, useRef } from 'react'

const STATUS_LABEL = {
  OPEN:      { text: 'Открыт',   color: '#8e44ad', bg: '#f5eefa' },
  PENDING:   { text: 'На кассе', color: '#f39c12', bg: '#fff8ec' },
  PAID:      { text: 'Оплачен',  color: '#2980b9', bg: '#eaf4fb' },
  CANCELLED: { text: 'Отменён',  color: '#e74c3c', bg: '#fdf0ef' },
}

export default function OrderPage({ waiter, onLogout }) {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')

  // Открытые чеки этого официанта
  const [openOrders, setOpenOrders] = useState([])
  // Текущий выбранный чек (для добавления)
  const [activeOrder, setActiveOrder] = useState(null)
  // Корзина для нового/текущего чека
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  const [view, setView] = useState('menu') // 'menu' | 'cart' | 'history'
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const wsRef = useRef(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { setCategories(data); if (data.length > 0) setActiveCategory(data[0].id) })
  }, [])

  useEffect(() => {
    loadOpenOrders()
  }, [])

  useEffect(() => {
    if (view === 'history') loadHistory()
  }, [view])

  // WebSocket — слушаем обновления статусов
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'order_accepted') {
          setOpenOrders(prev => prev.filter(o => o.id !== data.id))
          if (activeOrder?.id === data.id) { setActiveOrder(null); setCart([]) }
          if (data.waiterId === waiter.id || data.waiterName === waiter.name) {
            showToast(`✅ Заказ #${data.number} оплачен!`)
            setHistory(prev => prev.map(o => o.id === data.id ? { ...o, status: 'PAID' } : o))
          }
        }
        if (event === 'order_cancelled') {
          setOpenOrders(prev => prev.filter(o => o.id !== data.id))
          if (activeOrder?.id === data.id) { setActiveOrder(null); setCart([]) }
          if (data.waiterId === waiter.id || data.waiterName === waiter.name) {
            showToast(`❌ Заказ #${data.number} отменён`)
            setHistory(prev => prev.map(o => o.id === data.id ? { ...o, status: 'CANCELLED' } : o))
          }
        }
        if (event === 'order_updated') {
          setOpenOrders(prev => prev.map(o => o.id === data.id ? data : o))
          if (activeOrder?.id === data.id) setActiveOrder(data)
        }
      } catch {}
    }
    return () => ws.close()
  }, [activeOrder])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function loadOpenOrders() {
    try {
      const res = await fetch(`/api/orders/open?waiterId=${waiter.id}`)
      const data = await res.json()
      setOpenOrders(data)
    } catch {}
  }

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/orders?limit=50')
      const data = await res.json()
      setHistory(data.filter(o => o.waiterId === waiter.id || o.waiterName === waiter.name))
    } catch {}
    setLoadingHistory(false)
  }

  const currentItems = (() => {
    if (search.trim()) return categories.flatMap(c => c.items).filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()))
    return categories.find(c => c.id === activeCategory)?.items ?? []
  })()

  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(c => c.itemId === item.id)
      if (ex) return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const ex = prev.find(c => c.itemId === itemId)
      if (ex?.quantity > 1) return prev.map(c => c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      return prev.filter(c => c.itemId !== itemId)
    })
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  // Открыть новый чек
  async function openNewOrder() {
    if (!cart.length || !tableNumber.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, comment, items: cart, waiterId: waiter.id, waiterName: waiter.name })
      })
      const order = await res.json()
      setOpenOrders(prev => [...prev, order])
      setActiveOrder(order)
      setCart([])
      setTableNumber('')
      setComment('')
      showToast(`📋 Чек #${order.number} открыт — стол ${order.tableNumber}`)
      setView('menu')
    } catch (e) { alert('Ошибка: ' + e.message) }
    setSending(false)
  }

  // Добавить позиции в существующий чек
  async function addToExistingOrder() {
    if (!cart.length || !activeOrder) return
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/add-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      })
      const order = await res.json()
      setOpenOrders(prev => prev.map(o => o.id === order.id ? order : o))
      setActiveOrder(order)
      setCart([])
      showToast(`➕ Добавлено в чек #${order.number}`)
      setView('menu')
    } catch (e) { alert('Ошибка: ' + e.message) }
    setSending(false)
  }

  // Закрыть чек (отправить на кассу)
  async function closeOrder(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}/close`, { method: 'PUT' })
      const order = await res.json()
      setOpenOrders(prev => prev.filter(o => o.id !== orderId))
      if (activeOrder?.id === orderId) { setActiveOrder(null); setCart([]) }
      showToast(`🧾 Чек #${order.number} отправлен на кассу`)
      loadHistory()
    } catch (e) { alert('Ошибка: ' + e.message) }
  }

  function selectOrder(order) {
    setActiveOrder(order)
    setCart([])
    showToast(`Выбран чек #${order.number} — стол ${order.tableNumber}`)
  }

  return (
    <div className="waiter-app">
      {/* Header */}
      <div className="waiter-header">
        <div className="waiter-name">
          <img src="/waiter/hos_logo.png" alt="HOS" style={{ height: 30, objectFit: 'contain' }} />
          {waiter.name}
        </div>
        <button className="logout-btn" onClick={onLogout}>Выйти</button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="sent-toast" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {/* Открытые чеки */}
      {openOrders.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '8px 12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>Открытые чеки:</span>
            <button
              onClick={() => { setActiveOrder(null); setCart([]) }}
              style={{
                border: '1.5px solid ' + (!activeOrder ? '#1a1a2e' : '#ddd'),
                background: !activeOrder ? '#1a1a2e' : '#f5f5f5',
                color: !activeOrder ? '#fff' : '#555',
                borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              + Новый
            </button>
            {openOrders.map(o => (
              <button
                key={o.id}
                onClick={() => selectOrder(o)}
                style={{
                  border: '1.5px solid ' + (activeOrder?.id === o.id ? '#8e44ad' : '#ddd'),
                  background: activeOrder?.id === o.id ? '#f5eefa' : '#f9f9f9',
                  color: activeOrder?.id === o.id ? '#8e44ad' : '#333',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600
                }}
              >
                #{o.number} · Стол {o.tableNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="waiter-tabs">
        <button className={view === 'menu' ? 'active' : ''} onClick={() => setView('menu')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          Меню
        </button>
        <button className={view === 'cart' ? 'active' : ''} onClick={() => setView('cart')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          {activeOrder ? `Чек #${activeOrder.number}` : 'Новый чек'}
          {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          История
        </button>
      </div>

      {/* MENU */}
      {view === 'menu' && (
        <div className="waiter-menu">
          <div className="w-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!search && (
            <div className="w-categories">
              {categories.map(c => (
                <button key={c.id} className={activeCategory === c.id ? 'wcat active' : 'wcat'} onClick={() => setActiveCategory(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="w-items">
            {currentItems.map(item => {
              const inCart = cart.find(c => c.itemId === item.id)
              return (
                <div key={item.id} className="w-item" onClick={() => addToCart(item)}>
                  <div>
                    <div className="w-item-name">{item.name}</div>
                    <div className="w-item-price">{item.price} TMT</div>
                  </div>
                  {inCart ? (
                    <div className="w-item-count" onClick={e => { e.stopPropagation(); removeFromCart(item.id) }}>
                      <span>{inCart.quantity}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  ) : (
                    <div className="w-add-btn">+</div>
                  )}
                </div>
              )
            })}
          </div>
          {cartCount > 0 && (
            <button className="w-cart-fab" onClick={() => setView('cart')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
              {activeOrder ? `Добавить в чек #${activeOrder.number}` : 'Открыть чек'} · {cartTotal.toFixed(0)} TMT
            </button>
          )}
        </div>
      )}

      {/* CART / ЧЕК */}
      {view === 'cart' && (
        <div className="waiter-cart">

          {/* Если выбран существующий чек — показываем его позиции */}
          {activeOrder && (
            <>
              <div style={{ background: '#f5eefa', borderRadius: 12, padding: '10px 14px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#8e44ad' }}>Чек #{activeOrder.number} · Стол {activeOrder.tableNumber}</span>
                  <span style={{ fontSize: 13, color: '#888' }}>Открыт</span>
                </div>
              </div>

              <div className="w-cart-items">
                <div style={{ padding: '8px 16px', fontSize: 12, color: '#aaa', fontWeight: 600, letterSpacing: 0.5 }}>УЖЕ В ЧЕКЕ</div>
                {activeOrder.items.map(item => (
                  <div key={item.id} className="w-cart-item">
                    <span className="w-ci-name">{item.name}</span>
                    <span style={{ color: '#888', fontSize: 13 }}>×{item.quantity}</span>
                    <span className="w-ci-sum">{(item.price * item.quantity).toFixed(0)} TMT</span>
                  </div>
                ))}
                {cart.length > 0 && (
                  <>
                    <div style={{ padding: '8px 16px', fontSize: 12, color: '#27ae60', fontWeight: 600, letterSpacing: 0.5, borderTop: '1px solid #f0f0f0' }}>ДОБАВЛЯЕТСЯ</div>
                    {cart.map(item => (
                      <div key={item.itemId} className="w-cart-item">
                        <span className="w-ci-name">{item.name}</span>
                        <div className="w-ci-controls">
                          <button onClick={() => removeFromCart(item.itemId)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addToCart({ id: item.itemId, name: item.name, price: item.price })}>+</button>
                        </div>
                        <span className="w-ci-sum">{(item.price * item.quantity).toFixed(0)} TMT</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="w-total">
                <span>Итого в чеке:</span>
                <strong>{(activeOrder.total + cartTotal).toFixed(0)} TMT</strong>
              </div>

              {cart.length > 0 && (
                <button className="w-send-btn" onClick={addToExistingOrder} disabled={sending} style={{ background: '#27ae60', marginBottom: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {sending ? 'Добавляем...' : 'Добавить в чек'}
                </button>
              )}

              <button
                className="w-send-btn"
                onClick={() => closeOrder(activeOrder.id)}
                style={{ background: '#e74c3c' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Закрыть чек — гость просит счёт
              </button>
            </>
          )}

          {/* Новый чек */}
          {!activeOrder && (
            <>
              <div className="w-table-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <input
                  placeholder="Номер стола *"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className={!tableNumber.trim() ? 'required' : ''}
                />
              </div>
              <div className="w-cart-items">
                {cart.length === 0 && <div className="w-empty">Добавьте позиции из меню</div>}
                {cart.map(item => (
                  <div key={item.itemId} className="w-cart-item">
                    <span className="w-ci-name">{item.name}</span>
                    <div className="w-ci-controls">
                      <button onClick={() => removeFromCart(item.itemId)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart({ id: item.itemId, name: item.name, price: item.price })}>+</button>
                    </div>
                    <span className="w-ci-sum">{(item.price * item.quantity).toFixed(0)} TMT</span>
                  </div>
                ))}
              </div>
              <textarea
                className="w-comment"
                placeholder="Комментарий (аллергии, пожелания...)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
              />
              <div className="w-total">
                <span>Итого:</span>
                <strong>{cartTotal.toFixed(0)} TMT</strong>
              </div>
              <button
                className="w-send-btn"
                onClick={openNewOrder}
                disabled={!cart.length || !tableNumber.trim() || sending}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {sending ? 'Открываем...' : 'Открыть чек'}
              </button>
              {!tableNumber.trim() && cart.length > 0 && <p className="w-hint">Укажите номер стола</p>}
            </>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div className="waiter-cart">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#888' }}>Ваши заказы</span>
            <button onClick={loadHistory} style={{ background: 'none', border: 'none', color: '#1a1a2e', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>↻ Обновить</button>
          </div>
          {loadingHistory && <div className="w-empty">Загрузка...</div>}
          {!loadingHistory && history.length === 0 && <div className="w-empty">Заказов пока нет</div>}
          {history.map(order => {
            const s = STATUS_LABEL[order.status] || STATUS_LABEL.PENDING
            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Заказ #{order.number}</span>
                  <span style={{ background: s.bg, color: s.color, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>
                  Стол: <b style={{ color: '#1a1a2e' }}>{order.tableNumber || '—'}</b>
                  {' · '}
                  {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                  {(order.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{order.total?.toFixed(0)} TMT</span>
                  {order.status === 'OPEN' && (
                    <button
                      onClick={() => closeOrder(order.id)}
                      style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Закрыть чек
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
