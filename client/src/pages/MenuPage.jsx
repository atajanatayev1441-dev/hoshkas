import React, { useState, useEffect } from 'react'

const API = '/api'

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [newCat, setNewCat] = useState('')
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: '' })
  const [editItem, setEditItem] = useState(null)

  async function load() {
    const [cats, itms] = await Promise.all([
      fetch(`${API}/categories`).then(r => r.json()),
      fetch(`${API}/items`).then(r => r.json())
    ])
    setCategories(cats)
    setItems(itms)
    if (!newItem.categoryId && cats.length > 0) setNewItem(p => ({ ...p, categoryId: cats[0].id }))
  }

  useEffect(() => { load() }, [])

  async function addCategory() {
    if (!newCat.trim()) return
    await fetch(`${API}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat }) })
    setNewCat('')
    load()
  }

  async function deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return
    await fetch(`${API}/categories/${id}`, { method: 'DELETE' })
    load()
  }

  async function addItem() {
    if (!newItem.name || !newItem.price) return
    await fetch(`${API}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) })
    setNewItem(p => ({ ...p, name: '', price: '' }))
    load()
  }

  async function saveEdit() {
    await fetch(`${API}/items/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) })
    setEditItem(null)
    load()
  }

  async function toggleItem(item) {
    await fetch(`${API}/items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, active: !item.active }) })
    load()
  }

  return (
    <div className="menu-mgmt">
      <h1>Управление меню</h1>

      <div className="mgmt-grid">
        {/* Categories */}
        <div className="mgmt-section">
          <h2>Категории</h2>
          <div className="add-row">
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Название категории" onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button onClick={addCategory}>+ Добавить</button>
          </div>
          <ul className="cat-list">
            {categories.map(c => (
              <li key={c.id}>
                <span>{c.name}</span>
                <button className="del-btn" onClick={() => deleteCategory(c.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add item */}
        <div className="mgmt-section">
          <h2>Добавить позицию</h2>
          <div className="form-col">
            <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Название" />
            <div className="price-input-wrap">
              <input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="Цена" />
              <span className="currency-label">TMT</span>
            </div>
            <select value={newItem.categoryId} onChange={e => setNewItem(p => ({ ...p, categoryId: Number(e.target.value) }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={addItem}>+ Добавить позицию</button>
          </div>
        </div>
      </div>

      {/* Items table */}
      <h2>Все позиции</h2>
      <table className="acc-table">
        <thead><tr><th>Название</th><th>Категория</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ opacity: item.active ? 1 : 0.45 }}>
              {editItem?.id === item.id ? (
                <>
                  <td><input value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} /></td>
                  <td>
                    <select value={editItem.categoryId} onChange={e => setEditItem(p => ({ ...p, categoryId: Number(e.target.value) }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="price-input-wrap">
                      <input type="number" value={editItem.price} onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))} style={{ width: 80 }} />
                      <span className="currency-label">TMT</span>
                    </div>
                  </td>
                  <td>—</td>
                  <td>
                    <button className="icon-btn save" onClick={saveEdit}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button className="icon-btn" onClick={() => setEditItem(null)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{item.name}</td>
                  <td>{item.category?.name}</td>
                  <td>{item.price} TMT</td>
                  <td>
                    {item.active
                      ? <span className="badge-active">Активно</span>
                      : <span className="badge-hidden">Скрыто</span>}
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => setEditItem({ ...item })} title="Редактировать">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn" onClick={() => toggleItem(item)} title={item.active ? 'Скрыть' : 'Показать'}>
                      {item.active
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
