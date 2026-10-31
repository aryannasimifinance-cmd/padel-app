import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CITIES, CLUBS, DAYPARTS, addDays, clubById, courtsOf, dayLabel, dayMonth, fa, fromKey, hourLabel, levelOf, openMatches, rankOf, short, sportById, todayKey, toman, tournaments, weekday } from '../data'
import { haptic } from '../fx'
import { isFree, useStore } from '../store'
import { Avatar, CountUp, Icon, LevelPill, Photo, rise, stagger } from '../components/ui'

// خانه به شکل یک «روزنامه‌ی ورزشی»: تیتر روز، نمودار ساعت‌های خالی، تابلوی بازی‌ها، فهرست باشگاه‌ها
export default function Home({ nav }) {
  const { user, xp, bookings, notifications, updateUser } = useStore()
  const rank = rankOf(xp)
  const unread = notifications.filter((n) => !n.read).length
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && fromKey(b.date) >= today).sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.start - b.start)
  const city = CITIES.find((c) => c.id === user.city)
  const sports = user.sports?.length ? user.sports : ['padel']
  const [sport, setSport] = useState(sports[0])
  const tide = useTide(bookings, user.city, sport)
  const total = tide.hours.reduce((s, x) => s + x.n, 0)

  return (
    <motion.div className="home" variants={stagger} initial="hidden" animate="show">
      <motion.header className="mast" variants={rise}>
        <div className="mast-top">
          <span className="mast-date">{weekday(today)}، {dayMonth(today)}</span>
          <motion.button className="city-pill" whileTap={{ scale: 0.92 }} onClick={() => { haptic(8); updateUser({ city: user.city === 'tehran' ? 'karaj' : 'tehran' }) }}>
            <Icon name="pin" size={15} /> {city.name}
          </motion.button>
          <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => nav.open('notifs')} aria-label="اعلان‌ها">
            <Icon name="bell" />
            {unread > 0 && <motion.span className="badge-dot" key={unread} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}>{fa(unread)}</motion.span>}
          </motion.button>
        </div>
        <h1 className="mast-h">
          سلام {user.name.split(' ')[0]}،<br />
          {tide.tomorrow ? 'فردا' : 'امروز'} <mark><CountUp to={total} /> ساعت</mark> زمین خالیه.
        </h1>
        <div className="mast-sub">
          {sports.map((id) => {
            const s = sportById(id)
            return (
              <button key={id} className={`sp-tab ${sport === id ? 'on' : ''}`} style={{ '--c': s.color }} onClick={() => { haptic(6); setSport(id) }}>
                <i />{s.name}<LevelPill id={levelOf(user, id)} />
              </button>
            )
          })}
        </div>
      </motion.header>

      <motion.section variants={rise} className="tide-wrap">
        <div className="tide" key={sport + user.city}>
          {tide.hours.map((x, k) => (
            <button key={x.h} className={`tide-col ${x.peak ? 'peak' : ''} ${x.past ? 'past' : ''}`} disabled={!x.n}
              onClick={() => { haptic(8); nav.start({ sport, date: tide.date, daypart: DAYPARTS.find((d) => d.id !== 'any' && x.h >= d.from && x.h < d.to)?.id || 'any' }) }}>
              <small>{x.past ? '' : fa(x.n)}</small>
              <span className="tide-bar">
                <motion.i style={{ height: `${(x.n / tide.max) * 100}%`, '--c': sportById(sport).color }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: 0.15 + k * 0.035, type: 'spring', stiffness: 220, damping: 20 }} />
              </span>
              <b>{fa(x.h)}</b>
            </button>
          ))}
        </div>
        <div className="tide-foot">
          <span><i className="lg" /> تعداد زمین آزاد</span>
          <span><i className="lg pk" /> ساعت پیک</span>
          <button className="link" onClick={() => nav.tab('explore')}><Icon name="map" size={15} /> روی نقشه</button>
        </div>
      </motion.section>

      {upcoming[0] && (
        <motion.section variants={rise}>
          <Head title="بازی بعدی‌ات" action="همه" onAction={() => nav.tab('games')} />
          <NextUp b={upcoming[0]} onClick={() => nav.tab('games')} />
        </motion.section>
      )}

      <OpenFeed nav={nav} sport={sport} />

      <motion.section variants={rise}>
        <Head title={`محبوب‌های ${city.name}`} action="نقشه" onAction={() => nav.tab('explore')} />
        <ol className="toplist">
          {CLUBS.filter((c) => c.city === user.city && c.courts[sport]).sort((a, b) => b.rating - a.rating).slice(0, 5).map((c, k) => (
            <motion.li key={c.id} whileTap={{ scale: 0.98 }} onClick={() => nav.open('club', { id: c.id, sport })}>
              <span className="tl-n">{fa(k + 1)}</span>
              <Photo src={c.img} tone={sportById(sport).color} className="tl-img" />
              <div className="grow"><b>{c.name}</b><small>{c.area}، {fa(c.courts[sport])} زمین، ★ {fa(c.rating)}</small></div>
              <span className="tl-price">{short(c.price[sport])}<small>هر ساعت</small></span>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      <WeekendTeaser nav={nav} sport={sport} />

      <motion.button variants={rise} className="xp-strip" onClick={() => nav.tab('me')}>
        <span>{rank.name}</span>
        <i><motion.b initial={{ width: 0 }} animate={{ width: `${rank.progress * 100}%` }} transition={{ delay: 0.4, duration: 1 }} /></i>
        <span dir="ltr"><CountUp to={xp} /> XP</span>
      </motion.button>
    </motion.div>
  )
}

export function Head({ title, action, onAction, children }) {
  return (
    <div className="hd">
      <h2>{title}</h2>
      {children}
      {action && <button className="link" onClick={onAction}>{action}</button>}
    </div>
  )
}

// تعداد زمین‌های آزاد هر ساعت در کل شهر، برای امروز (یا فردا اگر دیروقت است)
function useTide(bookings, city, sport) {
  return useMemo(() => {
    const now = new Date().getHours()
    const tomorrow = now >= 20
    const date = tomorrow ? addDays(todayKey(), 1) : todayKey()
    const clubs = CLUBS.filter((c) => c.city === city && c.courts[sport])
    const hours = []
    for (let h = 8; h < 24; h++) {
      const past = !tomorrow && h <= now
      const n = past ? 0 : clubs.reduce((s, c) => s + courtsOf(c, sport).filter((ct) => isFree(bookings, c, sport, ct.id, date, h, 1)).length, 0)
      hours.push({ h, n, past, peak: h >= 17 })
    }
    return { date, tomorrow, hours, max: Math.max(1, ...hours.map((x) => x.n)) }
  }, [bookings, city, sport])
}

// بلیت بازی بعدی — با لبه‌ی سوراخ‌دار
export function NextUp({ b, onClick }) {
  const s = sportById(b.sport), c = clubById(b.clubId), d = fromKey(b.date)
  const empty = b.players?.filter((p) => !p.name).length || 0
  const name = { court: 'رزرو زمین', open: 'بازی باز', join: 'بازی باز', coach: 'کلاس با مربی', event: b.title }[b.kind]
  return (
    <motion.div className="ticket" whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <div className="tk-main">
        <span className="tk-kind">{name}، {s.name}</span>
        <b>{c.name}</b>
        <small>{c.area}، زمین {fa(b.court)}</small>
        {b.players && b.players.length > 1 && (
          <div className="mini-av">
            {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={24} /> : <span key={k} className="mini-empty" />))}
            {empty > 0 && b.open && <span className="searching-tag"><i /> دنبال {fa(empty)} نفر</span>}
          </div>
        )}
      </div>
      <div className="tk-stub">
        <small>{dayLabel(d)}</small>
        <b>{hourLabel(b.start)}</b>
        <small>{dayMonth(d)}</small>
      </div>
    </motion.div>
  )
}

