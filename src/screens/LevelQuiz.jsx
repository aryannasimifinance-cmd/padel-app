import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { QUIZ, QUIZ_LEVELS, fa, levelById, quizLevel, sportById } from '../data'
import { chime, haptic } from '../fx'
import { Button, Icon, LevelPill } from '../components/ui'

// ۱۰ سؤال برای یک رشته؛ نتیجه حداکثر B. «ادامه» نتیجه را به والد برمی‌گرداند
export default function LevelQuiz({ sport, onDone, index, count }) {
  const s = sportById(sport)
  const qs = QUIZ[sport]
  const [k, setK] = useState(0)
  const [answers, setAnswers] = useState([])
  const [picked, setPicked] = useState(null) // سطح انتخاب‌شده/محاسبه‌شده
  const [manual, setManual] = useState(false)

  const answer = (v) => {
    haptic(8)
    const a = [...answers]; a[k] = v; setAnswers(a)
    if (k < qs.length - 1) setTimeout(() => setK(k + 1), 160)
    else { setPicked(quizLevel(a.reduce((x, y) => x + y, 0), qs.length * 3)); chime('level') }
  }
  const restart = () => { setK(0); setAnswers([]); setPicked(null); setManual(false) }

  return (
    <div className="quiz" style={{ '--sc': s.color }}>
      <div className="quiz-head">
        <span className="quiz-sport"><i />{s.name}</span>
        {count > 1 && <small>رشته‌ی {fa(index + 1)} از {fa(count)}</small>}
      </div>
      <AnimatePresence mode="wait">
        {picked ? (
          <motion.div key="res" className="quiz-res" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="quiz-res-badge" initial={{ rotate: -120, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 13 }}>
              <span>{picked}</span>
            </motion.div>
            <h3>سطح {s.name} تو: {levelById(picked).title}</h3>
            <p>{levelById(picked).desc}</p>
            <small className="muted">بعد از هر بازی دقیق‌تر می‌شه. سطح بالاتر از B فقط با نتیجه‌ی مسابقه باز می‌شه.</small>
            <Button full onClick={() => onDone(picked)}>{index != null && index < count - 1 ? 'رشته‌ی بعدی' : 'تأیید'}</Button>
            <button className="link" onClick={restart}>دوباره جواب می‌دم</button>
          </motion.div>
        ) : manual ? (
          <motion.div key="man" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="muted quiz-man-h">سطحت رو انتخاب کن (حداکثر B)</p>
            <div className="level-list">
              {QUIZ_LEVELS.map((l) => (
                <motion.button key={l.id} className="level-row" whileTap={{ scale: 0.98 }} onClick={() => { haptic(6); setPicked(l.id) }}>
                  <LevelPill id={l.id} />
                  <div><b>{l.title}</b><small>{l.desc}</small></div>
                </motion.button>
              ))}
            </div>
            <button className="link quiz-switch" onClick={() => setManual(false)}>برگرد به سؤال‌ها</button>
          </motion.div>
        ) : (
          <motion.div key={'q' + k} className="quiz-q" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="quiz-dots">{qs.map((_, i) => <i key={i} className={i < k ? 'done' : i === k ? 'now' : ''} />)}</div>
            <span className="quiz-n">سؤال {fa(k + 1)} از {fa(qs.length)}</span>
            <h3>{qs[k].q}</h3>
            <div className="quiz-as">
              {qs[k].a.map((a, v) => (
                <motion.button key={a} className={`quiz-a ${answers[k] === v ? 'on' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => answer(v)}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: v * 0.04 }}>
                  <span className="quiz-bar">{[0, 1, 2].map((x) => <i key={x} className={x < v ? 'f' : ''} />)}</span>
                  {a}
                </motion.button>
              ))}
            </div>
            <div className="quiz-foot">
              {k > 0 ? <button className="link" onClick={() => setK(k - 1)}><Icon name="back" size={14} /> سؤال قبل</button> : <span />}
              <button className="link" onClick={() => setManual(true)}>سطحم رو می‌دونم</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
