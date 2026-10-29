import confetti from 'canvas-confetti'

export function haptic(pattern = 8) {
  try { navigator.vibrate?.(pattern) } catch { /* بدون پشتیبانی */ }
}

let ctx
function audio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { return null } }
  return ctx
}
// صدای کوتاه و نرم — «tap»، «success» و «alarm» برای اعلان مچ‌میکینگ
export function chime(kind = 'tap') {
  const a = audio(); if (!a) return
  const notes = { tap: [880], success: [660, 880, 1320], alarm: [988, 740, 988, 740], level: [523, 659, 784, 1047] }[kind]
  notes.forEach((f, i) => {
    const o = a.createOscillator(), g = a.createGain()
    o.type = 'sine'; o.frequency.value = f
    const t = a.currentTime + i * 0.09
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(kind === 'tap' ? 0.03 : 0.08, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.3)
  })
}

export function celebrate(colors = ['#D4FF3F', '#0E0F0C', '#3D5AFE', '#ffffff']) {
  const base = { spread: 70, ticks: 220, gravity: 0.9, scalar: 1, colors, disableForReducedMotion: true }
  confetti({ ...base, particleCount: 70, origin: { x: 0.15, y: 0.7 }, angle: 60 })
  confetti({ ...base, particleCount: 70, origin: { x: 0.85, y: 0.7 }, angle: 120 })
  setTimeout(() => confetti({ ...base, particleCount: 90, spread: 120, origin: { y: 0.35 }, shapes: ['circle'], scalar: 1.2 }), 250)
}

export async function askNotifyPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'default') {
    try { return await Notification.requestPermission() } catch { return 'denied' }
  }
  return Notification.permission
}
export function systemNotify(title, body) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(title, { body, icon: './img/padel-racket.jpg' })
  } catch { /* موبایل بدون service worker */ }
}
