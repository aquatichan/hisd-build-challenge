// Renders the site's placeholder images with headless Chrome (so they use the real site fonts).
// Nothing here depicts a real person: photo slots are labeled frames, sponsor logos are "your logo here" stickers.
//
// Usage:
//   1. Start Chrome:  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//        --user-data-dir=/tmp/chrome-ph --remote-debugging-port=9333 about:blank &
//   2. node scripts/make-placeholders.mjs            (writes public/placeholders/*.png)
//
// Replace a placeholder later by dropping a real file in and pointing src/content at it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const PORT = process.env.CDP_PORT || 9333
const OUT = new URL('../public/placeholders/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const map = JSON.parse(readFileSync(new URL('../src/content/hisd-map.json', import.meta.url), 'utf8'))

const FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Parkinsans:wght@400..800&family=Space+Mono:wght@400;700&display=block" rel="stylesheet">'
const BASE = `*{box-sizing:border-box;margin:0}body{background:transparent;font-family:Parkinsans,sans-serif}
.disp{font-weight:800;font-style:italic;font-synthesis:style;text-transform:uppercase;line-height:.9;letter-spacing:-.01em}
.mono{font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:.12em}`
const C = { teal: '#00a3af', yellow: '#f9d04e', coral: '#d96364', green: '#6db83d', blue: '#4975bd', purple: '#474f99', ink: '#010e2b' }
const camera = (c) =>
  `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.4"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`

// ---------- photo slots ----------
const PHOTOS = [
  ['Build day', 'teal'],
  ['Team at work', 'yellow'],
  ['Prototype testing', 'coral'],
  ['Westside students', 'teal'],
  ['Carnegie Vanguard students', 'green'],
  ['Bellaire students', 'yellow'],
  ['Demo day', 'blue'],
  ['Pitch practice', 'coral'],
]
const photo = (title, tone, n) => `<div id="card" style="width:1200px;height:800px;position:relative;overflow:hidden;
  background:repeating-linear-gradient(-45deg,rgb(0 163 175/.13) 0 2px,transparent 2px 18px),radial-gradient(ellipse at 30% 20%,#123a6e,#061633 70%);color:#fff">
  <div style="position:absolute;inset:28px;border:2px solid ${C[tone]}55"></div>
  ${['top:20px;left:20px;border-width:3px 0 0 3px', 'top:20px;right:20px;border-width:3px 3px 0 0', 'bottom:20px;left:20px;border-width:0 0 3px 3px', 'bottom:20px;right:20px;border-width:0 3px 3px 0']
    .map((p) => `<span style="position:absolute;${p};width:44px;height:44px;border-style:solid;border-color:${C[tone]}"></span>`)
    .join('')}
  <div style="position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:22px;text-align:center">
    ${camera(C[tone])}
    <div class="disp" style="font-size:84px;max-width:960px;color:#fff">${title}</div>
    <div class="mono" style="font-size:24px;color:${C[tone]}">HISD photo · coming soon</div>
  </div>
  <div class="mono" style="position:absolute;left:56px;bottom:50px;font-size:18px;color:#9fd9df">Fig. 02.${String(n).padStart(2, '0')}</div>
  <div class="mono" style="position:absolute;right:56px;bottom:50px;font-size:18px;color:#9fd9df">Placeholder</div>
</div>`

// ---------- school trading cards (63:88) ----------
const SCHOOLS = map.campuses.filter((c) => c.participating).sort((a, b) => a.name.localeCompare(b.name))
const seal = `data:image/png;base64,${readFileSync(new URL('../public/brand/hisd-seal-teal-192.png', import.meta.url)).toString('base64')}`
const LOGOS = { westside: 'westside.webp', carnegie: 'carnegie.png', bellaire: 'bellaire.webp' }
const logoUri = (c) => {
  const key = c.name.split(' ')[0].toLowerCase()
  const f = LOGOS[key]
  const type = f.endsWith('.png') ? 'png' : 'webp'
  return `data:image/${type};base64,${readFileSync(new URL(`../public/brand/schools/${f}`, import.meta.url)).toString('base64')}`
}
const schoolCard = (c, i) => {
  const [first, ...rest] = c.name.replace(' High School', '').split(' ')
  return `<div id="card" style="width:630px;height:880px;position:relative;overflow:hidden;border-radius:28px;color:#fff;
  background:radial-gradient(ellipse at 50% 0%,#14427a,#061633 62%,#020d26)">
  <div style="position:absolute;inset:16px;border:2px solid ${C.teal};border-radius:18px"></div>
  <div style="position:absolute;inset:26px;border:1px solid rgb(0 163 175/.35);border-radius:12px"></div>
  <div style="position:absolute;top:44px;left:48px;right:48px;display:flex;align-items:center;gap:14px">
    <img src="${seal}" width="54" height="54">
    <div class="mono" style="font-size:15px;line-height:1.35;color:#bfeff3">Houston ISD<br>Build Challenge</div>
    <div class="mono" style="margin-left:auto;font-size:15px;color:${C.yellow}">No. ${String(i + 1).padStart(2, '0')}</div>
  </div>
  <div style="position:absolute;top:140px;left:48px;right:48px">
    <div class="mono" style="display:inline-block;background:${C.yellow};color:${C.ink};font-weight:700;font-size:15px;padding:6px 12px">Participating school</div>
    <div class="disp" style="font-size:${first.length + rest.join(' ').length > 15 ? 60 : 76}px;margin-top:22px">${first}<br><span style="color:${C.teal}">${rest.join(' ') || '&nbsp;'}</span></div>
    <div class="disp" style="font-size:30px;margin-top:10px;color:#dfe9ee">High School</div>
  </div>
  <div style="position:absolute;left:48px;right:48px;top:390px;bottom:120px;display:grid;place-items:center"><img src="${logoUri(c)}" style="width:100%;height:310px;object-fit:contain;filter:drop-shadow(0 12px 30px rgb(0 0 0/.5))"></div>
  <div style="position:absolute;left:48px;right:48px;bottom:48px;display:flex;justify-content:space-between;align-items:end;border-top:1px solid rgb(0 163 175/.4);padding-top:16px">
    <div class="mono" style="font-size:14px;line-height:1.5;color:#bfeff3;max-width:380px">${c.address}</div>
    <div class="mono" style="font-size:14px;color:${C.teal}">1 of ${map.counts.total} campuses</div>
  </div>
</div>`
}

// ---------- sponsor stickers (transparent, die-cut white edge) ----------
const STICKERS = [
  { shape: 'border-radius:50%', w: 420, h: 420, bg: C.yellow, fg: C.ink },
  { shape: 'border-radius:44px', w: 480, h: 360, bg: C.teal, fg: C.ink },
  { shape: 'border-radius:999px', w: 520, h: 260, bg: C.ink, fg: '#fff' },
  { shape: 'border-radius:50%', w: 420, h: 420, bg: C.coral, fg: C.ink },
]
const sticker = (s, i) => `<div id="card" style="padding:18px;display:inline-block">
  <div style="width:${s.w}px;height:${s.h}px;${s.shape};background:#fff;padding:16px;box-shadow:0 0 0 2px rgb(0 0 0/.06)">
    <div style="width:100%;height:100%;${s.shape};background:${s.bg};color:${s.fg};display:grid;place-content:center;justify-items:center;gap:10px;text-align:center;
      outline:3px dashed ${s.fg}55;outline-offset:-22px">
      <div class="mono" style="font-size:20px;opacity:.75">Sponsor ${String(i + 1).padStart(2, '0')}</div>
      <div class="disp" style="font-size:52px">Your logo<br>here</div>
    </div>
  </div>
</div>`

// ---------- lanyard badge (portrait 1.6 : 2.25) + strap tile ----------
const badgeFront = `<div id="card" style="width:640px;height:900px;position:relative;overflow:hidden;color:${C.ink};background:#fffef4">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 31px,rgb(0 111 91/.08) 31px 32px),repeating-linear-gradient(90deg,transparent 0 31px,rgb(0 111 91/.08) 31px 32px)"></div>
  <div style="position:absolute;left:0;right:0;top:0;height:250px;background:${C.teal}"></div>
  <div style="position:absolute;left:50%;top:44px;transform:translateX(-50%);width:120px;height:26px;border-radius:13px;background:#fffef4"></div>
  <div style="position:absolute;top:110px;left:56px;right:56px;display:flex;align-items:center;gap:16px;color:${C.ink}">
    <img src="${seal}" width="72" height="72" style="border-radius:50%;background:#fff">
    <div class="mono" style="font-size:20px;line-height:1.35;font-weight:700">Houston ISD<br>Build Challenge</div>
  </div>
  <div style="position:absolute;top:300px;left:56px;right:56px">
    <div class="mono" style="font-size:20px;color:#006f5b;font-weight:700">Builder pass</div>
    <div class="disp" style="font-size:96px;margin-top:14px">Your<br>name<br><span style="color:${C.teal}">here</span></div>
  </div>
  <div style="position:absolute;left:56px;right:56px;bottom:64px;display:grid;grid-template-columns:1fr 1fr;gap:18px;border-top:3px solid ${C.ink};padding-top:22px">
    <div><div class="mono" style="font-size:15px;color:#4b5f63">School</div><div style="font-size:26px;font-weight:700;margin-top:4px">Yours</div></div>
    <div><div class="mono" style="font-size:15px;color:#4b5f63">Kickoff</div><div style="font-size:26px;font-weight:700;margin-top:4px">TBA</div></div>
  </div>
  <div style="position:absolute;right:40px;top:300px;width:22px;height:200px;background:${C.yellow}"></div>
</div>`
const badgeBack = `<div id="card" style="width:640px;height:900px;position:relative;overflow:hidden;color:#fff;background:${C.ink}">
  <div style="position:absolute;left:50%;top:44px;transform:translateX(-50%);width:120px;height:26px;border-radius:13px;background:#fffef4"></div>
  <div style="position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:26px;text-align:center;padding:60px">
    <img src="${seal}" width="200" height="200">
    <div class="disp" style="font-size:58px">Build for<br><span style="color:${C.yellow}">Houston</span></div>
    <div class="mono" style="font-size:17px;color:#9fd9df;line-height:1.6">Sample pass<br>Not an official ID</div>
  </div>
</div>`
const strap = `<div id="card" style="width:160px;height:640px;background:${C.teal};position:relative;overflow:hidden">
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(90deg);white-space:nowrap" class="mono">
    <span style="font-size:30px;font-weight:700;color:${C.ink};letter-spacing:.18em">HISD ✦ BUILD CHALLENGE ✦</span>
  </div>
  <div style="position:absolute;left:10px;top:0;bottom:0;width:3px;background:rgb(255 255 255/.35)"></div>
  <div style="position:absolute;right:10px;top:0;bottom:0;width:3px;background:rgb(255 255 255/.35)"></div>
</div>`

// ---------- hero: Houston at dusk (original illustration; fed to the halftone effect) ----------
function duskScene() {
  const W = 1800, H = 1100, horizon = 820
  const r = (() => { let t = 29; return () => ((t = (t * 1664525 + 1013904223) >>> 0) / 4294967296) })()
  const layer = (peak, spread, maxH, minW, maxW, fill, windows) => {
    let x = -20, out = '', win = ''
    while (x < W + 20) {
      const w = minW + r() * (maxW - minW)
      const core = Math.exp(-(((x - W * peak) / (W * spread)) ** 2))
      const h = 30 + r() * 60 + core * maxH * (0.45 + r() * 0.55)
      const y = horizon - h, roll = r()
      if (roll < 0.14) out += `<path d="M${x},${horizon}V${y}H${x + w / 2 - 3}V${y - 40}L${x + w / 2},${y - 70}L${x + w / 2 + 3},${y - 40}V${y}H${x + w}V${horizon}Z"/>`
      else if (roll < 0.28) out += `<path d="M${x},${horizon}V${y + 26}H${x + w * 0.2}V${y}H${x + w * 0.8}V${y + 26}H${x + w}V${horizon}Z"/>`
      else if (roll < 0.38) out += `<path d="M${x},${horizon}V${y + 34}L${x + w},${y}V${horizon}Z"/>`
      else out += `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`
      if (windows) for (let wy = y + 30; wy < horizon - 10; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 11) if (r() < 0.13) win += `<rect x="${wx}" y="${wy}" width="4" height="6"/>`
      x += w + (r() < 0.3 ? 3 + r() * 10 : 0)
    }
    return { out, win }
  }
  const back = layer(0.62, 0.22, 360, 40, 90, '', false)
  const front = layer(0.58, 0.16, 430, 28, 70, '', true)
  return `<div id="card" style="width:${W}px;height:${H}px">
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#010e2b"/><stop offset=".42" stop-color="#062a55"/><stop offset=".68" stop-color="#0d5470"/>
        <stop offset=".82" stop-color="#2f7d86"/><stop offset=".92" stop-color="#d96364"/><stop offset="1" stop-color="#f9d04e"/>
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2f4f"/><stop offset="1" stop-color="#010e2b"/></linearGradient>
      <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffed0"/><stop offset=".5" stop-color="#f9d04e"/><stop offset="1" stop-color="#f9d04e" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${horizon}" fill="url(#sky)"/>
    <circle cx="${W * 0.74}" cy="${horizon - 10}" r="150" fill="url(#sun)" opacity=".85"/>
    <g fill="#16436b">${back.out}</g>
    <g fill="#031432">${front.out}</g>
    <g fill="#f9d04e" opacity=".9">${front.win}</g>
    <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#water)"/>
    <g transform="translate(0 ${horizon * 2}) scale(1 -1)" opacity=".28"><g fill="#16436b">${back.out}</g><g fill="#0a2448">${front.out}</g></g>
    ${Array.from({ length: 26 }, (_, i) => `<rect x="${(i * 137) % W}" y="${horizon + 12 + i * 10}" width="${120 + ((i * 53) % 260)}" height="2" fill="#f9d04e" opacity="${(0.35 - i * 0.012).toFixed(2)}"/>`).join('')}
    <rect y="${horizon - 2}" width="${W}" height="3" fill="#00a3af" opacity=".7"/>
  </svg>
</div>`
}

// ---------- render ----------
const tab = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1900, height: 1200, deviceScaleFactor: 1, mobile: false })
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })

