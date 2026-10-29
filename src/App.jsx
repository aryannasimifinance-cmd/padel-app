import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { clubById, dayLabel, fa, fromKey, hourLabel, openMatches, randomPlayer, sportById } from './data'
import { chime, haptic, systemNotify } from './fx'
import { useStore } from './store'
import { Icon, Toasts } from './components/ui'
import Auth, { Splash } from './screens/Auth'
import Home from './screens/Home'
import { Matches, Notifications, Profile } from './screens/Tabs'
import Wizard from './screens/wizard/Wizard'

export default function App() {
  const { user } = useStore()
  const [splash, setSplash] = useState(true)
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1900); return () => clearTimeout(t) }, [])
  return (
    <div className="stage">
      <div className="stage-bg" style={{ backgroundImage: "url(./img/padel-hero.jpg)" }} />
      <div className="app">
        <AnimatePresence mode="wait">
          {splash ? <Splash key="s" /> : user ? <Main key="m" /> : <Auth key="a" />}
        </AnimatePresence>
        <Toasts />
        <div id="portal" />
      </div>
    </div>
  )
}

const TABS = [
  { id: 'home', name: 'خانه', icon: 'home' },
  { id: 'matches', name: 'بازی‌ها', icon: 'cal' },
  { id: 'new', name: '', icon: 'plus' },
  { id: 'notifs', name: 'اعلان‌ها', icon: 'bell' },
  { id: 'profile', name: 'من', icon: 'user' },
]

function Main() {
  const { notifications } = useStore()
  const [tab, setTab] = useState('home')
  const [wizard, setWizard] = useState(null)
  const scrollRef = useRef(null)
  const unread = notifications.filter((n) => !n.read).length
  useMatchmaking(setTab)

  const go = (t) => {
    if (t === 'new') { setWizard({}); return }
    haptic(6); setTab(t); scrollRef.current?.scrollTo({ top: 0 })
  }

  return (
    <motion.div className="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="app-scroll" ref={scrollRef}>
        <AnimatePresence mode="wait">
          {wizard ? (
            <motion.div key="wz" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
              <Wizard preset={wizard} onClose={() => setWizard(null)} onDone={(t) => { setWizard(null); setTab(t) }} />
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {tab === 'home' && <Home onStart={setWizard} onTab={go} scrollRef={scrollRef} />}
              {tab === 'matches' && <Matches onStart={setWizard} />}
              {tab === 'notifs' && <Notifications />}
              {tab === 'profile' && <Profile />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {!wizard && (
          <motion.nav className="nav" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            {TABS.map((t) => t.id === 'new' ? (
              <motion.button key={t.id} className="fab" whileTap={{ scale: 0.85, rotate: 90 }} whileHover={{ scale: 1.06 }} onClick={() => go('new')} aria-label="رزرو جدید">
                <Icon name="plus" size={28} stroke={2.6} />
              </motion.button>
            ) : (
              <button key={t.id} className={`nav-i ${tab === t.id ? 'on' : ''}`} onClick={() => go(t.id)}>
                {tab === t.id && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className="nav-ic">
                  <Icon name={t.icon} size={22} />
                  {t.id === 'notifs' && unread > 0 && <i className="nav-dot" />}
                </span>
                <small>{t.name}</small>
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
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
      const waiting = bookings.filter((b) => b.open && b.players?.some((p) => !p.name) &&
        !notifications.some((n) => n.type === 'join' && n.bookingId === b.id && !n.resolved))
      if (!waiting.length || Math.random() < 0.35) return
      const b = waiting[Math.floor(Math.random() * waiting.length)]
      const player = randomPlayer(String(Date.now()), b.levels)
      const club = clubById(b.clubId), sport = sportById(b.sport)
      const id = 'n' + Date.now()
      const body = `${player.name} (سطح ${player.level} · ${fa(player.games)} بازی) می‌خواد به ${sport.name} شما در ${club.name} بپیونده.`
      notify({ id, type: 'join', bookingId: b.id, player, icon: '🙋', title: 'درخواست پیوستن', body })
      chime('alarm'); haptic([60, 40, 60, 40, 120])
      systemNotify('راکت · درخواست پیوستن', body)
      toast({ icon: '🙋', title: `${player.name} می‌خواد بازی کنه`, body: `سطح ${player.level} · ${sport.name}`, duration: 6000,
        action: { label: 'قبول', run: () => { acceptJoin(id); chime('success') } } })
    }, 9000)
    return () => clearInterval(t)
  }, [])

  // یک بار در هر نشست: اعلان بازی باز هم‌سطح
  useEffect(() => {
    const t = setTimeout(() => {
      const { user, notify, toast } = live.current
      const m = openMatches(user.city, user.level)[0]
      if (!m) return
      const club = clubById(m.clubId), sport = sportById(m.sport)
      const body = `${sport.name} در ${club.name} · ${dayLabel(fromKey(m.date))} ساعت ${hourLabel(m.start)} — دنبال ${fa(m.total - m.players.length)} بازیکن سطح ${m.levels.join(' / ')}`
      notify({ icon: '📣', title: 'بازی هم‌سطح تو پیدا شد', body })
      chime('alarm'); haptic([40, 30, 40])
      systemNotify('راکت · بازی هم‌سطح', body)
      toast({ icon: '📣', title: 'بازی هم‌سطح تو پیدا شد', body: `${sport.name} · ${club.name}`, duration: 5500, action: { label: 'ببین', run: () => setTab('home') } })
    }, 14000)
    return () => clearTimeout(t)
  }, [])
}

