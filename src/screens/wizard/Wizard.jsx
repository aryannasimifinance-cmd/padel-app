import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ACTIVITIES, CITIES, CLUBS, DAYPARTS, LEVELS, SPORTS, activityById, dayKey, dayLabel, dayNum, fa, freeSlots, fromKey, levelIndex, nextDays, sportById } from '../../data'
import { haptic } from '../../fx'
import { useStore } from '../../store'
import { Button, Chips, Icon, Photo, TopBar, Tilt, rise, stagger } from '../../components/ui'
import { PickClub, PickCoach, PickTournament } from './Pick'
import { People, Partner } from './People'
import { Review, Success } from './Review'

// مراحل هر نوع فعالیت — کوتاه‌ترین مسیر ممکن
const FLOWS = {
  game: ['sport', 'activity', 'when', 'pick', 'people', 'review'],
  practice: ['sport', 'activity', 'when', 'pick', 'review'],
  coach: ['sport', 'activity', 'when', 'pick', 'review'],
  weekend: ['sport', 'activity', 'where', 'pick', 'partner', 'review'],
  official: ['sport', 'activity', 'where', 'pick', 'partner', 'review'],
}
const TITLES = { sport: 'چه رشته‌ای؟', activity: 'برای چی؟', when: 'کجا و کی؟', where: 'کجا؟', pick: 'انتخاب کن', people: 'بازیکن‌ها', partner: 'هم‌تیمی', review: 'مرور نهایی' }

