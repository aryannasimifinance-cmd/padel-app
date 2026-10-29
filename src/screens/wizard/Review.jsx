import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BADGES, COACHES, COACH_FORMATS, activityById, clubById, dayLabel, dayMonth, fa, fromKey, hourLabel, poolSize, sportById, toman } from '../../data'
import { askNotifyPermission, celebrate, chime, haptic } from '../../fx'
import { useStore } from '../../store'
import { Avatar, Button, Chips, CountUp, Icon, LevelPill, Photo } from '../../components/ui'

export function buildBooking(w, user) {
  const club = clubById(w.clubId), act = activityById(w.activity)
  const base = { id: 'b' + Date.now(), kind: w.activity, sport: w.sport, clubId: w.clubId, date: w.date, start: w.start, court: w.court, createdAt: Date.now() }
  if (w.activity === 'game') {
    const total = w.format === 'singles' ? 2 : 4
    const players = (w.players.length === total ? w.players : [{ name: user.name, level: user.level, me: true }, ...Array(total - 1).fill(null)]).map((p) => p || {})
    const price = club.price[w.sport] * w.duration
    const empty = players.filter((p) => !p.name).length
    return { ...base, duration: w.duration, total, players, open: w.open && empty > 0, levels: w.levels, price, share: price / total }
  }
  if (w.activity === 'practice') {
    const price = club.price[w.sport]
    return { ...base, duration: 1, total: 1, players: [{ name: user.name, level: user.level, me: true }], price, share: price }
  }
  if (w.activity === 'coach') {
    const m = COACHES.find((x) => x.id === w.coachId), f = COACH_FORMATS.find((x) => x.id === w.coachFormat)
    const price = m.price * f.mult
    return { ...base, duration: 1, coachId: m.id, coachName: m.name, coachFormat: f.name, price, share: price / f.people }
  }
  const t = w.tournament
  return {
    ...base, duration: 4, tournamentId: t.id, title: t.title, levels: t.levels, price: t.fee, share: t.partner ? t.fee / 2 : t.fee,
    partner: w.partner.trim() || null, open: !!w.findPartner, total: t.partner ? 2 : 1,
    players: t.partner ? [{ name: user.name, level: user.level, me: true }, w.partner.trim() ? { name: w.partner.trim(), level: user.level } : {}] : [{ name: user.name, level: user.level, me: true }],
  }
}

