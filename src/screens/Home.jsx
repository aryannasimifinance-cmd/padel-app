import { motion, useScroll, useTransform } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CITIES, SPORTS, activityById, clubById, dayLabel, dayMonth, fa, fromKey, hourLabel, openMatches, rankOf, sportById, toman, tournaments } from '../data'
import { celebrate, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Button, CountUp, Icon, LevelPill, Photo, Sheet, rise, stagger } from '../components/ui'

export default function Home({ onStart, onTab, scrollRef }) {
  const { user, xp, bookings, notifications, updateUser } = useStore()
  const rank = rankOf(xp)
  const unread = notifications.filter((n) => !n.read).length
  const upcoming = bookings.filter((b) => fromKey(b.date) >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.start - b.start)
  const { scrollY } = useScroll({ container: scrollRef })
  const heroY = useTransform(scrollY, [0, 300], [0, 60])
  const heroS = useTransform(scrollY, [0, 300], [1, 1.12])
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'صبح بخیر' : hour < 17 ? 'روز بخیر' : 'عصر بخیر'
  const city = CITIES.find((c) => c.id === user.city)

  return (
    <motion.div className="home" variants={stagger} initial="hidden" animate="show">
      <motion.header className="home-head" variants={rise}>
        <div>
          <small className="muted">{hello} 👋</small>
          <h1>{user.name.split(' ')[0]}</h1>
        </div>
        <div className="head-r">
          <motion.button className="city-pill" whileTap={{ scale: 0.92 }} onClick={() => { haptic(8); updateUser({ city: user.city === 'tehran' ? 'karaj' : 'tehran' }) }}>
            <Icon name="pin" size={16} /> {city.name}
          </motion.button>
          <motion.button className="icon-btn bell" whileTap={{ scale: 0.85 }} onClick={() => onTab('notifs')} aria-label="اعلان‌ها">
            <Icon name="bell" />
            {unread > 0 && <motion.span className="badge-dot" key={unread} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}>{fa(unread)}</motion.span>}
          </motion.button>
        </div>
      </motion.header>

      <motion.div variants={rise} className="rank-card" onClick={() => onTab('profile')}>
        <Ring progress={rank.progress} />
        <div className="grow">
          <small>رتبه</small>
          <b>{rank.name}</b>
          <div className="xpbar"><motion.i initial={{ width: 0 }} animate={{ width: `${rank.progress * 100}%` }} transition={{ duration: 1.2, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }} /></div>
          <small className="muted">{rank.next ? <><CountUp to={xp} /> / {fa(rank.next.xp)} تا «{rank.next.name}»</> : 'به اوج رسیدی!'}</small>
        </div>
        <div className="rank-lv"><LevelPill id={user.level} big /><small>سطح</small></div>
      </motion.div>

      <motion.div variants={rise} className="hero" onClick={() => onStart({})}>
        <motion.div className="hero-media" style={{ y: heroY, scale: heroS }}>
          <Photo src="./img/padel-aerial.jpg" />
        </motion.div>
        <div className="hero-shade" />
        <div className="hero-txt">
          <span className="eyebrow">رزرو در ۴ قدم</span>
          <h2>زمین آزاد پیدا کن،<br />تیمت رو بچین.</h2>
          <motion.span className="hero-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
            رزرو جدید <Icon name="plus" size={18} stroke={2.6} />
          </motion.span>
        </div>
        <div className="hero-shine" />
      </motion.div>

      <motion.section variants={rise}>
        <div className="sec-h"><h3>یه راست برو سراغ</h3></div>
        <div className="quick">
          {SPORTS.map((s) => (
            <motion.button key={s.id} className="quick-s" whileTap={{ scale: 0.9 }} whileHover={{ y: -3 }} onClick={() => onStart({ sport: s.id, format: s.formats[0].id })} style={{ '--c': s.color }}>
              <Photo src={s.img} />
              <span>{s.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {upcoming[0] && (
        <motion.section variants={rise}>
          <div className="sec-h"><h3>بازی بعدی‌ات</h3><button className="link" onClick={() => onTab('matches')}>همه</button></div>
          <NextUp b={upcoming[0]} onClick={() => onTab('matches')} />
        </motion.section>
      )}

      <OpenFeed />

      <WeekendTeaser onStart={onStart} />
    </motion.div>
  )
}

function Ring({ progress }) {
  const r = 26, c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="ring">
      <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,.12)" strokeWidth="6" fill="none" />
      <motion.circle cx="32" cy="32" r={r} stroke="var(--lime)" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - progress) }} transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
        transform="rotate(-90 32 32)" />
      <text x="32" y="38" textAnchor="middle" fontSize="18">🎾</text>
    </svg>
  )
}

