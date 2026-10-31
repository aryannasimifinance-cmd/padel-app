import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CITIES, clubById, dayKey, dayLabel, dayMonth, dayNum, fa, fromKey, hourLabel, levelOf, nextDays, openMatches, short, sportById, tournaments, weekday } from '../data'
import { haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Icon, LevelPill, Photo, rise, stagger } from '../components/ui'
import { SportGlyph } from './Explore'

// هم‌بازی: بازی‌های باز همه‌ی باشگاه‌های شهر، مرتب بر اساس نزدیکی به سطح کاربر، به‌علاوه‌ی مسابقه‌ها
export default function Games({ nav }) {
  const { user, joined } = useStore()
  const sports = user.sports?.length ? user.sports : ['padel']
  const [sport, setSport] = useState(sports[0])
  const [day, setDay] = useState('all')
  const lv = levelOf(user, sport)
  const days = useMemo(() => nextDays(5), [])
  const list = useMemo(() => openMatches({ city: user.city, sport, level: lv, date: day === 'all' ? undefined : day })
    .filter((g) => !joined.includes(g.id))
    .sort((a, b) => a.gap - b.gap || fromKey(a.date) - fromKey(b.date) || a.start - b.start), [user.city, sport, day, lv, joined])
  const events = [...tournaments('weekend', sport, user.city), ...tournaments('official', sport, user.city)].sort((a, b) => fromKey(a.date) - fromKey(b.date)).slice(0, 4)
  const city = CITIES.find((c) => c.id === user.city).name

  return (
    <motion.div className="page games" variants={stagger} initial="hidden" animate="show">
      <motion.header variants={rise} className="pg-head">
        <h1>هم‌بازی</h1>
        <p>بازی‌های بازی که دنبال یار هستن، در {city}. سطح تو در {sportById(sport).name}: <LevelPill id={lv} /></p>
      </motion.header>

      <motion.div variants={rise} className="g-filters">
        <div className="g-sports">
          {sports.map((id) => (
            <button key={id} className={sport === id ? 'on' : ''} onClick={() => { haptic(6); setSport(id) }}><SportGlyph id={id} />{sportById(id).name}</button>
          ))}
        </div>
        <div className="g-days">
          <button className={day === 'all' ? 'on' : ''} onClick={() => setDay('all')}>همه‌ی روزها</button>
          {days.map((d) => <button key={dayKey(d)} className={day === dayKey(d) ? 'on' : ''} onClick={() => { haptic(6); setDay(dayKey(d)) }}>{dayLabel(d)} {dayNum(d)}</button>)}
        </div>
      </motion.div>

      <motion.button variants={rise} className="g-host" whileTap={{ scale: 0.98 }} onClick={() => nav.tab('explore')}>
        <span className="g-host-ic"><Icon name="plus" size={22} stroke={2.4} /></span>
        <span className="grow"><b>بازی خودت رو بساز</b><small>یه زمین رزرو کن و «دنبال یار» رو بزن؛ ما به هم‌سطح‌ها خبر می‌دیم.</small></span>
        <Icon name="fwd" size={18} />
      </motion.button>

      <section className="g-list">
        {list.map((g, k) => <GameRow key={g.id} g={g} k={k} onClick={() => nav.open('checkout', { kind: 'join', gameId: g.id, sport: g.sport, clubId: g.clubId, date: g.date })} />)}
        {!list.length && <p className="muted">برای این روز بازی بازی نیست.</p>}
      </section>

      {events.length > 0 && (
        <section>
          <h2 className="club-h">مسابقه‌های پیش رو</h2>
          <div className="g-events">
            {events.map((e) => {
              const c = clubById(e.clubId)
              return (
                <motion.button key={e.id} className="g-ev" whileTap={{ scale: 0.98 }} onClick={() => nav.open('checkout', { kind: 'event', eventId: e.id, sport, clubId: e.clubId, date: e.date })}>
                  <Photo src={c.img} className="g-ev-img" />
                  <span className="g-ev-d"><b>{dayNum(fromKey(e.date))}</b><small>{weekday(fromKey(e.date))}</small></span>
                  <div className="g-ev-txt"><b>{e.title}</b><small>{c.name}، {dayMonth(fromKey(e.date))}، ورودی {short(e.fee)}</small></div>
                </motion.button>
              )
            })}
          </div>
        </section>
      )}
    </motion.div>
  )
}

function GameRow({ g, k, onClick }) {
  const c = clubById(g.clubId)
  const left = g.total - g.players.length
  return (
    <motion.button className="g-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(k, 8) * 0.04 }} whileTap={{ scale: 0.98 }} onClick={onClick}>
      <div className="g-row-top">
        <span className="g-when"><b>{hourLabel(g.start)}</b>{dayLabel(g.date)}</span>
        {g.gap === 0 ? <span className="g-fit">دقیقاً هم‌سطح</span> : <span className="g-fit near">نزدیک به سطحت</span>}
        <span className="g-lv">{g.levels.map((l) => <LevelPill key={l} id={l} />)}</span>
      </div>
      <b className="g-club">{c.name}</b>
      <small className="muted">{c.area}، زمین {fa(g.court)}، {fa(g.dur)} ساعت</small>
      <div className="g-row-foot">
        <span className="g-ppl">
          {Array.from({ length: g.total }, (_, j) => g.players[j] ? <Avatar key={j} name={g.players[j].name} size={30} /> : <span key={j} className="g-empty"><Icon name="plus" size={14} /></span>)}
        </span>
        <span className="g-left">{fa(left)} جای خالی</span>
        <em>{short(g.share)}<small>سهم هر نفر</small></em>
      </div>
    </motion.button>
  )
}
