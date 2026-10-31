import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { clubById, dayLabel, fa, hourLabel, levelOf, openMatches, randomPlayer, sportById } from './data'
import { chime, haptic, systemNotify } from './fx'
import { useStore } from './store'
import { Icon, Toasts } from './components/ui'
import { Splash } from './components/Logo'
import Auth from './screens/Auth'
import Home from './screens/Home'
import Explore from './screens/Explore'
import Club from './screens/Club'
import { Matches, Notifications, Profile } from './screens/Tabs'
import Wizard from './screens/wizard/Wizard'

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

const TABS = [
  { id: 'home', name: 'خانه', icon: 'home' },
  { id: 'explore', name: 'نقشه', icon: 'map' },
  { id: 'new', name: '', icon: 'plus' },
  { id: 'games', name: 'بازی‌ها', icon: 'cal' },
  { id: 'me', name: 'من', icon: 'user' },
]
const PAGES = { club: Club, notifs: Notifications }

function Main() {
  const { bookings } = useStore()
  const [tab, setTab] = useState('home')
  const [page, setPage] = useState(null)
  // اپ مستقیم از صفحه‌ی «+» باز می‌شود؛ نوار پایین همیشه دیده می‌شود
  const [wizard, setWizard] = useState({})
  const [wzKey, setWzKey] = useState(0)
  const scrollRef = useRef(null)
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.open).length
  useMatchmaking(setTab)

  const top = () => scrollRef.current?.scrollTo({ top: 0 })
  const nav = {
    tab: (t) => { setPage(null); setWizard(null); haptic(6); setTab(t); top() },
    open: (name, props = {}) => { haptic(6); setWizard(null); setPage({ name, props }); top() },
    start: (preset = {}) => { setWizard(preset); setWzKey((k) => k + 1); top() },
  }
  const Page = page && PAGES[page.name]
  const view = wizard ? 'wizard' : Page ? 'page' : tab

  return (
    <motion.div className="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={`app-scroll ${view === 'explore' ? 'locked' : ''}`} ref={scrollRef}>
        <AnimatePresence mode="wait">
          {wizard ? (
            <motion.div key={'wz' + wzKey} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Wizard preset={wizard} nav={nav} onClose={() => setWizard(null)} onDone={(t) => { setWizard(null); setPage(null); setTab(t) }} />
            </motion.div>
          ) : Page ? (
            <motion.div key={'p' + page.name + (page.props.id || '')} initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Page {...page.props} nav={nav} onBack={() => setPage(null)} />
            </motion.div>
          ) : (
            <motion.div key={tab} className={tab === 'explore' ? 'fill' : ''} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === 'home' && <Home nav={nav} />}
              {tab === 'explore' && <Explore nav={nav} />}
              {tab === 'games' && <Matches nav={nav} />}
              {tab === 'me' && <Profile nav={nav} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <nav className="nav">
        {TABS.map((t) => t.id === 'new' ? (
          <motion.button key={t.id} className={`fab ${wizard ? 'on' : ''}`} whileTap={{ scale: 0.85, rotate: 90 }} onClick={() => nav.start({})} aria-label="رزرو جدید">
            <Icon name="plus" size={26} stroke={2.6} />
          </motion.button>
        ) : (
          <button key={t.id} className={`nav-i ${view === t.id ? 'on' : ''}`} onClick={() => nav.tab(t.id)}>
            <span className="nav-ic">
              {view === t.id && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <Icon name={t.icon} size={21} />
              {t.id === 'games' && upcoming > 0 && <i className="nav-dot" />}
            </span>
            <small>{t.name}</small>
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
      toast({ icon: '📣', title: 'بازی هم‌سطح تو پیدا شد', body: `${s.name}، ${club.name}`, duration: 5500, action: { label: 'ببین', run: () => setTab('home') } })
    }, 15000)
    return () => clearTimeout(t)
  }, [])
}
