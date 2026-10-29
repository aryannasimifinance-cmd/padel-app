import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { sportById } from './data'

const KEY = 'matchy-v1'
const initial = { user: null, xp: 0, badges: [], bookings: [], notifications: [] }

function load() {
  try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return initial }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)
  const ref = useRef(state)
  ref.current = state

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* حالت خصوصی مرورگر */ }
  }, [state])

  const toast = useCallback((t) => {
    const id = ++toastId.current
    setToasts((x) => [...x, { id, ...t }])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.duration || 3200)
  }, [])

  const api = useMemo(() => ({
    login(user) {
      setState((s) => ({
        ...s, user,
        xp: s.user ? s.xp : 20,
        notifications: s.user ? s.notifications : [{
          id: 'welcome', at: Date.now(), read: false, icon: '👋',
          title: `${user.name}، خوش اومدی!`, body: '۲۰ امتیاز هدیه ثبت‌نام گرفتی. اولین رزروت رو بزن تا نشان «اولین سرو» باز بشه.',
        }],
      }))
    },
    logout() {
      try { localStorage.removeItem(KEY) } catch { /* حالت خصوصی مرورگر */ }
      setState(initial)
    },
    updateUser(patch) { setState((s) => ({ ...s, user: { ...s.user, ...patch } })) },

    // ثبت رزرو + محاسبه امتیاز و نشان‌های جدید (از آخرین state تا نتیجه همزمان برگردد)
    addBooking(b, xp) {
      const s = ref.current
      const bookings = [b, ...s.bookings]
      const earned = new Set(s.badges), fresh = []
      const give = (id) => { if (!earned.has(id)) { earned.add(id); fresh.push(id) } }
      give('first')
      if (b.open) give('host')
      if (b.start < 9) give('early')
      if (b.start + (b.duration || 1) > 21) give('night')
      if (new Set(bookings.map((x) => x.sport)).size > 1) give('multi')
      if (b.kind === 'coach') give('student')
      if (b.kind === 'weekend' || b.kind === 'official') give('champ')
      if (b.joined) give('social')
      if (b.players?.length > 1 && b.players.every((p) => p.name)) give('full')
      const next = { ...s, bookings, badges: [...earned], xp: s.xp + xp + fresh.length * 15 }
      ref.current = next
      setState(next)
      return { xp, badges: fresh }
    },
    cancelBooking(id) { setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) })) },
    addXp(n) { setState((s) => ({ ...s, xp: s.xp + n })) },
    notify(n) {
      setState((s) => ({ ...s, notifications: [{ id: 'n' + Date.now() + Math.random(), at: Date.now(), read: false, ...n }, ...s.notifications].slice(0, 60) }))
    },
    resolveNotif(id, patch) {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))
    },
    // پذیرش درخواست پیوستن از مچ‌میکینگ — بازیکن جای اولین اسلات خالی می‌نشیند
    acceptJoin(nid) {
      setState((s) => {
        const n = s.notifications.find((x) => x.id === nid)
        const b = n && s.bookings.find((x) => x.id === n.bookingId)
        const k = b ? b.players.findIndex((p) => !p.name) : -1
        if (k < 0) return { ...s, notifications: s.notifications.map((x) => (x.id === nid ? { ...x, resolved: 'expired', read: true } : x)) }
        const players = [...b.players]; players[k] = { ...n.player }
        const isFull = players.every((p) => p.name)
        const badges = isFull && !s.badges.includes('full') ? [...s.badges, 'full'] : s.badges
        return {
          ...s, badges, xp: s.xp + 5 + (badges !== s.badges ? 15 : 0),
          bookings: s.bookings.map((x) => (x.id === b.id ? { ...x, players, open: !isFull } : x)),
          notifications: s.notifications.map((x) => (x.id === nid ? { ...x, resolved: 'accepted', read: true } : x)),
        }
      })
    },
    readAll() { setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })) },
    toast,
  }), [toast])

  return <Ctx.Provider value={{ ...state, ...api, toasts }}>{children}</Ctx.Provider>
}

export const sportColor = (id) => sportById(id)?.color || '#0E0F0C'
