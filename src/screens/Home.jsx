import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CITIES, CLUBS, clubById, dayLabel, dayMonth, fa, fromKey, hourLabel, levelOf, openMatches, rankOf, sportById, todayKey, toman, tournaments } from '../data'
import { haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Chips, CountUp, Icon, LevelPill, SecHead, rise, stagger } from '../components/ui'
import { CourtArt } from '../components/Art'
import { ClubCard } from './Explore'
import { GameCard } from './wizard/Wizard'

export default function Home({ nav }) {
  const { user, xp, bookings, notifications, updateUser } = useStore()
  const rank = rankOf(xp)
  const unread = notifications.filter((n) => !n.read).length
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && fromKey(b.date) >= today).sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.start - b.start)
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'صبح بخیر' : hour < 17 ? 'روز بخیر' : 'عصر بخیر'
  const city = CITIES.find((c) => c.id === user.city)
  const sports = user.sports?.length ? user.sports : ['padel']

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
          <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => nav.open('notifs')} aria-label="اعلان‌ها">
            <Icon name="bell" />
            {unread > 0 && <motion.span className="badge-dot" key={unread} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}>{fa(unread)}</motion.span>}
          </motion.button>
        </div>
      </motion.header>

      <motion.div variants={rise} className="poster">
        <CourtArt className="poster-art" bounce={false} />
        <div className="poster-txt">
          <span className="eyebrow">{fa(CLUBS.filter((c) => c.city === user.city).length)} باشگاه در {city.name}</span>
          <h2>امروز کجا<br />بازی کنیم؟</h2>
          <div className="poster-btns">
            <motion.button className="pb pb-ink" whileTap={{ scale: 0.95 }} onClick={() => nav.tab('explore')}><Icon name="map" size={18} /> روی نقشه</motion.button>
            <motion.button className="pb" whileTap={{ scale: 0.95 }} onClick={() => nav.start({})}><Icon name="bolt" size={18} /> رزرو سریع</motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={rise} className="my-levels">
        {sports.map((id) => {
          const s = sportById(id)
          return (
            <motion.button key={id} className="my-lv" style={{ '--c': s.color }} whileTap={{ scale: 0.94 }} onClick={() => nav.start({ sport: id })}>
              <i /><span>{s.name}</span><LevelPill id={levelOf(user, id)} />
            </motion.button>
          )
        })}
        <button className="my-lv xp" onClick={() => nav.tab('me')}>
          <span>{rank.name}</span><b><CountUp to={xp} /> XP</b>
        </button>
      </motion.div>

      {upcoming[0] && (
        <motion.section variants={rise}>
          <SecHead n={1} title="بازی بعدی‌ات"><button className="link" onClick={() => nav.tab('games')}>همه</button></SecHead>
          <NextUp b={upcoming[0]} onClick={() => nav.tab('games')} />
        </motion.section>
      )}

      <OpenFeed nav={nav} sports={sports} />

      <motion.section variants={rise}>
        <SecHead n={3} title={`محبوب‌های ${city.name}`}><button className="link" onClick={() => nav.tab('explore')}>نقشه</button></SecHead>
        <div className="rail">
          {CLUBS.filter((c) => c.city === user.city && sports.some((s) => c.courts[s])).sort((a, b) => b.rating - a.rating).slice(0, 6).map((c) => (
            <ClubCard key={c.id} c={c} sport={sports.find((s) => c.courts[s])} onClick={() => nav.open('club', { id: c.id, sport: sports.find((s) => c.courts[s]) })} />
          ))}
        </div>
      </motion.section>

      <WeekendTeaser nav={nav} sport={sports[0]} />
    </motion.div>
  )
}

export function NextUp({ b, onClick }) {
  const s = sportById(b.sport), c = clubById(b.clubId), d = fromKey(b.date)
  const empty = b.players?.filter((p) => !p.name).length || 0
  const name = { court: 'رزرو زمین', open: 'بازی باز', join: 'بازی باز', coach: 'کلاس با مربی', event: b.title }[b.kind]
  return (
    <motion.div className="next" whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <div className="next-date"><small>{dayLabel(d)}</small><b>{hourLabel(b.start)}</b></div>
      <div className="grow">
        <b>{name}، {s.name}</b>
        <p className="muted">{c.name}، زمین {fa(b.court)}</p>
        {b.players && b.players.length > 1 && (
          <div className="mini-av">
            {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={24} /> : <span key={k} className="mini-empty" />))}
            {empty > 0 && b.open && <span className="searching-tag"><i /> دنبال {fa(empty)} نفر</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function OpenFeed({ nav, sports }) {
  const { user, joined } = useStore()
  const [sport, setSport] = useState(sports[0])
  const list = useMemo(() => openMatches({ city: user.city, sport, level: levelOf(user, sport) }), [user.city, sport, user.levels])
    .filter((m) => !joined.includes(m.id) && m.gap <= 1).slice(0, 8)
  return (
    <motion.section variants={rise}>
      <SecHead n={2} title="بازی‌های باز هم‌سطح تو"><span className="live"><i /> زنده</span></SecHead>
      {sports.length > 1 && <Chips id="feed-sport" small scroll value={sport} onChange={setSport} options={sports.map((id) => ({ id, name: sportById(id).name, color: sportById(id).color }))} />}
      {list.length ? (
        <div className="rail">
          {list.map((g) => (
            <div key={g.id} className="rail-game">
              <GameCard g={g} onClick={() => nav.start({ intent: 'match', sport: g.sport, clubId: g.clubId, date: g.date, gameId: g.id })} />
            </div>
          ))}
        </div>
      ) : <p className="muted">فعلاً بازی بازی نیست — خودت یکی بساز!</p>}
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
      <SecHead n={4} title="این آخر هفته" />
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
