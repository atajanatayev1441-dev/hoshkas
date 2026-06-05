// Печать чека — ESC/POS (USB принтер) или красивый PDF в браузере

export async function printReceipt(order) {
  if ('serial' in navigator) {
    try { await printViaSerial(order); return } catch(e) {
      console.warn('Serial print failed, fallback to window.print()', e)
    }
  }
  printViaWindow(order)
}

// ─── ESC/POS через Web Serial API ────────────────────────────
async function printViaSerial(order) {
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: 9600 })
  const writer = port.writable.getWriter()
  const enc = new TextEncoder()
  const cmd = (bytes) => writer.write(new Uint8Array(bytes))
  const txt = (s) => writer.write(enc.encode(s))
  const line = () => txt('--------------------------------\n')

  await cmd([0x1B, 0x40])          // Init
  await cmd([0x1B, 0x61, 0x01])    // Center
  await cmd([0x1D, 0x21, 0x11])    // Double size
  await txt('HOS LOUNGE\n')
  await cmd([0x1D, 0x21, 0x00])    // Normal
  await txt('Ресторан-бар\n\n')
  await line()
  await cmd([0x1B, 0x61, 0x00])    // Left
  await txt(`Чек #${order.number || order.id}\n`)
  await txt(`${new Date(order.closedAt || order.createdAt).toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}\n`)
  if (order.tableNumber) await txt(`Стол: ${order.tableNumber}\n`)
  if (order.cashierName) await txt(`Кассир: ${order.cashierName}\n`)
  await line()

  for (const item of (order.items || [])) {
    const name = item.name.length > 20 ? item.name.slice(0,19) + '…' : item.name
    const qty = `x${item.quantity}`
    const price = `${(item.price * item.quantity).toFixed(2)}`
    const spaces = 32 - name.length - qty.length - price.length - 1
    await txt(`${name} ${qty}${' '.repeat(Math.max(1, spaces))}${price}\n`)
  }

  await line()
  await cmd([0x1B, 0x45, 0x01])    // Bold
  const total = `${order.total.toFixed(2)} TMT`
  await txt(`ИТОГО:${' '.repeat(26 - total.length)}${total}\n`)
  await cmd([0x1B, 0x45, 0x00])
  await txt(`Оплата: ${order.paymentType === 'CASH' ? 'Наличные' : 'Карта'}\n`)
  await line()
  await cmd([0x1B, 0x61, 0x01])    // Center
  await txt('\nСпасибо за визит!\nПриятного отдыха!\n\n\n')
  await cmd([0x1D, 0x56, 0x41, 0x10])  // Cut
  writer.releaseLock()
  await port.close()
}

// ─── Печать через браузер ─────────────────────────────────────
function printViaWindow(order) {
  const w = window.open('', '_blank', 'width=380,height=700')
  if (!w) { alert('Разрешите всплывающие окна для печати'); return }

  const date = new Date(order.closedAt || order.createdAt)
  const dateStr = date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const items = (order.items || []).map(i => `
    <tr>
      <td style="padding:4px 0;max-width:170px;word-wrap:break-word">${i.name}</td>
      <td style="padding:4px 6px;text-align:center;white-space:nowrap">×${i.quantity}</td>
      <td style="padding:4px 0;text-align:right;white-space:nowrap">${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
    <tr>
      <td colspan="3" style="padding:0 0 4px 0;color:#888;font-size:11px">${i.price.toFixed(2)} × ${i.quantity} шт</td>
    </tr>
  `).join('')

  const payType = order.paymentType === 'CASH' ? 'Наличные' : 'Карта'

  w.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Чек #${order.number || order.id}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 8mm 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .logo { font-size: 20px; font-weight: 900; letter-spacing: 3px; margin-bottom: 2px; }
  .sub { font-size: 11px; color: #555; margin-bottom: 8px; }
  .dashes { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .meta { font-size: 12px; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  .total-row td { font-weight: 900; font-size: 15px; padding-top: 8px; }
  .footer { margin-top: 10px; font-size: 12px; color: #444; }
  .badge {
    display: inline-block;
    border: 1.5px solid #000;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 700;
    margin-top: 4px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="logo">HOS LOUNGE</div>
    <div class="sub">Ресторан-бар</div>
  </div>

  <hr class="dashes">

  <div class="meta">Чек: <b>#${order.number || order.id}</b></div>
  <div class="meta">Дата: ${dateStr}</div>
  ${order.tableNumber ? `<div class="meta">Стол: <b>${order.tableNumber}</b></div>` : ''}
  ${order.cashierName ? `<div class="meta">Кассир: ${order.cashierName}</div>` : ''}

  <hr class="dashes">

  <table>
    <tbody>${items}</tbody>
    <tr><td colspan="3"><hr class="dashes" style="margin:4px 0"></td></tr>
    <tr class="total-row">
      <td colspan="2">ИТОГО:</td>
      <td style="text-align:right">${order.total.toFixed(2)} TMT</td>
    </tr>
  </table>

  <div style="margin-top:8px">
    <span class="badge">${payType}</span>
  </div>

  <hr class="dashes">

  <div class="center footer">
    <div>Спасибо за визит!</div>
    <div>Приятного отдыха!</div>
    <div style="margin-top:6px;font-size:10px;color:#999">
      ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
    </div>
  </div>
</body>
</html>`)

  w.document.close()
  w.focus()
  // Даём время на рендеринг перед печатью
  setTimeout(() => {
    w.print()
    setTimeout(() => w.close(), 1000)
  }, 400)
}
