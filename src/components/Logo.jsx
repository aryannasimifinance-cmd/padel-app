import { motion } from 'framer-motion'

const LENS = 'M33.5 8.88A14 14 0 0 0 33.5 31.12A16 16 0 0 0 33.5 8.88Z'
const LOOP = { repeat: Infinity, repeatDelay: 2.2, duration: 1.4, ease: 'easeInOut' }

// نشان matchy: دو توپ که به هم می‌رسند — یعنی دو بازیکن هم‌سطح «مچ» شدند
// در حالت animated هر چند ثانیه از هم جدا می‌شوند، می‌چرخند و دوباره به هم می‌خورند
export function LogoMark({ size = 36, light, animated }) {
  const ink = light ? '#fff' : 'var(--ink)'
  if (!animated) {
    return (
      <svg width={size * 1.6} height={size} viewBox="0 0 64 40" aria-hidden="true">
        <circle cx="22" cy="20" r="16" fill="var(--lime)" />
        <circle cx="42" cy="20" r="14" fill="none" stroke={ink} strokeWidth="4" />
        <path d={LENS} fill={ink} />
      </svg>
    )
  }
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 64 40" aria-hidden="true" style={{ overflow: 'visible' }}>
      <motion.g animate={{ x: [0, -5, 1.2, 0], y: [0, -6, 0, 0], scaleY: [1, 1, 0.9, 1], scaleX: [1, 1, 1.08, 1] }}
        transition={{ ...LOOP, times: [0, 0.4, 0.62, 1] }} style={{ transformOrigin: '22px 36px' }}>
        <circle cx="22" cy="20" r="16" fill="var(--lime)" />
        <motion.path d="M10 12 C16 18 16 22 10 28 M34 12 C28 18 28 22 34 28" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1.6"
          animate={{ rotate: [0, 0, 180, 180] }} transition={{ ...LOOP, times: [0, 0.4, 0.75, 1] }} style={{ transformOrigin: '22px 20px' }} />
      </motion.g>
      <motion.g animate={{ x: [0, 5, -1.2, 0], rotate: [0, 40, -10, 0] }} transition={{ ...LOOP, times: [0, 0.4, 0.62, 1] }} style={{ transformOrigin: '42px 20px' }}>
        <circle cx="42" cy="20" r="14" fill="none" stroke={ink} strokeWidth="4" />
      </motion.g>
      <motion.path d={LENS} fill={ink} animate={{ opacity: [1, 0, 0, 1], scale: [1, 0.3, 1.35, 1] }}
        transition={{ ...LOOP, times: [0, 0.3, 0.66, 1] }} style={{ transformOrigin: '33.5px 20px' }} />
      <motion.circle cx="33.5" cy="20" r="6" fill="none" stroke="var(--lime)" strokeWidth="1.5"
        animate={{ scale: [0, 0, 3.4], opacity: [0, 0.9, 0] }} transition={{ ...LOOP, times: [0, 0.62, 1] }} style={{ transformOrigin: '33.5px 20px' }} />
    </svg>
  )
}

export function Logo({ size = 22, light, animated }) {
  return (
    <span className="logo" style={{ fontSize: size, color: light ? '#fff' : 'var(--ink)' }}>
      <LogoMark size={size * 1.1} light={light} animated={animated} />
      <span className="logo-word">matchy</span>
    </span>
  )
}

// موشن ورود: خطوط زمین کشیده می‌شوند، دو توپ از دو طرف می‌آیند، برخورد، موج، و بعد کلمه حرف‌به‌حرف
export function Splash() {
  const letters = 'matchy'.split('')
  return (
    <motion.div className="splash" exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.45 }}>
      <svg className="splash-lines" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {['M20 20H180V380H20Z', 'M20 200H180', 'M100 80V320', 'M20 80H180M20 320H180'].map((d, i) => (
          <motion.path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.12, duration: 1.1, ease: [0.6, 0, 0.2, 1] }} />
        ))}
      </svg>
      <div className="splash-mark">
        <svg viewBox="0 0 64 40" width="176" height="110" style={{ overflow: 'visible' }}>
          <motion.circle cx="22" cy="20" r="16" fill="var(--lime)" initial={{ x: -90, opacity: 0 }}
            animate={{ x: [-90, 3, 0], opacity: 1 }} transition={{ delay: 0.3, duration: 0.75, times: [0, 0.78, 1], ease: [0.3, 0.8, 0.3, 1] }} />
          <motion.circle cx="42" cy="20" r="14" fill="none" stroke="var(--ink)" strokeWidth="4" initial={{ x: 90, opacity: 0 }}
            animate={{ x: [90, -3, 0], opacity: 1 }} transition={{ delay: 0.3, duration: 0.75, times: [0, 0.78, 1], ease: [0.3, 0.8, 0.3, 1] }} />
          <motion.path d={LENS} fill="var(--ink)" style={{ transformOrigin: '33.5px 20px' }} initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }} transition={{ delay: 0.92, duration: 0.4 }} />
        </svg>
        <motion.span className="sb-wave" initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 3.4], opacity: [0.9, 0] }} transition={{ delay: 0.9, duration: 0.9, ease: 'easeOut' }} />
        <motion.span className="sb-wave" initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 2.4], opacity: [0.6, 0] }} transition={{ delay: 1.05, duration: 0.9, ease: 'easeOut' }} />
      </div>
      <div className="splash-word" dir="ltr">
        {letters.map((l, i) => (
          <motion.span key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.15 + i * 0.06, type: 'spring', stiffness: 380, damping: 20 }}>{l}</motion.span>
        ))}
        <motion.i initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, type: 'spring', stiffness: 600, damping: 12 }} />
      </div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.7, y: 0 }} transition={{ delay: 1.75 }}>پیدا کن، بازی کن، ببر</motion.p>
      <motion.div className="splash-sports" initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ delay: 1.9 }}>
        PADEL — TENNIS — BEACH — PICKLE
      </motion.div>
    </motion.div>
  )
}
