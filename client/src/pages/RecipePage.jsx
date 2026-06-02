import React, { useState, useEffect } from 'react'

const API = '/api'
function fmt(n) { return Number(n||0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) }

const UNITS = ['г','кг','мл','л','шт','порция','ст.л','ч.л','стакан']

const inputSt = { border:'1.5px solid #e8e8e8', borderRadius:10, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' }
const btnSt = (bg='#1a1a2e') => ({ background:bg, color:'#fff', border:'none', borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' })
const thSt = { background:'#f8f9fa', padding:'10px 14px', textAlign:'left', fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }
const tdSt = { padding:'10px 14px', borderTop:'1px solid #f0f0f0', fontSize:13 }

const Icon = {
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Back: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Chart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
}

function Loader() { return <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Загрузка...</div> }

export default function RecipePage() {
  const [view, setView] = useState('list') // list | edit | consumption
  const [editItemId, setEditItemId] = useState(null)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 56px)'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 24px',display:'flex',gap:0,flexShrink:0}}>
        {[
          {key:'list', label:'Калькуляции блюд'},
          {key:'consumption', label:'Расход продуктов'},
        ].map(t=>(
          <button key={t.key} onClick={()=>{setView(t.key);setEditItemId(null)}}
            style={{border:'none',background:'none',padding:'14px 18px',fontSize:13.5,fontWeight:view===t.key?700:400,color:view===t.key?'#1a1a2e':'#888',borderBottom:`2px solid ${view===t.key?'#c9a96e':'transparent'}`,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflow:'auto',background:'#f0f2f5'}}>
        {(view==='list'||view==='edit') && <RecipeList onEdit={(id)=>{setEditItemId(id);setView('edit')}} editItemId={editItemId} onBack={()=>{setView('list');setEditItemId(null)}} view={view} />}
        {view==='consumption' && <Consumption />}
      </div>
    </div>
  )
}

// ─── СПИСОК КАЛЬКУЛЯЦИЙ ───────────────────────────────────────
function RecipeList({ onEdit, editItemId, onBack, view }) {
  const [recipes, setRecipes] = useState([])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const [r, cats] = await Promise.all([
      fetch(`${API}/recipes`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/categories`).then(r=>r.json()).catch(()=>[])
    ])
    setRecipes(Array.isArray(r)?r:[])
    setCategories(cats)
    // Get all items for "add new" button
    const allItems = cats.flatMap(c=>c.items||[])
    setItems(allItems)
    setLoading(false)
  }

  async function del(id) {
    if (!confirm('Удалить калькуляцию?')) return
    await fetch(`${API}/recipes/${id}`,{method:'DELETE'})
    load()
  }

  if (view==='edit') {
    return <RecipeEditor itemId={editItemId} onBack={()=>{onBack();load()}} />
  }

  const recipeItemIds = new Set(recipes.map(r=>r.itemId))
  const filtered = recipes.filter(r=>{
    if (search && !r.item?.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && r.item?.categoryId !== Number(filterCat)) return false
    return true
  })
  const itemsWithoutRecipe = items.filter(i=>!recipeItemIds.has(i.id)&&(!search||i.name.toLowerCase().includes(search.toLowerCase())))

  return (
    <div style={{padding:24,maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,color:'#1a1a2e'}}>Калькуляция блюд</div>
        <div style={{fontSize:13,color:'#888'}}>
          {recipes.length} из {items.length} блюд с калькуляцией
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input placeholder="Поиск по блюду..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inputSt,maxWidth:260}} />
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inputSt,maxWidth:200}}>
          <option value="">Все категории</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Блюда с калькуляцией */}
          {filtered.length>0 && (
            <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:20}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #f0f0f0',fontWeight:600,color:'#1a1a2e',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#27ae60',display:'inline-block'}}/>
                С калькуляцией ({filtered.length})
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {['Блюдо','Категория','Выход','Ингредиентов','Себестоимость','Цена меню','Наценка',''].map(h=>(
                      <th key={h} style={thSt}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r=>{
                    const price = r.item?.price||0
                    const cost = r.totalCost||0
                    const markup = price>0&&cost>0 ? Math.round((price-cost)/cost*100) : null
                    return (
                      <tr key={r.id} style={{borderTop:'1px solid #f0f0f0'}}>
                        <td style={{...tdSt,fontWeight:600}}>{r.item?.name}</td>
                        <td style={{...tdSt,color:'#888',fontSize:12}}>{r.item?.category?.name}</td>
                        <td style={{...tdSt,color:'#888'}}>{r.yield} {r.yieldUnit}</td>
                        <td style={{...tdSt,textAlign:'center'}}>{r.ingredients?.length||0}</td>
                        <td style={{...tdSt,fontWeight:700,color:'#e74c3c'}}>{fmt(cost)} TMT</td>
                        <td style={{...tdSt,fontWeight:700,color:'#c9a96e'}}>{price>0?`${fmt(price)} TMT`:'—'}</td>
                        <td style={tdSt}>
                          {markup!==null&&(
                            <span style={{background:markup>200?'#eafaf1':markup>100?'#fff8ec':'#fdf0ef',color:markup>200?'#27ae60':markup>100?'#f39c12':'#e74c3c',borderRadius:6,padding:'3px 8px',fontSize:12,fontWeight:600}}>
                              {markup}%
                            </span>
                          )}
                        </td>
                        <td style={{...tdSt,display:'flex',gap:6}}>
                          <button onClick={()=>onEdit(r.itemId)} style={{background:'none',border:'1.5px solid #e8e8e8',borderRadius:8,padding:'5px 8px',cursor:'pointer',color:'#888'}}><Icon.Edit /></button>
                          <button onClick={()=>del(r.id)} style={{background:'none',border:'1.5px solid #fbd5d5',borderRadius:8,padding:'5px 8px',cursor:'pointer',color:'#e74c3c'}}><Icon.Trash /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Блюда без калькуляции */}
          {itemsWithoutRecipe.length>0 && (
            <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #f0f0f0',fontWeight:600,color:'#888',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#e8e8e8',display:'inline-block'}}/>
                Без калькуляции ({itemsWithoutRecipe.length})
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {['Блюдо','Категория','Цена меню',''].map(h=><th key={h} style={thSt}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {itemsWithoutRecipe.slice(0,50).map(item=>(
                    <tr key={item.id} style={{borderTop:'1px solid #f0f0f0'}}>
                      <td style={{...tdSt,color:'#888'}}>{item.name}</td>
                      <td style={{...tdSt,color:'#aaa',fontSize:12}}>{categories.find(c=>c.id===item.categoryId)?.name}</td>
                      <td style={{...tdSt,color:'#c9a96e',fontWeight:600}}>{item.price} TMT</td>
                      <td style={tdSt}>
                        <button onClick={()=>onEdit(item.id)} style={btnSt()}>
                          <Icon.Plus /> Добавить калькуляцию
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── РЕДАКТОР КАЛЬКУЛЯЦИИ ─────────────────────────────────────
function RecipeEditor({ itemId, onBack }) {
  const [item, setItem] = useState(null)
  const [products, setProducts] = useState([])
  const [yld, setYld] = useState('1')
  const [yieldUnit, setYieldUnit] = useState('порция')
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ loadData() },[itemId])

  async function loadData() {
    setLoading(true)
    const [cats, prods, recipe] = await Promise.all([
      fetch(`${API}/categories`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/stock/products`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/recipes/item/${itemId}`).then(r=>r.json()).catch(()=>null)
    ])
    const allItems = cats.flatMap(c=>c.items||[])
    setItem(allItems.find(i=>i.id===itemId)||null)
    setProducts(prods)
    if (recipe) {
      setYld(String(recipe.yield))
      setYieldUnit(recipe.yieldUnit||'порция')
      setNotes(recipe.notes||'')
      setIngredients(recipe.ingredients.map(ing=>({
        productId: String(ing.productId),
        quantity: String(ing.quantity),
        unit: ing.unit,
        wastePct: String(ing.wastePct||0),
        costPrice: String(ing.costPrice||0),
      })))
    } else {
      setIngredients([{productId:'',quantity:'',unit:'г',wastePct:'0',costPrice:''}])
    }
    setLoading(false)
  }

  function addIngredient() {
    setIngredients([...ingredients,{productId:'',quantity:'',unit:'г',wastePct:'0',costPrice:''}])
  }

  function removeIngredient(i) {
    setIngredients(ingredients.filter((_,idx)=>idx!==i))
  }

  function updateIngredient(i, field, val) {
    const updated = ingredients.map((ing,idx)=>{
      if (idx!==i) return ing
      const newIng = {...ing,[field]:val}
      // Auto-fill cost price from product
      if (field==='productId') {
        const prod = products.find(p=>String(p.id)===val)
        if (prod&&prod.costPrice>0) newIng.costPrice = String(prod.costPrice)
        if (prod) newIng.unit = prod.unit
      }
      return newIng
    })
    setIngredients(updated)
  }

  // Calculate totals
  const calcIngredients = ingredients.map(ing=>{
    const qty = parseFloat(ing.quantity||0)
    const waste = parseFloat(ing.wastePct||0)
    const gross = qty * (1 + waste/100)
    const cost = parseFloat(ing.costPrice||0)
    const total = gross * cost
    return {...ing, grossQty: gross.toFixed(3), totalCost: total.toFixed(2)}
  })
  const totalCost = calcIngredients.reduce((s,i)=>s+parseFloat(i.totalCost||0),0)
  const itemPrice = item?.price||0
  const markup = itemPrice>0&&totalCost>0 ? Math.round((itemPrice-totalCost)/totalCost*100) : null

  async function save() {
    const valid = ingredients.filter(i=>i.productId&&i.quantity)
    if (!valid.length) return alert('Добавьте хотя бы один ингредиент')
    setSaving(true)
    await fetch(`${API}/recipes`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        itemId,
        yield: parseFloat(yld||1),
        yieldUnit,
        notes,
        ingredients: valid.map(i=>({
          productId: Number(i.productId),
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          wastePct: parseFloat(i.wastePct||0),
          costPrice: parseFloat(i.costPrice||0)
        }))
      })
    })
    setSaving(false)
    onBack()
  }

  if (loading) return <Loader />

  return (
    <div style={{padding:24,maxWidth:1000,margin:'0 auto'}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',gap:6,fontSize:13,marginBottom:16,fontFamily:'inherit'}}>
        <Icon.Back /> Назад к списку
      </button>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:'#1a1a2e'}}>{item?.name||'Блюдо'}</div>
          <div style={{fontSize:13,color:'#888',marginTop:4}}>Калькуляция · Себестоимость и состав</div>
        </div>
        <div style={{textAlign:'right'}}>
          {totalCost>0 && (
            <>
              <div style={{fontSize:13,color:'#888'}}>Себестоимость</div>
              <div style={{fontSize:24,fontWeight:800,color:'#e74c3c'}}>{fmt(totalCost)} TMT</div>
              {itemPrice>0 && <div style={{fontSize:13,color:'#888'}}>Цена меню: {fmt(itemPrice)} TMT · Наценка: {markup}%</div>}
            </>
          )}
        </div>
      </div>

      {/* Выход блюда */}
      <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:16}}>
        <div style={{fontWeight:600,marginBottom:14,fontSize:14,color:'#1a1a2e'}}>Выход блюда</div>
        <div style={{display:'flex',gap:12}}>
          <div style={{flex:'0 0 120px'}}>
            <div style={{fontSize:12,color:'#888',marginBottom:4}}>Количество</div>
            <input type="number" value={yld} onChange={e=>setYld(e.target.value)} style={inputSt} />
          </div>
          <div style={{flex:'0 0 160px'}}>
            <div style={{fontSize:12,color:'#888',marginBottom:4}}>Единица</div>
            <select value={yieldUnit} onChange={e=>setYieldUnit(e.target.value)} style={inputSt}>
              {['порция','шт','г','кг','мл','л'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'#888',marginBottom:4}}>Примечание</div>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Технология приготовления..." style={inputSt} />
          </div>
        </div>
      </div>

      {/* Ингредиенты */}
      <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:16}}>
        <div style={{fontWeight:600,marginBottom:14,fontSize:14,color:'#1a1a2e'}}>Ингредиенты</div>

        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
          <thead>
            <tr>
              {['Продукт','Нетто (кол-во)','Ед.','Отходы %','Брутто','Цена/ед (TMT)','Стоимость',''].map(h=>(
                <th key={h} style={thSt}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calcIngredients.map((ing,i)=>(
              <tr key={i} style={{borderTop:'1px solid #f0f0f0'}}>
                <td style={{...tdSt,minWidth:200}}>
                  <select value={ing.productId} onChange={e=>updateIngredient(i,'productId',e.target.value)} style={{...inputSt,padding:'6px 10px',fontSize:12}}>
                    <option value="">Выберите продукт</option>
                    {products.map(p=>(
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                </td>
                <td style={{...tdSt,width:100}}>
                  <input type="number" value={ing.quantity} onChange={e=>updateIngredient(i,'quantity',e.target.value)} placeholder="0" style={{...inputSt,padding:'6px 10px',fontSize:12}} />
                </td>
                <td style={{...tdSt,width:80}}>
                  <select value={ing.unit} onChange={e=>updateIngredient(i,'unit',e.target.value)} style={{...inputSt,padding:'6px 10px',fontSize:12}}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </td>
                <td style={{...tdSt,width:80}}>
                  <input type="number" value={ing.wastePct} onChange={e=>updateIngredient(i,'wastePct',e.target.value)} placeholder="0" style={{...inputSt,padding:'6px 10px',fontSize:12}} />
                </td>
                <td style={{...tdSt,color:'#888',textAlign:'center',width:80}}>{ing.grossQty}</td>
                <td style={{...tdSt,width:120}}>
                  <input type="number" value={ing.costPrice} onChange={e=>updateIngredient(i,'costPrice',e.target.value)} placeholder="0" style={{...inputSt,padding:'6px 10px',fontSize:12}} />
                </td>
                <td style={{...tdSt,fontWeight:700,color:'#e74c3c',width:100,textAlign:'right'}}>{fmt(ing.totalCost)} TMT</td>
                <td style={{...tdSt,width:40}}>
                  <button onClick={()=>removeIngredient(i)} style={{background:'none',border:'1.5px solid #fbd5d5',borderRadius:8,padding:'4px 7px',cursor:'pointer',color:'#e74c3c'}}><Icon.Trash /></button>
                </td>
              </tr>
            ))}
          </tbody>
          {totalCost>0 && (
            <tfoot>
              <tr style={{borderTop:'2px solid #e8e8e8',background:'#f8f9fa'}}>
                <td colSpan={6} style={{...tdSt,fontWeight:700,textAlign:'right'}}>ИТОГО СЕБЕСТОИМОСТЬ:</td>
                <td style={{...tdSt,fontWeight:800,color:'#e74c3c',fontSize:16,textAlign:'right'}}>{fmt(totalCost)} TMT</td>
                <td style={tdSt}/>
              </tr>
              {itemPrice>0 && (
                <tr style={{background:'#f8f9fa'}}>
                  <td colSpan={6} style={{...tdSt,fontWeight:700,textAlign:'right',color:'#888'}}>Цена меню / Наценка:</td>
                  <td style={{...tdSt,fontWeight:700,color:'#27ae60',textAlign:'right'}}>{fmt(itemPrice)} TMT / {markup}%</td>
                  <td style={tdSt}/>
                </tr>
              )}
            </tfoot>
          )}
        </table>

        <button onClick={addIngredient} style={{...btnSt('#888'),fontSize:12}}>
          <Icon.Plus /> Добавить ингредиент
        </button>
      </div>

      <div style={{display:'flex',gap:12}}>
        <button onClick={save} disabled={saving} style={btnSt('#27ae60')}>
          {saving ? 'Сохраняем...' : '✓ Сохранить калькуляцию'}
        </button>
        <button onClick={onBack} style={btnSt('#888')}>Отмена</button>
      </div>
    </div>
  )
}

// ─── РАСХОД ПРОДУКТОВ ─────────────────────────────────────────
function Consumption() {
  const [data, setData] = useState([])
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10))
  const [to, setTo] = useState(new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/recipes/consumption?from=${from}&to=${to}`).then(r=>r.json()).catch(()=>[])
    setData(Array.isArray(res)?res:[]); setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const totalCost = data.reduce((s,d)=>s+(d.cost||0),0)

  return (
    <div style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:20,color:'#1a1a2e'}}>Теоретический расход продуктов</div>
      <div style={{background:'#eaf4fb',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#2980b9'}}>
        Рассчитывается на основе проданных блюд и их калькуляций. Показывает сколько продуктов должно было быть израсходовано.
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',fontFamily:'inherit'}} />
        <span style={{color:'#888'}}>—</span>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{border:'1.5px solid #e8e8e8',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',fontFamily:'inherit'}} />
        <button onClick={load} style={btnSt()}>Рассчитать</button>
        {totalCost>0 && <div style={{marginLeft:'auto',background:'#fdf0ef',borderRadius:10,padding:'8px 16px',fontWeight:700,color:'#e74c3c',border:'1px solid #f5c6c6'}}>Себестоимость: {fmt(totalCost)} TMT</div>}
      </div>

      {loading ? <Loader /> : data.length===0 ? (
        <div style={{textAlign:'center',padding:40,color:'#aaa',background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          Нет данных. Добавьте калькуляции к блюдам и продажи за период.
        </div>
      ) : (
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['#','Продукт','Количество','Ед.','Себестоимость'].map(h=>(
                  <th key={h} style={thSt}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d,i)=>(
                <tr key={d.productId} style={{borderTop:'1px solid #f0f0f0'}}>
                  <td style={{...tdSt,color:'#aaa',fontWeight:600}}>{i+1}</td>
                  <td style={{...tdSt,fontWeight:600}}>{d.name}</td>
                  <td style={{...tdSt,fontWeight:600,color:'#1a1a2e'}}>{fmt(d.quantity)}</td>
                  <td style={{...tdSt,color:'#888'}}>{d.unit}</td>
                  <td style={{...tdSt,fontWeight:700,color:'#e74c3c'}}>{fmt(d.cost)} TMT</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #e8e8e8',background:'#f8f9fa'}}>
                <td colSpan={4} style={{...tdSt,fontWeight:700,textAlign:'right'}}>ИТОГО:</td>
                <td style={{...tdSt,fontWeight:800,color:'#e74c3c',fontSize:15}}>{fmt(totalCost)} TMT</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
