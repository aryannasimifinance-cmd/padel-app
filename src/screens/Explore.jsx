import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES, DAYPARTS, REGIONS, SPORTS, cityById, clubsIn, dayKey, dayLabel, dayNum, fa, fromKey, hourLabel, nextDays, regionById, short, sportById } from '../data'
import { haptic } from '../fx'
import { freeHours, useStore } from '../store'
import { Icon, Photo } from '../components/ui'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TOP = 128 // فاصله‌ی پنل باز از بالا (زیر نوار جستجو)
const PEEK = 190 // ارتفاع پنل جمع‌شده (با احتساب نوار پایین)
const SPRING = { type: 'spring', stiffness: 380, damping: 38 }

// کاوش: نقشه‌ی تمام‌صفحه + پنل کشویی فهرست باشگاه‌ها + جستجو
export default function Explore({ nav, active }) {
  const { bookings, notifications } = useStore()
  const { q, setQ } = nav
  const [sel, setSel] = useState(null)
  const [search, setSearch] = useState(false)
  const part = DAYPARTS.find((d) => d.id === q.part)
  const sport = sportById(q.sport)
  const unread = notifications.filter((n) => !n.read).length

  const list = useMemo(() => clubsIn(q.city, q.sport, q.region)
    .map((c) => ({ c, hours: freeHours(bookings, c, q.sport, q.date, part.from, part.to) }))
    .sort((a, b) => (b.hours.length > 0) - (a.hours.length > 0) || b.c.rating - a.c.rating), [q, bookings])
  const open = list.filter((x) => x.hours.length).length

  // ---------- پنل کشویی با سه حالت: باز، نیمه، جمع ----------
  const box = useRef(null)
  const [H, setH] = useState(720)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  const snapsOf = (h) => ({ full: TOP, half: Math.round(h * 0.47), peek: h - PEEK })
  const snaps = snapsOf(H)
  const [snap, setSnap] = useState('half')
  const y = useMotionValue(snaps.half)
  const base = useRef(0)
  const go = (k) => { setSnap(k); animate(y, snapsOf(box.current?.clientHeight || H)[k], SPRING) }
  useEffect(() => { y.set(snaps[snap]) }, [H])
  const panEnd = (_, info) => {
    const v = info.velocity.y, cur = y.get()
    const order = ['full', 'half', 'peek']
    let k = order.reduce((a, b) => (Math.abs(snaps[b] - cur) < Math.abs(snaps[a] - cur) ? b : a))
    if (Math.abs(v) > 450) k = order[Math.max(0, Math.min(2, order.indexOf(snap) + (v > 0 ? 1 : -1)))]
    go(k)
  }

  // ---------- نقشه ----------
  const el = useRef(null), map = useRef(null), pins = useRef(null), goRef = useRef(go)
  goRef.current = go
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: false, zoomSnap: 0.5 }).setView(cityById(q.city).center, cityById(q.city).zoom)
    // اعتبار نقشه بالای صفحه، چون پایین زیر پنل می‌رود
    L.control.attribution({ position: 'topleft', prefix: false }).addTo(m)
    L.tileLayer(TILES, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    pins.current = L.layerGroup().addTo(m)
    m.on('dragstart', () => goRef.current('peek'))
    m.on('click', () => setSel(null))
    map.current = m
    const t = setTimeout(() => m.invalidateSize(), 260)
    return () => { clearTimeout(t); m.remove(); map.current = null }
  }, [])
  useEffect(() => { if (active) setTimeout(() => map.current?.invalidateSize(), 60) }, [active])

  // پین قیمت مثل آگهی‌ها؛ باشگاه بدون ساعت آزاد کم‌رنگ
  useEffect(() => {
    const g = pins.current; if (!g) return
    g.clearLayers()
    list.forEach(({ c, hours }) => {
      const on = sel === c.id
      const icon = L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], html: `<div class="ppin ${on ? 'on' : ''} ${hours.length ? '' : 'full'}">${short(c.price[q.sport])}</div>` })
      L.marker(c.at, { icon, zIndexOffset: on ? 1000 : hours.length ? 100 : 0 })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); haptic(8); setSel(c.id); goRef.current('peek') }).addTo(g)
    })
  }, [list, sel])

  useEffect(() => {
    const m = map.current; if (!m) return
    const r = q.region && regionById(q.region)
    if (r) m.flyToBounds(L.latLng(r.center).toBounds(r.r * 2.4), { duration: 0.7 })
    else m.flyTo(cityById(q.city).center, cityById(q.city).zoom, { duration: 0.7 })
  }, [q.city, q.region])
  useEffect(() => { const c = list.find((x) => x.c.id === sel); if (c) map.current?.panTo(c.c.at, { animate: true }) }, [sel])

  const picked = list.find((x) => x.c.id === sel)
  const where = q.region ? regionById(q.region).name : cityById(q.city).name

  return (
    <div className="explore" ref={box}>
      <div className="map" ref={el} dir="ltr" />

      <div className="ex-top">
        <div className="ex-search">
          <motion.button className="search-cap" whileTap={{ scale: 0.98 }} onClick={() => { haptic(8); setSearch(true) }}>
            <Icon name="search" size={20} stroke={2.4} />
            <span className="grow">
              <b>{sport.name} در {where}</b>
              <small>{dayLabel(q.date)} {dayNum(fromKey(q.date))}، {part.name}</small>
            </span>
            <span className="cap-filter"><Icon name="layers" size={18} /></span>
          </motion.button>
          <motion.button className="icon-btn cap-bell" whileTap={{ scale: 0.85 }} onClick={() => nav.open('notifs')} aria-label="اعلان‌ها">
            <Icon name="bell" size={20} />
            {unread > 0 && <span className="badge-dot">{fa(unread)}</span>}
          </motion.button>
        </div>
        <div className="sport-bar">
          {SPORTS.map((s) => (
            <button key={s.id} className={q.sport === s.id ? 'on' : ''} onClick={() => { haptic(6); setSel(null); setQ({ sport: s.id }) }}>
              <SportGlyph id={s.id} /><span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {picked && snap === 'peek' && (
          <motion.div className="pick-card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
            <Listing x={picked} q={q} nav={nav} compact />
            <button className="pick-x" onClick={() => setSel(null)} aria-label="بستن"><Icon name="close" size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="ex-sheet" style={{ y }}>
        <motion.div className="ex-grip" style={{ touchAction: 'none' }}
          onPanStart={() => { base.current = y.get() }}
          onPan={(_, i) => y.set(Math.max(TOP - 24, Math.min(H - PEEK + 40, base.current + i.offset.y)))}
          onPanEnd={panEnd}
          onTap={() => go(snap === 'full' ? 'half' : 'full')}>
          <i />
          <b>{open ? <>{fa(open)} باشگاه ساعت آزاد دارن</> : 'ساعت آزادی پیدا نشد'}</b>
          <small>{fa(list.length)} باشگاه {sport.name} در {where}، {dayLabel(q.date)}</small>
        </motion.div>
        <div className="ex-list" style={{ height: Math.max(0, H - snaps[snap] - 74) }}>
          {list.map((x, k) => (
            <motion.div key={x.c.id + q.sport} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(k, 6) * 0.04 }}>
              <Listing x={x} q={q} nav={nav} />
            </motion.div>
          ))}
          {!list.length && <p className="ex-empty">در {where} باشگاه {sport.name} نداریم. ناحیه یا رشته‌ی دیگه رو امتحان کن.</p>}
        </div>
      </motion.div>

      <AnimatePresence>
        {snap === 'full' && (
          <motion.button className="map-fab" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={() => go('peek')}>
            <Icon name="map" size={18} /> نقشه
          </motion.button>
        )}
      </AnimatePresence>

      <SearchPanel open={search} q={q} onClose={() => setSearch(false)} onApply={(p) => { setQ(p); setSel(null); setSearch(false); go('half') }} />
    </div>
  )
}

// کارت آگهی باشگاه: عکس بزرگ، امتیاز، ساعت‌های آزاد که مستقیم به پرداخت می‌روند
export function Listing({ x, q, nav, compact }) {
  const { c, hours } = x
  const s = sportById(q.sport)
  const n = compact ? 4 : 6
  const openClub = () => nav.open('club', { id: c.id, sport: q.sport, date: q.date })
  return (
    <div className={`lst ${compact ? 'compact' : ''}`}>
      <motion.div className="lst-photo" whileTap={{ scale: 0.98 }} onClick={openClub}>
        <Photo src={c.img} />
        <span className="lst-tag">{c.indoor ? 'سرپوشیده' : 'روباز'}</span>
        {!hours.length && <span className="lst-full">این بازه پره</span>}
      </motion.div>
      <div className="lst-info" onClick={openClub}>
        <div className="lst-row"><b>{c.name}</b><span><Icon name="star" size={13} fill="currentColor" /> {fa(c.rating)}</span></div>
        <small>{c.area}، {fa(c.courts[q.sport])} زمین {s.name}</small>
        <p><b>{short(c.price[q.sport])}</b> تومان، هر ساعت</p>
      </div>
      {hours.length > 0 && (
        <div className="lst-slots">
          {hours.slice(0, n).map((h) => (
            <motion.button key={h} whileTap={{ scale: 0.92 }} onClick={() => nav.open('checkout', { kind: 'court', clubId: c.id, sport: q.sport, date: q.date, start: h, dur: 1 })}>
              {hourLabel(h)}
            </motion.button>
          ))}
          {hours.length > n && <button className="more" onClick={openClub}>+{fa(hours.length - n)}</button>}
        </div>
      )}
    </div>
  )
}

// پنل جستجو: کجا، چه رشته‌ای، کی
function SearchPanel({ open, q, onClose, onApply }) {
  const [d, setD] = useState(q)
  useEffect(() => { if (open) setD(q) }, [open])
  const days = useMemo(() => nextDays(14), [])
  const set = (p) => { haptic(6); setD((x) => ({ ...x, ...p })) }
  const root = document.getElementById('portal')
  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="search-panel" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
          <div className="sp-head">
            <button className="icon-btn" onClick={onClose} aria-label="بستن"><Icon name="close" /></button>
            <b>جستجوی زمین</b>
            <span style={{ width: 40 }} />
          </div>
          <div className="sp-body">
            <section className="sp-card">
              <h3>کجا؟</h3>
              <div className="sp-cities">
                {CITIES.map((c) => <button key={c.id} className={d.city === c.id ? 'on' : ''} onClick={() => set({ city: c.id, region: null })}>{c.name}</button>)}
              </div>
              <div className="sp-regions">
                <button className={!d.region ? 'on' : ''} onClick={() => set({ region: null })}>همه‌ی {cityById(d.city).name}</button>
                {REGIONS.filter((r) => r.city === d.city).map((r) => (
                  <button key={r.id} className={d.region === r.id ? 'on' : ''} onClick={() => set({ region: r.id })}>{r.name}<small>{fa(clubsIn(d.city, d.sport, r.id).length)}</small></button>
                ))}
              </div>
            </section>
            <section className="sp-card">
              <h3>چه رشته‌ای؟</h3>
              <div className="sp-sports">
                {SPORTS.map((s) => (
                  <button key={s.id} className={d.sport === s.id ? 'on' : ''} onClick={() => set({ sport: s.id })}>
                    <SportGlyph id={s.id} big /><span>{s.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="sp-card">
              <h3>کِی؟</h3>
              <div className="sp-days">
                {days.map((x) => {
                  const k = dayKey(x)
                  return <button key={k} className={d.date === k ? 'on' : ''} onClick={() => set({ date: k })}><small>{dayLabel(x)}</small><b>{dayNum(x)}</b></button>
                })}
              </div>
              <div className="sp-parts">
                {DAYPARTS.map((p) => <button key={p.id} className={d.part === p.id ? 'on' : ''} onClick={() => set({ part: p.id })}>{p.name}{p.id !== 'any' && <small>{fa(p.from)} تا {fa(p.to)}</small>}</button>)}
              </div>
            </section>
          </div>
          <div className="sp-foot">
            <button className="link" onClick={() => setD({ ...q, region: null, part: 'any', date: dayKey(new Date()) })}>پاک کردن</button>
            <motion.button className="sp-go" whileTap={{ scale: 0.96 }} onClick={() => onApply(d)}><Icon name="search" size={18} stroke={2.6} /> نمایش باشگاه‌ها</motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}

// آیکن هر رشته: زمین از بالا روی رنگ رشته
export function SportGlyph({ id, big }) {
  const s = sportById(id), z = big ? 34 : 22
  const lines = {
    padel: 'M5 4h14v16H5zM5 12h14M12 7v10M5 7h14M5 17h14',
    tennis: 'M4 5h16v14H4zM4 12h16M7 5v14M17 5v14M7 8.5h10M7 15.5h10M12 8.5v7',
    beach: 'M4 6h16v12H4zM4 12h16',
    pickle: 'M5 4h14v16H5zM5 12h14M5 9h14M5 15h14M12 4v5M12 15v5',
  }[id]
  return (
    <svg className="glyph" width={z} height={z} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill={s.color} stroke="none" opacity=".2" />
      <path d={lines} />
    </svg>
  )
}
