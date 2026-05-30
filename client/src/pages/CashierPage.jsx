import React, { useState, useEffect } from 'react'
import { printReceipt } from '../utils/printer.js'

const API = '/api'

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

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(data => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
  }, [])

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

  function clearCart() {
    setCart([])
    setTableNumber('')
    setComment('')
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  async function handleSubmit() {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, comment, items: cart, paymentType })
      })
      const order = await res.json()
      setLastOrder(order)
      await printReceipt(order)
      clearCart()
    } catch (e) {
      alert('Ошибка при создании заказа: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="cashier">
      {/* LEFT: menu */}
      <div className="menu-panel">
        <div className="search-bar">
          <span className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text"
            placeholder="Поиск блюда..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {!search && (
          <div className="categories">
            {categories.map(c => (
              <button
                key={c.id}
                className={activeCategory === c.id ? 'cat-btn active' : 'cat-btn'}
                onClick={() => setActiveCategory(c.id)}
              >{c.name}</button>
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

      {/* RIGHT: cart */}
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Заказ</h2>
          <div className="table-row">
            <input
              type="text"
              placeholder="Стол / зона"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              className="table-input"
            />
          </div>
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
          <textarea
            placeholder="Комментарий к заказу..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
          />

          <div className="payment-row">
            <button
              className={paymentType === 'CASH' ? 'pay-btn active' : 'pay-btn'}
              onClick={() => setPaymentType('CASH')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              Наличные
            </button>
            <button
              className={paymentType === 'CARD' ? 'pay-btn active' : 'pay-btn'}
              onClick={() => setPaymentType('CARD')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Карта
            </button>
          </div>

          <div className="total-row">
            <span>Итого:</span>
            <span className="total-amount">{total.toFixed(0)} TMT</span>
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={cart.length === 0 || loading}
          >
            {loading ? (
              'Оформляем...'
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Принять и распечатать чек
              </>
            )}
          </button>

          {cart.length > 0 && (
            <button className="clear-btn" onClick={clearCart}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              Очистить
            </button>
          )}
        </div>

        {lastOrder && (
          <div className="last-order">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Заказ #{lastOrder.number} — {lastOrder.total.toFixed(0)} TMT
            </span>
            <button onClick={() => printReceipt(lastOrder)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Напечатать
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
