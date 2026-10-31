import { AnimatePresence, animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { fa, levelById } from '../data'
import { chime, haptic } from '../fx'
import { useStore } from '../store'

const P = {
  back: 'M9 6l6 6-6 6',
  fwd: 'M15 6l-6 6 6 6',
  close: 'M6 6l12 12M18 6L6 18',
  home: 'M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z',
  bell: 'M6 16V11a6 6 0 1112 0v5l1.5 2h-15zM10 20a2 2 0 004 0',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  map: 'M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.3a3.5 3.5 0 010 6.4M18 14a6.5 6.5 0 013.5 6',
  cal: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 10h16M8 3v4M16 3v4',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6v4H9z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  radar: 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M5 19a10 10 0 010-14M19 5a10 10 0 010 14M8 16a5.5 5.5 0 010-8M16 8a5.5 5.5 0 010 8',
  phone: 'M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2',
  logout: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h10',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  wallet: 'M4 7a2 2 0 012-2h11v4M4 7v10a2 2 0 002 2h13V9H6a2 2 0 01-2-2zM16 14h.01',
  card: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 10h18M7 15h4',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  coach: 'M12 3a4 4 0 110 8 4 4 0 010-8zM5 21v-2a5 5 0 015-5h4a5 5 0 015 5v2M15 3l4-1',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  locate: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3',
}
export function Icon({ name, size = 22, stroke = 2, style, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

export function Button({ children, variant = 'ink', onClick, disabled, full, icon, className = '', type = 'button', ...rest }) {
  const click = (e) => {
    if (disabled) return
    haptic(10); chime('tap')
    onClick?.(e)
  }
  return (
    <motion.button type={type} whileTap={disabled ? {} : { scale: 0.96 }}
      className={`btn btn-${variant} ${full ? 'btn-full' : ''} ${className}`} disabled={disabled} onClick={click} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      <span>{children}</span>
    </motion.button>
  )
}

// گروه چیپ با هایلایت متحرک مشترک
export function Chips({ options, value, onChange, id, scroll, small }) {
  return (
    <div className={`chips ${scroll ? 'chips-scroll' : ''} ${small ? 'chips-sm' : ''}`}>
      {options.map((o) => {
        const active = Array.isArray(value) ? value.includes(o.id) : value === o.id
        return (
          <motion.button key={o.id} className={`chip ${active ? 'on' : ''} ${o.disabled ? 'dis' : ''}`} whileTap={{ scale: 0.92 }}
            style={o.color ? { '--cc': o.color } : null}
            onClick={() => { if (o.disabled) return; haptic(6); onChange(o.id) }}>
            {active && !Array.isArray(value) && <motion.span layoutId={`chip-${id}`} className="chip-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            {active && Array.isArray(value) && <motion.span className="chip-bg" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />}
            <span className="chip-t">{o.color && <i className="chip-dot" />}{o.name}{o.sub && <small>{o.sub}</small>}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

const HUES = ['#3D5AFE', '#E2603A', '#17A866', '#E5A71E', '#8E44EC', '#E84A7F', '#0E9AA7']
export function Avatar({ name = '?', size = 40, me, empty, onClick }) {
  if (empty) {
    return (
      <motion.div className="avatar empty" style={{ width: size, height: size }} onClick={onClick} whileTap={{ scale: 0.9 }}>
        <Icon name="plus" size={size * 0.42} />
      </motion.div>
    )
  }
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]
  return (
    <motion.div className="avatar" onClick={onClick} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      style={{ width: size, height: size, fontSize: size * 0.4, background: me ? 'var(--lime)' : h, color: me ? 'var(--ink)' : '#fff' }}>
      {name.trim()[0]}
    </motion.div>
  )
}

export function LevelPill({ id, big }) {
  const l = levelById(id)
  return <span className={`lvl ${big ? 'lvl-big' : ''}`} style={{ '--c': l.color }}>{id}</span>
}

// نوار پیشرفت به شکل خط زمین: توپ روی خط جلو می‌رود
export function CourtProgress({ step, total }) {
  const p = total > 1 ? step / (total - 1) : 1
  return (
    <div className="cprog" aria-label={`مرحله ${fa(step + 1)} از ${fa(total)}`}>
      <span className="cprog-line" />
      <motion.span className="cprog-fill" initial={false} animate={{ scaleX: p }} transition={{ type: 'spring', stiffness: 180, damping: 24 }} />
      {Array.from({ length: total }, (_, i) => <i key={i} className={i <= step ? 'on' : ''} style={{ right: `${(i / Math.max(1, total - 1)) * 100}%` }} />)}
      <motion.span className="cprog-ball" initial={false} animate={{ right: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>
        <motion.b key={step} animate={{ y: [0, -9, 0] }} transition={{ duration: 0.45, ease: 'easeOut' }} />
      </motion.span>
    </div>
  )
}

export function TopBar({ title, onBack, right, step, total, clear }) {
  return (
    <div className={`topbar ${clear ? 'clear' : ''}`}>
      <div className="topbar-row">
        {onBack ? (
          <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => { haptic(6); onBack() }} aria-label="بازگشت">
            <Icon name="back" />
          </motion.button>
        ) : <span style={{ width: 40 }} />}
        <AnimatePresence mode="wait">
          <motion.div key={title} className="topbar-title" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>{title}</motion.div>
        </AnimatePresence>
        {right || <span style={{ width: 40 }} />}
      </div>
      {total ? <CourtProgress step={step} total={total} /> : null}
    </div>
  )
}

// تصویر با محو تدریجی؛ tone = رنگ دوتُن (عکس سیاه‌وسفید روی رنگ رشته)
export function Photo({ src, className = '', style, children, tone }) {
  const [ok, setOk] = useState(false)
  return (
    <div className={`photo ${tone ? 'duo' : ''} ${className}`} style={{ ...(tone ? { '--tone': tone } : null), ...style }}>
      <motion.img src={src} alt="" loading="lazy" onLoad={() => setOk(true)} draggable={false}
        initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: ok ? 1 : 0, scale: ok ? 1 : 1.06 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
      {children}
    </div>
  )
}

export function CountUp({ to, duration = 1.2, format = fa }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const c = animate(0, to, { duration, ease: [0.2, 0.7, 0.2, 1], onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [to, duration])
  return <>{format(v)}</>
}

export function Sheet({ open, onClose, children, title }) {
  const root = document.getElementById('portal')
  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose() }}>
            <div className="sheet-grip" />
            {title && <h3 className="sheet-title">{title}</h3>}
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    root,
  )
}

// دکمه‌ی اصلی هر مرحله — همیشه بالای نوار تب‌ها
export function CtaBar({ children }) {
  const root = document.getElementById('portal')
  if (!root) return null
  return createPortal(<div className="cta-bar">{children}</div>, root)
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className="toast" layout initial={{ y: -40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            <span className="toast-ic">{t.icon || '✨'}</span>
            <div><b>{t.title}</b>{t.body && <p>{t.body}</p>}</div>
            {t.action && <button className="toast-act" onClick={t.action.run}>{t.action.label}</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Empty({ text }) {
  return (
    <motion.div className="empty-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div className="empty-ball" animate={{ y: [0, -24, 0] }} transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }} />
      <p>{text}</p>
    </motion.div>
  )
}

// برچسب شماره‌دار بخش‌ها — «۰۱ عنوان»
export function SecHead({ n, title, children }) {
  return (
    <div className="sec-h">
      <h3>{n != null && <span className="sec-n">{fa(n).padStart(2, '۰')}</span>}{title}</h3>
      {children}
    </div>
  )
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}
export const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}
