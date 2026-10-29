import { motion } from 'framer-motion'

const LENS = 'M33.5 8.88A14 14 0 0 0 33.5 31.12A16 16 0 0 0 33.5 8.88Z'

// نشان matchy: دو توپ که به هم می‌رسند — یعنی دو بازیکن هم‌سطح «مچ» شدند
export function LogoMark({ size = 36, light }) {
  const ink = light ? '#fff' : 'var(--ink)'
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 64 40" aria-hidden="true">
      <circle cx="22" cy="20" r="16" fill="var(--lime)" />
      <circle cx="42" cy="20" r="14" fill="none" stroke={ink} strokeWidth="4" />
      <path d={LENS} fill={ink} />
    </svg>
  )
}

export function Logo({ size = 22, light }) {
  return (
    <span className="logo" style={{ fontSize: size, color: light ? '#fff' : 'var(--ink)' }}>
      <LogoMark size={size * 1.1} light={light} />
      <span className="logo-word">matchy</span>
    </span>
  )
}

// موشن ورود: دو توپ از دو طرف می‌آیند، برخورد، موج، و بعد کلمه حرف‌به‌حرف
export function Splash() {
  const letters = 'matchy'.split('')
  return (
    <motion.div className="splash" exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }} transition={{ duration: 0.5 }}>
      <div className="splash-glow" />
      <div className="splash-mark">
        <svg viewBox="0 0 64 40" width="176" height="110" style={{ overflow: 'visible' }}>
          <motion.circle cx="22" cy="20" r="16" fill="var(--lime)" initial={{ x: -70, opacity: 0 }}
            animate={{ x: [-70, 3, 0], opacity: 1 }} transition={{ duration: 0.75, times: [0, 0.78, 1], ease: [0.3, 0.8, 0.3, 1] }} />
          <motion.circle cx="42" cy="20" r="14" fill="none" stroke="#fff" strokeWidth="4" initial={{ x: 70, opacity: 0 }}
            animate={{ x: [70, -3, 0], opacity: 1 }} transition={{ duration: 0.75, times: [0, 0.78, 1], ease: [0.3, 0.8, 0.3, 1] }} />
          <motion.path d={LENS} fill="#fff" style={{ transformOrigin: '33.5px 20px' }} initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }} transition={{ delay: 0.62, duration: 0.4 }} />
        </svg>
        <motion.span className="sb-wave" initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 3.2], opacity: [0.9, 0] }} transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }} />
        <motion.span className="sb-wave" initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 2.4], opacity: [0.6, 0] }} transition={{ delay: 0.75, duration: 0.9, ease: 'easeOut' }} />
      </div>
      <div className="splash-word" dir="ltr">
        {letters.map((l, i) => (
          <motion.span key={i} initial={{ y: 40, opacity: 0, rotate: 8 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.9 + i * 0.06, type: 'spring', stiffness: 380, damping: 20 }}>{l}</motion.span>
        ))}
        <motion.i initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.35, type: 'spring', stiffness: 600, damping: 12 }} />
      </div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.6, y: 0 }} transition={{ delay: 1.5 }}>پیدا کن · بازی کن · ببر</motion.p>
      <motion.div className="splash-sports" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 1.7 }}>
        PADEL · TENNIS · BEACH · PICKLE
      </motion.div>
    </motion.div>
  )
}
