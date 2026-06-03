import React, { useState, useEffect, useRef } from 'react'
import { printReceipt } from '../utils/printer.js'

const API = '/api'
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
const TABLES = Array.from({ length: 20 }, (_, i) => i + 1)

// Статусы столов
const TABLE_STATUS = {
  FREE:    { label: 'Свободен',      color: '#27ae60', bg: '#eafaf1', border: '#a9dfbf' },
  OPEN:    { label: 'Открыт',        color: '#2980b9', bg: '#eaf4fb', border: '#a9cce3' },
  PENDING: { label: 'Ждёт расчёта',  color: '#e67e22', bg: '#fef9e7', border: '#f9ca8b' },
  PAID:    { label: 'Оплачен',       color: '#888',    bg: '#f5f5f5', border: '#ddd'    },
}

export default function CashierPage() {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [openOrders, setOpenOrders] = useState([]) // все открытые чеки
  const [pendingOrders, setPendingOrders] = useState([]) // ждут оплаты

  const [selectedTable, setSelectedTable] = useState(null) // выбранный стол
  const [activeOrder, setActiveOrder] = useState(null) // текущий чек выбранного стола
  const [cart, setCart] = useState([]) // новые позиции добавляемые в чек
  const [comment, setComment] = useState('')
  const [paymentType, setPaymentType] = useState('CASH')
  const [loading, setLoading] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('tables') // 'tables' | 'queue' | 'direct' | 'history'
  const [recentOrders, setRecentOrders] = useState([])
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptPayment, setAcceptPayment] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const wsRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(data => { setCategories(data); if (data.length > 0) setActiveCategory(data[0].id) })
    loadAllOrders()
    loadRecentOrders()
    connectWS()
    return () => wsRef.current?.close()
  }, [])

  async function loadRecentOrders() {
    try {
      const data = await fetch(`${API}/orders/recent?limit=50`).then(r => r.json())
      setRecentOrders(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [summary, expenses, recentOrd] = await Promise.all([
        fetch(`${API}/accounting/full-summary?from=${today}&to=${today}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/accounting/expenses?from=${today}&to=${today}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/orders/recent?limit=200`).then(r => r.json()).catch(() => []),
      ])
      // Считаем из чеков если бухгалтерия недоступна
      const todayOrders = (Array.isArray(recentOrd) ? recentOrd : []).filter(o => {
        const d = new Date(o.createdAt).toISOString().slice(0, 10)
        return d === today && o.status === 'PAID'
      })
      const cashTotal = todayOrders.filter(o => o.paymentType === 'CASH').reduce((s, o) => s + (o.total || 0), 0)
      const cardTotal = todayOrders.filter(o => o.paymentType === 'CARD').reduce((s, o) => s + (o.total || 0), 0)
      const totalRevenue = cashTotal + cardTotal
      // Топ блюд
      const itemMap = {}
      todayOrders.forEach(o => (o.items || []).forEach(i => {
        if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, total: 0 }
        itemMap[i.name].qty += i.quantity || 1
        itemMap[i.name].total += (i.price || 0) * (i.quantity || 1)
      }))
      const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 8)
      // По часам
      const hourMap = {}
      todayOrders.forEach(o => {
        const h = new Date(o.createdAt).getHours()
        if (!hourMap[h]) hourMap[h] = 0
        hourMap[h] += o.total || 0
      })
      const totalExpenses = expenses ? (Array.isArray(expenses) ? expenses.reduce((s, e) => s + (e.amount || 0), 0) : (expenses.total || 0)) : 0
      setAnalytics({
        totalRevenue, cashTotal, cardTotal,
        orderCount: todayOrders.length,
        avgCheck: todayOrders.length ? totalRevenue / todayOrders.length : 0,
        topItems, hourMap,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        summaryFromAccounting: summary,
      })
    } catch(e) { console.error(e) }
    setAnalyticsLoading(false)
  }

  function connectWS() {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)
        if (event === 'new_order' || event === 'order_opened') {
          if (data.status === 'PENDING') {
            setPendingOrders(prev => prev.find(o => o.id === data.id) ? prev : [data, ...prev])
            playNotification()
          }
          if (data.status === 'OPEN') {
            setOpenOrders(prev => prev.find(o => o.id === data.id) ? prev : [...prev, data])
          }
        }
        if (event === 'order_updated') {
          setOpenOrders(prev => prev.map(o => o.id === data.id ? data : o))
          setActiveOrder(prev => prev?.id === data.id ? data : prev)
        }
        if (event === 'order_accepted') {
          setOpenOrders(prev => prev.filter(o => o.id !== data.id))
          setPendingOrders(prev => prev.filter(o => o.id !== data.id))
          if (activeOrder?.id === data.id) { setActiveOrder(null); setCart([]) }
          // Автообновление аналитики при оплате
          setActiveTab(prev => { if (prev === 'analytics') loadAnalytics(); return prev })
        }
        if (event === 'order_cancelled') {
          setOpenOrders(prev => prev.filter(o => o.id !== data.id))
          setPendingOrders(prev => prev.filter(o => o.id !== data.id))
          if (activeOrder?.id === data.id) { setActiveOrder(null); setCart([]) }
        }
      } catch {}
    }
    ws.onclose = () => setTimeout(connectWS, 3000)
  }

  function playNotification() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  async function loadAllOrders() {
    const [open, pending] = await Promise.all([
      fetch(`${API}/orders/open`).then(r => r.json()),
      fetch(`${API}/orders/pending`).then(r => r.json())
    ])
    setOpenOrders(open)
    setPendingOrders(pending)
  }

  // Получить статус стола
  function getTableStatus(tableNum) {
    const t = String(tableNum)
    if (pendingOrders.find(o => String(o.tableNumber) === t)) return 'PENDING'
    if (openOrders.find(o => String(o.tableNumber) === t)) return 'OPEN'
    return 'FREE'
  }

  function getTableOrder(tableNum) {
    const t = String(tableNum)
    return pendingOrders.find(o => String(o.tableNumber) === t)
      || openOrders.find(o => String(o.tableNumber) === t)
      || null
  }

  function selectTable(tableNum) {
    setSelectedTable(tableNum)
    setCart([])
    setComment('')
    setPaymentType('CASH')
    const order = getTableOrder(tableNum)
    setActiveOrder(order || null)
    if (order?.status === 'PENDING') setActiveTab('tables')
  }

  // Меню
  const currentItems = (() => {
    if (search.trim()) return categories.flatMap(c => c.items).filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
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
  const orderTotal = activeOrder ? activeOrder.total : 0
  const grandTotal = orderTotal + cartTotal

  // Открыть новый чек для стола
  async function openTable() {
    if (!selectedTable || cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: String(selectedTable), comment, items: cart })
      })
      const order = await res.json()
      setOpenOrders(prev => [...prev, order])
      setActiveOrder(order)
      setCart([])
      setComment('')
    } catch (e) { alert('Ошибка: ' + e.message) }
    setLoading(false)
  }

  // Добавить позиции в существующий чек
  async function addToOrder() {
    if (!activeOrder || cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders/${activeOrder.id}/add-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      })
      const order = await res.json()
      setOpenOrders(prev => prev.map(o => o.id === order.id ? order : o))
      setActiveOrder(order)
      setCart([])
    } catch (e) { alert('Ошибка: ' + e.message) }
    setLoading(false)
  }

  // Запросить счёт (OPEN → PENDING)
  async function requestBill() {
    if (!activeOrder) return
    try {
      const res = await fetch(`${API}/orders/${activeOrder.id}/close`, { method: 'PUT' })
      const order = await res.json()
      setOpenOrders(prev => prev.filter(o => o.id !== order.id))
      setPendingOrders(prev => [...prev, order])
      setActiveOrder(order)
    } catch (e) { alert('Ошибка: ' + e.message) }
  }

  // Принять оплату (PENDING → PAID)
  async function payOrder() {
    if (!activeOrder) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders/${activeOrder.id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType })
      })
      const order = await res.json()
      setPendingOrders(prev => prev.filter(o => o.id !== order.id))
      setOpenOrders(prev => prev.filter(o => o.id !== order.id))
      setLastOrder(order)
      await printReceipt(order)
      setActiveOrder(null)
      setCart([])
      setSelectedTable(null)
      loadRecentOrders()
      setAnalytics(null) // сбросить чтобы обновилось при следующем открытии
    } catch (e) { alert('Ошибка: ' + e.message) }
    setLoading(false)
  }

  // Прямая продажа (без стола)
  async function directSale() {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: '', comment, items: cart, paymentType })
      })
      const order = await res.json()
      setLastOrder(order)
      await printReceipt(order)
      setCart([])
      setComment('')
      setAnalytics(null)
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
      setOpenOrders(prev => prev.filter(o => o.id !== order.id))
      setLastOrder(accepted)
      await printReceipt(accepted)
      if (activeOrder?.id === order.id) { setActiveOrder(null); setCart([]) }
    } catch (e) { alert('Ошибка: ' + e.message) }
    setAcceptingId(null)
  }

  async function cancelOrder(id) {
    await fetch(`${API}/orders/${id}/cancel`, { method: 'PUT' })
    setPendingOrders(prev => prev.filter(o => o.id !== id))
    setOpenOrders(prev => prev.filter(o => o.id !== id))
    if (activeOrder?.id === id) { setActiveOrder(null); setCart([]) }
  }

  const tableStatus = selectedTable ? getTableStatus(selectedTable) : null

  return (
    <div className="cashier-wrap">
      {/* Tabs */}
      <div className="cashier-tabs">
        <button className={activeTab === 'tables' ? 'active' : ''} onClick={() => setActiveTab('tables')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          Зал
        </button>
        <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          От официантов
          {pendingOrders.filter(o => !openOrders.find(oo => oo.id === o.id)).length > 0 &&
            <span className="badge-count">{pendingOrders.length}</span>}
        </button>
        <button className={activeTab === 'direct' ? 'active' : ''} onClick={() => { setActiveTab('direct'); setSelectedTable(null) }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Быстрая продажа
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => { setActiveTab('history'); loadRecentOrders() }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          История чеков
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => { setActiveTab('analytics'); loadAnalytics() }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Аналитика
        </button>
      </div>

      {/* ЗАЛЬНЫЙ ВИД */}
      {activeTab === 'tables' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Схема зала */}
          <div style={{ width: selectedTable ? 340 : '100%', flexShrink: 0, padding: 20, overflowY: 'auto', background: 'var(--bg)', transition: 'width .3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>Схема зала</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                {Object.entries(TABLE_STATUS).filter(([k]) => k !== 'PAID').map(([k, v]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
                    {v.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {TABLES.map(num => {
                const status = getTableStatus(num)
                const s = TABLE_STATUS[status]
                const order = getTableOrder(num)
                const isSelected = selectedTable === num
                return (
                  <div key={num} onClick={() => selectTable(num)}
                    style={{
                      background: isSelected ? s.color : s.bg,
                      border: `2px solid ${isSelected ? s.color : s.border}`,
                      borderRadius: 14,
                      padding: '14px 10px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all .2s',
                      boxShadow: isSelected ? `0 4px 16px ${s.color}40` : 'var(--shadow-sm)',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      position: 'relative'
                    }}>
                    {status === 'PENDING' && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#e67e22', animation: 'pulse 1.5s infinite' }} />
                    )}
                    <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? '#fff' : s.color, marginBottom: 4 }}>{num}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.85)' : s.color }}>
                      {s.label}
                    </div>
                    {order && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#fff' : 'var(--brand)', marginTop: 4 }}>
                        {order.total.toFixed(0)} TMT
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {lastOrder && (
              <div className="last-order" style={{ marginTop: 16 }}>
                <span>✓ Чек #{lastOrder.number} — {lastOrder.total.toFixed(0)} TMT</span>
                <button onClick={() => printReceipt(lastOrder)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Напечатать
                </button>
              </div>
            )}
          </div>

          {/* Панель стола */}
          {selectedTable && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderLeft: '1px solid var(--border)' }}>

              {/* Меню */}
              <div className="menu-panel">
                <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--brand)' }}>
                    Стол {selectedTable}
                    {activeOrder && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}> · Чек #{activeOrder.number}</span>}
                  </span>
                  <button onClick={() => { setSelectedTable(null); setActiveOrder(null); setCart([]) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                <div className="search-bar">
                  <span className="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  </span>
                  <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
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

              {/* Чек стола */}
              <div className="cart-panel">
                <div className="cart-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h2>Чек · Стол {selectedTable}</h2>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: TABLE_STATUS[tableStatus]?.bg, color: TABLE_STATUS[tableStatus]?.color }}>
                      {TABLE_STATUS[tableStatus]?.label}
                    </span>
                  </div>
                </div>

                <div className="cart-items">
                  {/* Уже в чеке */}
                  {activeOrder && activeOrder.items.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, padding: '4px 0', textTransform: 'uppercase' }}>В чеке</div>
                      {activeOrder.items.map(item => (
                        <div key={item.id} className="cart-item" style={{ opacity: 0.8 }}>
                          <span className="cart-name">{item.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 30, textAlign: 'center' }}>×{item.quantity}</span>
                          <span className="cart-sum">{(item.price * item.quantity).toFixed(0)} TMT</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Добавляемые */}
                  {cart.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: 0.5, padding: '8px 0 4px', textTransform: 'uppercase' }}>
                        {activeOrder ? '+ Добавляется' : 'Новые позиции'}
                      </div>
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
                    </>
                  )}

                  {!activeOrder && cart.length === 0 && (
                    <div className="empty-cart">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                      <p>Выберите позиции из меню</p>
                    </div>
                  )}
                </div>

                <div className="cart-footer">
                  {!activeOrder && (
                    <textarea placeholder="Комментарий..." value={comment} onChange={e => setComment(e.target.value)} rows={2} />
                  )}

                  <div className="total-row">
                    <span>Итого:</span>
                    <span className="total-amount">{grandTotal.toFixed(0)} TMT</span>
                  </div>

                  {/* Кнопки в зависимости от статуса */}
                  {tableStatus === 'FREE' && (
                    <button className="submit-btn" onClick={openTable} disabled={cart.length === 0 || loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {loading ? 'Открываем...' : 'Открыть чек'}
                    </button>
                  )}

                  {tableStatus === 'OPEN' && (
                    <>
                      {cart.length > 0 && (
                        <button className="submit-btn" onClick={addToOrder} disabled={loading}
                          style={{ background: 'linear-gradient(135deg, #27ae60, #219a52)', marginBottom: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          {loading ? '...' : 'Добавить в чек'}
                        </button>
                      )}
                      <button className="submit-btn" onClick={requestBill}
                        style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Гость просит счёт
                      </button>
                    </>
                  )}

                  {tableStatus === 'PENDING' && (
                    <>
                      <div className="payment-row">
                        <button className={paymentType === 'CASH' ? 'pay-btn active' : 'pay-btn'} onClick={() => setPaymentType('CASH')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                          Наличные
                        </button>
                        <button className={paymentType === 'CARD' ? 'pay-btn active' : 'pay-btn'} onClick={() => setPaymentType('CARD')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          Карта
                        </button>
                      </div>
                      <button className="submit-btn" onClick={payOrder} disabled={loading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {loading ? 'Оформляем...' : `Принять оплату · ${grandTotal.toFixed(0)} TMT`}
                      </button>
                    </>
                  )}

                  <button className="clear-btn" onClick={() => { setCart([]); if (tableStatus === 'FREE') setComment('') }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    {activeOrder ? 'Очистить добавляемое' : 'Очистить'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ОЧЕРЕДЬ ОТ ОФИЦИАНТОВ */}
      {activeTab === 'queue' && (
        <div className="queue-panel">
          {pendingOrders.length === 0 && (
            <div className="queue-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p>Нет заказов от официантов</p>
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
                {order.items.map((item, i) => <span key={i} className="pending-item">{item.name} ×{item.quantity}</span>)}
              </div>
              {order.comment && <p className="pending-comment">💬 {order.comment}</p>}
              <div className="pending-actions">
                <div className="payment-row" style={{ flex: 1 }}>
                  <button className={(acceptPayment[order.id] || 'CASH') === 'CASH' ? 'pay-btn active' : 'pay-btn'}
                    onClick={() => setAcceptPayment(p => ({ ...p, [order.id]: 'CASH' }))}>
                    Наличные
                  </button>
                  <button className={(acceptPayment[order.id] || 'CASH') === 'CARD' ? 'pay-btn active' : 'pay-btn'}
                    onClick={() => setAcceptPayment(p => ({ ...p, [order.id]: 'CARD' }))}>
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

      {/* ИСТОРИЯ ЧЕКОВ */}
      {activeTab === 'history' && (
        <div style={{ flex:1, overflow:'auto', padding:20, background:'var(--bg)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--brand)' }}>История чеков</div>
            <button onClick={loadRecentOrders}
              style={{ background:'none', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
              ↻ Обновить
            </button>
          </div>
          {recentOrders.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Нет чеков</div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {recentOrders.map(order => (
              <div key={order.id} style={{ background:'var(--surface)', borderRadius:14, padding:'14px 18px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--brand)', minWidth:50 }}>#{order.number}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                  {new Date(order.createdAt).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </span>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>Стол {order.tableNumber || '—'}</span>
                {order.waiterName && <span style={{ fontSize:13, color:'var(--text-muted)' }}>{order.waiterName}</span>}
                <div style={{ flex:1, fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {(order.items||[]).map(i=>`${i.name} ×${i.quantity}`).join(' · ')}
                </div>
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:600,
                  background: order.status==='PAID' ? 'var(--green-light)' : 'var(--red-light)',
                  color: order.status==='PAID' ? 'var(--green)' : 'var(--red)' }}>
                  {order.status==='PAID' ? 'Оплачен' : 'Отменён'}
                </span>
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, fontWeight:600,
                  background: order.paymentType==='CARD' ? 'var(--blue-light)' : 'var(--green-light)',
                  color: order.paymentType==='CARD' ? 'var(--blue)' : 'var(--green)' }}>
                  {order.paymentType==='CARD' ? 'Карта' : 'Наличные'}
                </span>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--brand)' }}>{order.total?.toFixed(0)} TMT</span>
                {order.status==='PAID' && (
                  <button onClick={() => printReceipt(order)}
                    style={{ background:'var(--brand)', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Печать
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* БЫСТРАЯ ПРОДАЖА */}
      {activeTab === 'direct' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div className="menu-panel">
            <div className="search-bar">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input placeholder="Поиск блюда..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <h2>Быстрая продажа</h2>
            </div>
            <div className="cart-items">
              {cart.length === 0 && (
                <div className="empty-cart">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                  Наличные
                </button>
                <button className={paymentType === 'CARD' ? 'pay-btn active' : 'pay-btn'} onClick={() => setPaymentType('CARD')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Карта
                </button>
              </div>
              <div className="total-row">
                <span>Итого:</span>
                <span className="total-amount">{cartTotal.toFixed(0)} TMT</span>
              </div>
              <button className="submit-btn" onClick={directSale} disabled={cart.length === 0 || loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {loading ? 'Оформляем...' : 'Принять и распечатать'}
              </button>
              {cart.length > 0 && (
                <button className="clear-btn" onClick={() => setCart([])}>Очистить</button>
              )}
            </div>
            {lastOrder && (
              <div className="last-order" style={{ margin: '0 14px 14px' }}>
                <span>✓ Чек #{lastOrder.number} — {lastOrder.total.toFixed(0)} TMT</span>
                <button onClick={() => printReceipt(lastOrder)}>Напечатать</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* АНАЛИТИКА */}
      {activeTab === 'analytics' && (
        <div style={{ flex:1, overflow:'auto', padding:20, background:'var(--bg)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--brand)' }}>Аналитика за сегодня</div>
            <button onClick={loadAnalytics} style={{ background:'none', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>↻ Обновить</button>
          </div>

          {analyticsLoading && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Загрузка...</div>}

          {!analyticsLoading && !analytics && (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Нет данных</div>
          )}

          {!analyticsLoading && analytics && (() => {
            const fmt = n => Number(n||0).toLocaleString('ru-RU', { maximumFractionDigits:0 })
            const maxHour = Math.max(...Object.values(analytics.hourMap || {}), 1)
            return (
              <>
                {/* Основные показатели */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
                  {[
                    { label:'Выручка', value:`${fmt(analytics.totalRevenue)} TMT`, color:'#27ae60', bg:'#eafaf1' },
                    { label:'Наличные', value:`${fmt(analytics.cashTotal)} TMT`, color:'#2980b9', bg:'#eaf4fb' },
                    { label:'Карта', value:`${fmt(analytics.cardTotal)} TMT`, color:'#8e44ad', bg:'#f5eef8' },
                    { label:'Чеков', value:analytics.orderCount, color:'#e67e22', bg:'#fef9e7' },
                    { label:'Средний чек', value:`${fmt(analytics.avgCheck)} TMT`, color:'#c0392b', bg:'#fdedec' },
                    { label:'Расходы', value:`${fmt(analytics.totalExpenses)} TMT`, color:'#e74c3c', bg:'#fff0f0' },
                    { label:'Прибыль', value:`${fmt(analytics.profit)} TMT`, color: analytics.profit >= 0 ? '#27ae60' : '#e74c3c', bg: analytics.profit >= 0 ? '#eafaf1' : '#fff0f0' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background:'var(--surface)', borderRadius:14, padding:'16px 18px', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:20, fontWeight:800, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* График по часам */}
                {Object.keys(analytics.hourMap).length > 0 && (
                  <div style={{ background:'var(--surface)', borderRadius:14, padding:20, border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', marginBottom:20 }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'var(--brand)' }}>Выручка по часам</div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100 }}>
                      {Array.from({ length:24 }, (_, h) => {
                        const val = analytics.hourMap[h] || 0
                        const height = val ? Math.max(8, (val / maxHour) * 90) : 4
                        return (
                          <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                            <div title={`${h}:00 — ${fmt(val)} TMT`} style={{ width:'100%', height, background: val ? 'var(--brand)' : '#eee', borderRadius:'4px 4px 0 0', transition:'height .3s', cursor:'default', opacity: val ? 1 : 0.4 }} />
                            {h % 3 === 0 && <span style={{ fontSize:9, color:'var(--text-muted)' }}>{h}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Топ блюд */}
                {analytics.topItems.length > 0 && (
                  <div style={{ background:'var(--surface)', borderRadius:14, padding:20, border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:'var(--brand)' }}>Топ блюд за сегодня</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {analytics.topItems.map((item, i) => (
                        <div key={item.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ width:22, height:22, borderRadius:'50%', background: i < 3 ? 'var(--brand)' : '#eee', color: i < 3 ? '#fff' : '#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                          <span style={{ flex:1, fontSize:13, fontWeight:500, color:'var(--text)' }}>{item.name}</span>
                          <span style={{ fontSize:13, color:'var(--text-muted)' }}>×{item.qty}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--brand)' }}>{fmt(item.total)} TMT</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}


    </div>
  )
}
