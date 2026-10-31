import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES, REGIONS, SPORTS, clubSports, clubsIn, cityById, fa, regionById, short, sportById } from '../data'
import { haptic } from '../fx'
import { useStore } from '../store'
import { Chips, Icon, Photo } from '../components/ui'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// بازارچه‌ی باشگاه‌ها روی نقشه: شهر و ناحیه را انتخاب کن، باشگاه‌ها را ببین
export default function Explore({ nav, embed }) {
  const { user, updateUser } = useStore()
  const [city, setCity] = useState(user.city)
  const [region, setRegion] = useState(null)
  const [sport, setSport] = useState(null)
  const [sel, setSel] = useState(null)
  const el = useRef(null), map = useRef(null), layers = useRef({ regions: null, pins: null }), rail = useRef(null)
  const clubs = useMemo(() => clubsIn(city, sport, region), [city, sport, region])

  // ساخت نقشه یک بار
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(cityById(city).center, cityById(city).zoom)
    L.tileLayer(TILES, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    m.attributionControl.setPrefix(false)
    layers.current.regions = L.layerGroup().addTo(m)
    layers.current.pins = L.layerGroup().addTo(m)
    map.current = m
    const t = setTimeout(() => m.invalidateSize(), 260)
    return () => { clearTimeout(t); m.remove(); map.current = null }
  }, [])

  // ناحیه‌ها: دایره‌های خط‌چین با برچسب؛ کلیک = فیلتر
  useEffect(() => {
    const g = layers.current.regions; if (!g) return
    g.clearLayers()
    REGIONS.filter((r) => r.city === city).forEach((r) => {
      const on = region === r.id
      const n = clubsIn(city, sport, r.id).length
      const c = L.circle(r.center, { radius: r.r, color: on ? '#111311' : '#6b6e66', weight: on ? 2 : 1.2, dashArray: on ? null : '4 6', fillColor: on ? '#D4FF3F' : '#111311', fillOpacity: on ? 0.22 : 0.03 })
      c.bindTooltip(`<b>${r.name}</b><small>${fa(n)} باشگاه</small>`, { permanent: true, direction: 'center', className: `region-tip ${on ? 'on' : ''}` })
      c.on('click', () => { haptic(8); setRegion(on ? null : r.id); setSel(null) })
      c.addTo(g)
    })
  }, [city, region, sport])

  // پین باشگاه‌ها — رنگ‌ها = رشته‌های هر باشگاه
  useEffect(() => {
    const g = layers.current.pins; if (!g) return
    g.clearLayers()
    clubs.forEach((c) => {
      const cols = clubSports(c).map((s) => s.color)
      const ring = cols.map((col, i) => `${col} ${(i / cols.length) * 100}% ${((i + 1) / cols.length) * 100}%`).join(',')
      const on = sel === c.id
      const icon = L.divIcon({
        className: 'pin-wrap',
        iconSize: [0, 0],
        html: `<div class="pin ${on ? 'on' : ''}"><i style="background:conic-gradient(${ring})"></i><b>${c.name}</b></div>`,
      })
      L.marker(c.at, { icon, zIndexOffset: on ? 1000 : 0 }).on('click', () => { haptic(8); setSel(c.id) }).addTo(g)
    })
  }, [clubs, sel])

  // جابه‌جایی دوربین
  useEffect(() => { map.current?.flyTo(cityById(city).center, cityById(city).zoom, { duration: 0.8 }) }, [city])
  useEffect(() => {
    const r = region && regionById(region)
    if (r && map.current) map.current.flyToBounds(L.latLng(r.center).toBounds(r.r * 2.6), { duration: 0.7 })
  }, [region])
  useEffect(() => {
    if (!sel) return
    const c = clubs.find((x) => x.id === sel)
    if (c) map.current?.panTo(c.at, { animate: true })
    rail.current?.querySelector(`[data-id="${sel}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [sel])

  const pickCity = (id) => { setCity(id); setRegion(null); setSel(null); if (id !== user.city) updateUser({ city: id }) }
  const regions = REGIONS.filter((r) => r.city === city)

  return (
    <div className={`explore ${embed ? 'embed' : ''}`}>
      <div className="map" ref={el} dir="ltr" />
      <div className="map-top">
        <div className="map-bar">
          <div className="seg">
            {CITIES.map((c) => (
              <button key={c.id} className={city === c.id ? 'on' : ''} onClick={() => { haptic(6); pickCity(c.id) }}>
                {city === c.id && <motion.span layoutId="seg-city" className="seg-bg" />}<span>{c.name}</span>
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => { setRegion(null); setSel(null); map.current?.flyTo(cityById(city).center, cityById(city).zoom) }} aria-label="کل شهر"><Icon name="locate" size={20} /></button>
        </div>
        <Chips id="ex-sport" scroll small value={sport || 'all'} onChange={(id) => { setSport(id === 'all' ? null : id); setSel(null) }}
          options={[{ id: 'all', name: 'همه رشته‌ها' }, ...SPORTS.map((s) => ({ id: s.id, name: s.name, color: s.color }))]} />
        <Chips id="ex-reg" scroll small value={region || 'all'} onChange={(id) => { setRegion(id === 'all' ? null : id); setSel(null) }}
          options={[{ id: 'all', name: 'همه ناحیه‌ها' }, ...regions.map((r) => ({ id: r.id, name: r.name }))]} />
      </div>
      <div className="map-rail" ref={rail}>
        <div className="rail-count">
          <b>{fa(clubs.length)}</b><small>باشگاه {region ? `در ${regionById(region).name}` : `در ${cityById(city).name}`}</small>
        </div>
        {clubs.map((c) => <ClubCard key={c.id} c={c} on={sel === c.id} sport={sport} onClick={() => (sel === c.id ? nav.open('club', { id: c.id, sport }) : setSel(c.id))} />)}
        {!clubs.length && <div className="rail-empty">اینجا باشگاهی با این رشته نیست — ناحیه یا رشته‌ی دیگه رو امتحان کن.</div>}
      </div>
    </div>
  )
}

export function ClubCard({ c, on, sport, onClick, wide }) {
  const sp = clubSports(c)
  const from = Math.min(...sp.filter((s) => !sport || s.id === sport).map((s) => c.price[s.id]))
  const tone = sportById(sport)?.color || sp[0].color
  return (
    <motion.button data-id={c.id} className={`club-card ${on ? 'on' : ''} ${wide ? 'wide' : ''}`} whileTap={{ scale: 0.97 }} onClick={onClick}>
      <Photo src={c.img} tone={tone} />
      <div className="cc-body">
        <b>{c.name}</b>
        <small><Icon name="pin" size={12} /> {c.area}، <Icon name="star" size={12} fill="currentColor" /> {fa(c.rating)}</small>
        <div className="cc-foot">
          <span className="cc-sports">{sp.map((s) => <i key={s.id} style={{ background: s.color }} title={s.name} />)}</span>
          <em>از {short(from)}</em>
        </div>
      </div>
      {on && <span className="cc-go">مشاهده باشگاه <Icon name="fwd" size={14} /></span>}
    </motion.button>
  )
}
