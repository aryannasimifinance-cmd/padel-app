import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { clubById, clubSports, coachesAt, courtsOf, fa, hourLabel, levelOf, openMatches, regionById, short, sportById, todayKey, toman, tournaments } from '../data'
import { haptic } from '../fx'
import { freeHours, useStore } from '../store'
import { Avatar, Chips, Icon, LevelPill, Photo, SecHead, rise, stagger } from '../components/ui'

export const INTENTS = [
  { id: 'court', name: 'رزرو زمین', desc: 'تک جلسه یا پکیج ۵ و ۱۰ جلسه؛ جای خالی رو با هم‌سطح پر می‌کنیم', icon: 'cal', xp: 50 },
  { id: 'match', name: 'پیوستن به بازی', desc: 'یار نداری؟ به بازی باز هم‌سطح خودت بپیوند', icon: 'bolt', xp: 40 },
  { id: 'coach', name: 'کلاس با مربی', desc: 'تک جلسه، پکیج یا گروهی', icon: 'coach', xp: 40 },
  { id: 'event', name: 'مسابقات', desc: 'آخر هفته‌ها دوستانه، تورنمنت رسمی', icon: 'trophy', xp: 80 },
]

export default function Club({ id, sport: pre, nav, onBack }) {
  const { user, bookings } = useStore()
  const c = clubById(id)
  const sports = clubSports(c)
  const [sport, setSport] = useState(pre && c.courts[pre] ? pre : (sports.find((s) => user.sports?.includes(s.id)) || sports[0]).id)
  const s = sportById(sport)
  const today = todayKey()
  const hours = useMemo(() => freeHours(bookings, c, sport, today), [bookings, sport])
  const games = openMatches({ city: c.city, sport, level: levelOf(user, sport), clubId: c.id })
  const coaches = coachesAt(c, sport)
  const events = [...tournaments('weekend', sport, c.city, c.id), ...tournaments('official', sport, c.city, c.id)]
  const start = (intent, extra = {}) => nav.start({ clubId: c.id, sport, intent, ...extra })

  return (
    <motion.div className="club-page" style={{ '--sc': s.color }} variants={stagger} initial="hidden" animate="show">
      <div className="club-cover">
        <Photo src={c.img} tone={s.color} />
        <button className="icon-btn glass" onClick={onBack} aria-label="بازگشت"><Icon name="back" /></button>
        <div className="club-cover-txt">
          <span className="club-region">{regionById(c.region).name}، {c.area}</span>
          <h1>{c.name}</h1>
          <p><Icon name="star" size={14} fill="currentColor" /> {fa(c.rating)} <small>({fa(c.reviews)} نظر)</small>، {c.indoor ? 'سرپوشیده' : 'روباز'}</p>
        </div>
      </div>

      <div className="club-in">
        {sports.length > 1 && (
          <motion.div variants={rise}>
            <Chips id="club-sport" value={sport} onChange={setSport} options={sports.map((x) => ({ id: x.id, name: x.name, color: x.color, sub: `${fa(c.courts[x.id])} زمین` }))} />
          </motion.div>
        )}

        <motion.div variants={rise} className="club-facts">
          <div><b>{fa(c.courts[sport])}</b><small>زمین {s.name}</small></div>
          <div><b>{short(c.price[sport])}</b><small>هر ساعت</small></div>
          <div><b>{fa(hours.length)}</b><small>ساعت آزاد امروز</small></div>
        </motion.div>

        <motion.section variants={rise}>
          <SecHead n={1} title="چی می‌خوای؟" />
          <div className="intents">
            {INTENTS.map((t, k) => (
              <motion.button key={t.id} className={`intent ${k === 0 ? 'big' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => { haptic(10); start(t.id) }}>
                <span className="intent-ic"><Icon name={t.icon} size={k === 0 ? 26 : 22} /></span>
                <div className="grow"><b>{t.name}</b><small>{t.desc}</small></div>
                <span className="intent-xp">+{fa(t.xp)}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section variants={rise}>
          <SecHead n={2} title="امروز آزاده" />
          {hours.length ? (
            <div className="hours">
              {hours.map((h) => (
                <motion.button key={h} className="hour" whileTap={{ scale: 0.9 }} onClick={() => start('court', { date: today, daypart: h < 12 ? 'morning' : h < 17 ? 'noon' : h < 21 ? 'evening' : 'night' })}>{hourLabel(h)}</motion.button>
              ))}
            </div>
          ) : <p className="muted">امروز ساعت آزادی نمونده — روزهای بعد رو در «رزرو زمین» ببین.</p>}
        </motion.section>

        {games.length > 0 && (
          <motion.section variants={rise}>
            <SecHead n={3} title="بازی‌های باز اینجا"><button className="link" onClick={() => start('match')}>همه</button></SecHead>
            <div className="mini-games">
              {games.slice(0, 4).map((g) => (
                <button key={g.id} className="mini-game" onClick={() => start('match', { date: g.date, gameId: g.id })}>
                  <b>{hourLabel(g.start)}</b>
                  <small>{g.date === today ? 'امروز' : new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(new Date(g.date.replace(/-/g, '/')))}</small>
                  <span className="mg-lv">{g.levels.map((l) => <LevelPill key={l} id={l} />)}</span>
                  <em>{fa(g.total - g.players.length)} جای خالی</em>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={rise}>
          <SecHead n={4} title="زمین‌ها" />
          <div className="courts-li">
            {courtsOf(c, sport).map((ct) => (
              <div key={ct.id} className="court-li">
                <span className="court-mini" />
                <b>{ct.name}</b><small>{ct.kind}</small>
              </div>
            ))}
          </div>
        </motion.section>

        {coaches.length > 0 && (
          <motion.section variants={rise}>
            <SecHead n={5} title="مربی‌ها" />
            <div className="coach-mini">
              {coaches.map((m) => (
                <button key={m.id} onClick={() => start('coach', { coachId: m.id })}>
                  <Avatar name={m.name} size={48} />
                  <b>{m.name}</b>
                  <small>{fa(m.exp)} سال، ★ {fa(m.rating)}</small>
                  <em>{short(m.price)}</em>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {events.length > 0 && (
          <motion.section variants={rise}>
            <SecHead n={6} title="مسابقه‌های پیش رو" />
            <button className="ev-teaser" onClick={() => start('event')}>
              <span className="ev-t-n">{fa(events.length)}</span>
              <div className="grow"><b>{events[0].title}</b><small>{toman(events[0].fee)}، سطح {events[0].levels.join(' / ')}</small></div>
              <Icon name="fwd" />
            </button>
          </motion.section>
        )}

        <motion.section variants={rise}>
          <SecHead n={7} title="امکانات" />
          <div className="amen">{c.amenities.map((a) => <span key={a}>{a}</span>)}</div>
        </motion.section>
      </div>
    </motion.div>
  )
}
