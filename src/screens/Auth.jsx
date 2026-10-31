import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CITIES, SPORTS, fa, levelById, sportById } from '../data'
import { celebrate, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Button, CourtProgress, Icon, LevelPill, Photo } from '../components/ui'
import { Logo } from '../components/Logo'
import { CourtArt } from '../components/Art'
import LevelQuiz from './LevelQuiz'

const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
const fa0 = (s) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])
const ORDER = ['welcome', 'phone', 'otp', 'name', 'sports', 'level', 'done']

export default function Auth() {
  const { login } = useStore()
  const [step, setStep] = useState('welcome')
  const [mode, setMode] = useState('signup')
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState({ phone: '', name: '', city: 'tehran', sports: [], levels: {} })
  const [lv, setLv] = useState(0) // کدام رشته در مرحله‌ی سطح
  const set = (p) => setForm((f) => ({ ...f, ...p }))
  const go = (s) => { setDir(ORDER.indexOf(s) > ORDER.indexOf(step) ? 1 : -1); setStep(s) }
  const back = () => {
    if (step === 'level' && lv > 0) { setLv(lv - 1); return }
    go(ORDER[ORDER.indexOf(step) - 1])
  }
  const progress = ORDER.indexOf(step) - 1

  const levelDone = (level) => {
    const sport = form.sports[lv]
    set({ levels: { ...form.levels, [sport]: level } })
    if (lv < form.sports.length - 1) { setLv(lv + 1); haptic(10) } else { celebrate(); chime('level'); haptic([20, 40, 20]); go('done') }
  }
  const enter = () => {
    const sports = form.sports
    login({ ...form, sports, level: form.levels[sports[0]], joined: Date.now() })
  }

  return (
    <div className="auth">
      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <motion.div key={step + (step === 'level' ? lv : '')} className={`auth-pane ${step}`} custom={dir}
          variants={{ in: (d) => ({ x: d * -40, opacity: 0 }), on: { x: 0, opacity: 1 }, out: (d) => ({ x: d * 40, opacity: 0 }) }}
          initial="in" animate="on" exit="out" transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
          {step === 'welcome' && <Welcome onStart={() => { setMode('signup'); go('phone') }} onLogin={() => { setMode('login'); go('phone') }} />}
          {step !== 'welcome' && step !== 'done' && (
            <div className="auth-step">
              <div className="auth-top">
                <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={back} aria-label="بازگشت"><Icon name="back" /></motion.button>
                <CourtProgress step={progress} total={5} />
                <span className="auth-n">{fa(progress + 1).padStart(2, '۰')}</span>
              </div>
              {step === 'phone' && <PhoneStep value={form.phone} onChange={(phone) => set({ phone })} onNext={() => go('otp')} mode={mode} />}
              {step === 'otp' && <OtpStep phone={form.phone} onNext={() => go('name')} />}
              {step === 'name' && <NameStep form={form} set={set} onNext={() => go('sports')} />}
              {step === 'sports' && <SportsStep value={form.sports} onChange={(sports) => set({ sports })} onNext={() => { setLv(0); go('level') }} />}
              {step === 'level' && (
                <div className="step-body">
                  <h2>سطحت تو {sportById(form.sports[lv]).name} چیه؟</h2>
                  <p className="muted">۱۰ سؤال کوتاه — برای اینکه با هم‌سطح خودت بازی کنی.</p>
                  <LevelQuiz key={form.sports[lv]} sport={form.sports[lv]} index={lv} count={form.sports.length} onDone={levelDone} />
                </div>
              )}
            </div>
          )}
          {step === 'done' && <Done form={form} onEnter={enter} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Welcome({ onStart, onLogin }) {
  const words = ['زمین بگیر.', 'یار پیدا کن.', 'عشق کن.']
  return (
    <div className="welcome-in">
      <motion.div className="brand" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Logo size={24} animated />
        <span className="brand-tag">تهران، کرج</span>
      </motion.div>
      <CourtArt className="welcome-art" fit="meet" />
      <div className="welcome-copy">
        <h1>
          {words.map((w, i) => (
            <motion.span key={w} className={i === 2 ? 'hl' : ''} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.14, type: 'spring', stiffness: 220, damping: 20 }}>
              {i === 2 ? <><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.05, duration: 0.5, ease: [0.6, 0, 0.2, 1] }} /><em>{w}</em></> : w}
            </motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}>
          پدل، تنیس، تنیس ساحلی و پیکلبال — باشگاه‌های تهران و کرج روی نقشه، رزرو در کمتر از یک دقیقه.
        </motion.p>
      </div>
      <motion.div className="welcome-cta" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
        <Button full onClick={onStart}>شروع کنیم</Button>
        <Button full variant="line" onClick={onLogin}>قبلاً ثبت‌نام کرده‌ام</Button>
        <p className="tiny">با ادامه، <u>قوانین</u> و <u>حریم خصوصی</u> را می‌پذیرید.</p>
      </motion.div>
    </div>
  )
}

function PhoneStep({ value, onChange, onNext, mode }) {
  const valid = /^09\d{9}$/.test(value)
  const pretty = value.replace(/^(\d{4})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
  return (
    <div className="step-body">
      <h2>{mode === 'login' ? 'خوش برگشتی 👋' : 'شماره موبایلت چنده؟'}</h2>
      <p className="muted">یه کد ۴ رقمی برات پیامک می‌کنیم.</p>
      <label className={`field phone ${valid ? 'ok' : ''}`}>
        <Icon name="phone" />
        <input inputMode="numeric" autoFocus dir="ltr" placeholder="0912 345 6789" value={fa0(pretty)}
          onChange={(e) => onChange(toLatin(e.target.value).replace(/\D/g, '').slice(0, 11))}
          onKeyDown={(e) => e.key === 'Enter' && valid && onNext()} />
        <AnimatePresence>{valid && <motion.span className="field-ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Icon name="check" size={16} stroke={3} /></motion.span>}</AnimatePresence>
      </label>
      <div className="auth-cta">
        <Button full disabled={!valid} onClick={onNext}>ارسال کد</Button>
        <Button full variant="line" onClick={() => { onChange('09120000000'); setTimeout(onNext, 150) }}>ورود سریع نمایشی</Button>
      </div>
    </div>
  )
}

function OtpStep({ phone, onNext }) {
  const [code, setCode] = useState(['', '', '', ''])
  const [auto, setAuto] = useState(false)
  const [sec, setSec] = useState(59)
  const refs = useRef([])
  useEffect(() => { refs.current[0]?.focus() }, [])
  useEffect(() => { const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t) }, [])
  // شبیه‌سازی دریافت خودکار پیامک (WebOTP)
  useEffect(() => {
    const t = setTimeout(() => {
      setAuto(true)
      '1234'.split('').forEach((d, i) => setTimeout(() => { haptic(6); setCode((c) => { const n = [...c]; n[i] = d; return n }) }, i * 140))
    }, 1600)
    return () => clearTimeout(t)
  }, [])
  const full = code.every(Boolean)
  useEffect(() => { if (full) { chime('success'); const t = setTimeout(onNext, 600); return () => clearTimeout(t) } }, [full])
  const put = (i, v) => {
    const d = toLatin(v).replace(/\D/g, '').slice(-1)
    setCode((c) => { const n = [...c]; n[i] = d; return n })
    if (d && i < 3) refs.current[i + 1]?.focus()
  }
  return (
    <div className="step-body">
      <h2>کد تأیید</h2>
      <p className="muted">به <b dir="ltr">{fa0(phone)}</b> ارسال شد</p>
      <div className="otp" dir="ltr">
        {code.map((d, i) => (
          <motion.input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" value={d ? fa0(d) : ''}
            className={d ? 'filled' : ''} animate={d ? { y: [0, -8, 0] } : {}} transition={{ duration: 0.3 }}
            onChange={(e) => put(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus() }} />
        ))}
      </div>
      <AnimatePresence>
        {auto && <motion.p className="auto-sms" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>✨ کد از پیامک خودکار خوانده شد</motion.p>}
      </AnimatePresence>
      <p className="muted center">{sec > 0 ? `ارسال مجدد تا ${fa(sec)} ثانیه` : <button className="link">ارسال مجدد کد</button>}</p>
    </div>
  )
}

function NameStep({ form, set, onNext }) {
  const ok = form.name.trim().length >= 2
  return (
    <div className="step-body">
      <h2>چی صدات کنیم؟</h2>
      <label className="field">
        <Icon name="user" />
        <input autoFocus placeholder="نام و نام خانوادگی" value={form.name} onChange={(e) => set({ name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && ok && onNext()} />
      </label>
      <p className="label">کجا بازی می‌کنی؟</p>
      <div className="city-pick">
        {CITIES.map((c) => (
          <motion.button key={c.id} className={form.city === c.id ? 'on' : ''} whileTap={{ scale: 0.96 }} onClick={() => { haptic(6); set({ city: c.id }) }}>
            <span className="city-pin"><Icon name="pin" size={20} /></span>
            <b>{c.name}</b>
            <small>{c.id === 'tehran' ? '۱۲ باشگاه' : '۴ باشگاه'}</small>
          </motion.button>
        ))}
      </div>
      <div className="auth-cta"><Button full disabled={!ok} onClick={onNext}>ادامه</Button></div>
    </div>
  )
}

function SportsStep({ value, onChange, onNext }) {
  const toggle = (id) => { haptic(8); onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]) }
  return (
    <div className="step-body">
      <h2>چی بازی می‌کنی؟</h2>
      <p className="muted">هر چندتا که دوست داری — برای هر رشته جدا سطحت رو می‌سنجیم.</p>
      <div className="sport-pick">
        {SPORTS.map((s, k) => {
          const on = value.includes(s.id)
          return (
            <motion.button key={s.id} className={`sport-tile ${on ? 'on' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => toggle(s.id)} style={{ '--c': s.color }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }}>
              <Photo src={s.img} tone={s.color} />
              <span className="sport-tile-en">{s.en}</span>
              <span className="sport-tile-name">{s.name}</span>
              <AnimatePresence>{on && <motion.span className="tick" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>{fa(value.indexOf(s.id) + 1)}</motion.span>}</AnimatePresence>
            </motion.button>
          )
        })}
      </div>
      <div className="auth-cta">
        <Button full disabled={!value.length} onClick={onNext}>{value.length ? `تعیین سطح، ${fa(value.length)} رشته` : 'حداقل یه رشته انتخاب کن'}</Button>
      </div>
    </div>
  )
}

function Done({ form, onEnter }) {
  return (
    <div className="done">
      <CourtArt className="done-art" balls={false} />
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>{form.name.split(' ')[0]}، آماده‌ای!</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="muted">{CITIES.find((c) => c.id === form.city).name}، سطح‌های شروع تو:</motion.p>
      <div className="done-levels">
        {form.sports.map((id, k) => {
          const s = sportById(id), l = form.levels[id]
          return (
            <motion.div key={id} className="done-lv" style={{ '--c': s.color }} initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.4 + k * 0.12, type: 'spring', stiffness: 260, damping: 16 }}>
              <span>{s.name}</span><LevelPill id={l} big /><small>{levelById(l).title}</small>
            </motion.div>
          )
        })}
      </div>
      <motion.div className="xp-pop" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}>+۲۰ امتیاز، ۵۰۰ هزار تومان اعتبار هدیه</motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} style={{ width: '100%' }}>
        <Button full variant="lime" onClick={onEnter}>بزن بریم</Button>
      </motion.div>
    </div>
  )
}
