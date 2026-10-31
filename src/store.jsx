import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { addDays, courtsOf, seededBusy, sportById, todayKey } from './data'

const KEY = 'matchy-v2'
const initial = { user: null, xp: 0, wallet: 0, badges: [], bookings: [], joined: [], notifications: [] }

function load() {
  try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return initial }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export const live = (bookings) => bookings.filter((b) => b.status !== 'cancelled')

// آیا این زمین در این بازه آزاد است؟ رزروهای ساختگی دیگران + رزروهای خود کاربر
export function isFree(bookings, club, sport, court, date, start, dur) {
  for (let h = start; h < start + dur; h++) if (seededBusy(club, sport, court, date, h)) return false
  return !live(bookings).some((b) => b.clubId === club.id && b.sport === sport && b.court === court && b.date === date && start < b.start + b.dur && b.start < start + dur)
}
// ساعت‌هایی که دست‌کم یک زمین آزاد دارند
export function freeHours(bookings, club, sport, date, from = 7, to = 24) {
  const now = new Date(), today = date === todayKey()
  const out = []
  for (let h = Math.max(7, from); h < to; h++) {
    if (today && h <= now.getHours()) continue
    if (courtsOf(club, sport).some((c) => isFree(bookings, club, sport, c.id, date, h, 1))) out.push(h)
  }
  return out
}
// پکیج هفتگی: هر هفته همان روز و ساعت؛ اگر پر بود زمین دیگر یا یک ساعت جابه‌جا
export function planSeries(bookings, club, sport, { court, date, start, dur, count }) {
  const courts = [court, ...courtsOf(club, sport).map((c) => c.id).filter((x) => x !== court)]
  const out = []
  let skipped = 0
  for (let k = 0; out.length < count && k < count + 6; k++) {
    const d = addDays(date, 7 * k)
    let pick = null
    for (const delta of [0, 1, -1]) {
      const h = start + delta
      if (h < 7 || h + dur > 24) continue
      const c = courts.find((x) => isFree(bookings, club, sport, x, d, h, dur))
      if (c) { pick = { date: d, court: c, start: h, dur, moved: c !== court || delta !== 0 }; break }
    }
    if (pick) out.push(pick); else skipped++
  }
  return { sessions: out, skipped, complete: out.length === count }
}

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

  const api = useMemo(() => {
    const commit = (fn) => { const next = fn(ref.current); ref.current = next; setState(next); return next }

    // امتیاز و نشان‌های جدید
    function reward(s, xp, gives) {
      const earned = new Set(s.badges), fresh = []
      gives.filter(Boolean).forEach((id) => { if (!earned.has(id)) { earned.add(id); fresh.push(id) } })
      const gain = xp + fresh.length * 15
      return { next: { ...s, badges: [...earned], xp: s.xp + gain }, result: { xp: gain, badges: fresh } }
    }
    const pay = (s, amount, method) => (method === 'wallet' ? { ...s, wallet: s.wallet - amount } : s)

    return {
      login(user) {
        commit((s) => ({
          ...s, user,
          xp: s.user ? s.xp : 20, wallet: s.user ? s.wallet : 500000,
          notifications: s.user ? s.notifications : [{
            id: 'welcome', at: Date.now(), read: false, icon: '👋',
            title: `${user.name}، خوش اومدی!`, body: '۲۰ امتیاز و ۵۰۰ هزار تومان اعتبار هدیه گرفتی. اولین رزروت رو بزن تا نشان «اولین سرو» باز بشه.',
          }],
        }))
      },
      logout() {
        try { localStorage.removeItem(KEY) } catch { /* حالت خصوصی مرورگر */ }
        ref.current = initial
        setState(initial)
      },
      updateUser(patch) { commit((s) => ({ ...s, user: { ...s.user, ...patch } })) },
      setLevel(sport, level) {
        commit((s) => ({ ...s, user: { ...s.user, levels: { ...s.user.levels, [sport]: level }, level: sport === s.user.sports?.[0] ? level : s.user.level } }))
      },

      // ثبت یک یا چند رزرو (پکیج) با یک پرداخت
      book(recs, { method, amount, xp }) {
        let out
        commit((s) => {
          const series = recs.length > 1 ? 'S' + Date.now() : null
          const made = recs.map((b, k) => ({ id: 'b' + Date.now() + k, status: 'ok', createdAt: Date.now(), method, series, ...b }))
          const bookings = [...made, ...s.bookings]
          const b = made[0]
          const all = live(bookings)
          const r = reward(pay({ ...s, bookings }, amount, method), xp, [
            'first', b.kind === 'open' && 'host', made.some((x) => x.start < 9) && 'early', made.some((x) => x.start + x.dur > 21) && 'night',
            new Set(all.map((x) => x.sport)).size > 1 && 'multi', b.kind === 'coach' && 'student', b.kind === 'event' && 'champ',
            b.kind === 'join' && 'social', series && 'loyal', new Set(all.map((x) => x.clubId)).size > 1 && 'explorer',
            b.players?.length > 1 && b.players.every((p) => p.name) && 'full',
          ])
          out = { ...r.result, ids: made.map((x) => x.id), count: made.length }
          return { ...r.next, joined: b.sourceId ? [...s.joined, b.sourceId] : s.joined }
        })
        return out
      },
      // لغو و برگشت مبلغ به کیف پول
      cancelBooking(id) {
        commit((s) => {
          const b = s.bookings.find((x) => x.id === id)
          return { ...s, wallet: s.wallet + (b?.paid || 0), joined: s.joined.filter((x) => x !== b?.sourceId), bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)) }
        })
      },
      topUp(n) { commit((s) => ({ ...s, wallet: s.wallet + n })) },
      notify(n) {
        commit((s) => ({ ...s, notifications: [{ id: 'n' + Date.now() + Math.random(), at: Date.now(), read: false, ...n }, ...s.notifications].slice(0, 60) }))
      },
      resolveNotif(id, patch) {
        commit((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))
      },
      // پذیرش درخواست پیوستن از مچ‌میکینگ — بازیکن جای اولین اسلات خالی می‌نشیند
      acceptJoin(nid) {
        commit((s) => {
          const n = s.notifications.find((x) => x.id === nid)
          const b = n && s.bookings.find((x) => x.id === n.bookingId)
          const k = b ? b.players.findIndex((p) => !p.name) : -1
          if (k < 0 || b.status === 'cancelled') return { ...s, notifications: s.notifications.map((x) => (x.id === nid ? { ...x, resolved: 'expired', read: true } : x)) }
          const players = [...b.players]; players[k] = { ...n.player }
          const isFull = players.every((p) => p.name)
          const r = reward(s, 5, [isFull && 'full'])
          return {
            ...r.next,
            bookings: s.bookings.map((x) => (x.id === b.id ? { ...x, players, open: !isFull } : x)),
            notifications: s.notifications.map((x) => (x.id === nid ? { ...x, resolved: 'accepted', read: true } : x)),
          }
        })
      },
      readAll() { commit((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })) },
      toast,
    }
  }, [toast])

  return <Ctx.Provider value={{ ...state, ...api, toasts }}>{children}</Ctx.Provider>
}

export const sportColor = (id) => sportById(id)?.color || '#111311'
