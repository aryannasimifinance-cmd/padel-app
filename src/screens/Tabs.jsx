import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BADGES, CITIES, CREDITS, LEVELS, SPORTS, activityById, clubById, dayLabel, dayMonth, fa, fromKey, hash, hourLabel, rankOf, sportById, toman } from '../data'
import { askNotifyPermission, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Button, Chips, Icon, LevelPill, Photo, Sheet, rise, stagger } from '../components/ui'
import { Empty } from './wizard/Pick'

// ---------- بازی‌های من ----------
export function Matches({ onStart }) {
  const { bookings, cancelBooking, toast } = useStore()
  const [tab, setTab] = useState('up')
  const [sel, setSel] = useState(null)
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const list = bookings.filter((b) => (tab === 'up' ? fromKey(b.date) >= today : fromKey(b.date) < today))
    .sort((a, b) => (fromKey(a.date) - fromKey(b.date) || a.start - b.start) * (tab === 'up' ? 1 : -1))
  const cur = sel && bookings.find((b) => b.id === sel)

  return (
    <div className="page">
      <h1 className="page-h">بازی‌های من</h1>
      <Chips id="mt" options={[{ id: 'up', name: 'پیش رو' }, { id: 'past', name: 'گذشته' }]} value={tab} onChange={setTab} />
      {!list.length && (
        <>
          <Empty text={tab === 'up' ? 'هنوز رزروی نداری. اولین زمینت رو بگیر!' : 'تاریخچه‌ای نیست.'} />
          {tab === 'up' && <Button full variant="lime" icon="plus" onClick={() => onStart({})}>رزرو جدید</Button>}
        </>
      )}
      <motion.div className="bookings" variants={stagger} initial="hidden" animate="show" key={tab}>
        {list.map((b) => <BookingCard key={b.id} b={b} onClick={() => setSel(b.id)} />)}
      </motion.div>
      <Sheet open={!!cur} onClose={() => setSel(null)} title={cur ? (cur.title || `${activityById(cur.kind).name} ${sportById(cur.sport).name}`) : ''}>
        {cur && (
          <div className="bk-detail">
            <Photo src={clubById(cur.clubId).img} className="td-img" />
            <div className="td-grid">
              <div><small>روز</small><b>{dayLabel(fromKey(cur.date))} {dayMonth(fromKey(cur.date))}</b></div>
              <div><small>ساعت</small><b>{hourLabel(cur.start)}</b></div>
              <div><small>باشگاه</small><b>{clubById(cur.clubId).name}</b></div>
              <div><small>پرداختی شما</small><b>{toman(cur.paid || cur.share || cur.price)}</b></div>
            </div>
            {cur.players?.length > 1 && (
              <>
                <p className="label">بازیکن‌ها</p>
                <div className="pl-list">
                  {cur.players.map((p, k) => (
                    <div key={k} className="pl-row">
                      {p.name ? <Avatar name={p.name} me={p.me} size={40} /> : <Avatar empty size={40} />}
                      <span className="grow">{p.name ? (p.me ? 'شما' : p.name) : cur.open ? 'در انتظار بازیکن هم‌سطح…' : 'جای خالی'}</span>
                      {p.level && <LevelPill id={p.level} />}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="row-btns">
              <Button variant="ghost" icon="users" onClick={() => {
                const text = `بیا ${sportById(cur.sport).name} بازی کنیم! ${clubById(cur.clubId).name} · ${dayLabel(fromKey(cur.date))} ساعت ${hourLabel(cur.start)}`
                if (navigator.share) navigator.share({ title: 'matchy', text }).catch(() => {})
                else { navigator.clipboard?.writeText(text); toast({ icon: '🔗', title: 'متن دعوت کپی شد' }) }
              }}>دعوت</Button>
              <Button variant="danger" onClick={() => { cancelBooking(cur.id); setSel(null); toast({ icon: '🗑', title: 'رزرو لغو شد', body: 'مبلغ به کیف پولت برگشت.' }) }}>لغو رزرو</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function BookingCard({ b, onClick }) {
  const s = sportById(b.sport), c = clubById(b.clubId), d = fromKey(b.date)
  const empty = b.players?.filter((p) => !p.name).length || 0
  return (
    <motion.button variants={rise} className="bk" whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <Photo src={c.img} className="bk-img" />
      <div className="bk-body">
        <div className="bk-tags"><span style={{ background: s.color }}>{s.name}</span><span>{activityById(b.kind).name}</span></div>
        <b>{b.title || c.name}</b>
        <p className="muted">{dayLabel(d)} {dayMonth(d)} · {hourLabel(b.start)}{b.coachName ? ` · ${b.coachName}` : ''}</p>
        {b.players?.length > 1 && (
          <div className="mini-av">
            {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={24} /> : <span key={k} className="mini-empty" />))}
            {empty > 0 && b.open && <span className="searching-tag"><i /> دنبال {fa(empty)} نفر</span>}
            {empty === 0 && <span className="full-tag">تیم کامل ✓</span>}
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ---------- اعلان‌ها ----------
export function Notifications() {
  const { notifications, readAll, resolveNotif, acceptJoin, toast } = useStore()
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const accept = (n) => {
    acceptJoin(n.id)
    chime('success'); haptic([15, 30, 15])
    toast({ icon: '🎉', title: n.player.name + ' به تیمت اضافه شد' })
  }
  return (
    <div className="page">
      <div className="page-hrow">
        <h1 className="page-h">اعلان‌ها</h1>
        {notifications.some((n) => !n.read) && <button className="link" onClick={readAll}>همه خوانده شد</button>}
      </div>
      {perm !== 'granted' && perm !== 'unsupported' && (
        <motion.div className="perm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <motion.span animate={{ rotate: [0, -18, 18, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1.5 }}>🔔</motion.span>
          <div className="grow"><b>آلارم بازی رو روشن کن</b><small>وقتی کسی برای بازی دنبال هم‌سطح توئه، فوری خبردار شو.</small></div>
          <Button variant="lime" onClick={async () => setPerm(await askNotifyPermission())}>روشن</Button>
        </motion.div>
      )}
      {!notifications.length && <Empty text="فعلاً خبری نیست." />}
      <motion.div className="notifs" variants={stagger} initial="hidden" animate="show">
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div key={n.id} variants={rise} layout className={`notif ${n.read ? '' : 'unread'}`} exit={{ opacity: 0, x: 60 }}>
              <span className="n-ic">{n.icon}</span>
              <div className="grow">
                <b>{n.title}</b>
                <p>{n.body}</p>
                <small className="muted">{ago(n.at)}</small>
                {n.type === 'join' && !n.resolved && (
                  <div className="n-act">
                    <Button variant="lime" onClick={() => accept(n)}>قبول</Button>
                    <Button variant="ghost" onClick={() => resolveNotif(n.id, { resolved: 'declined', read: true })}>رد</Button>
                  </div>
                )}
                {n.resolved && <small className={`n-res ${n.resolved}`}>{{ accepted: '✓ قبول شد', declined: 'رد شد', expired: 'تیم کامل شده بود', joined: '✓ پیوستی' }[n.resolved]}</small>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
function ago(t) {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'همین الان'
  if (m < 60) return `${fa(m)} دقیقه پیش`
  const h = Math.floor(m / 60)
  return h < 24 ? `${fa(h)} ساعت پیش` : `${fa(Math.floor(h / 24))} روز پیش`
}

// ---------- پروفایل ----------
export function Profile() {
  const { user, xp, badges, bookings, logout, updateUser } = useStore()
  const rank = rankOf(xp)
  const [editLvl, setEditLvl] = useState(false)
  const [credits, setCredits] = useState(false)
  const hours = bookings.reduce((s, b) => s + (b.duration || 1), 0)
  const board = Array.from({ length: 7 }, (_, k) => ({ name: ['آرمان ط.', 'سارا ک.', 'کیان م.', 'الناز ر.', 'پویا ن.', 'هستی ص.', 'سینا ج.'][k], xp: Math.floor(200 + hash('lb' + user.city + k) * 1600) }))
    .concat({ name: user.name, xp, me: true }).sort((a, b) => b.xp - a.xp)

  return (
    <div className="page profile">
      <motion.div className="pf-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Avatar name={user.name} size={84} me ring="var(--ink)" />
        <h1>{user.name}</h1>
        <p className="muted">{CITIES.find((c) => c.id === user.city).name} · {rank.name}</p>
        <button className="pf-lvl" onClick={() => setEditLvl(true)}><LevelPill id={user.level} big /> <span>{LEVELS.find((l) => l.id === user.level).title}</span> <Icon name="edit" size={16} /></button>
      </motion.div>
      <div className="stats">
        {[{ n: bookings.length, t: 'رزرو' }, { n: hours, t: 'ساعت بازی' }, { n: xp, t: 'امتیاز' }, { n: badges.length, t: 'نشان' }].map((s, k) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.06 }}><b>{fa(s.n)}</b><small>{s.t}</small></motion.div>
        ))}
      </div>

      <div className="sec-h"><h3>نشان‌ها</h3><small className="muted">{fa(badges.length)} از {fa(BADGES.length)}</small></div>
      <div className="badges">
        {BADGES.map((b, k) => {
          const on = badges.includes(b.id)
          return (
            <motion.div key={b.id} className={`badge ${on ? 'on' : ''}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.04 }} whileTap={{ scale: 0.9, rotate: on ? 8 : 0 }}>
              <span className={`badge-ic ${on ? 'shine' : ''}`}>{on ? b.icon : '🔒'}</span>
              <b>{b.name}</b>
              <small>{b.desc}</small>
            </motion.div>
          )
        })}
      </div>

      <div className="sec-h"><h3>جدول {CITIES.find((c) => c.id === user.city).name} این ماه</h3></div>
      <div className="board">
        {board.map((p, k) => (
          <motion.div key={p.name} className={`board-row ${p.me ? 'me' : ''}`} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.04 }}>
            <span className="board-n">{k < 3 ? ['🥇', '🥈', '🥉'][k] : fa(k + 1)}</span>
            <Avatar name={p.name} size={34} me={p.me} />
            <span className="grow">{p.me ? 'شما' : p.name}</span>
            <b>{fa(p.xp)}</b>
          </motion.div>
        ))}
      </div>

      <div className="sec-h"><h3>تنظیمات</h3></div>
      <div className="settings">
        <div className="set-row"><span>شهر</span><Chips id="pc" small options={CITIES.map((c) => ({ id: c.id, name: c.name }))} value={user.city} onChange={(city) => updateUser({ city })} /></div>
        <div className="set-row col"><span>رشته‌های من</span>
          <Chips id="ps" small options={SPORTS.map((s) => ({ id: s.id, name: s.name }))} value={user.sports || []}
            onChange={(id) => { const cur = user.sports || []; const n = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; if (n.length) updateUser({ sports: n }) }} />
        </div>
        <button className="set-row" onClick={() => setCredits(true)}><span>منابع تصاویر</span><Icon name="back" size={18} style={{ transform: 'scaleX(-1)' }} /></button>
        <button className="set-row danger" onClick={() => { haptic(20); logout() }}><span>خروج از حساب</span><Icon name="logout" size={18} /></button>
      </div>

      <Sheet open={editLvl} onClose={() => setEditLvl(false)} title="تغییر سطح">
        <div className="level-list">
          {LEVELS.map((l) => (
            <button key={l.id} className={`level-row ${user.level === l.id ? 'on' : ''}`} onClick={() => { updateUser({ level: l.id }); chime('tap'); setEditLvl(false) }}>
              <LevelPill id={l.id} /><div><b>{l.title}</b><small>{l.desc}</small></div>
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={credits} onClose={() => setCredits(false)} title="منابع تصاویر">
        <ul className="credits" dir="ltr">{CREDITS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Sheet>
    </div>
  )
}
