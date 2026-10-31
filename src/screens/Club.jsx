import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { clubById, clubSports, coachesAt, courtsOf, dayKey, dayLabel, dayNum, fa, fromKey, hourLabel, isPeak, levelOf, nextDays, openMatches, priceFor, range, regionById, short, sportById, todayKey, toman, tournaments, weekday } from '../data'
import { haptic } from '../fx'
import { isFree, useStore } from '../store'
import { Avatar, Button, CtaBar, Icon, LevelPill, Photo, rise, stagger } from '../components/ui'

// صفحه‌ی آگهی باشگاه: همین‌جا روز و ساعت انتخاب می‌شود و مستقیم به پرداخت می‌رود
export default function Club({ id, sport: pre, date: preDate, nav, onBack }) {
  const { user, bookings, toast } = useStore()
  const c = clubById(id)
  const sports = clubSports(c)
  const [sport, setSport] = useState(pre && c.courts[pre] ? pre : (sports.find((s) => user.sports?.includes(s.id)) || sports[0]).id)
  const [date, setDate] = useState(preDate || todayKey())
  const [dur, setDur] = useState(1)
  const [start, setStart] = useState(null)
  const s = sportById(sport)
  const days = useMemo(() => nextDays(14), [])

  const now = new Date()
  const slots = useMemo(() => {
    const out = []
    for (let h = 7; h + dur <= 24; h++) {
      const past = date === todayKey() && h <= now.getHours()
      const free = !past && courtsOf(c, sport).filter((ct) => isFree(bookings, c, sport, ct.id, date, h, dur)).length
      out.push({ h, past, free })
    }
    return out
  }, [bookings, sport, date, dur])
  const freeCount = slots.filter((x) => x.free).length
  const games = openMatches({ city: c.city, sport, level: levelOf(user, sport), clubId: c.id }).slice(0, 4)
  const coaches = coachesAt(c, sport)
  const events = [...tournaments('weekend', sport, c.city, c.id), ...tournaments('official', sport, c.city, c.id)].sort((a, b) => fromKey(a.date) - fromKey(b.date)).slice(0, 3)
  const total = start != null ? priceFor(c, sport, date, start, dur) : 0
  const pick = (p) => { haptic(6); setStart(null); p() }

  return (
    <motion.div className="club" variants={stagger} initial="hidden" animate="show">
      <div className="club-hero">
        <Photo src={c.img} />
        <div className="club-hero-btns">
          <button className="icon-btn glass" onClick={onBack} aria-label="بازگشت"><Icon name="back" /></button>
          <button className="icon-btn glass" aria-label="اشتراک" onClick={() => {
            const text = `${c.name}، ${c.area} — رزرو در matchy`
            if (navigator.share) navigator.share({ title: c.name, text }).catch(() => {})
            else { navigator.clipboard?.writeText(text); toast({ icon: '🔗', title: 'لینک کپی شد' }) }
          }}><Icon name="share" /></button>
        </div>
      </div>

      <div className="club-body">
        <motion.header variants={rise} className="club-title">
          <h1>{c.name}</h1>
          <p><Icon name="star" size={14} fill="currentColor" /> <b>{fa(c.rating)}</b> <span>({fa(c.reviews)} نظر)</span>، {regionById(c.region).name}، {c.area}</p>
          <div className="club-tags">
            <span>{c.indoor ? 'سرپوشیده' : 'روباز'}</span>
            {sports.map((x) => <span key={x.id}>{fa(c.courts[x.id])} زمین {x.name}</span>)}
          </div>
        </motion.header>

        {sports.length > 1 && (
          <motion.div variants={rise} className="club-sports">
            {sports.map((x) => (
              <button key={x.id} className={sport === x.id ? 'on' : ''} style={{ '--c': x.color }} onClick={() => pick(() => setSport(x.id))}><i />{x.name}</button>
            ))}
          </motion.div>
        )}

        <motion.section variants={rise} className="book-box">
          <h2>کِی بازی می‌کنی؟</h2>
          <div className="bx-days">
            {days.map((d) => {
              const k = dayKey(d)
              return (
                <button key={k} className={date === k ? 'on' : ''} onClick={() => pick(() => setDate(k))}>
                  <small>{dayLabel(d)}</small><b>{dayNum(d)}</b>
                </button>
              )
            })}
          </div>
          <div className="bx-dur">
            <span>مدت</span>
            {[1, 2, 3].map((n) => <button key={n} className={dur === n ? 'on' : ''} onClick={() => pick(() => setDur(n))}>{fa(n)} ساعت</button>)}
          </div>
          <div className="bx-hours">
            {slots.map(({ h, past, free }) => (
              <motion.button key={h} whileTap={free ? { scale: 0.92 } : {}} disabled={!free}
                className={`${start === h ? 'on' : ''} ${isPeak(date, h) ? 'peak' : ''} ${past ? 'past' : ''}`}
                onClick={() => { haptic(8); setStart(start === h ? null : h) }}>
                <b>{hourLabel(h)}</b>
                <small>{free ? short(priceFor(c, sport, date, h, 1)) : past ? 'گذشته' : 'پر'}</small>
              </motion.button>
            ))}
          </div>
          <p className="bx-note">{freeCount ? <>{fa(freeCount)} ساعت شروع آزاد، {dayLabel(date)} {weekday(fromKey(date))}. ساعت‌های خط‌دار پیک‌اند.</> : 'این روز پره؛ روز دیگه‌ای رو ببین.'}</p>
        </motion.section>

        {games.length > 0 && (
          <motion.section variants={rise}>
            <h2 className="club-h">بازی‌های باز همین‌جا</h2>
            <div className="club-games">
              {games.map((g) => (
                <button key={g.id} onClick={() => nav.open('checkout', { kind: 'join', gameId: g.id, sport: g.sport, clubId: c.id, date: g.date })}>
                  <span className="cg-t"><b>{hourLabel(g.start)}</b><small>{dayLabel(g.date)}</small></span>
                  <span className="cg-lv">{g.levels.map((l) => <LevelPill key={l} id={l} />)}</span>
                  <span className="cg-seats">{Array.from({ length: g.total }, (_, k) => <i key={k} className={k < g.players.length ? 'on' : ''} />)}</span>
                  <em>{short(g.share)}</em>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {coaches.length > 0 && (
          <motion.section variants={rise}>
            <h2 className="club-h">کلاس با مربی</h2>
            <div className="club-coaches">
              {coaches.map((m) => (
                <motion.button key={m.id} whileTap={{ scale: 0.97 }} onClick={() => nav.open('checkout', { kind: 'coach', coachId: m.id, sport, clubId: c.id, date })}>
                  <Avatar name={m.name} size={54} />
                  <b>{m.name}</b>
                  <small>{fa(m.exp)} سال سابقه، ★ {fa(m.rating)}</small>
                  <em>{short(m.price)} هر جلسه</em>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {events.length > 0 && (
          <motion.section variants={rise}>
            <h2 className="club-h">مسابقه‌ها</h2>
            <div className="club-events">
              {events.map((e) => (
                <button key={e.id} onClick={() => nav.open('checkout', { kind: 'event', eventId: e.id, sport, clubId: c.id, date: e.date })}>
                  <span className="ce-d"><b>{dayNum(fromKey(e.date))}</b><small>{weekday(fromKey(e.date))}</small></span>
                  <span className="grow"><b>{e.title}</b><small>{hourLabel(e.start)}، سطح {e.levels.join(' / ')}، {fa(e.cap - e.taken)} جا</small></span>
                  <em>{short(e.fee)}</em>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={rise}>
          <h2 className="club-h">امکانات</h2>
          <div className="amen">{c.amenities.map((a) => <span key={a}>{a}</span>)}</div>
        </motion.section>
      </div>

      <CtaBar>
        <div className="club-cta">
          <div className="grow">
            {start != null
              ? <><b>{toman(total)}</b><small>{range(start, dur)}، {dayLabel(date)}</small></>
              : <><b>از {short(c.price[sport])}</b><small>هر ساعت، یک ساعت رو انتخاب کن</small></>}
          </div>
          <Button variant="lime" disabled={start == null} onClick={() => nav.open('checkout', { kind: 'court', clubId: c.id, sport, date, start, dur })}>رزرو</Button>
        </div>
      </CtaBar>
    </motion.div>
  )
}