export function Review({ w, onDone }) {
  const { user, addBooking, notify } = useStore()
  const [pay, setPay] = useState('share')
  const [busy, setBusy] = useState(false)
  const b = buildBooking(w, user)
  const club = clubById(b.clubId), sport = sportById(b.sport), act = activityById(b.kind)
  const d = fromKey(b.date)
  const splittable = b.share < b.price
  const amount = pay === 'share' && splittable ? b.share : b.price

  const confirm = async () => {
    setBusy(true); haptic([10, 30, 10])
    await new Promise((r) => setTimeout(r, 1100))
    const reach = b.open ? poolSize(b.sport, user.city, b.levels) : 0
    const gained = addBooking({ ...b, paid: amount }, act.xp + (b.open ? 10 : 0))
    notify({ icon: '✅', title: 'رزرو تأیید شد', body: `${act.name} ${sport.name} · ${club.name} · ${dayLabel(d)} ساعت ${hourLabel(b.start)}` })
    if (b.open) {
      notify({ icon: '📣', title: 'درخواست بازیکن ارسال شد', body: `اعلان برای ${fa(reach)} بازیکن سطح ${b.levels.join('، ')} ارسال شد. به محض پیوستن کسی خبرت می‌کنیم.` })
      askNotifyPermission()
    }
    onDone({ booking: b, gained, reach })
  }

  return (
    <div className="review">
      <motion.div className="ticket" initial={{ rotateX: 30, opacity: 0, y: 30 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
        <Photo src={club.img} className="ticket-img">
          <div className="ticket-shade" />
          <div className="ticket-over">
            <span className="pill" style={{ background: sport.color }}>{sport.name}</span>
            <span className="pill glass">{act.name}</span>
          </div>
          <h2>{b.title || club.name}</h2>
        </Photo>
        <div className="ticket-body">
          <div className="t-grid">
            <div><small>روز</small><b>{dayLabel(d)}، {dayMonth(d)}</b></div>
            <div><small>ساعت</small><b>{hourLabel(b.start)}{b.kind !== 'weekend' && b.kind !== 'official' ? ` – ${hourLabel(b.start + b.duration)}` : ''}</b></div>
            <div><small>باشگاه</small><b>{club.name}</b></div>
            <div><small>{b.kind === 'coach' ? 'مربی' : 'زمین'}</small><b>{b.kind === 'coach' ? b.coachName : `زمین ${fa(b.court || 1)}`}</b></div>
          </div>
          {b.players && b.players.length > 1 && (
            <div className="t-players">
              {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={36} /> : <Avatar key={k} empty size={36} />))}
              {b.open && <span className="t-open">جای خالی با مچ‌میکینگ پر می‌شود · {b.levels.map((l) => <LevelPill key={l} id={l} />)}</span>}
            </div>
          )}
          {b.kind === 'coach' && <p className="muted">جلسه {b.coachFormat}</p>}
        </div>
        <div className="perf"><i /><span /><i /></div>
        <div className="ticket-foot">
          {splittable && (
            <Chips id="pay" options={[{ id: 'share', name: 'فقط سهم خودم' }, { id: 'full', name: 'کل مبلغ' }]} value={pay} onChange={setPay} />
          )}
          <div className="sum">
            <span>{splittable && pay === 'share' ? `سهم شما از ${toman(b.price)}` : 'مبلغ قابل پرداخت'}</span>
            <b><CountUp key={amount} to={amount / 1000} duration={0.5} format={(v) => fa(v * 1000)} /> <small>تومان</small></b>
          </div>
        </div>
      </motion.div>
      <p className="muted center small">لغو رایگان تا ۲۴ ساعت قبل از شروع · +{fa(act.xp + (b.open ? 10 : 0))} امتیاز</p>
      <div className="cta-bar">
        <Button full variant="lime" disabled={busy} onClick={confirm}>
          {busy ? <span className="spin" /> : 'پرداخت و ثبت نهایی'}
        </Button>
      </div>
    </div>
  )
}

export function Success({ result, onHome, onMatches }) {
  const { booking: b, gained, reach } = result
  const sport = sportById(b.sport), club = clubById(b.clubId)
  useEffect(() => {
    celebrate(['#D4FF3F', sport.color, '#0E0F0C', '#ffffff']); chime('success'); haptic([30, 50, 30])
  }, [])
  const badges = BADGES.filter((x) => gained.badges.includes(x.id))
  return (
    <div className="success">
      <motion.svg width="110" height="110" viewBox="0 0 110 110" className="succ-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
        <circle cx="55" cy="55" r="52" fill="var(--lime)" />
        <motion.path d="M32 57l15 15 32-34" fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
      </motion.svg>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {b.kind === 'weekend' || b.kind === 'official' ? 'ثبت‌نام شدی!' : 'زمین مال توئه!'}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.4 }}>
        {club.name} · {dayLabel(fromKey(b.date))} {dayMonth(fromKey(b.date))} · {hourLabel(b.start)}
      </motion.p>

      <motion.div className="xp-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <span className="xp-plus">+<CountUp to={gained.xp + gained.badges.length * 15} duration={1.4} /></span>
        <span>امتیاز تجربه</span>
      </motion.div>

      {b.open && (
        <motion.div className="broadcast" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75 }}>
          <div className="radar big"><span /><span /><span /><i /></div>
          <div>
            <b>اعلان برای <CountUp to={reach} duration={1.8} /> بازیکن ارسال شد</b>
            <small>سطح {b.levels.join('، ')} · {sport.name} — به محض درخواست پیوستن، آلارم می‌گیری.</small>
          </div>
        </motion.div>
      )}

      {badges.map((x, k) => (
        <motion.div key={x.id} className="badge-new" initial={{ opacity: 0, scale: 0.4, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1 + k * 0.25, type: 'spring', stiffness: 260, damping: 14 }}>
          <span className="badge-ic shine">{x.icon}</span>
          <div><small>نشان جدید باز شد</small><b>{x.name}</b></div>
        </motion.div>
      ))}

      <motion.div className="succ-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
        <Button full variant="lime" icon="cal" onClick={onMatches}>بازی‌های من</Button>
        <Button full variant="ghost" onClick={onHome}>صفحه اصلی</Button>
      </motion.div>
    </div>
  )
}
