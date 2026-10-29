import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { COACHES, COACH_FORMATS, clubById, dayLabel, dayMonth, fa, freeSlots, fromKey, hash, hourLabel, levelIndex, toman, tournaments } from '../../data'
import { haptic } from '../../fx'
import { useStore } from '../../store'
import { Avatar, Button, Chips, Icon, LevelPill, Photo, Sheet, rise, stagger } from '../../components/ui'
import { clubsFor } from './Wizard'

// انیمیشن جستجو کوتاه — حس «پیدا کردن» به کاربر می‌دهد
function useSearching(ms = 750) {
  const [busy, setBusy] = useState(true)
  useEffect(() => { const t = setTimeout(() => setBusy(false), ms); return () => clearTimeout(t) }, [ms])
  return busy
}
function Searching({ text }) {
  return (
    <div className="searching">
      <div className="radar"><span /><span /><span /><i /></div>
      <p>{text}</p>
      {[0, 1].map((k) => <div key={k} className="skeleton" />)}
    </div>
  )
}

export function PickClub({ w, set, onNext }) {
  const busy = useSearching()
  const dur = w.activity === 'game' ? w.duration : 1
  const [sort, setSort] = useState('near')
  const list = useMemo(() => clubsFor(w)
    .map((c) => ({ c, slots: freeSlots(c, w.sport, fromKey(w.date), dur, w.daypart) }))
    .filter((x) => x.slots.length)
    .sort((a, b) => (sort === 'near' ? a.c.km - b.c.km : sort === 'cheap' ? a.c.price[w.sport] - b.c.price[w.sport] : b.c.rating - a.c.rating)), [w, dur, sort])
  const sel = w.clubId && clubById(w.clubId)
  const players = w.activity === 'game' ? (w.format === 'singles' ? 2 : 4) : 1

  if (busy) return <Searching text="در حال پیدا کردن زمین‌های آزاد…" />
  return (
    <>
      <div className="res-head">
        <b>{fa(list.length)} باشگاه</b>
        <Chips id="sort" small options={[{ id: 'near', name: 'نزدیک‌ترین' }, { id: 'cheap', name: 'ارزان‌ترین' }, { id: 'top', name: 'محبوب‌ترین' }]} value={sort} onChange={setSort} />
      </div>
      <motion.div className="clubs" variants={stagger} initial="hidden" animate="show">
        {list.map(({ c, slots }) => {
          const price = c.price[w.sport] * dur
          const active = w.clubId === c.id
          return (
            <motion.article key={c.id} variants={rise} layout className={`club ${active ? 'on' : ''}`}>
              <Photo src={c.img} className="club-img">
                <span className="club-rate"><Icon name="star" size={13} fill="currentColor" /> {fa(c.rating)}</span>
                {c.indoor && <span className="club-tag">سرپوشیده</span>}
              </Photo>
              <div className="club-body">
                <div className="club-top">
                  <div>
                    <h3>{c.name}</h3>
                    <p className="muted"><Icon name="pin" size={14} /> {c.area} · {fa(c.km)} کیلومتر</p>
                  </div>
                  <div className="club-price">
                    <b>{toman(players > 1 ? price / players : price)}</b>
                    <small>{players > 1 ? 'سهم هر نفر' : `${fa(dur)} ساعت`}</small>
                  </div>
                </div>
                <div className="amen">{c.amenities.map((a) => <span key={a}>{a}</span>)}</div>
                <div className="slots">
                  {slots.map((h) => {
                    const on = active && w.start === h
                    return (
                      <motion.button key={h} className={`slot ${on ? 'on' : ''}`} whileTap={{ scale: 0.88 }}
                        onClick={() => { haptic(8); set({ clubId: c.id, start: h, court: 1 + Math.floor(hash(c.id + h + w.date) * c.courts) }) }}>
                        {on && <motion.span layoutId="slot-bg" className="slot-bg" transition={{ type: 'spring', stiffness: 500, damping: 32 }} />}
                        <span>{hourLabel(h)}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.article>
          )
        })}
      </motion.div>
      <FloatCta show={!!sel} onClick={onNext}>
        {sel && <>ادامه · {sel.name} · {hourLabel(w.start)} تا {hourLabel(w.start + dur)}</>}
      </FloatCta>
    </>
  )
}

export function FloatCta({ show, onClick, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="float-cta" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
          <Button full variant="lime" onClick={onClick}>{children}</Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PickCoach({ w, set, onNext }) {
  const busy = useSearching()
  const clubs = clubsFor(w).map((c) => c.id)
  const list = COACHES.filter((m) => m.sports.includes(w.sport) && m.clubs.some((id) => clubs.includes(id)))
    .map((m) => {
      const club = clubById(m.clubs.find((id) => clubs.includes(id)))
      return { m, club, slots: freeSlots(club, w.sport + m.id, fromKey(w.date), 1, w.daypart).slice(0, 8) }
    })
    .filter((x) => x.slots.length)
  const sel = list.find((x) => x.m.id === w.coachId)
  const fmt = COACH_FORMATS.find((f) => f.id === w.coachFormat)

  if (busy) return <Searching text="در حال بررسی تقویم مربی‌ها…" />
  if (!list.length) return <Empty text="در این روز و منطقه مربی آزاد پیدا نشد. روز یا ساعت دیگه‌ای رو امتحان کن." />
  return (
    <>
      <p className="label">نوع جلسه</p>
      <Chips id="cf" options={COACH_FORMATS.map((f) => ({ id: f.id, name: f.name, sub: `${fa(f.people)} نفر` }))} value={w.coachFormat} onChange={(coachFormat) => set({ coachFormat })} />
      <motion.div className="coaches" variants={stagger} initial="hidden" animate="show">
        {list.map(({ m, club, slots }) => (
          <motion.article key={m.id} variants={rise} className={`coach ${w.coachId === m.id ? 'on' : ''}`}>
            <div className="coach-top">
              <Avatar name={m.name} size={56} ring={w.coachId === m.id ? 'var(--lime-d)' : null} />
              <div className="grow">
                <h3>{m.name} <LevelPill id={m.level} /></h3>
                <p className="muted">{fa(m.exp)} سال سابقه · <Icon name="star" size={13} fill="currentColor" /> {fa(m.rating)}</p>
                <p className="coach-bio">{m.bio}</p>
              </div>
            </div>
            <div className="coach-meta">
              <span><Icon name="pin" size={14} /> {club.name} · {club.area}</span>
              <b>{toman(m.price * fmt.mult)}</b>
            </div>
            <div className="slots">
              {slots.map((h) => {
                const on = w.coachId === m.id && w.start === h
                return (
                  <motion.button key={h} className={`slot ${on ? 'on' : ''}`} whileTap={{ scale: 0.88 }}
                    onClick={() => { haptic(8); set({ coachId: m.id, clubId: club.id, start: h, court: 1 + Math.floor(hash(m.id + h) * club.courts) }) }}>
                    {on && <motion.span layoutId="slot-bg" className="slot-bg" />}
                    <span>{hourLabel(h)}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.article>
        ))}
      </motion.div>
      <FloatCta show={!!sel && w.start != null} onClick={onNext}>
        {sel && <>رزرو جلسه با {sel.m.name} · {hourLabel(w.start)}</>}
      </FloatCta>
    </>
  )
}

export function PickTournament({ w, set, onNext }) {
  const { user } = useStore()
  const busy = useSearching()
  const [lvl, setLvl] = useState('mine')
  const [open, setOpen] = useState(null)
  const all = useMemo(() => tournaments(w.activity, w.sport, w.city).filter((t) => w.area === 'همه' || clubById(t.clubId).region === w.area), [w.activity, w.sport, w.city, w.area])
  const my = levelIndex(user.level)
  const list = lvl === 'mine' ? all.filter((t) => t.levels.some((l) => Math.abs(levelIndex(l) - my) <= 1)) : all

  if (busy) return <Searching text="در حال پیدا کردن مسابقات…" />
  return (
    <>
      <div className="res-head">
        <b>{fa(list.length)} مسابقه</b>
        <Chips id="tl" small options={[{ id: 'mine', name: `سطح من (${user.level})` }, { id: 'all', name: 'همه سطوح' }]} value={lvl} onChange={setLvl} />
      </div>
      {!list.length && <Empty text="مسابقه‌ای با این فیلتر نیست. «همه سطوح» یا شهر دیگه رو ببین." />}
      <motion.div className="tours" variants={stagger} initial="hidden" animate="show">
        {list.map((t) => {
          const c = clubById(t.clubId), d = fromKey(t.date), left = t.cap - t.taken
          return (
            <motion.button key={t.id} variants={rise} className="tour" whileTap={{ scale: 0.98 }} onClick={() => { haptic(8); setOpen(t) }}>
              <div className="tour-date"><small>{dayLabel(d)}</small><b>{dayMonth(d)}</b></div>
              <div className="grow">
                <h3>{t.title}</h3>
                <p className="muted">{c.name} · {c.area} · ساعت {hourLabel(t.start)}</p>
                <div className="tour-lv">{t.levels.map((l) => <LevelPill key={l} id={l} />)}<span className="muted">{t.format}</span></div>
                <div className="cap"><motion.i initial={{ width: 0 }} animate={{ width: `${(t.taken / t.cap) * 100}%` }} transition={{ duration: 1, delay: 0.3 }} /></div>
                <small className={left < 6 ? 'hot' : 'muted'}>{left < 6 ? `🔥 فقط ${fa(left)} جای خالی` : `${fa(left)} جای خالی از ${fa(t.cap)}`}</small>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="tour-detail">
            <Photo src={clubById(open.clubId).img} className="td-img" />
            <div className="td-grid">
              <div><small>تاریخ</small><b>{dayLabel(fromKey(open.date))} {dayMonth(fromKey(open.date))}</b></div>
              <div><small>شروع</small><b>{hourLabel(open.start)}</b></div>
              <div><small>ورودی</small><b>{toman(open.fee)}</b></div>
              <div><small>جایزه</small><b>{open.prize}</b></div>
              <div><small>فرمت</small><b>{open.format}</b></div>
              <div><small>{open.points ? 'امتیاز رنکینگ' : 'ثبت‌نام'}</small><b>{open.points ? fa(open.points) : open.partner ? 'تیمی دونفره' : 'انفرادی'}</b></div>
            </div>
            <div className="tour-lv">سطوح مجاز: {open.levels.map((l) => <LevelPill key={l} id={l} />)}</div>
            {!open.levels.some((l) => Math.abs(levelIndex(l) - my) <= 1) && <p className="warn">سطح شما ({user.level}) با این مسابقه فاصله دارد — ثبت‌نام نیاز به تأیید برگزارکننده دارد.</p>}
            <Button full variant="lime" onClick={() => { set({ tournament: open, clubId: open.clubId, start: open.start, date: open.date }); setOpen(null); onNext() }}>ثبت‌نام در مسابقه</Button>
          </div>
        )}
      </Sheet>
    </>
  )
}

export function Empty({ text }) {
  return (
    <motion.div className="empty-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div className="empty-ball" animate={{ y: [0, -24, 0] }} transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }} />
      <p>{text}</p>
    </motion.div>
  )
}