export function NextUp({ b, onClick }) {
  const s = sportById(b.sport), c = clubById(b.clubId), d = fromKey(b.date)
  const empty = b.players?.filter((p) => !p.name).length || 0
  return (
    <motion.div className="next" whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <div className="next-date"><small>{dayLabel(d)}</small><b>{hourLabel(b.start)}</b></div>
      <div className="grow">
        <b>{b.title || `${activityById(b.kind).name} ${s.name}`}</b>
        <p className="muted">{c.name} · {c.area}</p>
        {b.players && b.players.length > 1 && (
          <div className="mini-av">
            {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={26} /> : <span key={k} className="mini-empty" />))}
            {empty > 0 && b.open && <span className="searching-tag"><i /> دنبال {fa(empty)} نفر</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function OpenFeed() {
  const { user, bookings, addBooking, notify } = useStore()
  const [sel, setSel] = useState(null)
  const joined = new Set(bookings.map((b) => b.sourceId))
  const list = useMemo(() => openMatches(user.city, user.level), [user.city, user.level])
    .filter((m) => !joined.has(m.id) && (user.sports?.length ? user.sports.includes(m.sport) : true)).slice(0, 10)
  const join = (m) => {
    const club = clubById(m.clubId)
    const players = [...m.players, { name: user.name, level: user.level, me: true }]
    while (players.length < m.total) players.push({})
    addBooking({ id: 'b' + Date.now(), sourceId: m.id, kind: 'game', joined: true, sport: m.sport, clubId: m.clubId, date: m.date, start: m.start, duration: m.duration, total: m.total, players, levels: m.levels, open: players.some((p) => !p.name), price: m.price * m.total, share: m.price, court: 2, createdAt: Date.now() }, 40)
    notify({ icon: '🤝', title: 'به بازی پیوستی', body: `${sportById(m.sport).name} · ${club.name} · ${dayLabel(fromKey(m.date))} ساعت ${hourLabel(m.start)}` })
    celebrate(); chime('success'); haptic([20, 40, 20])
    setSel(null)
  }
  if (!list.length) return null
  return (
    <motion.section variants={rise}>
      <div className="sec-h"><h3>بازی‌های باز هم‌سطح تو</h3><span className="live"><i /> زنده</span></div>
      <div className="feed">
        {list.map((m, k) => {
          const s = sportById(m.sport), c = clubById(m.clubId), d = fromKey(m.date)
          const empty = m.total - m.players.length
          return (
            <motion.button key={m.id} className="om" style={{ '--c': s.color }} whileTap={{ scale: 0.96 }} onClick={() => { haptic(8); setSel(m) }}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.05 }}>
              <div className="om-top">
                <span className="om-sport">{s.name}</span>
                <span className="om-lv">{m.levels.map((l) => <LevelPill key={l} id={l} />)}</span>
              </div>
              <b>{dayLabel(d)} · {hourLabel(m.start)}</b>
              <p>{c.name} · {c.area}</p>
              <div className="om-av">
                {m.players.map((p) => <Avatar key={p.id} name={p.name} size={30} />)}
                {Array.from({ length: empty }, (_, i) => <span key={i} className="om-empty" />)}
              </div>
              <div className="om-foot"><span>{fa(empty)} جای خالی</span><b>{toman(m.price)}</b></div>
            </motion.button>
          )
        })}
      </div>
      <Sheet open={!!sel} onClose={() => setSel(null)} title="پیوستن به بازی">
        {sel && (
          <div className="join">
            <Photo src={clubById(sel.clubId).img} className="td-img" />
            <h3>{sportById(sel.sport).name} · {clubById(sel.clubId).name}</h3>
            <p className="muted">{dayLabel(fromKey(sel.date))} {dayMonth(fromKey(sel.date))} · {hourLabel(sel.start)} تا {hourLabel(sel.start + sel.duration)}</p>
            <div className="join-p">
              {sel.players.map((p) => (
                <div key={p.id}><Avatar name={p.name} size={48} /><span>{p.name}</span><LevelPill id={p.level} /><small className="muted">{fa(p.games)} بازی</small></div>
              ))}
              <div><Avatar name={user.name} me size={48} /><span>شما</span><LevelPill id={user.level} /></div>
            </div>
            <Button full variant="lime" onClick={() => join(sel)}>بپیوند · {toman(sel.price)}</Button>
          </div>
        )}
      </Sheet>
    </motion.section>
  )
}

function WeekendTeaser({ onStart }) {
  const { user } = useStore()
  const sport = user.sports?.[0] || 'padel'
  const t = tournaments('weekend', sport, user.city)[0]
  if (!t) return null
  const c = clubById(t.clubId)
  return (
    <motion.section variants={rise}>
      <div className="sec-h"><h3>این آخر هفته</h3></div>
      <motion.div className="teaser" whileTap={{ scale: 0.98 }} onClick={() => onStart({ sport, activity: 'weekend', format: sportById(sport).formats[0].id })}>
        <Photo src="./img/ball-space.jpg" />
        <div className="teaser-shade" />
        <div className="teaser-txt">
          <span className="eyebrow">🏆 مسابقه {sportById(sport).name}</span>
          <h3>{t.title}</h3>
          <p>{c.name} · {dayMonth(fromKey(t.date))} · {fa(t.cap - t.taken)} جای خالی</p>
        </div>
        <span className="teaser-go">ثبت‌نام</span>
      </motion.div>
    </motion.section>
  )
}
