import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fa, levelById } from '../data'
import { chime, haptic } from '../fx'
import { useStore } from '../store'

const P = {
  back: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  home: 'M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z',
  bell: 'M6 16V11a6 6 0 1112 0v5l1.5 2h-15zM10 20a2 2 0 004 0',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
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
  filter: 'M4 6h16M7 12h10M10 18h4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
}
export function Icon({ name, size = 22, stroke = 2, style, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

export function Button({ children, variant = 'primary', onClick, disabled, full, icon, className = '', type = 'button', ...rest }) {
  const [ripples, setRipples] = useState([])
  const click = (e) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples((x) => [...x, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((x) => x.filter((y) => y.id !== id)), 600)
    haptic(10); chime('tap')
    onClick?.(e)
  }
  return (
    <motion.button type={type} whileTap={disabled ? {} : { scale: 0.96 }} whileHover={disabled ? {} : { y: -1 }}
      className={`btn btn-${variant} ${full ? 'btn-full' : ''} ${className}`} disabled={disabled} onClick={click} {...rest}>
      {ripples.map((r) => <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />)}
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
            onClick={() => { if (o.disabled) return; haptic(6); onChange(o.id) }}>
            {active && !Array.isArray(value) && <motion.span layoutId={`chip-${id}`} className="chip-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            {active && Array.isArray(value) && <motion.span className="chip-bg" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />}
            <span className="chip-t">{o.icon && <i>{o.icon}</i>}{o.name}{o.sub && <small>{o.sub}</small>}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

const HUES = ['#3D5AFE', '#D9643A', '#1FAF6B', '#E0A526', '#8E44EC', '#E84A7F', '#0E9AA7']
export function Avatar({ name = '?', size = 40, ring, me, empty, pending, onClick }) {
  if (empty) {
    return (
      <motion.div className="avatar empty" style={{ width: size, height: size }} onClick={onClick} whileTap={{ scale: 0.9 }}>
        <Icon name="plus" size={size * 0.42} />
      </motion.div>
    )
  }
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]
  return (
    <motion.div className={`avatar ${pending ? 'pending' : ''}`} onClick={onClick} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      style={{ width: size, height: size, fontSize: size * 0.38, background: me ? 'var(--lime)' : `linear-gradient(135deg, ${h}, ${h}bb)`, color: me ? 'var(--ink)' : '#fff', boxShadow: ring ? `0 0 0 3px var(--paper), 0 0 0 5px ${ring}` : undefined }}>
      {name.trim()[0]}
    </motion.div>
  )
}

export function LevelPill({ id, big }) {
  const l = levelById(id)
  return <span className={`lvl ${big ? 'lvl-big' : ''}`} style={{ '--c': l.color }}>{id}</span>
}

export function TopBar({ title, onBack, right, step, total, transparent }) {
  return (
    <div className={`topbar ${transparent ? 'clear' : ''}`}>
      {onBack ? (
        <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => { haptic(6); onBack() }} aria-label="بازگشت">
          <Icon name="back" />
        </motion.button>
      ) : <span style={{ width: 42 }} />}
      <div className="topbar-mid">
        {total ? (
          <div className="steps">
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className="step-seg">
                <motion.div className="step-fill" initial={false} animate={{ scaleX: i < step ? 1 : i === step ? 0.5 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
              </div>
            ))}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div key={title} className="topbar-title" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>{title}</motion.div>
        </AnimatePresence>
      </div>
      {right || <span style={{ width: 42 }} />}
    </div>
  )
}

// تصویر با محو تدریجی پس از بارگذاری
export function Photo({ src, className = '', style, children, zoom }) {
  const [ok, setOk] = useState(false)
  return (
    <div className={`photo ${className}`} style={style}>
      <motion.img src={src} alt="" loading="lazy" onLoad={() => setOk(true)} draggable={false}
        initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: ok ? 1 : 0, scale: ok ? (zoom ? 1.12 : 1) : 1.08 }}
        transition={zoom ? { opacity: { duration: 0.6 }, scale: { duration: 18, ease: 'linear' } } : { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
      {children}
    </div>
  )
}

// کارت سه‌بعدی با کج‌شدن بر اساس اشاره‌گر
export function Tilt({ children, className = '', onClick, style, max = 8 }) {
  const ref = useRef(null)
  const x = useMotionValue(0.5), y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 250, damping: 20 })
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 250, damping: 20 })
  const gx = useTransform(x, (v) => `${v * 100}%`), gy = useTransform(y, (v) => `${v * 100}%`)
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width); y.set((e.clientY - r.top) / r.height)
  }
  const leave = () => { x.set(0.5); y.set(0.5) }
  return (
    <motion.div ref={ref} className={`tilt ${className}`} style={{ rotateX: rx, rotateY: ry, '--gx': gx, '--gy': gy, ...style }}
      onPointerMove={move} onPointerLeave={leave} whileTap={{ scale: 0.97 }} onClick={onClick}>
      {children}
      <motion.div className="tilt-glare" />
    </motion.div>
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

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
export const rise = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
}