// تابلوی بازی‌های باز — مثل تابلوی پروازهای فرودگاه
function OpenFeed({ nav, sport }) {
  const { user, joined } = useStore()
  const list = useMemo(() => openMatches({ city: user.city, sport, level: levelOf(user, sport) }), [user.city, sport, user.levels])
    .filter((m) => !joined.includes(m.id) && m.gap <= 1).slice(0, 6)
  return (
    <motion.section variants={rise}>
      <Head title="بازی‌های باز هم‌سطح تو"><span className="live"><i /> زنده</span></Head>
      {list.length ? (
        <div className="dep">
          {list.map((g, k) => {
            const c = clubById(g.clubId)
            return (
              <motion.button key={g.id} className="dep-row" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.05 }}
                onClick={() => nav.start({ intent: 'match', sport: g.sport, clubId: g.clubId, date: g.date, gameId: g.id })}>
                <span className="dep-t"><b>{hourLabel(g.start)}</b><small>{dayLabel(g.date)}</small></span>
                <span className="grow"><b>{c.name}</b><small>{c.area}، سهم هر نفر {short(g.share)}</small></span>
                <span className="dep-r">
                  <span className="dep-seats">{Array.from({ length: g.total }, (_, j) => <i key={j} className={j < g.players.length ? 'on' : ''} />)}</span>
                  <small>{fa(g.total - g.players.length)} جای خالی</small>
                </span>
              </motion.button>
            )
          })}
        </div>
      ) : <p className="muted">فعلاً بازی بازی نیست، خودت یکی بساز!</p>}
    </motion.section>
  )
}

function WeekendTeaser({ nav, sport }) {
  const { user } = useStore()
  const t = tournaments('weekend', sport, user.city)[0]
  if (!t) return null
  const c = clubById(t.clubId)
  return (
    <motion.section variants={rise}>
      <motion.button className="teaser" whileTap={{ scale: 0.98 }} onClick={() => nav.start({ intent: 'event', sport })} style={{ '--c': sportById(sport).color }}>
        <span className="teaser-n">{dayMonth(fromKey(t.date))}</span>
        <div className="grow">
          <span className="eyebrow">🏆 مسابقه {sportById(sport).name}{t.date === todayKey() ? '، امروز' : ''}</span>
          <h3>{t.title}</h3>
          <p>{c.name}، {fa(t.cap - t.taken)} جای خالی، {toman(t.fee)}</p>
        </div>
        <span className="teaser-go">ثبت‌نام</span>
      </motion.button>
    </motion.section>
  )
}
