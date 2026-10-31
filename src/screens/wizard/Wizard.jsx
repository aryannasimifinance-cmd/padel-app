import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  BADGES, CITIES, COACH_PACKS, DAYPARTS, EVENT_KIND, FRIENDS, LEVELS, REGIONS, SERIES, SPORTS, clubById, clubsIn, coachById, coachPackPrice, coachesAt, courtsOf, dayKey,
  dayLabel, dayMonth, dayNum, fa, fromKey, hash, hourLabel, isPeak, levelIndex, levelOf, nearLevels, nextDays, openMatches, poolSize, priceAt, priceFor, range, short,
  sportById, todayKey, toman, tournaments, weekday,
} from '../../data'
import { askNotifyPermission, celebrate, chime, haptic } from '../../fx'
import { freeHours, isFree, planSeries, useStore } from '../../store'
import { Avatar, Button, Chips, CountUp, CtaBar, Empty, Icon, LevelPill, Photo, Sheet, TopBar, rise, stagger } from '../../components/ui'
import { ClubCard } from '../Explore'
import { INTENTS } from '../Club'

const FLOWS = {
  court: ['intent', 'sport', 'club', 'when', 'slot', 'people', 'pay'],
  match: ['intent', 'sport', 'when', 'games', 'pay'],
  coach: ['intent', 'sport', 'club', 'coach', 'when', 'slot', 'pay'],
  event: ['intent', 'sport', 'event', 'pay'],
}
const TITLES = { intent: 'چی می‌خوای؟', sport: 'چه رشته‌ای؟', club: 'کدوم باشگاه؟', when: 'کِی؟', slot: 'زمین و ساعت', people: 'بازیکن‌ها', games: 'بازی‌های باز', coach: 'مربی و پکیج', event: 'مسابقه‌ها', pay: 'پرداخت' }
const scrollTop = () => document.querySelector('.app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })

export default function Wizard({ preset = {}, nav, onClose, onDone }) {
  const { user } = useStore()
  const [w, setW] = useState(() => ({
    intent: preset.intent || null, sport: preset.sport || null, clubId: preset.clubId || null,
    city: preset.clubId ? clubById(preset.clubId).city : user.city, region: null,
    date: preset.date || todayKey(), daypart: preset.daypart || 'any', court: null, start: null, dur: 1, series: 'single',
    format: null, missing: null, visibility: 'public', invited: [], levels: [], players: [],
    gameId: preset.gameId || null, coachId: preset.coachId || null, pack: 'one', eventId: null,
  }))
  const set = (p) => setW((x) => ({ ...x, ...p }))
  // مراحلی که از قبل معلوم‌اند (از صفحه‌ی باشگاه) حذف می‌شوند
  const skip = { intent: !!preset.intent, sport: !!preset.sport, club: !!preset.clubId }
  const flowOf = (intent) => FLOWS[intent || 'court'].filter((s) => !skip[s])
  const flow = flowOf(w.intent)
  const [i, setI] = useState(preset.gameId ? flow.indexOf('pay') : 0)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(null)
  const step = flow[i]

  // با انتخاب رشته، سطح‌های پیشنهادی و تعداد نفرات تنظیم می‌شود
  useEffect(() => {
    if (!w.sport) return
    const lv = levelOf(user, w.sport)
    set({ levels: nearLevels(lv, 1), format: sportById(w.sport).formats[0].id })
  }, [w.sport])

  const next = () => { haptic(10); setDir(1); setI((x) => Math.min(x + 1, flow.length - 1)); scrollTop() }
  const goStep = (name, intent) => { setDir(1); setI(flowOf(intent || w.intent).indexOf(name)); scrollTop() }
  const back = () => { setDir(-1); if (i === 0) onClose(); else setI((x) => x - 1); scrollTop() }

  if (done) return <Success r={done} onHome={() => onDone('home')} onGames={() => onDone('games')} />
  const sport = sportById(w.sport)

  return (
    <div className="wizard" style={{ '--sc': sport?.color || 'var(--ink)' }}>
      <TopBar onBack={i > 0 || preset.clubId ? back : null} title={TITLES[step]} step={i} total={flow.length} />
      {i > 0 && <Crumbs w={w} step={step} />}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} className="wz-body" custom={dir}
          variants={{ in: (d) => ({ x: d * -36, opacity: 0 }), on: { x: 0, opacity: 1 }, out: (d) => ({ x: d * 36, opacity: 0 }) }}
          initial="in" animate="on" exit="out" transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}>
          {step === 'intent' && <StepIntent onMap={() => nav.tab('explore')} onPick={(intent) => { set({ intent, start: null, gameId: null, eventId: null, dur: 1 }); setDir(1); setI(1); scrollTop() }} />}
          {step === 'sport' && <StepSport w={w} onPick={(sp) => { set({ sport: sp, clubId: skip.club ? w.clubId : null, start: null, coachId: null }); next() }} />}
          {step === 'club' && <StepClub w={w} set={set} onNext={next} />}
          {step === 'when' && <StepWhen w={w} set={set} onNext={next} />}
          {step === 'slot' && <StepSlot w={w} set={set} onNext={next} />}
          {step === 'people' && <StepPeople w={w} set={set} onNext={next} />}
          {step === 'games' && <StepGames w={w} set={set} onNext={next} onCreate={() => { set({ intent: 'court', missing: null }); goStep(skip.club ? 'when' : 'club', 'court') }} />}
          {step === 'coach' && <StepCoach w={w} set={set} onNext={next} />}
          {step === 'event' && <StepEvent w={w} set={set} onNext={next} />}
          {step === 'pay' && <StepPay w={w} set={set} onDone={setDone} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Crumbs({ w, step }) {
  const s = sportById(w.sport), c = clubById(w.clubId)
  const bits = [INTENTS.find((x) => x.id === w.intent)?.name, s && step !== 'sport' && s.name]
  if (c && step !== 'club') bits.push(c.name)
  if (['slot', 'games', 'people', 'pay'].includes(step) && w.intent !== 'event') bits.push(`${dayLabel(w.date)} ${dayNum(fromKey(w.date))}`)
  if (w.start != null && ['people', 'pay'].includes(step)) bits.push(`زمین ${fa(w.court)}، ${hourLabel(w.start)}`)
  return (
    <div className="crumbs">
      {bits.filter(Boolean).map((t, k) => (
        <motion.span key={t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.04 }}>{t}</motion.span>
      ))}
    </div>
  )
}

// ---------- ۱. چی می‌خوای ----------
function StepIntent({ onPick, onMap }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="intent-step">
      <motion.h2 variants={rise} className="wz-h">امروز چی کار کنیم؟<small>زیر یک دقیقه رزروت قطعی می‌شه</small></motion.h2>
      <div className="intents">
        {INTENTS.map((t, k) => (
          <motion.button key={t.id} variants={rise} className={`intent ${k === 0 ? 'big' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => { haptic(10); onPick(t.id) }}>
            <span className="intent-ic"><Icon name={t.icon} size={k === 0 ? 26 : 22} /></span>
            <div className="grow"><b>{t.name}</b><small>{t.desc}</small></div>
            <span className="intent-xp">+{fa(t.xp)}</span>
          </motion.button>
        ))}
      </div>
      <motion.button variants={rise} className="map-cta" whileTap={{ scale: 0.97 }} onClick={onMap}>
        <svg viewBox="0 0 120 60" aria-hidden="true"><path d="M0 40 C20 10 40 50 60 25 S100 5 120 30" fill="none" stroke="currentColor" strokeDasharray="3 4" /><circle cx="60" cy="25" r="5" fill="var(--lime)" stroke="currentColor" /><circle cx="22" cy="28" r="3.5" fill="#3D5AFE" /><circle cx="98" cy="17" r="3.5" fill="#E2603A" /></svg>
        <div className="grow"><b>باشگاه‌ها رو روی نقشه ببین</b><small>تهران و کرج، ناحیه رو انتخاب کن</small></div>
        <Icon name="map" />
      </motion.button>
    </motion.div>
  )
}

// ---------- ۲. رشته ----------
function StepSport({ w, onPick }) {
  const { user } = useStore()
  const list = [...SPORTS].sort((a, b) => (user.sports?.includes(b.id) ? 1 : 0) - (user.sports?.includes(a.id) ? 1 : 0))
  return (
    <motion.div className="sport-pick big" variants={stagger} initial="hidden" animate="show">
      {list.map((s) => (
        <motion.button key={s.id} variants={rise} className={`sport-tile ${w.sport === s.id ? 'on' : ''}`} whileTap={{ scale: 0.96 }} onClick={() => { haptic(10); onPick(s.id) }} style={{ '--c': s.color }}>
          <Photo src={s.img} tone={s.color} />
          <span className="sport-tile-en">{s.en}</span>
          <span className="sport-tile-name">{s.name}</span>
          <span className="sport-tile-lv">سطح تو <LevelPill id={levelOf(user, s.id)} /></span>
        </motion.button>
      ))}
    </motion.div>
  )
}

// ---------- ۳. باشگاه ----------
function StepClub({ w, set, onNext }) {
  const { bookings } = useStore()
  const list = useMemo(() => clubsIn(w.city, w.sport, w.region)
    .map((c) => ({ c, free: freeHours(bookings, c, w.sport, todayKey()).length }))
    .sort((a, b) => b.c.rating - a.c.rating), [w.city, w.sport, w.region, bookings])
  return (
    <div className="club-step">
      <div className="seg">
        {CITIES.map((c) => (
          <button key={c.id} className={w.city === c.id ? 'on' : ''} onClick={() => { haptic(6); set({ city: c.id, region: null, clubId: null }) }}>
            {w.city === c.id && <motion.span layoutId="seg-wz-city" className="seg-bg" />}<span>{c.name}</span>
          </button>
        ))}
      </div>
      <Chips id="wz-reg" scroll small value={w.region || 'all'} onChange={(id) => set({ region: id === 'all' ? null : id, clubId: null })}
        options={[{ id: 'all', name: 'همه ناحیه‌ها' }, ...REGIONS.filter((r) => r.city === w.city).map((r) => ({ id: r.id, name: r.name }))]} />
      <p className="label">{fa(list.length)} باشگاه {sportById(w.sport).name}</p>
      {!list.length && <Empty text="اینجا باشگاهی با این رشته نیست. ناحیه‌ی دیگه رو ببین." />}
      <motion.div className="club-list" variants={stagger} initial="hidden" animate="show">
        {list.map(({ c, free }) => (
          <motion.div key={c.id} variants={rise} className="club-list-i">
            <ClubCard c={c} sport={w.sport} wide on={w.clubId === c.id} onClick={() => { haptic(8); set({ clubId: c.id, start: null, coachId: null }) }} />
            <span className="free-tag">{free ? `${fa(free)} ساعت آزاد امروز` : 'امروز پر'}</span>
          </motion.div>
        ))}
      </motion.div>
      <CtaBar><Button full disabled={!w.clubId} onClick={onNext}>{w.clubId ? `ادامه با ${clubById(w.clubId).name}` : 'یک باشگاه انتخاب کن'}</Button></CtaBar>
    </div>
  )
}

// ---------- ۴. روز و بازه ----------
function DayPicker({ value, onChange }) {
  const days = useMemo(() => nextDays(14), [])
  return (
    <div className="days">
      {days.map((d) => {
        const k = dayKey(d), on = value === k
        return (
          <motion.button key={k} className={`day ${on ? 'on' : ''} ${d.getDay() === 4 || d.getDay() === 5 ? 'we' : ''}`} whileTap={{ scale: 0.9 }} onClick={() => { haptic(6); onChange(k) }}>
            {on && <motion.span layoutId="day-bg" className="day-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            <small>{dayLabel(d)}</small>
            <b>{dayNum(d)}</b>
          </motion.button>
        )
      })}
    </div>
  )
}

function Process() {
  const steps = [['روز و ساعت', 'یک تا سه ساعت پشت هم'], ['زمین', 'از روی جدول'], ['یارها', 'دوستات یا هم‌سطح'], ['پرداخت', 'تکی یا پکیج']]
  return (
    <div className="process">
      {steps.map(([t, d], k) => <div key={t} className={`pr-step ${k === 0 ? 'on' : ''}`}><span>{fa(k + 1)}</span><b>{t}</b><small>{d}</small></div>)}
    </div>
  )
}

function StepWhen({ w, set, onNext }) {
  const { user, bookings, joined } = useStore()
  const dp = DAYPARTS.find((d) => d.id === w.daypart)
  const club = clubById(w.clubId)
  const count = useMemo(() => {
    if (w.intent === 'match') return openMatches({ city: w.city, sport: w.sport, date: w.date, level: levelOf(user, w.sport), clubId: w.clubId }).filter((g) => !joined.includes(g.id) && g.start >= dp.from && g.start < dp.to).length
    return freeHours(bookings, club, w.sport, w.date, dp.from, dp.to).length
  }, [w.date, w.daypart, w.intent, bookings])
  return (
    <div className="when">
      {w.intent === 'court' && <Process />}
      <section><p className="label">روز</p><DayPicker value={w.date} onChange={(date) => set({ date, start: null })} /></section>
      <section><p className="label">چه ساعتی؟</p>
        <Chips id="dp" options={DAYPARTS.map((d) => ({ id: d.id, name: d.name }))} value={w.daypart} onChange={(daypart) => set({ daypart, start: null })} />
      </section>
      {w.intent === 'match' && <p className="hint">⚡ بازی‌هایی که به سطح تو ({levelOf(user, w.sport)}) نزدیک‌ترن اول میان.</p>}
      {w.intent === 'coach' && <p className="hint">🧢 جلسه‌ی مربی ۶۰ دقیقه است. ساعت‌هایی که مربی کلاس دارد نمایش داده نمی‌شوند.</p>}
      {w.intent === 'court' && isPeak(w.date, 17) && <p className="hint">💡 عصرها و آخر هفته‌ها ساعت پیک است و قیمت کمی بالاتر.</p>}
      <CtaBar>
        <Button full disabled={!count && w.intent !== 'match'} onClick={onNext}>
          {w.intent === 'match'
            ? (count ? <>نمایش <CountUp key={count} to={count} duration={0.5} /> بازی باز</> : 'بازی بازی نیست — خودم می‌سازم')
            : count ? <><CountUp key={count} to={count} duration={0.5} /> ساعت آزاد در {club.name}</> : 'در این بازه ساعت آزاد نیست'}
        </Button>
      </CtaBar>
    </div>
  )
}

// ---------- ۵. ماتریس ساعت × زمین ----------
function StepSlot({ w, set, onNext }) {
  const { bookings, toast } = useStore()
  const club = clubById(w.clubId), courts = courtsOf(club, w.sport)
  const dp = DAYPARTS.find((d) => d.id === w.daypart)
  const isCoach = w.intent === 'coach', coach = coachById(w.coachId)
  const now = new Date(), today = w.date === dayKey(now)
  const coachBusy = (h) => isCoach && hash(coach.id + w.date + h) < 0.35
  const free = (c, h) => isFree(bookings, club, w.sport, c, w.date, h, 1) && !coachBusy(h)
  const inSel = (c, h) => w.start != null && w.court === c && h >= w.start && h < w.start + w.dur
  const hours = []
  for (let h = dp.from; h < Math.min(dp.to, 24); h++) if (!today || h > now.getHours()) hours.push(h)
  const rows = hours.filter((h) => courts.some((c) => free(c.id, h) || inSel(c.id, h)))

  const tap = (c, h) => {
    haptic(8)
    if (isCoach || w.start == null || w.court !== c) return set({ court: c, start: h, dur: 1 })
    const s0 = w.start, e0 = w.start + w.dur
    if (h >= s0 && h < e0) { // دوباره زدن = برداشتن همان ساعت
      if (w.dur === 1) return set({ start: null })
      if (h === s0) return set({ start: s0 + 1, dur: w.dur - 1 })
      if (h === e0 - 1) return set({ dur: w.dur - 1 })
      return set({ dur: h - s0 })
    }
    if (h === e0 || h === s0 - 1) {
      if (w.dur >= 3) { toast({ icon: '⏱', title: 'حداکثر ۳ ساعت پشت هم' }); return }
      return h === e0 ? set({ dur: w.dur + 1 }) : set({ start: h, dur: w.dur + 1 })
    }
    set({ court: c, start: h, dur: 1 })
  }
  const total = w.start != null ? (isCoach ? coach.price : priceFor(club, w.sport, w.date, w.start, w.dur)) : 0
  const players = sportById(w.sport).formats.find((f) => f.id === w.format)?.players || 4

  return (
    <div className="slot">
      <p className="slot-help">{isCoach ? 'یک ساعت آزاد رو انتخاب کن.' : 'روی یک ساعت بزن. برای بیشتر، ساعت قبل یا بعدش رو هم بزن (تا ۳ ساعت). دوباره زدن = برداشتن.'}</p>
      <div className="slot-table" style={{ '--n': courts.length }}>
        <div className="slot-row head">
          <span />
          {courts.map((c) => <div key={c.id} className={`sc-head ${w.court === c.id && w.start != null ? 'on' : ''}`}><b>{fa(c.id)}</b><small>{c.kind}</small></div>)}
        </div>
        {rows.length === 0 && <div className="empty-card">در این بازه ساعت آزاد نیست؛ روز یا ساعت دیگه‌ای انتخاب کن.</div>}
        {rows.map((h) => (
          <div key={h} className="slot-row">
            <span className={`slot-t ${isPeak(w.date, h) ? 'peak' : ''}`}>{hourLabel(h)}</span>
            {courts.map((c) => {
              const sel = inSel(c.id, h)
              const ok = sel || free(c.id, h)
              const cls = sel ? `sel ${inSel(c.id, h - 1) ? 'jt' : ''} ${inSel(c.id, h + 1) ? 'jb' : ''}` : ok ? 'free' : 'busy'
              return (
                <button key={c.id} className={`cell ${cls}`} disabled={!ok} onClick={() => tap(c.id, h)}>
                  {sel ? <Icon name="check" size={16} stroke={3} /> : ok ? <span>{fa(Math.round((isCoach ? coach.price : priceAt(club, w.sport, w.date, h)) / 1000))}</span> : null}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <p className="slot-legend"><i className="lg free" /> آزاد (هزار تومان) <i className="lg sel" /> انتخاب تو <i className="lg busy" /> پر <i className="lg peak" /> پیک</p>
      <AnimatePresence>
        {w.start != null && (
          <motion.div className="sel-sum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grow"><b>زمین {fa(w.court)}، {range(w.start, w.dur)}</b><small>{fa(w.dur)} ساعت{!isCoach && `، هر نفر ${toman(total / players)}`}</small></div>
            <em>{toman(total)}</em>
          </motion.div>
        )}
      </AnimatePresence>
      <CtaBar>
        <Button full disabled={w.start == null} onClick={onNext}>
          {w.start == null ? 'یک ساعت آزاد انتخاب کن' : <>ادامه، {fa(w.dur)} ساعت روی زمین {fa(w.court)}</>}
        </Button>
      </CtaBar>
    </div>
  )
}

// ---------- ۶. یارها ----------
function StepPeople({ w, set, onNext }) {
  const { user } = useStore()
  const [edit, setEdit] = useState(null)
  const sport = sportById(w.sport)
  const total = sport.formats.find((f) => f.id === w.format)?.players || 4
  const me = { id: 'me', name: user.name, level: levelOf(user, w.sport), me: true }
  const players = Array.from({ length: total }, (_, k) => (k === 0 ? me : w.players[k] || null))
  const missing = w.missing == null ? total - 1 : Math.min(w.missing, total - 1)
  const need = total - 1 - missing
  const added = players.slice(1, need + 1).filter(Boolean).length
  const ready = added === need
  const put = (k, p) => { const n = [...players]; n[k] = p; set({ players: n }); haptic(12) }
  const setMissing = (m) => { set({ missing: m, players: players.map((p, k) => (k === 0 || k <= total - 1 - m ? p : null)) }); haptic(8) }
  const toggleLevel = (id) => {
    const has = w.levels.includes(id)
    if (has && w.levels.length === 1) return
    set({ levels: has ? w.levels.filter((x) => x !== id) : [...w.levels, id].sort((a, b) => levelIndex(a) - levelIndex(b)) })
  }
  const reach = poolSize(w.sport, w.city, w.levels)
  const TEAM = Array.from({ length: total }, (_, m) => ({ id: m, name: m === 0 ? 'تیم کامله' : `${fa(m)} یار کم`, sub: `${fa(total - m)} نفریم` }))

  return (
    <div className="people">
      {sport.formats.length > 1 && (
        <section><p className="label">نوع بازی</p>
          <Chips id="fmt" value={w.format} onChange={(format) => set({ format, missing: null, players: [] })} options={sport.formats.map((f) => ({ id: f.id, name: f.name, sub: `${fa(f.players)} نفر` }))} />
        </section>
      )}
      <h2 className="wz-h">چند نفرید؟</h2>
      <div className="team-pick" style={{ '--n': TEAM.length }}>
        {TEAM.map((t) => (
          <button key={t.id} className={`team-opt ${missing === t.id ? 'on' : ''}`} onClick={() => setMissing(t.id)}>
            <span className="team-dots">{Array.from({ length: total }, (_, k) => <i key={k} className={k < total - t.id ? 'f' : ''} />)}</span>
            <b>{t.name}</b><small>{t.sub}</small>
          </button>
        ))}
      </div>
      <div className={`court-viz ${total === 2 ? 'singles' : ''}`}>
        <div className="cv-net" /><div className="cv-mid" />
        {players.map((p, k) => {
          const searching = k > need
          return (
            <div key={k} className={`cv-spot s${k}`}>
              {p ? (
                <div className="spot-p" onClick={() => k > 0 && put(k, null)}>
                  <Avatar name={p.name} size={48} me={p.me} />
                  <span>{p.me ? 'شما' : p.name.split(' ')[0]}</span>
                  {p.level ? <LevelPill id={p.level} /> : <em className="inv">مهمان</em>}
                </div>
              ) : searching ? (
                <div className="spot-p"><motion.div className="spot-search" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}><Icon name="radar" size={22} /></motion.div><span>در جستجو…</span></div>
              ) : (
                <div className="spot-p"><Avatar empty size={48} onClick={() => setEdit(k)} /><span>افزودن یار</span></div>
              )}
            </div>
          )
        })}
      </div>
      {missing > 0 && (
        <>
          <p className="label">چه کسی این بازی رو ببینه؟</p>
          <div className="vis-pick">
            {[['public', 'عمومی', 'هم‌سطح‌ها اعلان می‌گیرن'], ['private', 'خصوصی', 'فقط دعوت‌شده‌ها']].map(([id, n, d]) => (
              <button key={id} className={`vis-opt ${w.visibility === id ? 'on' : ''}`} onClick={() => { haptic(6); set({ visibility: id }) }}>
                <Icon name={id === 'public' ? 'users' : 'lock'} size={18} /><div><b>{n}</b><small>{d}</small></div>
              </button>
            ))}
          </div>
          {w.visibility === 'public' ? (
            <div className="mm">
              <div className="mm-head"><div className="mm-ic"><Icon name="radar" /></div>
                <div className="grow"><b>برای {fa(missing)} جای خالی دنبال یار می‌گردیم</b><small>به بازیکن‌های هم‌سطح {sport.name} اعلان و آلارم می‌فرستیم</small></div></div>
              <p className="label">چه سطح‌هایی بیان؟</p>
              <div className="lv-pick">
                {LEVELS.map((l) => (
                  <button key={l.id} className={w.levels.includes(l.id) ? 'on' : ''} style={{ '--c': l.color }} onClick={() => { haptic(6); toggleLevel(l.id) }}>{l.id}</button>
                ))}
              </div>
              <div className="reach"><span className="reach-n"><CountUp key={reach} to={reach} duration={0.6} /></span><span>بازیکن {sport.name} در {CITIES.find((c) => c.id === w.city).name} اعلان می‌گیرن</span></div>
            </div>
          ) : (
            <div className="mm">
              <div className="mm-head"><div className="mm-ic"><Icon name="lock" /></div>
                <div className="grow"><b>{fa(missing)} جای خالی با دعوت پر می‌شه</b><small>این بازی در لیست عمومی نمیاد</small></div></div>
              <div className="inv-chips">
                {w.invited.map((id) => (
                  <span key={id}>{FRIENDS.find((m) => m.id === id)?.name}<button onClick={() => set({ invited: w.invited.filter((x) => x !== id) })} aria-label="حذف">×</button></span>
                ))}
                <button className="inv-add" onClick={() => setEdit('invite')}><Icon name="plus" size={14} /> دعوت دوست</button>
              </div>
            </div>
          )}
        </>
      )}
      <CtaBar>
        <Button full disabled={!ready} onClick={onNext}>
          {ready ? (missing ? 'ثبت بازی و پرداخت سهم' : 'تیم کامله! پرداخت') : `${fa(need - added)} یار دیگه اضافه کن`}
        </Button>
      </CtaBar>
      <Sheet open={edit !== null} onClose={() => setEdit(null)} title={edit === 'invite' ? 'دعوت به بازی خصوصی' : 'افزودن یار'}>
        {edit === 'invite'
          ? <AddPlayer noGuest exclude={[...players.filter(Boolean).map((p) => p.id), ...w.invited]} onAdd={(p) => { set({ invited: [...w.invited, p.id] }); setEdit(null) }} />
          : edit !== null && <AddPlayer exclude={players.filter(Boolean).map((p) => p.id)} onAdd={(p) => { put(edit, p); setEdit(null) }} />}
      </Sheet>
    </div>
  )
}

function AddPlayer({ onAdd, exclude, noGuest }) {
  const [name, setName] = useState('')
  return (
    <div className="add-p">
      <p className="label">دوستان اخیر</p>
      <div className="friends">
        {FRIENDS.filter((f) => !exclude.includes(f.id)).map((f) => (
          <motion.button key={f.id} whileTap={{ scale: 0.9 }} onClick={() => onAdd(f)}>
            <Avatar name={f.name} size={48} />
            <span>{f.name.split(' ')[0]}</span>
            <LevelPill id={f.level} />
          </motion.button>
        ))}
      </div>
      {!noGuest && (
        <>
          <p className="label">یا مهمان (فقط اسمش کافیه)</p>
          <label className="field"><Icon name="user" /><input placeholder="نام مهمان" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <Button full disabled={name.trim().length < 2} onClick={() => onAdd({ id: 'g:' + name.trim(), name: name.trim(), level: null, guest: true })}>افزودن مهمان</Button>
        </>
      )}
    </div>
  )
}

// ---------- بازی‌های باز ----------
function StepGames({ w, set, onNext, onCreate }) {
  const { user, joined } = useStore()
  const dp = DAYPARTS.find((d) => d.id === w.daypart)
  const lv = levelOf(user, w.sport)
  const list = openMatches({ city: w.city, sport: w.sport, date: w.date, level: lv, clubId: w.clubId })
    .filter((g) => !joined.includes(g.id) && g.start >= dp.from && g.start < dp.to)
  return (
    <div className="games-pick">
      <h2 className="wz-h">به یکی بپیوند<small>مرتب بر اساس نزدیکی به سطح {lv}</small></h2>
      <motion.div variants={stagger} initial="hidden" animate="show" className="og-list">
        {list.map((g) => <motion.div key={g.id} variants={rise}><GameCard g={g} on={w.gameId === g.id} onClick={() => { haptic(8); set({ gameId: g.id }) }} /></motion.div>)}
        <motion.button variants={rise} className="create-card" whileTap={{ scale: 0.97 }} onClick={onCreate}>
          <Icon name="plus" size={26} /><div><b>خودم یه بازی باز می‌سازم</b><small>زمین رو انتخاب کن، بقیه رو ما پیدا می‌کنیم</small></div>
        </motion.button>
      </motion.div>
      <CtaBar><Button full disabled={!w.gameId} onClick={onNext}>{w.gameId ? 'پیوستن و پرداخت سهم' : 'یک بازی انتخاب کن'}</Button></CtaBar>
    </div>
  )
}

export function GameCard({ g, on, onClick }) {
  const c = clubById(g.clubId), s = sportById(g.sport)
  return (
    <motion.button className={`og ${on ? 'on' : ''}`} whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <div className="og-time"><b>{hourLabel(g.start)}</b><small>{dayLabel(g.date)}</small></div>
      <div className="grow">
        <div className="og-top">
          <span className={`og-fit ${g.gap === 0 ? 'hot' : ''}`}>{g.gap === 0 ? 'دقیقاً هم‌سطح' : g.gap === 1 ? 'نزدیک' : `${fa(g.gap)} سطح فاصله`}</span>
          <span className="og-lv">{g.levels.map((l) => <LevelPill key={l} id={l} />)}</span>
        </div>
        <b>{c.name}</b>
        <small className="muted">{c.area}، زمین {fa(g.court)}، {range(g.start, g.dur)}</small>
        <div className="og-ppl">
          {Array.from({ length: g.total }, (_, k) => g.players[k] ? <Avatar key={k} name={g.players[k].name} size={26} /> : <span key={k} className="og-empty" />)}
          <span className="og-left">{fa(g.total - g.players.length)} جای خالی</span>
          <em>{toman(g.share)}</em>
        </div>
      </div>
      {on && <motion.span className="tick" initial={{ scale: 0 }} animate={{ scale: 1 }}><Icon name="check" size={16} stroke={3} /></motion.span>}
    </motion.button>
  )
}

// ---------- مربی ----------
function StepCoach({ w, set, onNext }) {
  const club = clubById(w.clubId)
  const list = coachesAt(club, w.sport)
  const coach = coachById(w.coachId)
  return (
    <div className="coach-pick">
      <h2 className="wz-h">با کی تمرین کنیم؟</h2>
      {!list.length && <Empty text={`فعلاً مربی ${sportById(w.sport).name} در ${club.name} نداریم.`} />}
      <div className="coach-list">
        {list.map((m) => (
          <motion.button key={m.id} className={`coach-li ${w.coachId === m.id ? 'on' : ''}`} whileTap={{ scale: 0.98 }} onClick={() => { haptic(8); set({ coachId: m.id, start: null }) }}>
            <Avatar name={m.name} size={52} />
            <div className="grow">
              <b>{m.name} <LevelPill id={m.level} /></b>
              <small>{fa(m.exp)} سال سابقه، ★ {fa(m.rating)}</small>
              <p>{m.bio}</p>
            </div>
            <em>{short(m.price)}<small>هر جلسه</small></em>
          </motion.button>
        ))}
      </div>
      {coach && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label">تعداد جلسه</p>
          <div className="pack-grid">
            {COACH_PACKS.map((p) => (
              <motion.button key={p.id} className={`pack-opt ${w.pack === p.id ? 'on' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => { haptic(6); set({ pack: p.id }) }}>
                <b>{p.name}</b><span>{toman(coachPackPrice(coach, p))}</span>{p.tag && <small>{p.tag}</small>}
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
      {coach && COACH_PACKS.find((p) => p.id === w.pack)?.sessions > 1 && <p className="hint">📅 جلسه‌ها هر هفته همون روز و ساعتیه که در مرحله‌ی بعد انتخاب می‌کنی؛ همه همون لحظه در تقویم ثبت می‌شن.</p>}
      <CtaBar><Button full disabled={!coach} onClick={onNext}>انتخاب روز و ساعت</Button></CtaBar>
    </div>
  )
}

// ---------- مسابقه ----------
function StepEvent({ w, set, onNext }) {
  const { bookings } = useStore()
  const mine = new Set(bookings.filter((b) => b.kind === 'event' && b.status !== 'cancelled').map((b) => b.eventId))
  return (
    <div className="event-pick">
      {Object.entries(EVENT_KIND).map(([kind, k]) => {
        const list = tournaments(kind, w.sport, w.city, w.clubId).slice(0, 6)
        if (!list.length) return null
        return (
          <section key={kind} className="ev-group">
            <h2 className="wz-h">{k.name}<small>{k.sub}</small></h2>
            {list.map((e) => {
              const has = mine.has(e.id), c = clubById(e.clubId)
              return (
                <motion.button key={e.id} className={`ev-card ${w.eventId === e.id ? 'on' : ''} ${kind}`} disabled={has} whileTap={{ scale: 0.98 }} onClick={() => { haptic(8); set({ eventId: e.id, clubId: e.clubId }) }}>
                  <div className="ev-date"><b>{dayNum(fromKey(e.date))}</b><small>{weekday(fromKey(e.date))}</small></div>
                  <div className="grow">
                    <b>{e.title}</b>
                    <small>{c.name}، {hourLabel(e.start)}، سطح {e.levels.join(' / ')}</small>
                    <div className="ev-cap"><div className="bar"><i style={{ width: `${(e.taken / e.cap) * 100}%` }} /></div><span>{fa(e.taken)}/{fa(e.cap)}</span></div>
                  </div>
                  <em>{has ? 'ثبت‌نام شدی' : short(e.fee)}</em>
                </motion.button>
              )
            })}
          </section>
        )
      })}
      <CtaBar><Button full disabled={!w.eventId} onClick={onNext}>ثبت‌نام</Button></CtaBar>
    </div>
  )
}

// ---------- پرداخت ----------
function StepPay({ w, set, onDone }) {
  const s = useStore()
  const { user, bookings, wallet } = s
  const sport = sportById(w.sport)
  const club = clubById(w.clubId)
  const coach = coachById(w.coachId)
  const pack = COACH_PACKS.find((p) => p.id === w.pack)
  const me = { name: user.name, level: levelOf(user, w.sport), me: true }
  const game = w.gameId && openMatches({ city: w.city, sport: w.sport, date: w.date, level: me.level }).find((g) => g.id === w.gameId)
  const ev = w.eventId && tournaments('weekend', w.sport, w.city).concat(tournaments('official', w.sport, w.city)).find((e) => e.id === w.eventId)
  const total0 = sport.formats.find((f) => f.id === w.format)?.players || 4
  const missing = w.missing == null ? total0 - 1 : Math.min(w.missing, total0 - 1)
  const isOpen = w.intent === 'court' && missing > 0
  const series = SERIES.find((x) => x.id === w.series) || SERIES[0]
  const count = w.intent === 'coach' ? pack.sessions : w.intent === 'court' && !isOpen ? series.sessions : 1
  const plan = useMemo(() => (count > 1 ? planSeries(bookings, club, w.sport, { court: w.court, date: w.date, start: w.start, dur: w.intent === 'coach' ? 1 : w.dur, count }) : null),
    [count, w.court, w.date, w.start, w.dur])

  let title, sub, lines = [], total, recs, xp
  if (w.intent === 'match' && game) {
    const gc = clubById(game.clubId)
    title = 'پیوستن به بازی باز'; sub = `${gc.name}، ${dayLabel(game.date)}، ${range(game.start, game.dur)}`
    total = game.share
    lines = [['کل زمین', toman(game.price)], [`سهم تو (۱ از ${fa(game.total)})`, toman(game.share)]]
    const players = [...game.players, me]; while (players.length < game.total) players.push({})
    recs = [{ kind: 'join', sourceId: game.id, clubId: game.clubId, sport: game.sport, court: game.court, date: game.date, start: game.start, dur: game.dur, total: game.total, players, levels: game.levels, open: players.some((p) => !p.name), price: game.price, paid: game.share }]
    xp = 40
  } else if (w.intent === 'coach') {
    title = `${pack.name}، ${coach.name}`; sub = `${club.name}، ${count > 1 ? 'از ' : ''}${dayLabel(w.date)}، ${range(w.start, 1)}`
    total = coachPackPrice(coach, pack)
    lines = [[`${fa(count)} جلسه × ${toman(coach.price)}${pack.mult ? '، سهم هر نفر' : ''}`, toman(coach.price * count * (pack.mult || 1))], pack.off > 0 && ['تخفیف پکیج', '−' + toman(coach.price * count * pack.off)]].filter(Boolean)
    const ss = plan ? plan.sessions : [{ date: w.date, court: w.court, start: w.start }]
    recs = ss.map((x) => ({ kind: 'coach', coachId: coach.id, coachName: coach.name, pack: pack.name, clubId: club.id, sport: w.sport, court: x.court, date: x.date, start: x.start, dur: 1, players: [me], price: Math.round(total / count), paid: Math.round(total / count) }))
    xp = 40 + (count - 1) * 10
  } else if (w.intent === 'event' && ev) {
    const ec = clubById(ev.clubId)
    title = ev.title; sub = `${ec.name}، ${dayLabel(ev.date)} ${dayMonth(fromKey(ev.date))}، ${hourLabel(ev.start)}`
    total = ev.fee; lines = [['ورودی', toman(ev.fee)], ['جایزه', ev.prize], ['فرمت', ev.format]]
    recs = [{ kind: 'event', eventId: ev.id, title: ev.title, clubId: ev.clubId, sport: w.sport, court: 1, date: ev.date, start: ev.start, dur: 4, levels: ev.levels, players: [me], price: ev.fee, paid: ev.fee }]
    xp = 80
  } else {
    const players = Array.from({ length: total0 }, (_, k) => (k === 0 ? me : w.players[k] && k <= total0 - 1 - missing ? w.players[k] : {}))
    if (count > 1 && plan) {
      const prices = plan.sessions.map((x) => priceFor(club, w.sport, x.date, x.start, x.dur))
      const base = prices.reduce((a, x) => a + x, 0)
      total = Math.round(base * (1 - series.off) / 1000) * 1000
      title = `${series.name} زمین`; sub = `${club.name}، هر ${weekday(fromKey(w.date))}، ${range(w.start, w.dur)}`
      lines = [[`${fa(plan.sessions.length)} جلسه × ${fa(w.dur)} ساعت`, toman(base)], ['تخفیف پکیج', '−' + toman(base - total)]]
      recs = plan.sessions.map((x, k) => ({ kind: 'court', clubId: club.id, sport: w.sport, court: x.court, date: x.date, start: x.start, dur: x.dur, total: total0, players, price: prices[k], paid: Math.round(prices[k] * (1 - series.off)) }))
      xp = 50 + count * 10
    } else {
      const base = priceFor(club, w.sport, w.date, w.start, w.dur)
      title = isOpen ? 'بازی باز' : 'رزرو زمین'; sub = `${club.name}، ${dayLabel(w.date)}، ${range(w.start, w.dur)}، زمین ${fa(w.court)}`
      total = isOpen ? base / total0 : base
      lines = [[`زمین ${fa(w.dur)} ساعته`, toman(base)], isOpen && [`سهم تو (بقیه سهم خودشون رو می‌دن)`, toman(base / total0)]].filter(Boolean)
      recs = [{ kind: isOpen ? 'open' : 'court', clubId: club.id, sport: w.sport, court: w.court, date: w.date, start: w.start, dur: w.dur, total: total0, players, open: isOpen, visibility: w.visibility, invited: w.invited, levels: isOpen ? w.levels : null, price: base, paid: total }]
      xp = isOpen ? 60 : 50
    }
  }

  const [method, setMethod] = useState(() => (wallet >= total ? 'wallet' : 'online'))
  const useMethod = wallet >= total ? method : 'online'
  const [busy, setBusy] = useState(false)
  const blocked = plan && !plan.complete
  const confirm = () => {
    setBusy(true); haptic(12)
    setTimeout(() => {
      const r = s.book(recs, { method: useMethod, amount: total, xp })
      const b = recs[0]
      const reach = b.open && b.visibility !== 'private' ? poolSize(b.sport, w.city, b.levels || []) : 0
      s.notify({ icon: '✅', title: w.intent === 'event' ? 'ثبت‌نام شد' : 'رزرو تأیید شد', body: `${title}، ${sub}` })
      if (reach) { s.notify({ icon: '📣', title: 'درخواست بازیکن ارسال شد', body: `اعلان برای ${fa(reach)} بازیکن سطح ${b.levels.join('، ')} ارسال شد.` }); askNotifyPermission() }
      chime('success'); haptic([20, 40, 20, 40, 80])
      onDone({ ...r, kind: b.kind, title, sub, total, reach, color: sport.color })
    }, useMethod === 'online' ? 1300 : 600)
  }

  return (
    <div className="pay">
      {w.intent === 'court' && (
        <section>
          <p className="label">تعداد جلسه</p>
          <div className="pack-grid three">
            {SERIES.map((x) => (
              <motion.button key={x.id} className={`pack-opt ${w.series === x.id ? 'on' : ''}`} whileTap={{ scale: 0.95 }} disabled={isOpen && x.sessions > 1} onClick={() => { haptic(6); set({ series: x.id }) }}>
                <b>{x.name}</b>{x.tag ? <small>{x.tag}</small> : <span>همین یک بار</span>}
              </motion.button>
            ))}
          </div>
          {isOpen && <p className="hint">پکیج برای تیم کامله؛ برای خرید پکیج در مرحله‌ی قبل «تیم کامله» رو انتخاب کن.</p>}
        </section>
      )}
      <motion.div className="ticket" initial={{ rotateX: 20, opacity: 0, y: 20 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 18 }}>
        <div className="ticket-top">
          <span className="ticket-sport"><i />{sport.name}</span>
          <b>{title}</b>
          <small>{sub}</small>
        </div>
        <div className="perf"><i /><span /><i /></div>
        <div className="ticket-lines">{lines.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        <div className="ticket-total"><span>مبلغ قابل پرداخت</span><b><CountUp key={total} to={Math.round(total / 1000)} duration={0.5} format={(v) => fa(v * 1000)} /> <small>تومان</small></b></div>
      </motion.div>
      {plan && (
        <section className="plan">
          <p className="label">برنامه‌ی {fa(count)} جلسه — همه همین الان در تقویم رزرو می‌شن</p>
          {plan.sessions.map((x, k) => (
            <motion.div key={x.date} className={`plan-row ${x.moved ? 'moved' : ''}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(k, 10) * 0.03 }}>
              <span className="plan-n">{fa(k + 1)}</span>
              <div className="grow"><b>{weekday(fromKey(x.date))} {dayMonth(fromKey(x.date))}</b><small>زمین {fa(x.court)}{x.moved ? '، ساعت یا زمین جابه‌جا شد' : ''}</small></div>
              <span className="plan-t">{range(x.start, x.dur)}</span>
            </motion.div>
          ))}
          {blocked && <p className="hint warn">فقط {fa(plan.sessions.length)} از {fa(count)} جلسه جا شد. روز یا ساعت دیگه‌ای انتخاب کن.</p>}
        </section>
      )}
      <p className="label">روش پرداخت</p>
      <div className="methods">
        {[{ id: 'wallet', name: 'کیف پول', sub: toman(wallet), icon: 'wallet', ok: wallet >= total }, { id: 'online', name: 'کارت بانکی', sub: 'درگاه شتاب', icon: 'card', ok: true }].map((m) => (
          <motion.button key={m.id} className={`method ${useMethod === m.id ? 'on' : ''}`} disabled={!m.ok} whileTap={{ scale: 0.97 }} onClick={() => { haptic(6); setMethod(m.id) }}>
            <Icon name={m.icon} /><div className="grow"><b>{m.name}</b><small>{m.ok ? m.sub : 'موجودی کافی نیست'}</small></div>
            <span className={`radio ${useMethod === m.id ? 'on' : ''}`} />
          </motion.button>
        ))}
      </div>
      <p className="hint">لغو رایگان تا ۶ ساعت قبل از شروع — مبلغ به کیف پولت برمی‌گرده.</p>
      <CtaBar>
        <Button full variant="lime" disabled={busy || blocked} onClick={confirm}>
          {busy ? <><span className="spin" /> {useMethod === 'online' ? 'اتصال به درگاه…' : 'در حال ثبت…'}</> : `پرداخت ${toman(total)}`}
        </Button>
      </CtaBar>
    </div>
  )
}

function Success({ r, onHome, onGames }) {
  useEffect(() => { celebrate(['#D4FF3F', r.color, '#111311', '#ffffff']) }, [])
  const badges = BADGES.filter((x) => r.badges?.includes(x.id))
  return (
    <div className="success">
      <motion.svg width="104" height="104" viewBox="0 0 104 104" className="succ-check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 13 }}>
        <circle cx="52" cy="52" r="48" fill="var(--lime)" stroke="var(--ink)" strokeWidth="2.5" />
        <motion.path d="M31 54l14 14 29-31" fill="none" stroke="var(--ink)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.45 }} />
      </motion.svg>
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {r.kind === 'event' ? 'ثبت‌نام شدی!' : r.kind === 'join' ? 'به بازی پیوستی!' : r.count > 1 ? 'پکیج رزرو شد!' : 'زمین مال توئه!'}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: 0.4 }}>{r.title}، {r.sub}</motion.p>
      {r.count > 1 && <motion.span className="pill-ink" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>{fa(r.count)} جلسه در تقویمت ثبت شد</motion.span>}
      <motion.div className="xp-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <span className="xp-plus">+<CountUp to={r.xp || 0} duration={1.2} /></span><span>امتیاز تجربه</span>
      </motion.div>
      {r.reach > 0 && (
        <motion.div className="broadcast" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75 }}>
          <div className="radar"><span /><span /><span /><i /></div>
          <div><b>اعلان برای <CountUp to={r.reach} duration={1.6} /> بازیکن ارسال شد</b><small>به محض درخواست پیوستن، آلارم می‌گیری.</small></div>
        </motion.div>
      )}
      {badges.map((x, k) => (
        <motion.div key={x.id} className="badge-new" initial={{ opacity: 0, scale: 0.4, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1 + k * 0.2, type: 'spring', stiffness: 260, damping: 14 }}>
          <span className="badge-ic on">{x.icon}</span>
          <div><small>نشان جدید باز شد</small><b>{x.name}</b></div>
        </motion.div>
      ))}
      <div className="succ-cta">
        <Button full onClick={onGames} icon="cal">بازی‌های من</Button>
        <Button full variant="line" onClick={onHome}>خانه</Button>
      </div>
    </div>
  )
}
