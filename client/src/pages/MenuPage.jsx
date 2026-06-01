import React, { useState, useEffect } from 'react'

const API = '/api'

const Icon = {
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Menu: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
}

const s = {
  page: { padding: 28, maxWidth: 1100, margin: '0 auto', overflowY: 'auto', height: 'calc(100vh - 56px)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 10 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 },
  card: { background: '#fff', borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' },
  cardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 13px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', transition: 'border-color .2s', color: 'var(--text)' },
  select: { border: '1.5px solid var(--border)', borderRadius: 10, padding: '9px 13px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', background: '#fff', color: 'var(--text)' },
  btn: { background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .2s' },
  iconBtn: { background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginRight: 4, transition: 'all .15s', color: 'var(--text-muted)' },
  catItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', marginBottom: 6, fontSize: 14, fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' },
  th: { background: 'var(--bg)', padding: '11px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 },
  td: { padding: '11px 16px', borderTop: '1px solid var(--border)', fontSize: 14, verticalAlign: 'middle' },
}

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [newCat, setNewCat] = useState('')
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryId: '' })
  const [editItem, setEditItem] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

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
    setNewCat(''); load()
  }

  async function deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return
    await fetch(`${API}/categories/${id}`, { method: 'DELETE' }); load()
  }

  async function addItem() {
    if (!newItem.name || !newItem.price) return
    await fetch(`${API}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) })
    setNewItem(p => ({ ...p, name: '', price: '' })); load()
  }

  async function saveEdit() {
    await fetch(`${API}/items/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) })
    setEditItem(null); load()
  }

  async function toggleItem(item) {
    await fetch(`${API}/items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, active: !item.active }) })
    load()
  }

  const filteredItems = filterCat === 'all' ? items : items.filter(i => i.categoryId === Number(filterCat))
  const activeCount = items.filter(i => i.active).length

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>
          <Icon.Menu />
          Управление меню
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '5px 12px', borderRadius: 20, fontWeight: 600 }}>
            {activeCount} активных
          </span>
          <span style={{ background: 'var(--bg)', padding: '5px 12px', borderRadius: 20, fontWeight: 600 }}>
            {categories.length} категорий
          </span>
        </div>
      </div>

      <div style={s.grid}>
        {/* Категории */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <Icon.Tag />
            Категории
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input style={s.input} value={newCat} onChange={e => setNewCat(e.target.value)}
              placeholder="Название категории" onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button style={s.btn} onClick={addCategory}><Icon.Plus /> Добавить</button>
          </div>
          <div>
            {categories.map(c => (
              <div key={c.id} style={s.catItem}>
                <span>{c.name}</span>
                <button style={{ ...s.iconBtn, color: 'var(--red)' }} onClick={() => deleteCategory(c.id)}>
                  <Icon.Trash />
                </button>
              </div>
            ))}
            {categories.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 20, fontSize: 13 }}>Нет категорий</div>}
          </div>
        </div>

        {/* Добавить позицию */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <Icon.Plus />
            Добавить позицию
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={s.input} value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Название блюда" />
            <div style={{ position: 'relative' }}>
              <input style={{ ...s.input, paddingRight: 50 }} type="number" value={newItem.price}
                onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="Цена" />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none' }}>TMT</span>
            </div>
            <select style={s.select} value={newItem.categoryId} onChange={e => setNewItem(p => ({ ...p, categoryId: Number(e.target.value) }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button style={{ ...s.btn, justifyContent: 'center', padding: 12 }} onClick={addItem}>
              <Icon.Plus /> Добавить позицию
            </button>
          </div>
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCat('all')}
          style={{ border: `1.5px solid ${filterCat === 'all' ? 'var(--brand)' : 'var(--border)'}`, background: filterCat === 'all' ? 'var(--brand)' : '#fff', color: filterCat === 'all' ? '#fff' : 'var(--text-muted)', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
          Все
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilterCat(String(c.id))}
            style={{ border: `1.5px solid ${filterCat === String(c.id) ? 'var(--brand)' : 'var(--border)'}`, background: filterCat === String(c.id) ? 'var(--brand)' : '#fff', color: filterCat === String(c.id) ? '#fff' : 'var(--text-muted)', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Таблица позиций */}
      <table style={s.table}>
        <thead>
          <tr>
            {['Название', 'Категория', 'Цена', 'Статус', 'Действия'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(item => (
            <tr key={item.id} style={{ opacity: item.active ? 1 : 0.5, transition: 'opacity .2s' }}>
              {editItem?.id === item.id ? (
                <>
                  <td style={s.td}><input style={{ ...s.input, padding: '7px 10px' }} value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} /></td>
                  <td style={s.td}>
                    <select style={{ ...s.select, padding: '7px 10px' }} value={editItem.categoryId} onChange={e => setEditItem(p => ({ ...p, categoryId: Number(e.target.value) }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <input style={{ ...s.input, width: 100, padding: '7px 40px 7px 10px' }} type="number" value={editItem.price} onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))} />
                      <span style={{ position: 'absolute', right: 10, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>TMT</span>
                    </div>
                  </td>
                  <td style={s.td}>—</td>
                  <td style={s.td}>
                    <button style={{ ...s.iconBtn, color: 'var(--green)', borderColor: '#b7e4c7' }} onClick={saveEdit}><Icon.Check /></button>
                    <button style={s.iconBtn} onClick={() => setEditItem(null)}><Icon.X /></button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ ...s.td, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)' }}>{item.category?.name}</td>
                  <td style={{ ...s.td, fontWeight: 700, color: 'var(--accent)' }}>{item.price} TMT</td>
                  <td style={s.td}>
                    {item.active
                      ? <span style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Активно</span>
                      : <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Скрыто</span>}
                  </td>
                  <td style={s.td}>
                    <button style={s.iconBtn} onClick={() => setEditItem({ ...item })} title="Редактировать"><Icon.Edit /></button>
                    <button style={{ ...s.iconBtn, color: item.active ? 'var(--text-muted)' : 'var(--green)' }} onClick={() => toggleItem(item)} title={item.active ? 'Скрыть' : 'Показать'}>
                      {item.active ? <Icon.EyeOff /> : <Icon.Eye />}
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 32, fontSize: 14 }}>Позиций нет</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
