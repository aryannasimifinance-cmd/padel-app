import { motion } from 'framer-motion'
import { useId } from 'react'
import { SPORTS } from '../data'

// ترکیب پوستری: خطوط زمین که کشیده می‌شوند + توپ‌هایی به رنگ هر رشته که آرام شناورند
export function CourtArt({ className = '', balls = true, bounce = true, fit = 'slice' }) {
  return (
    <div className={`court-art ${className}`} aria-hidden="true">
      <svg viewBox="0 0 360 420" preserveAspectRatio={`xMidYMid ${fit}`}>
        <motion.g stroke="currentColor" strokeWidth="1.4" fill="none" initial="h" animate="s">
          {['M40 40H320V380H40Z', 'M40 210H320', 'M180 110V310', 'M40 110H320M40 310H320', 'M70 40V380M290 40V380'].map((d, i) => (
            <motion.path key={d} d={d} variants={{ h: { pathLength: 0, opacity: 0 }, s: { pathLength: 1, opacity: 1, transition: { delay: 0.1 + i * 0.15, duration: 1.4, ease: [0.6, 0, 0.2, 1] } } }} />
          ))}
        </motion.g>
        {balls && SPORTS.map((s, i) => (
          <motion.circle key={s.id} r={[46, 30, 22, 16][i]} fill={s.color} style={{ mixBlendMode: 'multiply' }}
            cx={[270, 90, 300, 120][i]} cy={[120, 300, 330, 120][i]}
            initial={{ scale: 0 }} animate={{ scale: 1, x: [0, 10, -6, 0], y: [0, -12, 8, 0] }}
            transition={{ scale: { delay: 0.6 + i * 0.12, type: 'spring', stiffness: 160, damping: 14 }, x: { repeat: Infinity, duration: 9 + i * 2, ease: 'easeInOut' }, y: { repeat: Infinity, duration: 7 + i * 2, ease: 'easeInOut' } }} />
        ))}
        {bounce && (
          <>
            <motion.ellipse cx="180" cy="372" rx="14" ry="3" fill="currentColor" opacity=".15"
              animate={{ scaleX: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }} />
            <motion.circle cx="180" cy="356" r="14" fill="var(--lime)" stroke="currentColor" strokeWidth="1.4"
              animate={{ y: [0, -120, 0], scaleY: [0.86, 1.04, 0.86] }} transition={{ repeat: Infinity, duration: 1.3, ease: [0.33, 0, 0.67, 1], times: [0, 0.5, 1] }} />
          </>
        )}
      </svg>
    </div>
  )
}

// نقطه‌چین‌های ریز پس‌زمینه برای کارت‌ها
export function Dots({ color = 'currentColor' }) {
  const id = 'dp' + useId().replace(/:/g, '')
  return (
    <svg className="dots-art" width="100%" height="100%" aria-hidden="true">
      <defs><pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill={color} /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
