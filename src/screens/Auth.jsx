import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CITIES, LEVELS, SPORTS, fa } from '../data'
import { celebrate, chime, haptic } from '../fx'
import { useStore } from '../store'
import { Button, Icon, LevelPill, Photo, TopBar } from '../components/ui'

const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
const HERO = ['./img/padel-hero.jpg', './img/tennis-clay.jpg', './img/beach-court.jpg', './img/pickleball.jpg']

export function Splash() {
  return (
    <motion.div className="splash" exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }}>
      <motion.div className="splash-ball" initial={{ y: -260, scale: 0.6 }} animate={{ y: [-260, 0, -70, 0, -18, 0], scale: [0.6, 1, 1, 1, 1, 1] }}
        transition={{ duration: 1.1, times: [0, 0.35, 0.55, 0.72, 0.86, 1], ease: 'easeOut' }} />
      <motion.h1 initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.02em' }} transition={{ delay: 0.7, duration: 0.8 }}>راکت</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1 }}>PADEL · TENNIS · BEACH · PICKLE</motion.p>
    </motion.div>
  )
}

export default function Auth() {
  const { login } = useStore()
  const [step, setStep] = useState('welcome') // welcome → phone → otp → name → sports → level → done
  const [mode, setMode] = useState('signup')
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState({ phone: '', name: '', city: 'tehran', sports: [], level: null })
  const set = (p) => setForm((f) => ({ ...f, ...p }))
  const order = ['welcome', 'phone', 'otp', 'name', 'sports', 'level', 'done']
  const go = (s) => { setDir(order.indexOf(s) > order.indexOf(step) ? 1 : -1); setStep(s) }
  const back = () => go(order[order.indexOf(step) - 1])

  const finish = () => {
    celebrate(); chime('level'); haptic([20, 40, 20])
    go('done')
  }

  const progress = { phone: 0, otp: 1, name: 2, sports: 3, level: 4 }[step]

  return (
    <div className="auth">
      <HeroSlides dim={step !== 'welcome'} />
      <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        <motion.div key={step} className={`auth-pane ${step === 'welcome' ? 'welcome' : ''}`} custom={dir}
          variants={{ in: (d) => ({ x: d * -60, opacity: 0 }), on: { x: 0, opacity: 1 }, out: (d) => ({ x: d * 60, opacity: 0 }) }}
          initial="in" animate="on" exit="out" transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
          {step === 'welcome' && <Welcome onStart={() => { setMode('signup'); go('phone') }} onLogin={() => { setMode('login'); go('phone') }} />}
          {step !== 'welcome' && step !== 'done' && (
            <div className="auth-card glass">
              <TopBar onBack={back} total={5} step={progress} title={mode === 'login' && step === 'phone' ? 'ورود' : 'ساخت حساب'} transparent />
              {step === 'phone' && <PhoneStep value={form.phone} onChange={(phone) => set({ phone })} onNext={() => go('otp')} mode={mode} />}
              {step === 'otp' && <OtpStep phone={form.phone} onNext={() => go('name')} />}
              {step === 'name' && <NameStep form={form} set={set} onNext={() => go('sports')} />}
              {step === 'sports' && <SportsStep value={form.sports} onChange={(sports) => set({ sports })} onNext={() => go('level')} />}
              {step === 'level' && <LevelStep value={form.level} onChange={(level) => set({ level })} onNext={finish} />}
            </div>
          )}
          {step === 'done' && <Done form={form} onEnter={() => login({ ...form, joined: Date.now() })} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function HeroSlides({ dim }) {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % HERO.length), 4200); return () => clearInterval(t) }, [])
  return (
    <div className="auth-bg">
      <AnimatePresence>
        <motion.div key={i} className="auth-bg-img" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
          <Photo src={HERO[i]} zoom />
        </motion.div>
      </AnimatePresence>
      <motion.div className="auth-bg-shade" animate={{ opacity: dim ? 1 : 0.75 }} />
      <div className="grain" />
    </div>
  )
}

function Welcome({ onStart, onLogin }) {
  const words = ['زمین بگیر.', 'هم‌سطح پیدا کن.', 'ببر.']
  return (
    <div className="welcome-in">
      <motion.div className="brand" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="brand-dot" /> راکت
      </motion.div>
      <div className="welcome-copy">
        <div className="sport-tags">
          {SPORTS.map((s, i) => (
            <motion.span key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>{s.name}</motion.span>
          ))}
        </div>
        <h1>
          {words.map((w, i) => (
            <motion.span key={w} className={i === 2 ? 'hl' : ''} initial={{ opacity: 0, y: 40, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200, damping: 18 }}>{w}</motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.8 }}>
          رزرو زمین در باشگاه‌های تهران و کرج، ساخت بازی و پیدا کردن بازیکن هم‌سطح — در کمتر از یک دقیقه.
        </motion.p>
      </div>
      <motion.div className="welcome-cta" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
        <Button full variant="lime" onClick={onStart}>شروع کنیم</Button>
        <Button full variant="glass" onClick={onLogin}>قبلاً ثبت‌نام کرده‌ام</Button>
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
      <Button full variant="lime" disabled={!valid} onClick={onNext}>ارسال کد</Button>
      <div className="or"><span>یا</span></div>
      <Button full variant="ghost" onClick={() => { onChange('09120000000'); setTimeout(onNext, 150) }}>
        <span className="g-logo">G</span> ادامه با گوگل
      </Button>
    </div>
  )
}
const fa0 = (s) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])

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
    }, 1800)
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
            className={d ? 'filled' : ''} animate={d ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.25 }}
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
      <div className="city-toggle">
        {CITIES.map((c) => (
          <motion.button key={c.id} className={form.city === c.id ? 'on' : ''} whileTap={{ scale: 0.95 }} onClick={() => { haptic(6); set({ city: c.id }) }}>
            {form.city === c.id && <motion.span layoutId="city-bg" className="city-bg" />}
            <span><Icon name="pin" size={18} /> {c.name}</span>
          </motion.button>
        ))}
      </div>
      <Button full variant="lime" disabled={!ok} onClick={onNext}>ادامه</Button>
    </div>
  )
}

