// ESC/POS printer via Web Serial API or window.print() fallback

export async function printReceipt(order) {
  // Try Web Serial API (Chrome on desktop with USB/COM printer)
  if ('serial' in navigator) {
    try {
      await printViaSerial(order)
      return
    } catch (e) {
      console.warn('Serial print failed, falling back to window.print()', e)
    }
  }
  // Fallback: print dialog
  printViaWindow(order)
}

async function printViaSerial(order) {
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: 9600 })

  const writer = port.writable.getWriter()
  const enc = new TextEncoder()

  const ESC = 0x1B
  const GS = 0x1D

  const cmd = (bytes) => writer.write(new Uint8Array(bytes))
  const txt = (s) => writer.write(enc.encode(s))

  // Init
  await cmd([ESC, 0x40])
  // Center
  await cmd([ESC, 0x61, 0x01])
  await txt('ЛАУНЖ-КАФЕ\n')
  await txt('--------------------------------\n')
  // Left
  await cmd([ESC, 0x61, 0x00])
  await txt(`Чек #${order.number}\n`)
  await txt(`${new Date(order.createdAt).toLocaleString('ru-RU')}\n`)
  if (order.tableNumber) await txt(`Стол: ${order.tableNumber}\n`)
  await txt('--------------------------------\n')

  for (const item of order.items) {
    const left = `${item.name} x${item.quantity}`
    const right = `${(item.price * item.quantity).toFixed(2)}`
    const spaces = 32 - left.length - right.length
    await txt(left + ' '.repeat(Math.max(1, spaces)) + right + '\n')
  }

  await txt('--------------------------------\n')
  // Bold total
  await cmd([ESC, 0x45, 0x01])
  await txt(`ИТОГО: ${order.total.toFixed(2)} руб.\n`)
  await cmd([ESC, 0x45, 0x00])
  await txt(`Оплата: ${order.paymentType === 'CASH' ? 'Наличные' : 'Карта'}\n`)
  await txt('--------------------------------\n')
  // Center
  await cmd([ESC, 0x61, 0x01])
  await txt('Спасибо! Приятного отдыха!\n\n\n')
  // Cut
  await cmd([GS, 0x56, 0x41, 0x10])

  writer.releaseLock()
  await port.close()
}

function printViaWindow(order) {
  const w = window.open('', '_blank', 'width=400,height=600')
  const lines = order.items.map(i =>
    `<tr><td>${i.name} x${i.quantity}</td><td style="text-align:right">${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('')

  w.document.write(`
    <html><head><title>Чек #${order.number}</title>
    <style>
      body { font-family: monospace; font-size: 13px; width: 280px; margin: 0 auto; }
      h2 { text-align: center; }
      hr { border: 1px dashed #000; }
      table { width: 100%; }
      .total { font-weight: bold; font-size: 15px; }
      .center { text-align: center; }
    </style></head><body>
    <h2>ЛАУНЖ-КАФЕ</h2>
    <hr>
    <p>Чек #${order.number}<br>
    ${new Date(order.createdAt).toLocaleString('ru-RU')}<br>
    ${order.tableNumber ? 'Стол: ' + order.tableNumber : ''}</p>
    <hr>
    <table>${lines}</table>
    <hr>
    <p class="total">ИТОГО: ${order.total.toFixed(2)} руб.</p>
    <p>Оплата: ${order.paymentType === 'CASH' ? 'Наличные' : 'Карта'}</p>
    <hr>
    <p class="center">Спасибо! Приятного отдыха!</p>
    </body></html>
  `)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 300)
}
