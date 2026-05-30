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
          <input
            type="text"
            placeholder="🔍 Поиск блюда..."
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
              <span className="item-price">{item.price} ₽</span>
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
          {cart.length === 0 && <p className="empty-cart">Выберите позиции из меню</p>}
          {cart.map(item => (
            <div key={item.itemId} className="cart-item">
              <span className="cart-name">{item.name}</span>
              <div className="cart-controls">
                <button onClick={() => removeFromCart(item.itemId)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => addToCart({ id: item.itemId, name: item.name, price: item.price })}>+</button>
              </div>
              <span className="cart-sum">{(item.price * item.quantity).toFixed(0)} ₽</span>
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
            >💵 Наличные</button>
            <button
              className={paymentType === 'CARD' ? 'pay-btn active' : 'pay-btn'}
              onClick={() => setPaymentType('CARD')}
            >💳 Карта</button>
          </div>

          <div className="total-row">
            <span>Итого:</span>
            <span className="total-amount">{total.toFixed(0)} ₽</span>
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Оформляем...' : '✅ Принять и распечатать чек'}
          </button>

          {cart.length > 0 && (
            <button className="clear-btn" onClick={clearCart}>🗑 Очистить</button>
          )}
        </div>

        {lastOrder && (
          <div className="last-order">
            ✓ Заказ #{lastOrder.number} оформлен — {lastOrder.total.toFixed(0)} ₽
            <button onClick={() => printReceipt(lastOrder)}>🖨 Напечатать снова</button>
          </div>
        )}
      </div>
    </div>
  )
}
