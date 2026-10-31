import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  BADGES, COACH_PACKS, LEVELS, SERIES, clubById, coachById, coachPackPrice, courtsOf, dayKey, dayLabel, dayMonth, dayNum, fa, fromKey, hash, hourLabel,
  levelIndex, levelOf, nearLevels, nextDays, openMatches, poolSize, priceFor, range, short, sportById, toman, tournaments, weekday,
} from '../data'
import { askNotifyPermission, celebrate, chime, haptic } from '../fx'
import { isFree, planSeries, useStore } from '../store'
import { Avatar, Button, CountUp, CtaBar, Icon, LevelPill, Photo, TopBar } from '../components/ui'

const KIND_NAME = { court: 'رزرو زمین', open: 'بازی باز', join: 'پیوستن به بازی', coach: 'کلاس با مربی', event: 'ثبت‌نام مسابقه' }

// یک صفحه‌ی واحد «تأیید و پرداخت» به‌جای ویزارد چندمرحله‌ای
export default function Checkout({ kind, clubId, sport: sid, date: d0, start: s0, dur = 1, gameId, coachId, eventId, nav, onBack }) {
  const store = useStore()
  const { user, bookings, wallet } = store
  const club = clubById(clubId), sport = sportById(sid)
  const lv = levelOf(user, sid)
  const me = { name: user.name, level: lv, me: true }
  const fmt = sport.formats[0].players

  // کلاس مربی: روز و ساعت همین‌جا انتخاب می‌شود
  const coach = coachById(coachId)
  const [date, setDate] = useState(d0)
  const [start, setStart] = useState(s0 ?? null)
  const coachBusy = (h) => hash(coachId + date + h) < 0.35
  const coachHours = useMemo(() => {
    if (kind !== 'coach') return []
    const out = [], now = new Date()
    for (let h = 7; h < 23; h++) {
      if (date === dayKey(now) && h <= now.getHours()) continue
      if (!coachBusy(h) && courtsOf(club, sid).some((ct) => isFree(bookings, club, sid, ct.id, date, h, 1))) out.push(h)
    }
    return out
  }, [kind, date, bookings])

  const courts = start == null ? [] : courtsOf(club, sid).filter((ct) => isFree(bookings, club, sid, ct.id, date, start, kind === 'coach' ? 1 : dur))
  const [court, setCourt] = useState(null)
  useEffect(() => { if (!courts.some((c) => c.id === court)) setCourt(courts[0]?.id ?? null) }, [start, date])

  const [team, setTeam] = useState('full')
  const [missing, setMissing] = useState(fmt - 1)
  const [levels, setLevels] = useState(() => nearLevels(lv, 1))
  const [visibility, setVisibility] = useState('public')
  const [series, setSeries] = useState('single')
  const [packId, setPack] = useState('one')
  const isOpen = kind === 'court' && team === 'open'
  const ser = SERIES.find((x) => x.id === series)
  const pack = COACH_PACKS.find((p) => p.id === packId)
  const count = kind === 'coach' ? pack.sessions : kind === 'court' && !isOpen ? ser.sessions : 1
  const plan = useMemo(() => (count > 1 && start != null && court ? planSeries(bookings, club, sid, { court, date, start, dur: kind === 'coach' ? 1 : dur, count }) : null),
    [count, court, date, start, dur])

  const game = kind === 'join' && openMatches({ city: club.city, sport: sid, date, level: lv }).find((g) => g.id === gameId)
  const ev = kind === 'event' && [...tournaments('weekend', sid, club.city), ...tournaments('official', sid, club.city)].find((e) => e.id === eventId)

  let title, sub, lines = [], total = 0, recs = [], xp = 0
  if (game) {
    title = KIND_NAME.join; sub = `${dayLabel(game.date)}، ${range(game.start, game.dur)}، زمین ${fa(game.court)}`
    total = game.share
    lines = [['کل هزینه‌ی زمین', toman(game.price)], [`سهم تو (۱ از ${fa(game.total)})`, toman(game.share)]]
    const players = [...game.players, me]; while (players.length < game.total) players.push({})
    recs = [{ kind: 'join', sourceId: game.id, clubId, sport: sid, court: game.court, date: game.date, start: game.start, dur: game.dur, total: game.total, players, levels: game.levels, open: players.some((p) => !p.name), price: game.price, paid: game.share }]
    xp = 40
  } else if (ev) {
    title = ev.title; sub = `${dayLabel(ev.date)} ${dayMonth(fromKey(ev.date))}، ساعت ${hourLabel(ev.start)}`
    total = ev.fee; lines = [['ورودی', toman(ev.fee)], ['جایزه', ev.prize], ['فرمت', ev.format]]
    recs = [{ kind: 'event', eventId: ev.id, title: ev.title, clubId, sport: sid, court: 1, date: ev.date, start: ev.start, dur: 4, levels: ev.levels, players: [me], price: ev.fee, paid: ev.fee }]
    xp = 80
  } else if (kind === 'coach' && start != null && court) {
    title = `${coach.name}، ${pack.name}`; sub = `${count > 1 ? 'از ' : ''}${dayLabel(date)}، ${range(start, 1)}`
    total = coachPackPrice(coach, pack)
    lines = [[`${fa(count)} جلسه × ${toman(coach.price)}${pack.mult ? '، سهم هر نفر' : ''}`, toman(coach.price * count * (pack.mult || 1))], pack.off > 0 && ['تخفیف پکیج', '−' + toman(coach.price * count * pack.off)]].filter(Boolean)
    const ss = plan ? plan.sessions : [{ date, court, start }]
    recs = ss.map((x) => ({ kind: 'coach', coachId: coach.id, coachName: coach.name, pack: pack.name, clubId, sport: sid, court: x.court, date: x.date, start: x.start, dur: 1, players: [me], price: Math.round(total / count), paid: Math.round(total / count) }))
    xp = 40 + (count - 1) * 10
  } else if (kind === 'court' && court) {
    const players = isOpen ? [me, ...Array.from({ length: fmt - 1 }, (_, k) => (k < fmt - 1 - missing ? { name: 'یار ' + fa(k + 1), guest: true } : {}))] : [me]
    if (count > 1 && plan) {
      const prices = plan.sessions.map((x) => priceFor(club, sid, x.date, x.start, x.dur))
      const base = prices.reduce((a, x) => a + x, 0)
      total = Math.round(base * (1 - ser.off) / 1000) * 1000
      title = `${ser.name}`; sub = `هر ${weekday(fromKey(date))}، ${range(start, dur)}`
      lines = [[`${fa(plan.sessions.length)} جلسه × ${fa(dur)} ساعت`, toman(base)], ['تخفیف پکیج', '−' + toman(base - total)]]
      recs = plan.sessions.map((x, k) => ({ kind: 'court', clubId, sport: sid, court: x.court, date: x.date, start: x.start, dur: x.dur, total: fmt, players, price: prices[k], paid: Math.round(prices[k] * (1 - ser.off)) }))
      xp = 50 + count * 10
    } else {
      const base = priceFor(club, sid, date, start, dur)
      title = isOpen ? 'بازی باز' : 'رزرو زمین'; sub = `${dayLabel(date)} ${dayMonth(fromKey(date))}، ${range(start, dur)}`
      total = isOpen ? base / fmt : base
      lines = [[`زمین ${fa(dur)} ساعته`, toman(base)], isOpen && ['سهم تو (هر کس سهم خودش رو می‌ده)', toman(base / fmt)]].filter(Boolean)
      recs = [{ kind: isOpen ? 'open' : 'court', clubId, sport: sid, court, date, start, dur, total: fmt, players, open: isOpen, visibility, levels: isOpen ? levels : null, price: base, paid: total }]
      xp = isOpen ? 60 : 50
    }
  }

  const [method, setMethod] = useState('wallet')
  const useMethod = wallet >= total ? method : 'online'
  const [busy, setBusy] = useState(false)
  const blocked = !recs.length || (plan && !plan.complete)
  const reach = isOpen && visibility === 'public' ? poolSize(sid, club.city, levels) : 0
  const toggleLevel = (id) => {
    haptic(6)
    if (levels.includes(id)) { if (levels.length > 1) setLevels(levels.filter((x) => x !== id)) }
    else setLevels([...levels, id].sort((a, b) => levelIndex(a) - levelIndex(b)))
  }

  const pay = () => {
    setBusy(true); haptic(12)
    setTimeout(() => {
      const r = store.book(recs, { method: useMethod, amount: total, xp })
      store.notify({ icon: '✅', title: kind === 'event' ? 'ثبت‌نام شد' : 'رزرو تأیید شد', body: `${title}، ${club.name}، ${sub}` })
      if (reach) { store.notify({ icon: '📣', title: 'دنبال یار می‌گردیم', body: `اعلان برای ${fa(reach)} بازیکن سطح ${levels.join('، ')} ارسال شد.` }); askNotifyPermission() }
      chime('success'); haptic([20, 40, 20, 40, 80])
      nav.replace('success', { r: { ...r, kind: recs[0].kind, title, sub: `${club.name}، ${sub}`, total, reach, color: sport.color } })
    }, useMethod === 'online' ? 1300 : 600)
  }

  return (
    <div className="co">
      <TopBar title="تأیید و پرداخت" onBack={onBack} />
      <div className="co-body">
        <div className="co-sum">
          <Photo src={club.img} className="co-img" />
          <div className="grow">
            <span className="co-kind" style={{ '--c': sport.color }}><i />{KIND_NAME[isOpen ? 'open' : kind]}، {sport.name}</span>
            <b>{club.name}</b>
            <small><Icon name="star" size={12} fill="currentColor" /> {fa(club.rating)}، {club.area}</small>
          </div>
        </div>

        {kind === 'coach' && (
          <section className="co-sec">
            <h3>مربی و تعداد جلسه</h3>
            <div className="co-coach">
              <Avatar name={coach.name} size={46} />
              <div className="grow"><b>{coach.name} <LevelPill id={coach.level} /></b><small>{coach.bio}</small></div>
            </div>
            <div className="co-opts four">
              {COACH_PACKS.map((p) => (
                <button key={p.id} className={packId === p.id ? 'on' : ''} onClick={() => { haptic(6); setPack(p.id) }}>
                  <b>{p.name}</b><small>{short(coachPackPrice(coach, p))}</small>{p.tag && <em>{p.tag}</em>}
                </button>
              ))}
            </div>
            <h3>روز و ساعت</h3>
            <div className="bx-days">
              {nextDays(14).map((x) => {
                const k = dayKey(x)
                return <button key={k} className={date === k ? 'on' : ''} onClick={() => { haptic(6); setDate(k); setStart(null) }}><small>{dayLabel(x)}</small><b>{dayNum(x)}</b></button>
              })}
            </div>
            <div className="co-hours">
              {coachHours.map((h) => <button key={h} className={start === h ? 'on' : ''} onClick={() => { haptic(6); setStart(h) }}>{hourLabel(h)}</button>)}
              {!coachHours.length && <p className="muted">این روز مربی وقت آزاد نداره.</p>}
            </div>
          </section>
        )}

        {(kind === 'court' || kind === 'coach') && start != null && (
          <section className="co-sec">
            <h3>زمان و زمین</h3>
            <div className="co-row"><span>روز</span><b>{dayLabel(date)}، {weekday(fromKey(date))} {dayMonth(fromKey(date))}</b></div>
            <div className="co-row"><span>ساعت</span><b>{range(start, kind === 'coach' ? 1 : dur)}</b></div>
            <div className="co-row"><span>زمین</span>
              <div className="co-courts">
                {courts.map((ct) => <button key={ct.id} className={court === ct.id ? 'on' : ''} onClick={() => { haptic(6); setCourt(ct.id) }}>{fa(ct.id)}</button>)}
                {!courts.length && <small className="warn">این ساعت دیگه آزاد نیست</small>}
              </div>
            </div>
            {kind === 'court' && <button className="link" onClick={onBack}>تغییر روز یا ساعت</button>}
          </section>
        )}

        {kind === 'court' && court && (
          <section className="co-sec">
            <h3>با کی بازی می‌کنی؟</h3>
            <div className="co-team">
              <button className={team === 'full' ? 'on' : ''} onClick={() => { haptic(6); setTeam('full') }}>
                <span className="ct-dots">{Array.from({ length: fmt }, (_, k) => <i key={k} className="f" />)}</span>
                <b>تیمم کامله</b><small>با دوستام میام</small>
              </button>
              <button className={team === 'open' ? 'on' : ''} onClick={() => { haptic(6); setTeam('open'); setSeries('single') }}>
                <span className="ct-dots">{Array.from({ length: fmt }, (_, k) => <i key={k} className={k === 0 ? 'f' : ''} />)}</span>
                <b>دنبال یار هم‌سطح</b><small>بقیه رو ما پیدا می‌کنیم</small>
              </button>
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div className="co-open" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="co-row"><span>چند نفر کمه؟</span>
                    <div className="co-courts">{Array.from({ length: fmt - 1 }, (_, k) => k + 1).map((m) => <button key={m} className={missing === m ? 'on' : ''} onClick={() => { haptic(6); setMissing(m) }}>{fa(m)}</button>)}</div>
                  </div>
                  <p className="co-mini">چه سطح‌هایی بیان؟</p>
                  <div className="lv-pick">
                    {LEVELS.map((l) => <button key={l.id} className={levels.includes(l.id) ? 'on' : ''} style={{ '--c': l.color }} onClick={() => toggleLevel(l.id)}>{l.id}</button>)}
                  </div>
                  <div className="co-vis">
                    {[['public', 'عمومی', 'همه‌ی هم‌سطح‌ها می‌بینن'], ['private', 'خصوصی', 'فقط با لینک دعوت']].map(([id, n, d]) => (
                      <button key={id} className={visibility === id ? 'on' : ''} onClick={() => { haptic(6); setVisibility(id) }}><Icon name={id === 'public' ? 'users' : 'lock'} size={17} /><span><b>{n}</b><small>{d}</small></span></button>
                    ))}
                  </div>
                  {reach > 0 && <p className="co-reach"><Icon name="radar" size={18} /> به <b><CountUp key={reach} to={reach} duration={0.6} /></b> بازیکن هم‌سطح اعلان می‌دیم</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {kind === 'court' && court && !isOpen && (
          <section className="co-sec">
            <h3>هر هفته تکرار بشه؟</h3>
            <div className="co-opts">
              {SERIES.map((x) => (
                <button key={x.id} className={series === x.id ? 'on' : ''} onClick={() => { haptic(6); setSeries(x.id) }}>
                  <b>{x.name}</b><small>{x.sessions > 1 ? `هر ${weekday(fromKey(date))}` : 'فقط همین بار'}</small>{x.tag && <em>{x.tag}</em>}
                </button>
              ))}
            </div>
          </section>
        )}

        {plan && (
          <section className="co-sec">
            <h3>{fa(count)} جلسه، همه همین الان رزرو می‌شن</h3>
            <div className="co-plan">
              {plan.sessions.map((x, k) => (
                <span key={x.date} className={x.moved ? 'moved' : ''}><b>{fa(k + 1)}</b>{dayMonth(fromKey(x.date))}{x.moved && '*'}</span>
              ))}
            </div>
            {plan.sessions.some((x) => x.moved) && <p className="co-mini">* ساعت یا زمین این جلسه کمی جابه‌جا شد.</p>}
            {!plan.complete && <p className="warn">فقط {fa(plan.sessions.length)} از {fa(count)} جلسه جا شد. ساعت دیگه‌ای انتخاب کن.</p>}
          </section>
        )}

        {game && (
          <section className="co-sec">
            <h3>{sub}</h3>
            <div className="co-players">
              {Array.from({ length: game.total }, (_, k) => {
                const p = game.players[k]
                return (
                  <div key={k} className={p ? '' : k === game.players.length ? 'me' : 'empty'}>
                    {p ? <Avatar name={p.name} size={44} /> : k === game.players.length ? <Avatar name={user.name} size={44} me /> : <Avatar empty size={44} />}
                    <small>{p ? p.name.split(' ')[0] : k === game.players.length ? 'تو' : 'خالی'}</small>
                    {p ? <LevelPill id={p.level} /> : k === game.players.length ? <LevelPill id={lv} /> : null}
                  </div>
                )
              })}
            </div>
            <p className="co-mini">سطح این بازی: {game.levels.join(' / ')}، سطح تو {lv}</p>
          </section>
        )}

        {ev && (
          <section className="co-sec">
            <h3>{ev.title}</h3>
            <div className="co-row"><span>زمان</span><b>{sub}</b></div>
            <div className="co-row"><span>سطح</span><b>{ev.levels.join(' / ')}</b></div>
            <div className="co-row"><span>ظرفیت</span><b>{fa(ev.taken)} از {fa(ev.cap)}</b></div>
          </section>
        )}

        {recs.length > 0 && (
          <>
            <section className="co-sec">
              <h3>جزئیات قیمت</h3>
              {lines.map(([k, v]) => <div key={k} className="co-row"><span>{k}</span><b>{v}</b></div>)}
              <div className="co-row total"><span>جمع</span><b>{toman(total)}</b></div>
            </section>
            <section className="co-sec">
              <h3>پرداخت با</h3>
              {[{ id: 'wallet', name: 'کیف پول', sub: `موجودی ${toman(wallet)}`, icon: 'wallet', ok: wallet >= total }, { id: 'online', name: 'کارت بانکی', sub: 'درگاه شتاب', icon: 'card', ok: true }].map((m) => (
                <button key={m.id} className={`co-method ${useMethod === m.id ? 'on' : ''}`} disabled={!m.ok} onClick={() => { haptic(6); setMethod(m.id) }}>
                  <Icon name={m.icon} /><span className="grow"><b>{m.name}</b><small>{m.ok ? m.sub : 'موجودی کافی نیست'}</small></span><span className={`radio ${useMethod === m.id ? 'on' : ''}`} />
                </button>
              ))}
            </section>
            <p className="co-mini">لغو رایگان تا ۶ ساعت قبل از شروع؛ مبلغ به کیف پولت برمی‌گرده.</p>
          </>
        )}
      </div>
      <CtaBar>
        <Button full variant="lime" disabled={busy || blocked} onClick={pay}>
          {busy ? <><span className="spin" /> {useMethod === 'online' ? 'اتصال به درگاه…' : 'در حال ثبت…'}</> : recs.length ? `پرداخت ${toman(total)}` : kind === 'coach' ? 'یک ساعت انتخاب کن' : 'این ساعت آزاد نیست'}
        </Button>
      </CtaBar>
    </div>
  )
}

export function Success({ r, nav }) {
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
        <Button full onClick={() => nav.done('trips')} icon="cal">رزروهای من</Button>
        <Button full variant="line" onClick={() => nav.done('explore')}>ادامه‌ی کاوش</Button>
      </div>
    </div>
  )
}