export default function Wizard({ preset = {}, onClose, onDone }) {
  const { user } = useStore()
  const myLvl = levelIndex(user.level)
  const [w, setW] = useState(() => ({
    sport: null, activity: null, format: null, city: user.city, area: 'همه',
    date: dayKey(new Date()), daypart: 'any', duration: 2,
    clubId: null, start: null, court: null,
    players: [], open: true, levels: LEVELS.slice(Math.max(0, myLvl - 1), myLvl + 2).map((l) => l.id),
    coachId: null, coachFormat: 'private', tournament: null, partner: '', findPartner: false,
    ...preset,
  }))
  const set = (p) => setW((x) => ({ ...x, ...p }))
  const flow = FLOWS[w.activity || 'game']
  const first = preset.activity ? 2 : preset.sport ? 1 : 0
  const [i, setI] = useState(first)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(null)
  const step = flow[i]

  const next = () => { haptic(10); setDir(1); setI((x) => Math.min(x + 1, flow.length - 1)); scrollTop() }
  const back = () => { setDir(-1); if (i === 0 || (i <= first && !done)) onClose(); else setI((x) => x - 1); scrollTop() }
  const sport = sportById(w.sport)

  if (done) return <Success result={done} w={w} onHome={() => onDone('home')} onMatches={() => onDone('matches')} />

  return (
    <div className="wizard" style={{ '--sc': sport?.color || 'var(--ink)' }}>
      <TopBar onBack={back} title={TITLES[step]} step={i} total={flow.length}
        right={<motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={onClose} aria-label="بستن"><Icon name="close" /></motion.button>} />
      {i > 0 && <Breadcrumb w={w} step={step} />}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} className="wz-body" custom={dir}
          variants={{ in: (d) => ({ x: d * -50, opacity: 0, filter: 'blur(6px)' }), on: { x: 0, opacity: 1, filter: 'blur(0px)' }, out: (d) => ({ x: d * 50, opacity: 0, filter: 'blur(6px)' }) }}
          initial="in" animate="on" exit="out" transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
          {step === 'sport' && <StepSport value={w.sport} onPick={(sport) => { set({ sport, format: sportById(sport).formats[0].id }); next() }} />}
          {step === 'activity' && <StepActivity sport={sport} onPick={(activity) => { set({ activity, duration: activityById(activity).durations?.[0] || 1, clubId: null, start: null }); next() }} />}
          {step === 'when' && <StepWhen w={w} set={set} onNext={next} />}
          {step === 'where' && <StepWhere w={w} set={set} onNext={next} />}
          {step === 'pick' && w.activity === 'coach' && <PickCoach w={w} set={set} onNext={next} />}
          {step === 'pick' && (w.activity === 'game' || w.activity === 'practice') && <PickClub w={w} set={set} onNext={next} />}
          {step === 'pick' && (w.activity === 'weekend' || w.activity === 'official') && <PickTournament w={w} set={set} onNext={next} />}
          {step === 'people' && <People w={w} set={set} onNext={next} />}
          {step === 'partner' && <Partner w={w} set={set} onNext={next} />}
          {step === 'review' && <Review w={w} onDone={setDone} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
const scrollTop = () => document.querySelector('.app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })

function Breadcrumb({ w, step }) {
  const s = sportById(w.sport), a = activityById(w.activity)
  const bits = [s && { t: s.name, c: s.color }, a && step !== 'activity' && { t: a.name }]
  if (['pick', 'people', 'review', 'partner'].includes(step) && w.activity !== 'weekend' && w.activity !== 'official') bits.push({ t: `${dayLabel(fromKey(w.date))} ${dayNum(fromKey(w.date))}` })
  if (step === 'pick' || step === 'people' || step === 'review' || step === 'partner') bits.push({ t: CITIES.find((c) => c.id === w.city).name + (w.area !== 'همه' ? ' · ' + w.area : '') })
  return (
    <div className="crumbs">
      {bits.filter(Boolean).map((b, k) => (
        <motion.span key={b.t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.05 }} style={b.c ? { '--c': b.c } : null} className={b.c ? 'dot' : ''}>{b.t}</motion.span>
      ))}
    </div>
  )
}

function StepSport({ value, onPick }) {
  return (
    <motion.div className="sport-list" variants={stagger} initial="hidden" animate="show">
      <h2 className="wz-h">امروز چی بازی کنیم؟</h2>
      {SPORTS.map((s) => (
        <motion.div key={s.id} variants={rise}>
          <Tilt className={`sport-card ${value === s.id ? 'on' : ''}`} onClick={() => onPick(s.id)} style={{ '--c': s.color }}>
            <Photo src={s.img} />
            <div className="sport-card-shade" />
            <div className="sport-card-txt">
              <span className="en">{s.en}</span>
              <h3>{s.name}</h3>
              <p>{s.tagline}</p>
            </div>
            <span className="sport-card-go"><Icon name="back" style={{ transform: 'scaleX(-1)' }} /></span>
          </Tilt>
        </motion.div>
      ))}
    </motion.div>
  )
}

function StepActivity({ sport, onPick }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <h2 className="wz-h">{sport.name} — برای چی می‌خوای؟</h2>
      <div className="act-grid">
        {ACTIVITIES.map((a, k) => (
          <motion.button key={a.id} variants={rise} className={`act-card ${k === 0 ? 'wide' : ''}`} whileTap={{ scale: 0.96 }} onClick={() => onPick(a.id)}>
            <Photo src={k === 0 ? sport.alt : a.img} />
            <div className="act-shade" />
            <span className="act-ic">{a.icon}</span>
            <div className="act-txt">
              <b>{a.name}</b>
              <small>{a.meta}</small>
              {k === 0 && <p>{a.desc}</p>}
            </div>
            <span className="act-xp">+{fa(a.xp)} XP</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export function CityArea({ w, set }) {
  const city = CITIES.find((c) => c.id === w.city)
  return (
    <>
      <div className="city-toggle">
        {CITIES.map((c) => (
          <motion.button key={c.id} className={w.city === c.id ? 'on' : ''} whileTap={{ scale: 0.95 }} onClick={() => { haptic(6); set({ city: c.id, area: 'همه' }) }}>
            {w.city === c.id && <motion.span layoutId="wz-city" className="city-bg" />}
            <span><Icon name="pin" size={18} /> {c.name}</span>
          </motion.button>
        ))}
      </div>
      <Chips id="area" scroll small options={city.areas.map((a) => ({ id: a, name: a }))} value={w.area} onChange={(area) => set({ area })} />
    </>
  )
}

export const clubsFor = (w) => CLUBS.filter((c) => c.city === w.city && c.sports.includes(w.sport) && (w.area === 'همه' || c.region === w.area))

function StepWhen({ w, set, onNext }) {
  const sport = sportById(w.sport), act = activityById(w.activity)
  const days = useMemo(() => nextDays(14), [])
  const dur = w.activity === 'game' ? w.duration : 1
  // شمارش زنده باشگاه‌های دارای زمان آزاد
  const count = useMemo(() => clubsFor(w).filter((c) => freeSlots(c, w.sport, fromKey(w.date), dur, w.daypart).length).length, [w.city, w.area, w.date, w.daypart, dur, w.sport])
  return (
    <div className="when">
      <section>
        <p className="label">شهر و منطقه</p>
        <CityArea w={w} set={set} />
      </section>
      <section>
        <p className="label">روز</p>
        <div className="days">
          {days.map((d) => {
            const k = dayKey(d), on = w.date === k
            return (
              <motion.button key={k} className={`day ${on ? 'on' : ''}`} whileTap={{ scale: 0.9 }} onClick={() => { haptic(6); set({ date: k }) }}>
                {on && <motion.span layoutId="day-bg" className="day-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <small>{dayLabel(d)}</small>
                <b>{dayNum(d)}</b>
              </motion.button>
            )
          })}
        </div>
      </section>
      <section>
        <p className="label">چه ساعتی؟</p>
        <Chips id="dp" options={DAYPARTS.map((d) => ({ id: d.id, name: d.name, icon: d.icon }))} value={w.daypart} onChange={(daypart) => set({ daypart })} />
      </section>
      {w.activity === 'game' && (
        <section className="row2">
          <div>
            <p className="label">مدت بازی</p>
            <Chips id="dur" options={act.durations.map((h) => ({ id: h, name: `${fa(h)} ساعت` }))} value={w.duration} onChange={(duration) => set({ duration })} />
          </div>
          {sport.formats.length > 1 && (
            <div>
              <p className="label">نوع بازی</p>
              <Chips id="fmt" options={sport.formats.map((f) => ({ id: f.id, name: f.name, sub: `${fa(f.players)} نفر` }))} value={w.format} onChange={(format) => set({ format })} />
            </div>
          )}
        </section>
      )}
      {w.activity === 'game' && sport.id === 'padel' && <p className="hint">🎾 پدل همیشه دونفره است — ۴ بازیکن. بازی حداقل ۲ ساعت رزرو می‌شود.</p>}
      {w.activity === 'practice' && <p className="hint">🎯 زمین تمرین ۱ ساعته رزرو می‌شود.</p>}
      {w.activity === 'coach' && <p className="hint">🧢 مربی‌هایی نمایش داده می‌شوند که در این منطقه و روز وقت آزاد دارند.</p>}
      <div className="cta-bar">
        <Button full variant="dark" disabled={!count} onClick={onNext}>
          {count ? <>نمایش {w.activity === 'coach' ? 'مربی‌ها' : `${fa(count)} باشگاه با زمین آزاد`}</> : 'در این بازه زمین آزاد نیست'}
        </Button>
      </div>
    </div>
  )
}

function StepWhere({ w, set, onNext }) {
  return (
    <div className="when">
      <section>
        <p className="label">شهر و منطقه</p>
        <CityArea w={w} set={set} />
      </section>
      <div className="tour-intro">
        <Photo src={activityById(w.activity).img} />
        <div className="act-shade" />
        <div>
          <b>{activityById(w.activity).name}</b>
          <p>{w.activity === 'weekend' ? 'فرمت‌های امریکانو و میکسینو — هر بازی با یار جدید، کلی بازی در یک عصر. فقط سطح‌های نزدیک به شما.' : 'تورنمنت‌های رنکینگ‌دار با رده‌بندی سطح. امتیاز رنکینگ و جایزه نقدی.'}</p>
        </div>
      </div>
      <div className="cta-bar">
        <Button full variant="dark" onClick={onNext}>نمایش مسابقات</Button>
      </div>
    </div>
  )
}
