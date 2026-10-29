import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CITIES, LEVELS, fa, levelIndex, poolSize, randomPlayer, sportById } from '../../data'
import { haptic } from '../../fx'
import { useStore } from '../../store'
import { Avatar, Button, CountUp, Icon, LevelPill, Sheet } from '../../components/ui'

const FRIENDS = Array.from({ length: 8 }, (_, k) => randomPlayer('friend' + k))

export function People({ w, set, onNext }) {
  const { user } = useStore()
  const total = w.format === 'singles' ? 2 : 4
  const sport = sportById(w.sport)
  const [edit, setEdit] = useState(null)

  // اسلات اول همیشه خود کاربر است
  useEffect(() => {
    if (w.players.length !== total) {
      const p = Array.from({ length: total }, (_, k) => w.players[k] || null)
      p[0] = { name: user.name, level: user.level, me: true }
      set({ players: p })
    }
  }, [total])
  const players = w.players.length === total ? w.players : [{ name: user.name, level: user.level, me: true }, ...Array(total - 1).fill(null)]
  const empty = players.filter((p) => !p).length

  const put = (k, p) => { const n = [...players]; n[k] = p; set({ players: n }); haptic(12) }
  const toggleLevel = (id) => {
    const has = w.levels.includes(id)
    if (has && w.levels.length === 1) return
    set({ levels: has ? w.levels.filter((x) => x !== id) : [...w.levels, id].sort((a, b) => levelIndex(a) - levelIndex(b)) })
  }
  const reach = poolSize(w.sport, w.city, w.levels)

  return (
    <div className="people">
      <h2 className="wz-h">کی‌ها بازی می‌کنن؟</h2>
      <p className="muted">روی جای خالی بزن و دوستت رو اضافه کن. جای خالی رو می‌تونیم با بازیکن هم‌سطح پر کنیم.</p>

      <div className={`court ${total === 2 ? 'singles' : ''}`} style={{ '--c': sport.color }}>
        <div className="court-net" />
        <div className="court-line" />
        {players.map((p, k) => (
          <div key={k} className={`court-spot s${k}`}>
            <AnimatePresence mode="popLayout">
              {p ? (
                <motion.div key={p.name} className="spot-p" initial={{ y: -30, opacity: 0, scale: 0.4 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 16 }} onClick={() => !p.me && put(k, null)}>
                  <Avatar name={p.name} size={52} me={p.me} />
                  <span>{p.me ? 'شما' : p.name.split(' ')[0]}</span>
                  <LevelPill id={p.level} />
                </motion.div>
              ) : (
                <motion.div key="e" className="spot-p" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <motion.div animate={w.open ? { boxShadow: ['0 0 0 0 rgba(212,255,63,.7)', '0 0 0 14px rgba(212,255,63,0)'] } : {}} transition={{ repeat: Infinity, duration: 1.6 }} style={{ borderRadius: '50%' }}>
                    <Avatar empty size={52} onClick={() => setEdit(k)} />
                  </motion.div>
                  <span>{w.open ? 'در جستجو…' : 'خالی'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {empty > 0 && (
          <motion.div className={`mm ${w.open ? 'on' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
            <div className="mm-head" onClick={() => { haptic(10); set({ open: !w.open }) }}>
              <div className="mm-ic"><Icon name="radar" /></div>
              <div className="grow">
                <b>{fa(empty)} بازیکن کم داری؟</b>
                <small>به بازیکن‌های هم‌سطح اعلان و آلارم می‌فرستیم</small>
              </div>
              <div className={`switch ${w.open ? 'on' : ''}`}><motion.i layout transition={{ type: 'spring', stiffness: 600, damping: 30 }} /></div>
            </div>
            <AnimatePresence>
              {w.open && (
                <motion.div className="mm-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <p className="label">چه سطحی‌هایی بیان؟</p>
                  <div className="lv-pick">
                    {LEVELS.map((l) => {
                      const on = w.levels.includes(l.id)
                      return (
                        <motion.button key={l.id} whileTap={{ scale: 0.85 }} className={on ? 'on' : ''} style={{ '--c': l.color }} onClick={() => { haptic(6); toggleLevel(l.id) }}>
                          {l.id}
                        </motion.button>
                      )
                    })}
                  </div>
                  <p className="lv-desc">{w.levels.map((id) => LEVELS[levelIndex(id)].title).join('، ')}</p>
                  <div className="reach">
                    <span className="reach-n"><CountUp key={reach} to={reach} duration={0.6} /></span>
                    <span>بازیکن {sport.name} در {CITIES.find((c) => c.id === w.city).name} اعلان می‌گیرن</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="cta-bar">
        <Button full variant="dark" onClick={onNext}>
          {empty === 0 ? 'تیم کامله! مرور نهایی' : w.open ? 'مرور و ارسال درخواست' : 'ادامه با جای خالی'}
        </Button>
      </div>

      <Sheet open={edit !== null} onClose={() => setEdit(null)} title="اضافه کردن بازیکن">
        <AddPlayer exclude={players.filter(Boolean).map((p) => p.name)} onAdd={(p) => { put(edit, p); setEdit(null) }} />
      </Sheet>
    </div>
  )
}

function AddPlayer({ onAdd, exclude }) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('C')
  return (
    <div className="add-p">
      <p className="label">دوستان اخیر</p>
      <div className="friends">
        {FRIENDS.filter((f) => !exclude.includes(f.name)).map((f) => (
          <motion.button key={f.id} whileTap={{ scale: 0.9 }} onClick={() => onAdd(f)}>
            <Avatar name={f.name} size={48} />
            <span>{f.name.split(' ')[0]}</span>
            <LevelPill id={f.level} />
          </motion.button>
        ))}
      </div>
      <p className="label">یا اسم و سطحش رو بنویس</p>
      <label className="field">
        <Icon name="user" />
        <input placeholder="نام بازیکن یا شماره موبایل" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="lv-pick sm">
        {LEVELS.map((l) => (
          <button key={l.id} className={level === l.id ? 'on' : ''} style={{ '--c': l.color }} onClick={() => setLevel(l.id)}>{l.id}</button>
        ))}
      </div>
      <Button full variant="lime" disabled={name.trim().length < 2} onClick={() => onAdd({ name: name.trim(), level, invited: true })}>اضافه کن و دعوت‌نامه بفرست</Button>
    </div>
  )
}

export function Partner({ w, set, onNext }) {
  const { user } = useStore()
  const t = w.tournament
  if (!t.partner) {
    return (
      <div className="people">
        <h2 className="wz-h">ثبت‌نام انفرادی</h2>
        <p className="muted">این مسابقه انفرادی است — نیاز به هم‌تیمی ندارید.</p>
        <div className="cta-bar"><Button full variant="dark" onClick={onNext}>مرور نهایی</Button></div>
      </div>
    )
  }
  return (
    <div className="people">
      <h2 className="wz-h">با کی تیم می‌شی؟</h2>
      <p className="muted">مسابقه دونفره است. هم‌تیمی‌ات رو بنویس یا بذار سیستم برات پیدا کنه.</p>
      <div className="pair">
        <div className="pair-p"><Avatar name={user.name} size={64} me /><b>شما</b><LevelPill id={user.level} /></div>
        <motion.span className="pair-x" animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>×</motion.span>
        <div className="pair-p">
          {w.partner ? <Avatar name={w.partner} size={64} /> : <motion.div animate={w.findPartner ? { scale: [1, 1.08, 1] } : {}} transition={{ repeat: Infinity, duration: 1.2 }}><Avatar empty size={64} /></motion.div>}
          <b>{w.partner || (w.findPartner ? 'در جستجو…' : 'هم‌تیمی')}</b>
        </div>
      </div>
      <label className="field">
        <Icon name="user" />
        <input placeholder="نام هم‌تیمی" value={w.partner} onChange={(e) => set({ partner: e.target.value, findPartner: false })} />
      </label>
      <button className={`mm-head solo ${w.findPartner ? 'on' : ''}`} onClick={() => { haptic(10); set({ findPartner: !w.findPartner, partner: '' }) }}>
        <div className="mm-ic"><Icon name="radar" /></div>
        <div className="grow"><b>هم‌تیمی ندارم — پیدا کن</b><small>اعلان برای بازیکن‌های سطح {t.levels.join('، ')}</small></div>
        <div className={`switch ${w.findPartner ? 'on' : ''}`}><motion.i layout /></div>
      </button>
      <div className="cta-bar">
        <Button full variant="dark" disabled={!w.partner.trim() && !w.findPartner} onClick={onNext}>مرور نهایی</Button>
      </div>
    </div>
  )
}
