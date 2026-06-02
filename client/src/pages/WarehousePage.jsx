import React, { useState, useEffect } from 'react'

const API = '/api'
function fmt(n) { return Number(n||0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' }) }

const Icon = {
  Warehouse: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Arrival: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Writeoff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Inventory: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  Products: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
}

const TAB_STYLE = (active) => ({
  border: 'none', background: 'none', padding: '14px 18px', fontSize: 13.5,
  fontWeight: active ? 700 : 400, color: active ? '#1a1a2e' : '#888',
  borderBottom: `2px solid ${active ? '#c9a96e' : 'transparent'}`,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
  whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .2s'
})

const INPUT = { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '9px 13px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const BTN = (color='#1a1a2e') => ({ background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap' })
const CARD = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }

function Loader() { return <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Загрузка...</div> }
function Empty({ text }) { return <div style={{ textAlign:'center', padding:40, color:'#aaa', ...CARD }}>{text}</div> }

export default function WarehousePage() {
  const [tab, setTab] = useState('products')

  const tabs = [
    { key: 'products', label: 'Товары', icon: <Icon.Products /> },
    { key: 'arrivals', label: 'Поступления', icon: <Icon.Arrival /> },
    { key: 'writeoffs', label: 'Списания', icon: <Icon.Writeoff /> },
    { key: 'inventory', label: 'Инвентаризация', icon: <Icon.Inventory /> },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', padding:'0 24px', display:'flex', overflowX:'auto', flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.key} style={TAB_STYLE(tab===t.key)} onClick={() => setTab(t.key)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'auto', background:'#f0f2f5' }}>
        {tab === 'products'   && <Products />}
        {tab === 'arrivals'   && <Arrivals />}
        {tab === 'writeoffs'  && <Writeoffs />}
        {tab === 'inventory'  && <InventoryTab />}
      </div>
    </div>
  )
}

// ─── ТОВАРЫ ───────────────────────────────────────────────────
function Products() {
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', unit:'кг', costPrice:'', minStock:'', warehouseId:'' })
  const [editId, setEditId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [p, w] = await Promise.all([
      fetch(`${API}/stock/products`).then(r=>r.json()),
      fetch(`${API}/warehouses`).then(r=>r.json())
    ])
    setProducts(p); setWarehouses(w)
    if (w.length && !form.warehouseId) setForm(f => ({...f, warehouseId: w[0].id}))
    setLoading(false)
  }

  async function save() {
    if (!form.name) return
    const data = { ...form, costPrice: parseFloat(form.costPrice||0), minStock: parseFloat(form.minStock||0), warehouseId: Number(form.warehouseId)||null }
    if (editId) {
      await fetch(`${API}/stock/products/${editId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    } else {
      await fetch(`${API}/stock/products`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    }
    setForm({ name:'', unit:'кг', costPrice:'', minStock:'', warehouseId: warehouses[0]?.id||'' })
    setShowForm(false); setEditId(null); load()
  }

  async function del(id) {
    if (!confirm('Удалить товар?')) return
    await fetch(`${API}/stock/products/${id}`, { method:'DELETE' }); load()
  }

  const lowStock = products.filter(p => p.minStock > 0 && p.currentStock < p.minStock)

  return (
    <div style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', display:'flex', alignItems:'center', gap:10 }}>
          <Icon.Products /> Товары на складе
        </div>
        <button style={BTN()} onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name:'', unit:'кг', costPrice:'', minStock:'', warehouseId: warehouses[0]?.id||'' }) }}>
          <Icon.Plus /> Добавить товар
        </button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ ...CARD, borderLeft:'4px solid #e74c3c', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <Icon.Alert />
          <span style={{ fontSize:13, color:'#c0392b', fontWeight:600 }}>Заканчивается: {lowStock.map(p=>p.name).join(', ')}</span>
        </div>
      )}

      {showForm && (
        <div style={{ ...CARD, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14, fontSize:14, color:'#1a1a2e' }}>{editId ? 'Редактировать' : 'Новый товар'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <input style={INPUT} placeholder="Название *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <select style={INPUT} value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})}>
              {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select style={INPUT} value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>
              {['кг','г','л','мл','шт','порция','бутылка','упаковка'].map(u=><option key={u}>{u}</option>)}
            </select>
            <input style={INPUT} type="number" placeholder="Цена закупки (TMT)" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})} />
            <input style={INPUT} type="number" placeholder="Мин. остаток" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={BTN('#27ae60')} onClick={save}>{editId ? 'Сохранить' : 'Добавить'}</button>
            <button style={{ ...BTN('#888') }} onClick={() => { setShowForm(false); setEditId(null) }}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e8e8e8' }}>
          <thead>
            <tr>
              {['Название','Склад','Ед.','Остаток','Мин.','Цена закупки','Статус',''].map(h=>(
                <th key={h} style={{ background:'#f8f9fa', padding:'11px 16px', textAlign:'left', fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const low = p.minStock > 0 && p.currentStock < p.minStock
              return (
                <tr key={p.id} style={{ borderTop:'1px solid #f0f0f0' }}>
                  <td style={{ padding:'12px 16px', fontWeight:600 }}>{p.name}</td>
                  <td style={{ padding:'12px 16px', color:'#888', fontSize:13 }}>{p.warehouse?.name||'—'}</td>
                  <td style={{ padding:'12px 16px', color:'#888' }}>{p.unit}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color: low?'#e74c3c':'#1a1a2e' }}>{fmt(p.currentStock)}</td>
                  <td style={{ padding:'12px 16px', color:'#aaa' }}>{p.minStock||'—'}</td>
                  <td style={{ padding:'12px 16px', color:'#c9a96e', fontWeight:600 }}>{p.costPrice>0?`${fmt(p.costPrice)} TMT`:'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    {low
                      ? <span style={{ background:'#fdf0ef', color:'#e74c3c', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>Мало</span>
                      : <span style={{ background:'#eafaf1', color:'#27ae60', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>OK</span>}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button style={{ background:'none', border:'1.5px solid #e8e8e8', borderRadius:8, padding:'5px 8px', cursor:'pointer', color:'#888', marginRight:6 }}
                      onClick={() => { setEditId(p.id); setForm({ name:p.name, unit:p.unit, costPrice:p.costPrice, minStock:p.minStock, warehouseId:p.warehouseId||'' }); setShowForm(true) }}>
                      <Icon.Edit />
                    </button>
                    <button style={{ background:'none', border:'1.5px solid #fbd5d5', borderRadius:8, padding:'5px 8px', cursor:'pointer', color:'#e74c3c' }} onClick={()=>del(p.id)}>
                      <Icon.Trash />
                    </button>
                  </td>
                </tr>
              )
            })}
            {products.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:32 }}>Товаров нет</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── ПОСТУПЛЕНИЯ ──────────────────────────────────────────────
function Arrivals() {
  const [arrivals, setArrivals] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplierId:'', invoiceNum:'', notes:'', createdBy:'' })
  const [items, setItems] = useState([{ productId:'', quantity:'', price:'' }])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [a, p, s] = await Promise.all([
      fetch(`${API}/stock/arrivals`).then(r=>r.json()),
      fetch(`${API}/stock/products`).then(r=>r.json()),
      fetch(`${API}/stock/suppliers`).then(r=>r.json()),
    ])
    setArrivals(a); setProducts(p); setSuppliers(s); setLoading(false)
  }

  function addItem() { setItems([...items, { productId:'', quantity:'', price:'' }]) }
  function removeItem(i) { setItems(items.filter((_,idx)=>idx!==i)) }
  function updateItem(i, field, val) { setItems(items.map((item,idx)=>idx===i?{...item,[field]:val}:item)) }

  async function save() {
    const validItems = items.filter(i=>i.productId&&i.quantity)
    if (!validItems.length) return
    await fetch(`${API}/stock/arrivals`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, supplierId: form.supplierId?Number(form.supplierId):null, items: validItems.map(i=>({ productId:Number(i.productId), quantity:parseFloat(i.quantity), price:parseFloat(i.price||0) })) })
    })
    setShowForm(false); setForm({ supplierId:'', invoiceNum:'', notes:'', createdBy:'' }); setItems([{ productId:'', quantity:'', price:'' }]); load()
  }

  const total = items.reduce((s,i)=>{
    const qty = parseFloat(i.quantity||0), price = parseFloat(i.price||0)
    return s + qty * price
  }, 0)

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', display:'flex', alignItems:'center', gap:10 }}><Icon.Arrival /> Поступления товаров</div>
        <button style={BTN('#27ae60')} onClick={()=>setShowForm(!showForm)}><Icon.Plus /> Новое поступление</button>
      </div>

      {showForm && (
        <div style={{ ...CARD, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Новое поступление</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            <select style={INPUT} value={form.supplierId} onChange={e=>setForm({...form,supplierId:e.target.value})}>
              <option value="">Поставщик (необязательно)</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input style={INPUT} placeholder="№ накладной" value={form.invoiceNum} onChange={e=>setForm({...form,invoiceNum:e.target.value})} />
            <input style={INPUT} placeholder="Принял (имя)" value={form.createdBy} onChange={e=>setForm({...form,createdBy:e.target.value})} />
          </div>

          <div style={{ fontWeight:600, fontSize:13, color:'#888', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Позиции</div>
          {items.map((item, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px 36px', gap:8, marginBottom:8 }}>
              <select style={INPUT} value={item.productId} onChange={e=>updateItem(i,'productId',e.target.value)}>
                <option value="">Выберите товар</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
              <input style={INPUT} type="number" placeholder="Кол-во" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} />
              <input style={INPUT} type="number" placeholder="Цена/ед." value={item.price} onChange={e=>updateItem(i,'price',e.target.value)} />
              <button style={{ background:'none', border:'1.5px solid #fbd5d5', borderRadius:8, cursor:'pointer', color:'#e74c3c', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>removeItem(i)}>×</button>
            </div>
          ))}
          <button style={{ ...BTN('#888'), marginBottom:14, fontSize:12 }} onClick={addItem}><Icon.Plus /> Добавить строку</button>

          {total > 0 && <div style={{ fontWeight:700, color:'#1a1a2e', marginBottom:14 }}>Итого: {fmt(total)} TMT</div>}

          <textarea style={{ ...INPUT, resize:'none', marginBottom:12 }} rows={2} placeholder="Примечание" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <div style={{ display:'flex', gap:10 }}>
            <button style={BTN('#27ae60')} onClick={save}>Сохранить поступление</button>
            <button style={BTN('#888')} onClick={()=>setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : arrivals.length===0 ? <Empty text="Поступлений нет" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {arrivals.map(a => (
            <div key={a.id} style={CARD}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:15 }}>{fmtDate(a.date)}</span>
                  {a.invoiceNum && <span style={{ color:'#888', fontSize:13, marginLeft:10 }}>№{a.invoiceNum}</span>}
                  {a.supplier && <span style={{ color:'#888', fontSize:13, marginLeft:10 }}>· {a.supplier.name}</span>}
                  {a.createdBy && <span style={{ color:'#aaa', fontSize:12, marginLeft:10 }}>· {a.createdBy}</span>}
                </div>
                <span style={{ fontWeight:700, color:'#27ae60', fontSize:16 }}>{fmt(a.totalAmount)} TMT</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(a.items||[]).map((item,i) => (
                  <span key={i} style={{ background:'#f0f2f5', padding:'4px 10px', borderRadius:20, fontSize:12 }}>
                    {item.product?.name||item.productId} — {item.quantity} {item.product?.unit||''} × {item.price} TMT
                  </span>
                ))}
              </div>
              {a.notes && <div style={{ fontSize:12, color:'#888', marginTop:8 }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── СПИСАНИЯ ─────────────────────────────────────────────────
function Writeoffs() {
  const [writeoffs, setWriteoffs] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reason:'', notes:'', createdBy:'' })
  const [items, setItems] = useState([{ productId:'', quantity:'', reason:'' }])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [w, p] = await Promise.all([
      fetch(`${API}/stock/writeoffs`).then(r=>r.json()),
      fetch(`${API}/stock/products`).then(r=>r.json()),
    ])
    setWriteoffs(w); setProducts(p); setLoading(false)
  }

  function addItem() { setItems([...items, { productId:'', quantity:'', reason:'' }]) }
  function removeItem(i) { setItems(items.filter((_,idx)=>idx!==i)) }
  function updateItem(i, field, val) { setItems(items.map((item,idx)=>idx===i?{...item,[field]:val}:item)) }

  async function save() {
    const validItems = items.filter(i=>i.productId&&i.quantity)
    if (!validItems.length) return
    await fetch(`${API}/stock/writeoffs`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, items: validItems.map(i=>({ productId:Number(i.productId), quantity:parseFloat(i.quantity), reason:i.reason })) })
    })
    setShowForm(false); setForm({ reason:'', notes:'', createdBy:'' }); setItems([{ productId:'', quantity:'', reason:'' }]); load()
  }

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', display:'flex', alignItems:'center', gap:10 }}><Icon.Writeoff /> Списания</div>
        <button style={BTN('#e74c3c')} onClick={()=>setShowForm(!showForm)}><Icon.Plus /> Новое списание</button>
      </div>

      {showForm && (
        <div style={{ ...CARD, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Новое списание</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <input style={INPUT} placeholder="Причина списания" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} />
            <input style={INPUT} placeholder="Кто списывает" value={form.createdBy} onChange={e=>setForm({...form,createdBy:e.target.value})} />
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px 1fr 36px', gap:8, marginBottom:8 }}>
              <select style={INPUT} value={item.productId} onChange={e=>updateItem(i,'productId',e.target.value)}>
                <option value="">Выберите товар</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.unit}) — {fmt(p.currentStock)}</option>)}
              </select>
              <input style={INPUT} type="number" placeholder="Кол-во" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} />
              <input style={INPUT} placeholder="Причина (необяз.)" value={item.reason} onChange={e=>updateItem(i,'reason',e.target.value)} />
              <button style={{ background:'none', border:'1.5px solid #fbd5d5', borderRadius:8, cursor:'pointer', color:'#e74c3c', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>removeItem(i)}>×</button>
            </div>
          ))}
          <button style={{ ...BTN('#888'), marginBottom:14, fontSize:12 }} onClick={addItem}><Icon.Plus /> Добавить строку</button>
          <textarea style={{ ...INPUT, resize:'none', marginBottom:12 }} rows={2} placeholder="Примечание" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <div style={{ display:'flex', gap:10 }}>
            <button style={BTN('#e74c3c')} onClick={save}>Сохранить списание</button>
            <button style={BTN('#888')} onClick={()=>setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : writeoffs.length===0 ? <Empty text="Списаний нет" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {writeoffs.map(w => (
            <div key={w.id} style={CARD}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <span style={{ fontWeight:700 }}>{fmtDate(w.date)}</span>
                  {w.reason && <span style={{ color:'#888', fontSize:13, marginLeft:10 }}>· {w.reason}</span>}
                  {w.createdBy && <span style={{ color:'#aaa', fontSize:12, marginLeft:10 }}>· {w.createdBy}</span>}
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(w.items||[]).map((item,i) => (
                  <span key={i} style={{ background:'#fdf0ef', color:'#e74c3c', padding:'4px 10px', borderRadius:20, fontSize:12 }}>
                    {item.product?.name} — {item.quantity} {item.product?.unit}
                    {item.reason&&` (${item.reason})`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ИНВЕНТАРИЗАЦИЯ ───────────────────────────────────────────
function InventoryTab() {
  const [inventories, setInventories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ notes:'', createdBy:'' })
  const [items, setItems] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [inv, p] = await Promise.all([
      fetch(`${API}/stock/inventories`).then(r=>r.json()),
      fetch(`${API}/stock/products`).then(r=>r.json()),
    ])
    setInventories(inv); setProducts(p)
    setItems(p.map(p=>({ productId:p.id, name:p.name, unit:p.unit, expected:p.currentStock, actual:'' })))
    setLoading(false)
  }

  async function save() {
    const validItems = items.filter(i=>i.actual!=='')
    if (!validItems.length) return
    await fetch(`${API}/stock/inventories`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, items: validItems.map(i=>({ productId:i.productId, expected:i.expected, actual:parseFloat(i.actual), diff:parseFloat(i.actual)-i.expected })) })
    })
    setShowForm(false); load()
  }

  return (
    <div style={{ padding:24, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', display:'flex', alignItems:'center', gap:10 }}><Icon.Inventory /> Инвентаризация</div>
        <button style={BTN('#8e44ad')} onClick={()=>setShowForm(!showForm)}><Icon.Plus /> Новая инвентаризация</button>
      </div>

      {showForm && (
        <div style={{ ...CARD, marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Инвентаризация</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <input style={INPUT} placeholder="Кто проводит" value={form.createdBy} onChange={e=>setForm({...form,createdBy:e.target.value})} />
            <textarea style={{ ...INPUT, resize:'none' }} rows={1} placeholder="Примечание" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:14 }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['Товар','Ед.','По системе','Факт','Разница'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, color:'#888', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const diff = item.actual!=='' ? parseFloat(item.actual) - item.expected : null
                return (
                  <tr key={item.productId} style={{ borderTop:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'8px 12px', fontWeight:500 }}>{item.name}</td>
                    <td style={{ padding:'8px 12px', color:'#888' }}>{item.unit}</td>
                    <td style={{ padding:'8px 12px', color:'#888' }}>{fmt(item.expected)}</td>
                    <td style={{ padding:'4px 12px' }}>
                      <input type="number" placeholder="введите" value={item.actual}
                        onChange={e=>setItems(items.map((it,idx)=>idx===i?{...it,actual:e.target.value}:it))}
                        style={{ border:'1.5px solid #e8e8e8', borderRadius:8, padding:'6px 10px', width:100, fontSize:13, outline:'none', fontFamily:'inherit' }} />
                    </td>
                    <td style={{ padding:'8px 12px', fontWeight:700, color: diff===null?'#aaa':diff<0?'#e74c3c':diff>0?'#f39c12':'#27ae60' }}>
                      {diff===null ? '—' : diff===0 ? 'OK' : `${diff>0?'+':''}${fmt(diff)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display:'flex', gap:10 }}>
            <button style={BTN('#8e44ad')} onClick={save}>Сохранить инвентаризацию</button>
            <button style={BTN('#888')} onClick={()=>setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : inventories.length===0 ? <Empty text="Инвентаризаций нет" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {inventories.map(inv => {
            const diffs = (inv.items||[]).filter(i=>i.diff!==0)
            return (
              <div key={inv.id} style={{ ...CARD, borderLeft:`4px solid ${diffs.length>0?'#e74c3c':'#27ae60'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{fmtDate(inv.date)}</span>
                    {inv.createdBy && <span style={{ color:'#888', fontSize:13, marginLeft:10 }}>· {inv.createdBy}</span>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color: diffs.length>0?'#e74c3c':'#27ae60' }}>
                    {diffs.length>0 ? `${diffs.length} расхождений` : 'Без расхождений'}
                  </span>
                </div>
                {diffs.length>0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {diffs.map((item,i) => (
                      <span key={i} style={{ background: item.diff<0?'#fdf0ef':'#fff8ec', color: item.diff<0?'#e74c3c':'#f39c12', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>
                        {item.product?.name}: {item.diff>0?'+':''}{fmt(item.diff)} {item.product?.unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
