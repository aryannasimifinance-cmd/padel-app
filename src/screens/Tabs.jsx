import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BADGES, CITIES, CREDITS, LEVELS, SPORTS, clubById, dayLabel, dayMonth, dayNum, fa, fromKey, hash, hourLabel, levelById, levelOf, range, rankOf, short, sportById, toman } from '../data'
import { askNotifyPermission, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Avatar, Button, Chips, CountUp, Empty, Icon, LevelPill, Photo, Sheet, TopBar, rise, stagger } from '../components/ui'
import { SportGlyph } from './Explore'
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
      <h1 className="pg-title">رزروهای من</h1>
      <Chips id="mt" options={[{ id: 'up', name: 'پیش رو' }, { id: 'past', name: 'گذشته' }]} value={tab} onChange={setTab} />
      {!list.length && (
        <>
          <Empty text={tab === 'up' ? 'هنوز رزروی نداری. اولین زمینت رو بگیر!' : 'تاریخچه‌ای نیست.'} />
          {tab === 'up' && <Button full icon="search" onClick={() => nav.tab('explore')}>پیدا کردن زمین</Button>}
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
      <Photo src={c.img} className="bk-img" />
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

export function Profile({ nav }) {
  const { user, xp, wallet, badges, bookings, logout, updateUser, setLevel, topUp, toast } = useStore()
  const rank = rankOf(xp)
  const [quiz, setQuiz] = useState(null)
  const [sheet, setSheet] = useState(null)
  const mine = bookings.filter((b) => b.status !== 'cancelled')
  const hours = mine.reduce((s, b) => s + (b.dur || 1), 0)
  const cityName = CITIES.find((c) => c.id === user.city).name
  const board = Array.from({ length: 9 }, (_, k) => ({ name: ['آرمان ط.', 'سارا ک.', 'کیان م.', 'الناز ر.', 'پویا ن.', 'هستی ص.', 'سینا ج.', 'نیلوفر ا.', 'بردیا ش.'][k], xp: Math.floor(200 + hash('lb' + user.city + k) * 1600) }))
    .concat({ name: user.name, xp, me: true }).sort((a, b) => b.xp - a.xp)
  const myPos = board.findIndex((p) => p.me)
  const sports = user.sports?.length ? user.sports : ['padel']

  const Row = ({ icon, title, value, onClick, danger }) => (
    <button className={`menu-row ${danger ? 'danger' : ''}`} onClick={() => { haptic(6); onClick() }}>
      <Icon name={icon} size={21} /><span className="grow">{title}</span>{value != null && <small>{value}</small>}<Icon name="fwd" size={17} />
    </button>
  )

  return (
    <div className="page profile">
      <h1 className="pg-title">پروفایل</h1>

      <motion.div className="pf-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="pf-id">
          <div className="pf-av"><Avatar name={user.name} size={86} me /><span className="pf-rank">{rank.name}</span></div>
          <b>{user.name}</b>
          <small>{cityName}</small>
        </div>
        <div className="pf-stats">
          <div><b><CountUp to={mine.length} /></b><small>رزرو</small></div>
          <div><b><CountUp to={hours} /></b><small>ساعت بازی</small></div>
          <div><b><CountUp to={xp} /></b><small>امتیاز</small></div>
        </div>
      </motion.div>
      <div className="pf-xp">
        <i><motion.b initial={{ width: 0 }} animate={{ width: `${rank.progress * 100}%` }} transition={{ delay: 0.2, duration: 1 }} /></i>
        <small>{rank.next ? `${fa(rank.next.xp - xp)} امتیاز تا «${rank.next.name}»` : 'به اوج رسیدی!'}</small>
      </div>

      <section>
        <h2 className="club-h">سطح من</h2>
        <div className="pf-levels">
          {sports.map((id) => {
            const s = sportById(id), l = levelOf(user, id), k = LADDER.findIndex((x) => x.id === l)
            return (
              <motion.button key={id} className="pf-lv" whileTap={{ scale: 0.97 }} onClick={() => setQuiz(id)} style={{ '--c': s.color }}>
                <span className="pf-lv-top"><SportGlyph id={id} />{s.name}</span>
                <b dir="ltr">{l}</b>
                <small>{levelById(l).title}</small>
                <span className="pf-steps">{LADDER.map((x, j) => <i key={x.id} className={j <= k ? 'on' : ''} />)}</span>
                <em>تعیین دوباره</em>
              </motion.button>
            )
          })}
        </div>
      </section>

      <div className="menu">
        <Row icon="wallet" title="کیف پول" value={toman(wallet)} onClick={() => setSheet('wallet')} />
        <Row icon="trophy" title={`جایگاه من در ${cityName}`} value={`نفر ${fa(myPos + 1)}`} onClick={() => setSheet('board')} />
        <Row icon="sparkle" title="نشان‌ها" value={`${fa(badges.length)} از ${fa(BADGES.length)}`} onClick={() => setSheet('badges')} />
        <Row icon="bell" title="اعلان‌ها" onClick={() => nav.open('notifs')} />
      </div>
      <div className="menu">
        <div className="menu-row static"><Icon name="pin" size={21} /><span className="grow">شهر</span>
          <span className="mini-seg">{CITIES.map((c) => <button key={c.id} className={user.city === c.id ? 'on' : ''} onClick={() => { updateUser({ city: c.id }); nav.setQ({ city: c.id, region: null }) }}>{c.name}</button>)}</span>
        </div>
        <Row icon="layers" title="رشته‌های من" value={sports.map((id) => sportById(id).name).join('، ')} onClick={() => setSheet('sports')} />
        <Row icon="map" title="منابع تصاویر و نقشه" onClick={() => setSheet('credits')} />
        <Row icon="logout" title="خروج از حساب" danger onClick={() => { haptic(20); logout() }} />
      </div>

      <Sheet open={sheet === 'wallet'} onClose={() => setSheet(null)} title="کیف پول">
        <div className="wallet-sheet">
          <small>موجودی</small>
          <b><CountUp key={wallet} to={Math.round(wallet / 1000)} format={(v) => fa(v * 1000)} /> <span>تومان</span></b>
          <div className="ws-amounts">
            {[200000, 500000, 1000000].map((a) => (
              <Button key={a} variant="line" onClick={() => { topUp(a); chime('success'); toast({ icon: '💳', title: `${short(a)} تومان شارژ شد` }) }}>+ {short(a)}</Button>
            ))}
          </div>
          <p className="co-mini">در نسخه‌ی نمایشی، پرداخت شبیه‌سازی می‌شه. هزینه‌ی رزروهای لغوشده هم به همین‌جا برمی‌گرده.</p>
        </div>
      </Sheet>

      <Sheet open={sheet === 'board'} onClose={() => setSheet(null)} title={`جایگاه ${cityName}، این ماه`}>
        <div className="podium">
          {[1, 0, 2].map((k) => (
            <div key={k} className={`pd-col ${board[k].me ? 'me' : ''}`}>
              <Avatar name={board[k].name} size={k === 0 ? 50 : 40} me={board[k].me} />
              <b>{board[k].me ? 'شما' : board[k].name}</b>
              <small>{fa(board[k].xp)}</small>
              <motion.span className="pd-block" initial={{ height: 0 }} animate={{ height: [86, 62, 48][k] }} transition={{ delay: 0.15 + k * 0.1, type: 'spring', stiffness: 120, damping: 14 }}>{fa(k + 1)}</motion.span>
            </div>
          ))}
        </div>
        <div className="ranks">
          {board.slice(3).map((p, k) => (
            <div key={p.name} className={`rk-row ${p.me ? 'me' : ''}`}><span className="rk-n">{fa(k + 4)}</span><span className="grow">{p.me ? 'شما' : p.name}</span><b>{fa(p.xp)}</b></div>
          ))}
        </div>
        {myPos > 0 && <p className="co-mini">{fa(board[myPos - 1].xp - xp + 1)} امتیاز دیگه تا نفر {fa(myPos)}. با هر رزرو امتیاز می‌گیری.</p>}
      </Sheet>

      <Sheet open={sheet === 'badges'} onClose={() => setSheet(null)} title="نشان‌ها">
        <div className="stickers">
          {BADGES.map((b) => {
            const on = badges.includes(b.id)
            return (
              <div key={b.id} className={`sticker ${on ? 'on' : ''}`}>
                <span>{on ? b.icon : '?'}</span>
                <b>{b.name}</b>
                <small>{b.desc}</small>
              </div>
            )
          })}
        </div>
      </Sheet>

      <Sheet open={sheet === 'sports'} onClose={() => setSheet(null)} title="رشته‌های من">
        <div className="sp-sports">
          {SPORTS.map((s) => {
            const on = sports.includes(s.id)
            return (
              <button key={s.id} className={on ? 'on' : ''} onClick={() => {
                const n = on ? sports.filter((x) => x !== s.id) : [...sports, s.id]
                if (!n.length) return
                haptic(6); updateUser({ sports: n })
                if (!on && !user.levels?.[s.id]) { setSheet(null); setQuiz(s.id) }
              }}><SportGlyph id={s.id} big /><span>{s.name}</span></button>
            )
          })}
        </div>
      </Sheet>

      <Sheet open={sheet === 'credits'} onClose={() => setSheet(null)} title="منابع">
        <ul className="credits" dir="ltr">{CREDITS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Sheet>

      <Sheet open={!!quiz} onClose={() => setQuiz(null)} title={quiz ? `تعیین سطح ${sportById(quiz).name}` : ''}>
        {quiz && <LevelQuiz key={quiz} sport={quiz} onDone={(l) => { setLevel(quiz, l); chime('success'); toast({ icon: '🎯', title: `سطح ${sportById(quiz).name}: ${l}` }); setQuiz(null) }} />}
      </Sheet>
    </div>
  )
}
