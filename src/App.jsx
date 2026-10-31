import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { clubById, dayLabel, fa, hourLabel, levelOf, openMatches, randomPlayer, sportById, todayKey } from './data'
import { chime, haptic, systemNotify } from './fx'
import { useStore } from './store'
import { Icon, Toasts } from './components/ui'
import { Splash } from './components/Logo'
import Auth from './screens/Auth'
import Explore from './screens/Explore'
import Club from './screens/Club'
import Checkout, { Success } from './screens/Checkout'
import { Matches, Notifications, Profile } from './screens/Tabs'

export default function App() {
  const { user } = useStore()
  const [splash, setSplash] = useState(true)
  useEffect(() => { const t = setTimeout(() => setSplash(false), 2900); return () => clearTimeout(t) }, [])
  return (
    <div className="stage">
      <div className="app">
        {/* Main بدون انیمیشن خروج حذف می‌شود تا بعد از خروج از حساب با user خالی رندر نشود */}
        {!splash && (user ? <Main key="m" /> : <Auth key="a" />)}
        <AnimatePresence>{splash && <Splash key="s" />}</AnimatePresence>
        <Toasts />
        <div id="portal" />
      </div>
    </div>
  )
}

// همه‌چیز از نقشه شروع می‌شود: سه تب اول حالت‌های مختلف همان نقشه‌اند؛ بقیه صفحه‌هایی روی آن
const TABS = [
  { id: 'court', name: 'زمین', icon: 'map', map: true },
  { id: 'games', name: 'هم‌بازی', icon: 'users', map: true },
  { id: 'coach', name: 'مربی', icon: 'coach', map: true },
  { id: 'trips', name: 'رزروها', icon: 'cal' },
  { id: 'me', name: 'من', icon: 'user' },
]
const isMap = (t) => TABS.find((x) => x.id === t)?.map
const PAGES = { club: Club, checkout: Checkout, success: Success, notifs: Notifications }

function Main() {
  const { user, bookings } = useStore()
  const [tab, setTab] = useState('court')
  const [stack, setStack] = useState([])
  // جستجوی کاوش بین صفحه‌ها حفظ می‌شود
  const [q, setQ] = useState(() => ({ city: user.city, region: null, sport: user.sports?.[0] || 'padel', date: todayKey(), part: 'any' }))
  const scrollRef = useRef(null)
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.open).length
  useMatchmaking(setTab)

  const top = () => scrollRef.current?.scrollTo({ top: 0 })
  const nav = {
    q, setQ: (p) => setQ((x) => ({ ...x, ...p })),
    tab: (t) => { setStack([]); haptic(6); setTab(t); top() },
    open: (name, props = {}) => { haptic(6); setStack((s) => [...s, { name, props, key: Date.now() }]); top() },
    back: () => { setStack((s) => s.slice(0, -1)); top() },
    replace: (name, props = {}) => { setStack((s) => [...s.slice(0, -1), { name, props, key: Date.now() }]); top() },
    done: (t) => { setStack([]); setTab(t); top() },
  }
  const page = stack[stack.length - 1]
  const Page = page && PAGES[page.name]
  const onMap = isMap(tab)

  return (
    <motion.div className="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* کاوش همیشه زنده می‌ماند تا نقشه با هر رفت‌وبرگشت از نو ساخته نشود */}
      <div className={`explore-layer ${onMap && !Page ? '' : 'off'}`} aria-hidden={!onMap || !!Page}>
        <Explore nav={nav} mode={onMap ? tab : 'court'} active={onMap && !Page} />
      </div>
      {(Page || !onMap) && (
        <div className="app-scroll" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {Page ? (
              <motion.div key={page.key} initial={{ x: -28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}>
                <Page {...page.props} nav={nav} onBack={nav.back} />
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {tab === 'trips' && <Matches nav={nav} />}
                {tab === 'me' && <Profile nav={nav} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <nav className="nav">
        {TABS.map((t) => (
          <button key={t.id} className={`nav-i ${tab === t.id ? 'on' : ''}`} onClick={() => nav.tab(t.id)}>
            <span className="nav-ic">
              <Icon name={t.icon} size={22} stroke={tab === t.id ? 2.4 : 1.8} />
              {t.id === 'trips' && upcoming > 0 && <i className="nav-dot" />}
            </span>
            <small>{t.name}</small>
            {tab === t.id && <motion.span layoutId="nav-line" className="nav-line" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          </button>
        ))}
      </nav>
    </motion.div>
  )
}

// شبیه‌ساز مچ‌میکینگ: بازیکنان هم‌سطح برای پر کردن جای خالی درخواست می‌دهند
// و گاهی بازی باز جدیدی در سطح کاربر اعلان می‌شود
function useMatchmaking(setTab) {
  const store = useStore()
  const live = useRef(store); live.current = store

  useEffect(() => {
    const t = setInterval(() => {
      const { bookings, notifications, notify, toast, acceptJoin } = live.current
      const waiting = bookings.filter((b) => b.status !== 'cancelled' && b.open && b.visibility !== 'private' && b.players?.some((p) => !p.name) &&
        !notifications.some((n) => n.type === 'join' && n.bookingId === b.id && !n.resolved))
      if (!waiting.length || Math.random() < 0.35) return
      const b = waiting[Math.floor(Math.random() * waiting.length)]
      const player = randomPlayer(String(Date.now()), b.levels)
      const club = clubById(b.clubId), sport = sportById(b.sport)
      const id = 'n' + Date.now()
      const body = `${player.name} (سطح ${player.level}، ${fa(player.games)} بازی) می‌خواد به ${sport.name} شما در ${club.name} بپیونده.`
      notify({ id, type: 'join', bookingId: b.id, player, icon: '🙋', title: 'درخواست پیوستن', body })
      chime('alarm'); haptic([60, 40, 60, 40, 120])
      systemNotify('matchy، درخواست پیوستن', body)
      toast({ icon: '🙋', title: `${player.name} می‌خواد بازی کنه`, body: `سطح ${player.level}، ${sport.name}`, duration: 6000,
        action: { label: 'قبول', run: () => { acceptJoin(id); chime('success') } } })
    }, 9000)
    return () => clearInterval(t)
  }, [])

  // یک بار در هر نشست: اعلان بازی باز هم‌سطح
  useEffect(() => {
    const t = setTimeout(() => {
      const { user, notify, toast } = live.current
      const sport = user.sports?.[0] || 'padel'
      const m = openMatches({ city: user.city, sport, level: levelOf(user, sport) }).find((x) => x.gap === 0)
      if (!m) return
      const club = clubById(m.clubId), s = sportById(m.sport)
      const body = `${s.name} در ${club.name}، ${dayLabel(m.date)} ساعت ${hourLabel(m.start)} — دنبال ${fa(m.total - m.players.length)} بازیکن سطح ${m.levels.join(' / ')}`
      notify({ icon: '📣', title: 'بازی هم‌سطح تو پیدا شد', body })
      chime('alarm'); haptic([40, 30, 40])
      systemNotify('matchy، بازی هم‌سطح', body)
      toast({ icon: '📣', title: 'بازی هم‌سطح تو پیدا شد', body: `${s.name}، ${club.name}`, duration: 5500, action: { label: 'ببین', run: () => setTab('games') } })
    }, 15000)
    return () => clearTimeout(t)
  }, [])
}