function SportsStep({ value, onChange, onNext }) {
  const toggle = (id) => { haptic(8); onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]) }
  return (
    <div className="step-body">
      <h2>چی بازی می‌کنی؟</h2>
      <p className="muted">هر چندتا که دوست داری</p>
      <div className="sport-grid-sm">
        {SPORTS.map((s) => {
          const on = value.includes(s.id)
          return (
            <motion.button key={s.id} className={`sport-tile ${on ? 'on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggle(s.id)} style={{ '--c': s.color }}>
              <Photo src={s.img} />
              <span className="sport-tile-name">{s.name}</span>
              <AnimatePresence>{on && <motion.span className="tick" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><Icon name="check" size={16} stroke={3} /></motion.span>}</AnimatePresence>
            </motion.button>
          )
        })}
      </div>
      <Button full variant="lime" disabled={!value.length} onClick={onNext}>ادامه</Button>
    </div>
  )
}

const QUIZ = [
  { q: 'چند وقته بازی می‌کنی؟', a: ['تازه شروع کردم', 'کمتر از ۶ ماه', '۶ ماه تا ۲ سال', 'بیشتر از ۲ سال'] },
  { q: 'یه رالی ۱۰ ضربه‌ای رو نگه می‌داری؟', a: ['نه هنوز', 'گاهی', 'معمولاً', 'همیشه'] },
  { q: 'تجربه مسابقه داری؟', a: ['نه', 'دوستانه', 'باشگاهی', 'رسمی'] },
]

function LevelStep({ value, onChange, onNext }) {
  const [quiz, setQuiz] = useState(null) // null = انتخاب مستقیم، عدد = سؤال فعلی
  const [score, setScore] = useState(0)
  const answer = (k) => {
    haptic(8)
    const s = score + k
    if (quiz < QUIZ.length - 1) { setScore(s); setQuiz(quiz + 1) } else {
      const idx = Math.max(0, Math.min(8, 8 - s))
      onChange(LEVELS[idx].id); setQuiz(null); setScore(0); chime('success')
    }
  }
  return (
    <div className="step-body">
      <h2>سطحت چیه؟</h2>
      <p className="muted">برای مچ‌میکینگ — بعداً با هر بازی دقیق‌تر می‌شه.</p>
      <AnimatePresence mode="wait">
        {quiz === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="quiz-cta" onClick={() => { setQuiz(0); setScore(0) }}>
              <Icon name="sparkle" /> مطمئن نیستم — با ۳ سؤال کمکم کن
            </button>
            <div className="level-list">
              {LEVELS.map((l) => (
                <motion.button key={l.id} className={`level-row ${value === l.id ? 'on' : ''}`} whileTap={{ scale: 0.98 }} onClick={() => { haptic(6); onChange(l.id) }}>
                  <LevelPill id={l.id} />
                  <div><b>{l.title}</b><small>{l.desc}</small></div>
                  {value === l.id && <motion.span layoutId="lvl-check" className="lvl-check"><Icon name="check" size={16} stroke={3} /></motion.span>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key={'q' + quiz} className="quiz" initial={{ x: -40, opacity: 0, rotate: -2 }} animate={{ x: 0, opacity: 1, rotate: 0 }} exit={{ x: 40, opacity: 0, rotate: 2 }}>
            <span className="quiz-n">{fa(quiz + 1)} / {fa(QUIZ.length)}</span>
            <h3>{QUIZ[quiz].q}</h3>
            {QUIZ[quiz].a.map((a, k) => (
              <motion.button key={a} className="quiz-a" whileTap={{ scale: 0.97 }} onClick={() => answer(k)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.05 }}>{a}</motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {quiz === null && <Button full variant="lime" disabled={!value} onClick={onNext}>تموم شد!</Button>}
    </div>
  )
}

function Done({ form, onEnter }) {
  return (
    <div className="done">
      <motion.div className="done-badge" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <LevelPill id={form.level} big />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>{form.name}، آماده‌ای!</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.45 }}>سطح شروع: {form.level} · {CITIES.find((c) => c.id === form.city).name}</motion.p>
      <motion.div className="xp-pop" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}>+۲۰ امتیاز هدیه</motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} style={{ width: '100%' }}>
        <Button full variant="lime" onClick={onEnter}>بزن بریم</Button>
      </motion.div>
    </div>
  )
}

