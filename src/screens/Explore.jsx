import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CITIES, DAYPARTS, REGIONS, SPORTS, cityById, clubById, clubsIn, coachesAt, dayKey, dayLabel, dayNum, fa, fromKey, hourLabel, levelOf, nextDays,
  openMatches, priceFor, range, regionById, short, sportById, toman, tournaments, weekday,
} from '../data'
import { haptic } from '../fx'
import { freeHours, useStore } from '../store'
import { Avatar, Button, Icon, LevelPill, Photo } from '../components/ui'
import { BookBox } from './Club'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TOP = 128 // فاصله‌ی پنل باز از بالا (زیر نوار جستجو)
const PEEK = 178 // ارتفاع پنل جمع‌شده (با احتساب نوار پایین)
const SPRING = { type: 'spring', stiffness: 380, damping: 38 }
const MODE = {
  court: { title: (n) => `${fa(n)} باشگاه ساعت آزاد دارن`, empty: 'ساعت آزادی پیدا نشد' },
  games: { title: (n) => `${fa(n)} بازی باز دنبال یارن`, empty: 'بازی بازی پیدا نشد' },
  coach: { title: (n) => `${fa(n)} مربی در دسترس`, empty: 'مربی‌ای پیدا نشد' },
}

// همه‌چیز از نقشه شروع می‌شود: سه حالت زمین / هم‌بازی / مربی روی یک نقشه و یک پنل کشویی
export default function Explore({ nav, mode, active }) {
  const { user, bookings, joined, notifications } = useStore()
  const { q, setQ } = nav
  const [sel, setSel] = useState(null)
  const [search, setSearch] = useState(false)
  const part = DAYPARTS.find((d) => d.id === q.part)
  const sport = sportById(q.sport)
  const lv = levelOf(user, q.sport)
  const unread = notifications.filter((n) => !n.read).length
  const clubs = useMemo(() => clubsIn(q.city, q.sport, q.region), [q.city, q.sport, q.region])

  // داده‌ی هر حالت: فهرست پنل + عدد روی پین هر باشگاه
  const data = useMemo(() => {
    if (mode === 'games') {
      // بازی‌ها از روز انتخابی تا چند روز بعد، تا فهرست هیچ‌وقت خالی نماند
      const games = openMatches({ city: q.city, sport: q.sport, level: lv })
        .filter((g) => !joined.includes(g.id) && fromKey(g.date) >= fromKey(q.date) && (!q.region || clubById(g.clubId).region === q.region) && g.start >= part.from && g.start < part.to)
        .sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.gap - b.gap || a.start - b.start)
      return { items: games, pin: (c) => { const n = games.filter((g) => g.clubId === c.id).length; return n ? { label: `${fa(n)} بازی`, hot: true } : null } }
    }
    if (mode === 'coach') {
      const seen = new Set(), items = []
      clubs.forEach((c) => coachesAt(c, q.sport).forEach((m) => { if (!seen.has(m.id)) { seen.add(m.id); items.push({ m, c }) } }))
      return { items, pin: (c) => { const n = coachesAt(c, q.sport).length; return n ? { label: `${fa(n)} مربی`, hot: true } : null } }
    }
    const items = clubs.map((c) => ({ c, hours: freeHours(bookings, c, q.sport, q.date, part.from, part.to) }))
      .sort((a, b) => (b.hours.length > 0) - (a.hours.length > 0) || b.c.rating - a.c.rating)
    return { items, count: items.filter((x) => x.hours.length).length, pin: (c) => { const x = items.find((i) => i.c.id === c.id); return { label: short(c.price[q.sport]), hot: !!x?.hours.length } } }
  }, [mode, clubs, q, bookings, joined, lv])
  const count = data.count ?? data.items.length

  // ---------- پنل کشویی با سه حالت ----------
  const box = useRef(null)
  const [H, setH] = useState(720)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  const snapsOf = (h) => ({ full: TOP, half: Math.round(h * 0.5), peek: h - PEEK })
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
  const pick = (id) => { haptic(8); setSel(id); goRef.current('half') }
  const pickRef = useRef(pick); pickRef.current = pick
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: false, zoomSnap: 0.5 }).setView(cityById(q.city).center, cityById(q.city).zoom)
    // اعتبار نقشه بالای صفحه، چون پایین زیر پنل می‌رود
    L.control.attribution({ position: 'topleft', prefix: false }).addTo(m)
    L.tileLayer(TILES, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    pins.current = L.layerGroup().addTo(m)
    m.on('dragstart', () => goRef.current('peek'))
    map.current = m
    const t = setTimeout(() => m.invalidateSize(), 260)
    return () => { clearTimeout(t); m.remove(); map.current = null }
  }, [])
  useEffect(() => { if (active) setTimeout(() => map.current?.invalidateSize(), 60) }, [active])
  useEffect(() => { setSel(null) }, [mode, q.sport, q.city])

  useEffect(() => {
    const g = pins.current; if (!g) return
    g.clearLayers()
    clubs.forEach((c) => {
      const p = data.pin(c)
      const on = sel === c.id
      const html = p ? `<div class="ppin ${on ? 'on' : ''} ${p.hot ? '' : 'full'} m-${mode}">${p.label}</div>` : `<div class="pdot ${on ? 'on' : ''}"></div>`
      L.marker(c.at, { icon: L.divIcon({ className: 'pin-wrap', iconSize: [0, 0], html }), zIndexOffset: on ? 1000 : p?.hot ? 100 : 0 })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); pickRef.current(c.id) }).addTo(g)
    })
  }, [clubs, data, sel, mode])

  // دوربین روی باشگاه‌ها، در بخشی از نقشه که زیر پنل نیست
  const frame = (animate = true) => {
    const m = map.current; if (!m) return
    const h = box.current?.clientHeight || H
    const pts = clubsIn(q.city, null, q.region).map((c) => c.at)
    if (!pts.length) return
    const opts = { paddingTopLeft: [40, 150], paddingBottomRight: [40, Math.round(h * 0.5) + 30], maxZoom: 14 }
    animate ? m.flyToBounds(L.latLngBounds(pts), { ...opts, duration: 0.7 }) : m.fitBounds(L.latLngBounds(pts), opts)
  }
  useEffect(() => { frame(true) }, [q.city, q.region])
  useEffect(() => { const t = setTimeout(() => frame(false), 300); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const m = map.current, c = sel && clubById(sel)
    if (!m || !c) return
    // باشگاه انتخاب‌شده بالای پنل نیمه‌باز قرار می‌گیرد
    const h = box.current?.clientHeight || H
    m.panTo(m.unproject(m.project(c.at).add([0, h * 0.2])), { animate: true })
  }, [sel])

  const where = q.region ? regionById(q.region).name : cityById(q.city).name
  const selClub = sel && clubById(sel)
  const events = mode === 'games' ? [...tournaments('weekend', q.sport, q.city), ...tournaments('official', q.sport, q.city)].sort((a, b) => fromKey(a.date) - fromKey(b.date)).slice(0, 4) : []

  return (
    <div className="explore" ref={box}>
      <div className="map" ref={el} dir="ltr" />

      <div className="ex-top">
        <div className="ex-search">
          <motion.button className="search-cap" whileTap={{ scale: 0.98 }} onClick={() => { haptic(8); setSearch(true) }}>
            <Icon name="search" size={20} stroke={2.4} />
            <span className="grow">
              <b>{sport.name}، {where}</b>
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
            <button key={s.id} className={q.sport === s.id ? 'on' : ''} onClick={() => { haptic(6); setQ({ sport: s.id }) }}>
              <SportGlyph id={s.id} /><span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div className="ex-sheet" style={{ y }}>
        <motion.div className="ex-grip" style={{ touchAction: 'none' }}
          onPanStart={() => { base.current = y.get() }}
          onPan={(_, i) => y.set(Math.max(TOP - 24, Math.min(H - PEEK + 40, base.current + i.offset.y)))}
          onPanEnd={panEnd}
          onTap={() => go(snap === 'full' ? 'half' : 'full')}>
          <i />
          {selClub ? (
            <b className="grip-club">{selClub.name}</b>
          ) : (
            <>
              <b>{count ? MODE[mode].title(count) : MODE[mode].empty}</b>
              <small>{sport.name} در {where}، {mode === 'games' ? `از ${dayLabel(q.date)}` : dayLabel(q.date)}، {part.name}</small>
            </>
          )}
        </motion.div>
        <div className="ex-list" style={{ height: Math.max(0, H - snaps[snap] - 70) }}>
          <AnimatePresence mode="wait" initial={false}>
            {selClub ? (
              <motion.div key={'c' + sel} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }}>
                <ClubPanel c={selClub} mode={mode} q={q} nav={nav} onClose={() => setSel(null)} />
              </motion.div>
            ) : (
              <motion.div key={'l' + mode} className="ex-rows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {mode === 'court' && data.items.map((x) => <ClubRow key={x.c.id} x={x} q={q} nav={nav} onOpen={() => pick(x.c.id)} />)}
                {mode === 'games' && data.items.map((g) => <GameLine key={g.id} g={g} nav={nav} />)}
                {mode === 'coach' && data.items.map(({ m, c }) => <CoachLine key={m.id} m={m} c={c} q={q} nav={nav} />)}
                {!data.items.length && <p className="ex-empty">{MODE[mode].empty}. روز، ساعت یا ناحیه‌ی دیگه رو از جستجو امتحان کن.</p>}
                {events.length > 0 && (
                  <div className="ex-events">
                    <h3>مسابقه‌های پیش رو</h3>
                    {events.map((e) => (
                      <button key={e.id} className="ev-line" onClick={() => nav.open('checkout', { kind: 'event', eventId: e.id, sport: q.sport, clubId: e.clubId, date: e.date })}>
                        <span className="ce-d"><b>{dayNum(fromKey(e.date))}</b><small>{weekday(fromKey(e.date))}</small></span>
                        <span className="grow"><b>{e.title}</b><small>{clubById(e.clubId).name}، {hourLabel(e.start)}، {fa(e.cap - e.taken)} جا</small></span>
                        <em>{short(e.fee)}</em>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

// ردیف باشگاه در حالت زمین: عکس کوچک، اطلاعات، ساعت‌های آزاد
function ClubRow({ x, q, nav, onOpen }) {
  const { c, hours } = x
  return (
    <div className={`crow ${hours.length ? '' : 'full'}`}>
      <button className="crow-main" onClick={onOpen}>
        <Photo src={c.img} className="crow-img" />
        <span className="grow">
          <b>{c.name}</b>
          <small>{c.area}، <Icon name="star" size={11} fill="currentColor" /> {fa(c.rating)}</small>
          <small><b>{short(c.price[q.sport])}</b> هر ساعت</small>
        </span>
        <Icon name="fwd" size={18} />
      </button>
      {hours.length > 0 ? (
        <div className="crow-slots">
          {hours.slice(0, 6).map((h) => (
            <motion.button key={h} whileTap={{ scale: 0.92 }} onClick={() => nav.open('checkout', { kind: 'court', clubId: c.id, sport: q.sport, date: q.date, start: h, dur: 1 })}>{hourLabel(h)}</motion.button>
          ))}
          {hours.length > 6 && <button className="more" onClick={onOpen}>+{fa(hours.length - 6)}</button>}
        </div>
      ) : <small className="crow-none">در این بازه پره</small>}
    </div>
  )
}

function GameLine({ g, nav }) {
  const c = clubById(g.clubId)
  return (
    <motion.button className="gline" whileTap={{ scale: 0.98 }} onClick={() => nav.open('checkout', { kind: 'join', gameId: g.id, sport: g.sport, clubId: g.clubId, date: g.date })}>
      <span className="gl-t"><b>{hourLabel(g.start)}</b><small>{dayLabel(g.date)}</small></span>
      <span className="grow">
        <b>{c.name}</b>
        <span className="gl-meta">{g.levels.map((l) => <LevelPill key={l} id={l} />)}{g.gap === 0 && <em>هم‌سطح تو</em>}</span>
      </span>
      <span className="gl-r">
        <span className="cg-seats">{Array.from({ length: g.total }, (_, k) => <i key={k} className={k < g.players.length ? 'on' : ''} />)}</span>
        <small>{short(g.share)}</small>
      </span>
    </motion.button>
  )
}

function CoachLine({ m, c, q, nav }) {
  return (
    <motion.button className="cline" whileTap={{ scale: 0.98 }} onClick={() => nav.open('checkout', { kind: 'coach', coachId: m.id, sport: q.sport, clubId: c.id, date: q.date })}>
      <Avatar name={m.name} size={48} />
      <span className="grow">
        <b>{m.name} <LevelPill id={m.level} /></b>
        <small>{c.name}، {fa(m.exp)} سال سابقه، ★ {fa(m.rating)}</small>
      </span>
      <span className="cl-p"><b>{short(m.price)}</b><small>هر جلسه</small></span>
    </motion.button>
  )
}

// پنل باشگاه داخل پنل نقشه: رزرو همین‌جا، بدون رفتن به صفحه‌ی دیگر
function ClubPanel({ c, mode, q, nav, onClose }) {
  const { user } = useStore()
  const sid = c.courts[q.sport] ? q.sport : Object.keys(c.courts)[0]
  const [v, setV] = useState({ date: q.date, dur: 1, start: null })
  const set = (p) => setV((x) => ({ ...x, ...p }))
  const games = openMatches({ city: c.city, sport: sid, level: levelOf(user, sid), clubId: c.id })
  const coaches = coachesAt(c, sid)
  const total = v.start != null ? priceFor(c, sid, v.date, v.start, v.dur) : 0
  return (
    <div className="cpanel">
      <div className="cp-head">
        <Photo src={c.img} className="cp-img" />
        <div className="grow">
          <small><Icon name="star" size={12} fill="currentColor" /> {fa(c.rating)} ({fa(c.reviews)})، {c.area}</small>
          <span className="cp-tags"><span>{c.indoor ? 'سرپوشیده' : 'روباز'}</span><span>{fa(c.courts[sid])} زمین</span><span>{short(c.price[sid])}/ساعت</span></span>
        </div>
        <button className="pick-x" onClick={onClose} aria-label="بستن"><Icon name="close" size={16} /></button>
      </div>
      <div className="cp-links">
        <button className="link" onClick={() => nav.open('club', { id: c.id, sport: sid, date: v.date })}>صفحه‌ی کامل باشگاه</button>
        <span>،</span>
        <button className="link" onClick={onClose}>همه‌ی باشگاه‌ها</button>
      </div>

      {mode === 'court' && (
        <>
          <BookBox c={c} sport={sid} v={v} set={set} title={null} />
          <Button full variant="lime" disabled={v.start == null} onClick={() => nav.open('checkout', { kind: 'court', clubId: c.id, sport: sid, date: v.date, start: v.start, dur: v.dur })}>
            {v.start == null ? 'یک ساعت انتخاب کن' : `رزرو ${range(v.start, v.dur)}، ${toman(total)}`}
          </Button>
        </>
      )}
      {mode === 'games' && (
        <div className="ex-rows">
          {games.map((g) => <GameLine key={g.id} g={g} nav={nav} />)}
          {!games.length && <p className="ex-empty">فعلاً بازی بازی اینجا نیست.</p>}
        </div>
      )}
      {mode === 'coach' && (
        <div className="ex-rows">
          {coaches.map((m) => <CoachLine key={m.id} m={m} c={c} q={{ ...q, sport: sid }} nav={nav} />)}
          {!coaches.length && <p className="ex-empty">این باشگاه مربی {sportById(sid).name} نداره.</p>}
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
            <b>جستجو</b>
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
            <motion.button className="sp-go" whileTap={{ scale: 0.96 }} onClick={() => onApply(d)}><Icon name="search" size={18} stroke={2.6} /> نمایش روی نقشه</motion.button>
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
