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
                <button className="del-btn" onClick={() => deleteCategory(c.id)}>✕</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add item */}
        <div className="mgmt-section">
          <h2>Добавить позицию</h2>
          <div className="form-col">
            <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Название" />
            <input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="Цена (₽)" />
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
            <tr key={item.id} style={{ opacity: item.active ? 1 : 0.4 }}>
              {editItem?.id === item.id ? (
                <>
                  <td><input value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} /></td>
                  <td>
                    <select value={editItem.categoryId} onChange={e => setEditItem(p => ({ ...p, categoryId: Number(e.target.value) }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={editItem.price} onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))} style={{ width: 80 }} /></td>
                  <td>—</td>
                  <td>
                    <button onClick={saveEdit}>💾</button>
                    <button onClick={() => setEditItem(null)}>✕</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{item.name}</td>
                  <td>{item.category?.name}</td>
                  <td>{item.price} ₽</td>
                  <td>{item.active ? '✅ Активно' : '🔴 Скрыто'}</td>
                  <td>
                    <button onClick={() => setEditItem({ ...item })}>✏️</button>
                    <button onClick={() => toggleItem(item)}>{item.active ? '🙈' : '👁'}</button>
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
