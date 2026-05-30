import React, { useState, useEffect } from 'react'

export default function OrderPage({ waiter, onLogout }) {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [comment, setComment] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  const [view, setView] = useState('menu') // 'menu' | 'cart'

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        setCategories(data)
        if (data.length > 0) setActiveCategory(data[0].id)
      })
  }, [])

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

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  async function sendOrder() {
    if (!cart.length || !tableNumber.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          comment,
          items: cart,
          waiterId: waiter.id,
          waiterName: waiter.name
        })
      })
      const order = await res.json()
      setSent(order)
      setCart([])
      setTableNumber('')
      setComment('')
      setView('menu')
    } catch (e) {
      alert('Ошибка отправки: ' + e.message)
    }
    setSending(false)
  }

  return (
    <div className="waiter-app">
      {/* Header */}
      <div className="waiter-header">
        <div className="waiter-name">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {waiter.name}
        </div>
        <button className="logout-btn" onClick={onLogout}>Выйти</button>
      </div>

      {/* Success toast */}
      {sent && (
        <div className="sent-toast" onClick={() => setSent(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Заказ #{sent.number} отправлен на кассу! (стол {sent.tableNumber})
        </div>
      )}

      {/* Tab bar */}
      <div className="waiter-tabs">
        <button className={view === 'menu' ? 'active' : ''} onClick={() => setView('menu')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          Меню
        </button>
        <button className={view === 'cart' ? 'active' : ''} onClick={() => setView('cart')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Заказ
          {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
        </button>
      </div>

      {/* MENU VIEW */}
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
              Перейти к заказу · {total.toFixed(0)} TMT
            </button>
          )}
        </div>
      )}

      {/* CART VIEW */}
      {view === 'cart' && (
        <div className="waiter-cart">
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
            {cart.length === 0 && (
              <div className="w-empty">Заказ пуст — добавьте позиции из меню</div>
            )}
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
            placeholder="Комментарий к заказу (аллергии, пожелания...)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />

          <div className="w-total">
            <span>Итого:</span>
            <strong>{total.toFixed(0)} TMT</strong>
          </div>

          <button
            className="w-send-btn"
            onClick={sendOrder}
            disabled={!cart.length || !tableNumber.trim() || sending}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {sending ? 'Отправляем...' : 'Отправить заказ на кассу'}
          </button>
          {!tableNumber.trim() && cart.length > 0 && (
            <p className="w-hint">Укажите номер стола чтобы отправить</p>
          )}
        </div>
      )}
    </div>
  )
}