async function render(html, file) {
  const jpeg = file.endsWith('.jpg')
  const doc = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}</style></head><body>${html}</body></html>`
  await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(doc).toString('base64') })
  await new Promise((r) => setTimeout(r, 300))
  const box = (
    await send('Runtime.evaluate', {
      expression: `document.fonts.ready.then(()=>new Promise(r=>setTimeout(r,250))).then(()=>{const b=document.getElementById('card').getBoundingClientRect();return [b.x,b.y,b.width,b.height]})`,
      awaitPromise: true,
      returnByValue: true,
    })
  ).result.result.value
  const shot = await send('Page.captureScreenshot', {
    format: jpeg ? 'jpeg' : 'png',
    ...(jpeg ? { quality: 82 } : {}),
    captureBeyondViewport: true,
    clip: { x: box[0], y: box[1], width: box[2], height: box[3], scale: 1 },
  })
  writeFileSync(new URL(file, OUT), Buffer.from(shot.result.data, 'base64'))
  console.log('wrote', file)
}

for (const [i, [t, tone]] of PHOTOS.entries()) await render(photo(t, tone, i + 1), `photo-${String(i + 1).padStart(2, '0')}.jpg`)
for (const [i, c] of SCHOOLS.entries()) await render(schoolCard(c, i), `school-${c.name.split(' ')[0].toLowerCase()}.jpg`)
await render(duskScene(), 'houston-dusk.jpg')
await render(badgeFront, 'badge-front.jpg')
await render(badgeBack, 'badge-back.jpg')
await render(strap, 'strap.png')
for (const [i, s] of STICKERS.entries()) await render(sticker(s, i), `sponsor-${String(i + 1).padStart(2, '0')}.png`)
ws.close()
