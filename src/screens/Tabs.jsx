import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BADGES, CITIES, CREDITS, LEVELS, SPORTS, clubById, dayLabel, dayMonth, dayNum, fa, fromKey, hash, hourLabel, levelById, levelOf, range, rankOf, sportById, toman } from '../data'
import { askNotifyPermission, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Button, Chips, CountUp, Empty, Icon, LevelPill, Photo, Sheet, TopBar, rise, stagger } from '../components/ui'
import { CourtArt } from '../components/Art'
import { Head } from './Home'
import LevelQuiz from './LevelQuiz'

const KIND = { court: 'رزرو زمین', open: 'بازی باز', join: 'بازی باز', coach: 'کلاس مربی', event: 'مسابقه' }

// ---------- بازی‌های من ----------
export function Matches({ nav }) {
  const { bookings, cancelBooking, toast } = useStore()
  const [tab, setTab] = useState('up')
  const [sel, setSel] = useState(null)
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const list = bookings.filter((b) => b.status !== 'cancelled' && (tab === 'up' ? fromKey(b.date) >= today : fromKey(b.date) < today))
    .sort((a, b) => (fromKey(a.date) - fromKey(b.date) || a.start - b.start) * (tab === 'up' ? 1 : -1))
  const cur = sel && bookings.find((b) => b.id === sel)

  return (
    <div className="page">
      <h1 className="page-h">بازی‌های من</h1>
      <Chips id="mt" options={[{ id: 'up', name: 'پیش رو' }, { id: 'past', name: 'گذشته' }]} value={tab} onChange={setTab} />
      {!list.length && (
        <>
          <Empty text={tab === 'up' ? 'هنوز رزروی نداری. اولین زمینت رو بگیر!' : 'تاریخچه‌ای نیست.'} />
          {tab === 'up' && <Button full icon="plus" onClick={() => nav.start({})}>رزرو جدید</Button>}
        </>
      )}
      <motion.div className="tline" variants={stagger} initial="hidden" animate="show" key={tab}>
        {[...new Set(list.map((b) => b.date))].map((date) => (
          <motion.div key={date} variants={rise} className="tl-day">
            <div className="tl-date"><b>{dayNum(fromKey(date))}</b><small>{dayLabel(date)}</small></div>
            <div className="tl-items">
              {list.filter((b) => b.date === date).map((b) => <BookingCard key={b.id} b={b} onClick={() => setSel(b.id)} />)}
            </div>
          </motion.div>
        ))}
      </motion.div>
      <Sheet open={!!cur} onClose={() => setSel(null)} title={cur ? `${cur.title || KIND[cur.kind]}، ${sportById(cur.sport).name}` : ''}>
        {cur && (
          <div className="bk-detail">
            <Photo src={clubById(cur.clubId).img} tone={sportById(cur.sport).color} className="td-img" />
            <div className="td-grid">
              <div><small>روز</small><b>{dayLabel(cur.date)} {dayMonth(fromKey(cur.date))}</b></div>
              <div><small>ساعت</small><b>{range(cur.start, cur.dur)}</b></div>
              <div><small>باشگاه</small><b>{clubById(cur.clubId).name}</b></div>
              <div><small>{cur.kind === 'coach' ? 'مربی' : 'زمین'}</small><b>{cur.kind === 'coach' ? cur.coachName : `زمین ${fa(cur.court)}`}</b></div>
              <div><small>پرداختی شما</small><b>{toman(cur.paid || 0)}</b></div>
              {cur.series && <div><small>پکیج</small><b>{fa(bookings.filter((x) => x.series === cur.series && x.status !== 'cancelled').length)} جلسه</b></div>}
            </div>
            {cur.players?.length > 1 && (
              <>
                <p className="label">بازیکن‌ها</p>
                <div className="pl-list">
                  {cur.players.map((p, k) => (
                    <div key={k} className="pl-row">
                      {p.name ? <Avatar name={p.name} me={p.me} size={36} /> : <Avatar empty size={36} />}
                      <span className="grow">{p.name ? (p.me ? 'شما' : p.name) : cur.open ? 'در انتظار بازیکن هم‌سطح…' : 'جای خالی'}</span>
                      {p.level && <LevelPill id={p.level} />}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="row-btns">
              <Button variant="line" icon="users" onClick={() => {
                const text = `بیا ${sportById(cur.sport).name} بازی کنیم! ${clubById(cur.clubId).name}، ${dayLabel(cur.date)} ساعت ${hourLabel(cur.start)}`
                if (navigator.share) navigator.share({ title: 'matchy', text }).catch(() => {})
                else { navigator.clipboard?.writeText(text); toast({ icon: '🔗', title: 'متن دعوت کپی شد' }) }
              }}>دعوت</Button>
              <Button variant="danger" onClick={() => { cancelBooking(cur.id); setSel(null); toast({ icon: '↩️', title: 'رزرو لغو شد', body: `${toman(cur.paid || 0)} به کیف پولت برگشت.` }) }}>لغو</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function BookingCard({ b, onClick }) {
  const s = sportById(b.sport), c = clubById(b.clubId)
  const empty = b.players?.filter((p) => !p.name).length || 0
  return (
    <motion.button className="bk" whileTap={{ scale: 0.98 }} onClick={onClick} style={{ '--c': s.color }}>
      <div className="bk-body">
        <div className="bk-tags"><span className="sp"><i />{s.name}</span><span>{KIND[b.kind]}</span>{b.series && <span>پکیج</span>}</div>
        <b>{b.title || c.name}</b>
        <p className="muted">{b.coachName || `${c.area}، زمین ${fa(b.court)}`}</p>
        {b.players?.length > 1 && (
          <div className="mini-av">
            {b.players.map((p, k) => (p.name ? <Avatar key={k} name={p.name} me={p.me} size={22} /> : <span key={k} className="mini-empty" />))}
            {empty > 0 && b.open && <span className="searching-tag"><i /> دنبال {fa(empty)} نفر</span>}
            {empty === 0 && <span className="full-tag">تیم کامل ✓</span>}
          </div>
        )}
      </div>
      <div className="bk-time"><b>{hourLabel(b.start)}</b><small>{fa(b.dur)} ساعت</small></div>
    </motion.button>
  )
}

// ---------- اعلان‌ها ----------
export function Notifications({ onBack }) {
  const { notifications, readAll, resolveNotif, acceptJoin, toast } = useStore()
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const accept = (n) => {
    acceptJoin(n.id)
    chime('success'); haptic([15, 30, 15])
    toast({ icon: '🎉', title: n.player.name + ' به تیمت اضافه شد' })
  }
  return (
    <div className="page">
      <TopBar onBack={onBack} title="اعلان‌ها" clear right={notifications.some((n) => !n.read) ? <button className="link" onClick={readAll}>خواندم</button> : null} />
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
                    <Button variant="line" onClick={() => resolveNotif(n.id, { resolved: 'declined', read: true })}>رد</Button>
                  </div>
                )}
                {n.resolved && <small className={`n-res ${n.resolved}`}>{{ accepted: '✓ قبول شد', declined: 'رد شد', expired: 'تیم کامل شده بود' }[n.resolved]}</small>}
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
const LADDER = [...LEVELS].reverse()
const QUIZ_TOP = LADDER.findIndex((l) => l.id === 'B')

export function Profile() {
  const { user, xp, wallet, badges, bookings, logout, updateUser, setLevel, topUp, toast } = useStore()
  const rank = rankOf(xp)
  const [quiz, setQuiz] = useState(null)
  const [credits, setCredits] = useState(false)
  const mine = bookings.filter((b) => b.status !== 'cancelled')
  const hours = mine.reduce((s, b) => s + (b.dur || 1), 0)
  const clubs = new Set(mine.map((b) => b.clubId)).size
  const cityName = CITIES.find((c) => c.id === user.city).name
  const board = Array.from({ length: 9 }, (_, k) => ({ name: ['آرمان ط.', 'سارا ک.', 'کیان م.', 'الناز ر.', 'پویا ن.', 'هستی ص.', 'سینا ج.', 'نیلوفر ا.', 'بردیا ش.'][k], xp: Math.floor(200 + hash('lb' + user.city + k) * 1600) }))
    .concat({ name: user.name, xp, me: true }).sort((a, b) => b.xp - a.xp)
  const myPos = board.findIndex((p) => p.me)
  const sports = user.sports?.length ? user.sports : ['padel']
  const R = 46, C = 2 * Math.PI * R

  return (
    <div className="page profile">
      <motion.div className="pcard" initial={{ opacity: 0, rotate: -5, y: 30 }} animate={{ opacity: 1, rotate: -1.5, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
        <CourtArt className="pcard-art" balls={false} bounce={false} />
        <div className="pc-top"><span dir="ltr">MATCHY PLAYER</span><span>{cityName}</span></div>
        <div className="pc-id">
          <div className="pc-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={R} className="trk" />
              <motion.circle cx="50" cy="50" r={R} className="val" strokeDasharray={C} initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - rank.progress) }} transition={{ delay: 0.3, duration: 1.2 }} />
            </svg>
            <Avatar name={user.name} size={66} me />
          </div>
          <div className="grow">
            <h1>{user.name}</h1>
            <span className="pc-rank">{rank.name}</span>
            <small>{rank.next ? `${fa(rank.next.xp - xp)} امتیاز تا «${rank.next.name}»` : 'به اوج رسیدی!'}</small>
          </div>
        </div>
        <div className="pc-lv">
          {sports.map((id) => (
            <button key={id} onClick={() => setQuiz(id)} style={{ '--c': sportById(id).color }}>
              <small><i />{sportById(id).name}</small><b dir="ltr">{levelOf(user, id)}</b>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="nums">
        {[{ n: mine.length, t: 'رزرو' }, { n: hours, t: 'ساعت بازی' }, { n: clubs, t: 'باشگاه' }, { n: xp, t: 'امتیاز' }].map((s, k) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.06 }}><b><CountUp to={s.n} /></b><small>{s.t}</small></motion.div>
        ))}
      </div>

      <div className="wallet-line">
        <Icon name="wallet" />
        <span className="grow">کیف پول <b>{toman(wallet)}</b></span>
        <button className="link" onClick={() => { topUp(500000); chime('success'); toast({ icon: '💳', title: '۵۰۰ هزار تومان شارژ شد' }) }}>+ شارژ</button>
      </div>

      <section>
        <Head title="پلکان سطح من"><small className="muted">برای تعیین دوباره بزن</small></Head>
        <div className="ladders">
          {sports.map((id) => {
            const s = sportById(id), cur = LADDER.findIndex((l) => l.id === levelOf(user, id))
            return (
              <button key={id} className="ladder" style={{ '--c': s.color }} onClick={() => setQuiz(id)}>
                <div className="ld-head"><b>{s.name}</b><span>{LADDER[cur].title}</span><Icon name="edit" size={15} /></div>
                <div className="ld-steps">
                  {LADDER.map((l, k) => (
                    <motion.span key={l.id} className={`${k <= cur ? 'on' : ''} ${k === cur ? 'me' : ''} ${k > QUIZ_TOP ? 'lock' : ''}`}
                      style={{ height: 16 + k * 7 }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1 + k * 0.04 }}>
                      <em dir="ltr">{l.id}</em>
                    </motion.span>
                  ))}
                </div>
              </button>
            )
          })}
          <p className="ld-note"><i /> پله‌های بالاتر از B فقط با نتیجه‌ی مسابقه باز می‌شن.</p>
        </div>
      </section>

      <section>
        <Head title={`جایگاه من در ${cityName}`}><small className="muted">این ماه</small></Head>
        <div className="podium">
          {[1, 0, 2].map((k) => (
            <div key={k} className={`pd-col ${board[k].me ? 'me' : ''}`}>
              <Avatar name={board[k].name} size={k === 0 ? 52 : 42} me={board[k].me} />
              <b>{board[k].me ? 'شما' : board[k].name}</b>
              <small>{fa(board[k].xp)}</small>
              <motion.span className="pd-block" initial={{ height: 0 }} animate={{ height: [96, 70, 54][k] }}
                transition={{ delay: 0.2 + k * 0.12, type: 'spring', stiffness: 120, damping: 14 }}>{fa(k + 1)}</motion.span>
            </div>
          ))}
        </div>
        <div className="ranks">
          {board.slice(3).map((p, k) => (
            <div key={p.name} className={`rk-row ${p.me ? 'me' : ''}`}>
              <span className="rk-n">{fa(k + 4)}</span>
              <span className="grow">{p.me ? 'شما' : p.name}</span>
              <b>{fa(p.xp)}</b>
            </div>
          ))}
        </div>
        {myPos > 0 && <p className="rk-gap">{fa(board[myPos - 1].xp - xp + 1)} امتیاز دیگه تا جایگاه {fa(myPos)} 🔥</p>}
      </section>

      <section>
        <Head title="نشان‌ها"><small className="muted">{fa(badges.length)} از {fa(BADGES.length)}</small></Head>
        <div className="stickers">
          {BADGES.map((b, k) => {
            const on = badges.includes(b.id)
            return (
              <motion.button key={b.id} className={`sticker ${on ? 'on' : ''}`} style={{ '--r': `${((hash(b.id) - 0.5) * 16).toFixed(1)}deg` }}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.03, type: 'spring', stiffness: 260, damping: 16 }}
                onClick={() => toast({ icon: on ? b.icon : '🔒', title: b.name, body: b.desc })}>
                <span>{on ? b.icon : '?'}</span>
                <small>{b.name}</small>
              </motion.button>
            )
          })}
        </div>
      </section>

      <Head title="تنظیمات" />
      <div className="settings">
        <div className="set-row"><span>شهر</span><Chips id="pc" small options={CITIES.map((c) => ({ id: c.id, name: c.name }))} value={user.city} onChange={(city) => updateUser({ city })} /></div>
        <div className="set-row col"><span>رشته‌های من</span>
          <Chips id="ps" small options={SPORTS.map((s) => ({ id: s.id, name: s.name, color: s.color }))} value={user.sports || []}
            onChange={(id) => {
              const cur = user.sports || []
              const n = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
              if (!n.length) return
              updateUser({ sports: n })
              if (!cur.includes(id) && !user.levels?.[id]) setQuiz(id)
            }} />
        </div>
        <button className="set-row" onClick={() => setCredits(true)}><span>منابع تصاویر و نقشه</span><Icon name="fwd" size={18} /></button>
        <button className="set-row danger" onClick={() => { haptic(20); logout() }}><span>خروج از حساب</span><Icon name="logout" size={18} /></button>
      </div>

      <Sheet open={!!quiz} onClose={() => setQuiz(null)} title={quiz ? `تعیین سطح ${sportById(quiz).name}` : ''}>
        {quiz && <LevelQuiz key={quiz} sport={quiz} onDone={(l) => { setLevel(quiz, l); chime('success'); toast({ icon: '🎯', title: `سطح ${sportById(quiz).name}: ${l}` }); setQuiz(null) }} />}
      </Sheet>
      <Sheet open={credits} onClose={() => setCredits(false)} title="منابع">
        <ul className="credits" dir="ltr">{CREDITS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Sheet>
    </div>
  )
}
