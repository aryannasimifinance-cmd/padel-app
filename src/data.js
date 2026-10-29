// داده‌های نمونه — باشگاه‌ها، مربی‌ها، مسابقات و بازیکنان همه ساختگی هستند
const img = (n) => `./img/${n}.jpg`

export const SPORTS = [
  {
    id: 'padel', name: 'پدل', en: 'PADEL', color: '#3D5AFE', soft: '#E3E8FF',
    img: img('padel-hero'), alt: img('padel-aerial'),
    tagline: 'سریع، اجتماعی، همیشه چهار نفره',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }],
  },
  {
    id: 'tennis', name: 'تنیس', en: 'TENNIS', color: '#D9643A', soft: '#FBE7DE',
    img: img('tennis-clay'), alt: img('tennis-courts'),
    tagline: 'کلاسیک، روی خاک یا هارد',
    formats: [{ id: 'singles', name: 'انفرادی', players: 2 }, { id: 'doubles', name: 'دونفره', players: 4 }],
  },
  {
    id: 'beach', name: 'تنیس ساحلی', en: 'BEACH TENNIS', color: '#E0A526', soft: '#FBF0D6',
    img: img('beach-court'), alt: img('beach-sea'),
    tagline: 'پابرهنه روی شن، حس تابستان',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }, { id: 'singles', name: 'انفرادی', players: 2 }],
  },
  {
    id: 'pickle', name: 'پیکلبال', en: 'PICKLEBALL', color: '#1FAF6B', soft: '#DDF5E8',
    img: img('pickleball'), alt: img('tennis-hard'),
    tagline: 'ساده برای شروع، اعتیادآور برای ادامه',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }, { id: 'singles', name: 'انفرادی', players: 2 }],
  },
]
export const sportById = (id) => SPORTS.find((s) => s.id === id)

// نوع فعالیت — «بازی» حداقل ۲ ساعت، «تمرین» ۱ ساعت
export const ACTIVITIES = [
  { id: 'game', name: 'بازی', icon: '⚡', desc: 'زمین بگیر، رفقا رو دعوت کن یا هم‌سطح پیدا کن', meta: 'حداقل ۲ ساعت', durations: [2, 3], xp: 50, img: img('padel-aerial') },
  { id: 'practice', name: 'تمرین', icon: '🎯', desc: 'زمین برای تمرین شخصی یا دونفره', meta: '۱ ساعت', durations: [1], xp: 20, img: img('tennis-shadow') },
  { id: 'coach', name: 'آموزش با مربی', icon: '🧢', desc: 'جلسه خصوصی یا گروهی با مربی‌های تأییدشده', meta: 'جلسه ۱ ساعته', durations: [1], xp: 30, img: img('coach') },
  { id: 'weekend', name: 'مسابقات آخر هفته', icon: '🌤', desc: 'امریکانو و میکسینو، دوستانه و پرهیجان', meta: 'پنجشنبه و جمعه', xp: 80, img: img('tennis-fun') },
  { id: 'official', name: 'مسابقات رسمی', icon: '🏆', desc: 'رنکینگ‌دار، رده‌بندی بر اساس سطح', meta: 'امتیاز رنکینگ', xp: 120, img: img('ball-space') },
]
export const activityById = (id) => ACTIVITIES.find((a) => a.id === id)

// سطوح مچ‌میکینگ — از بالاترین به پایین‌ترین
export const LEVELS = [
  { id: 'A', title: 'حرفه‌ای', desc: 'سابقه مسابقات رسمی، کنترل کامل همه ضربه‌ها', color: '#0E0F0C' },
  { id: 'B+', title: 'پیشرفته قوی', desc: 'تاکتیک تیمی، اسمش و ولی قدرتمند', color: '#2B2D42' },
  { id: 'B', title: 'پیشرفته', desc: 'رالی‌های طولانی، استفاده از دیوار و زاویه', color: '#3D5AFE' },
  { id: 'B-', title: 'نیمه‌پیشرفته', desc: 'ضربات ثابت، شروع بازی تاکتیکی', color: '#5C6BFF' },
  { id: 'C+', title: 'متوسط قوی', desc: 'رالی پیوسته، سرویس مطمئن', color: '#1FAF6B' },
  { id: 'C', title: 'متوسط', desc: 'بازی منظم با چند ماه سابقه', color: '#3CC27F' },
  { id: 'C-', title: 'متوسط مبتدی', desc: 'ضربات پایه را بلدی ولی هنوز ناپایدار', color: '#E0A526' },
  { id: 'D+', title: 'مبتدی با تجربه', desc: 'چند بار بازی کرده‌ای و قوانین را می‌دانی', color: '#E9862F' },
  { id: 'D', title: 'تازه‌کار', desc: 'تازه شروع کرده‌ای — خوش آمدی!', color: '#D9643A' },
]
export const levelIndex = (id) => LEVELS.findIndex((l) => l.id === id)
export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[5]

export const CITIES = [
  { id: 'tehran', name: 'تهران', areas: ['همه', 'شمال', 'غرب', 'شرق', 'مرکز'] },
  { id: 'karaj', name: 'کرج', areas: ['همه', 'مهرشهر', 'گوهردشت', 'عظیمیه', 'فردیس'] },
]

export const DAYPARTS = [
  { id: 'any', name: 'هر ساعتی', from: 7, to: 24 },
  { id: 'morning', name: 'صبح', icon: '🌅', from: 7, to: 12 },
  { id: 'noon', name: 'ظهر', icon: '☀️', from: 12, to: 16 },
  { id: 'evening', name: 'عصر', icon: '🌇', from: 16, to: 20 },
  { id: 'night', name: 'شب', icon: '🌙', from: 20, to: 24 },
]

export const CLUBS = [
  { id: 'c1', name: 'باشگاه آبی‌نیلی', city: 'tehran', region: 'غرب', area: 'سعادت‌آباد', sports: ['padel', 'tennis'], courts: 6, price: { padel: 900000, tennis: 700000 }, rating: 4.9, km: 3.2, indoor: true, img: img('padel-hero'), amenities: ['سرپوشیده', 'پارکینگ', 'کافه', 'رختکن'] },
  { id: 'c2', name: 'کلاب شیشه‌ای', city: 'tehran', region: 'غرب', area: 'چیتگر', sports: ['padel'], courts: 8, price: { padel: 800000 }, rating: 4.7, km: 9.5, indoor: true, img: img('padel-indoor'), amenities: ['سرپوشیده', 'اجاره راکت', 'دوش'] },
  { id: 'c3', name: 'آکادمی خاک‌رس', city: 'tehran', region: 'شمال', area: 'نیاوران', sports: ['tennis'], courts: 5, price: { tennis: 850000 }, rating: 4.8, km: 6.1, indoor: false, img: img('tennis-clay'), amenities: ['زمین خاک', 'مربی', 'کافه'] },
  { id: 'c4', name: 'ساحل شنی', city: 'tehran', region: 'غرب', area: 'دریاچه چیتگر', sports: ['beach'], courts: 4, price: { beach: 600000 }, rating: 4.6, km: 11.2, indoor: false, img: img('beach-court'), amenities: ['شن ساحلی', 'دوش', 'نور شب'] },
  { id: 'c5', name: 'پیکل‌هاوس', city: 'tehran', region: 'مرکز', area: 'یوسف‌آباد', sports: ['pickle', 'padel'], courts: 6, price: { pickle: 450000, padel: 850000 }, rating: 4.8, km: 2.4, indoor: true, img: img('pickleball'), amenities: ['سرپوشیده', 'اجاره راکت', 'کافه'] },
  { id: 'c6', name: 'باغ راکت', city: 'tehran', region: 'شرق', area: 'لویزان', sports: ['tennis', 'padel', 'pickle'], courts: 9, price: { tennis: 650000, padel: 750000, pickle: 400000 }, rating: 4.5, km: 7.8, indoor: false, img: img('padel-aerial'), amenities: ['فضای سبز', 'پارکینگ', 'رختکن'] },
  { id: 'c7', name: 'سنترکورت', city: 'tehran', region: 'شرق', area: 'پاسداران', sports: ['tennis'], courts: 4, price: { tennis: 780000 }, rating: 4.7, km: 4.9, indoor: false, img: img('tennis-courts'), amenities: ['هارد کورت', 'نور شب', 'پارکینگ'] },
  { id: 'c8', name: 'اسپین‌پارک', city: 'tehran', region: 'شمال', area: 'زعفرانیه', sports: ['padel', 'beach'], courts: 5, price: { padel: 950000, beach: 650000 }, rating: 4.9, km: 5.5, indoor: false, img: img('padel-outdoor'), amenities: ['روف‌تاپ', 'کافه', 'دوش'] },
  { id: 'k1', name: 'پدل‌پوینت', city: 'karaj', region: 'مهرشهر', area: 'مهرشهر', sports: ['padel', 'pickle'], courts: 4, price: { padel: 600000, pickle: 350000 }, rating: 4.7, km: 2.1, indoor: true, img: img('padel-racket'), amenities: ['سرپوشیده', 'اجاره راکت', 'پارکینگ'] },
  { id: 'k2', name: 'باشگاه سبز', city: 'karaj', region: 'گوهردشت', area: 'گوهردشت', sports: ['tennis'], courts: 5, price: { tennis: 500000 }, rating: 4.5, km: 4.3, indoor: false, img: img('tennis-shadow'), amenities: ['هارد کورت', 'مربی', 'رختکن'] },
  { id: 'k3', name: 'شن‌زار', city: 'karaj', region: 'عظیمیه', area: 'عظیمیه', sports: ['beach', 'padel'], courts: 4, price: { beach: 450000, padel: 650000 }, rating: 4.6, km: 3.6, indoor: false, img: img('beach-play'), amenities: ['شن ساحلی', 'نور شب', 'کافه'] },
  { id: 'k4', name: 'کورت‌لند', city: 'karaj', region: 'فردیس', area: 'فردیس', sports: ['tennis', 'pickle', 'padel'], courts: 7, price: { tennis: 480000, pickle: 320000, padel: 580000 }, rating: 4.4, km: 6.7, indoor: true, img: img('tennis-hard'), amenities: ['سرپوشیده', 'پارکینگ', 'دوش'] },
]
export const clubById = (id) => CLUBS.find((c) => c.id === id)

export const COACHES = [
  { id: 'm1', name: 'کاوه رحیمی', sports: ['padel'], level: 'A', exp: 9, rating: 4.9, price: 1800000, clubs: ['c1', 'c2', 'c5'], bio: 'مربی درجه یک فدراسیون، متخصص بازی کنار دیوار' },
  { id: 'm2', name: 'نازنین فرهی', sports: ['tennis'], level: 'A', exp: 12, rating: 5.0, price: 2000000, clubs: ['c3', 'c7'], bio: 'قهرمان سابق کشور، آموزش تکنیک و فوت‌وورک' },
  { id: 'm3', name: 'آرش کیانی', sports: ['padel', 'pickle'], level: 'B+', exp: 5, rating: 4.7, price: 1200000, clubs: ['c5', 'c6', 'k1'], bio: 'صبور و دقیق؛ مخصوص شروع از صفر' },
  { id: 'm4', name: 'شیدا مقدم', sports: ['beach'], level: 'A', exp: 7, rating: 4.8, price: 1400000, clubs: ['c4', 'c8', 'k3'], bio: 'عضو تیم ملی تنیس ساحلی' },
  { id: 'm5', name: 'بهراد صالحی', sports: ['tennis'], level: 'B+', exp: 6, rating: 4.6, price: 1100000, clubs: ['k2', 'k4', 'c6'], bio: 'برنامه تمرینی شخصی و آنالیز ویدیویی' },
  { id: 'm6', name: 'ترانه نوری', sports: ['padel', 'beach'], level: 'B+', exp: 4, rating: 4.8, price: 1300000, clubs: ['c8', 'k3', 'k1'], bio: 'کلاس‌های گروهی پرانرژی برای بانوان و آقایان' },
  { id: 'm7', name: 'مانی اصلانی', sports: ['pickle', 'tennis'], level: 'B', exp: 3, rating: 4.5, price: 900000, clubs: ['c5', 'k4', 'c7'], bio: 'مربی جوان، تمرکز روی بازی دونفره' },
]
export const COACH_FORMATS = [
  { id: 'private', name: 'خصوصی', people: 1, mult: 1 },
  { id: 'semi', name: 'نیمه‌خصوصی', people: 2, mult: 1.5 },
  { id: 'group', name: 'گروهی', people: 4, mult: 2.2 },
]

const FIRST = ['آرین', 'نیما', 'سارا', 'مهسا', 'کیان', 'پارسا', 'الناز', 'رها', 'سینا', 'امید', 'تینا', 'بهار', 'ماهان', 'یاسمن', 'دانیال', 'نگار', 'آرمان', 'شیوا', 'پویا', 'هستی', 'رامین', 'لیلا', 'سپهر', 'مریم']
const LAST = ['ک.', 'م.', 'ر.', 'ن.', 'ص.', 'ج.', 'ف.', 'ش.', 'ط.', 'ب.']

// مولد شبه‌تصادفی قطعی تا داده‌ها بین رفرش‌ها ثابت بمانند
export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) / 4294967295
}
export function randomPlayer(seed, levelIds) {
  const r = (k) => hash(seed + k)
  const pool = levelIds?.length ? levelIds : LEVELS.map((l) => l.id)
  return {
    id: 'p' + Math.floor(r('id') * 1e9),
    name: FIRST[Math.floor(r('f') * FIRST.length)] + ' ' + LAST[Math.floor(r('l') * LAST.length)],
    level: pool[Math.floor(r('lv') * pool.length)],
    games: 5 + Math.floor(r('g') * 140),
  }
}

// تعداد بازیکنان فعال هر سطح در هر شهر — برای نمایش «اعلان برای X نفر ارسال شد»
export function poolSize(sport, city, levelIds) {
  return levelIds.reduce((sum, l) => sum + 12 + Math.floor(hash(sport + city + l) * 70), 0)
}

// ---- تاریخ و زمان ----
export function nextDays(n = 14) {
  const out = []
  const base = new Date(); base.setHours(0, 0, 0, 0)
  for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() + i); out.push(d) }
  return out
}
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
const wd = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' })
const dm = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
const dn = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' })
export const weekday = (d) => wd.format(d)
export const dayNum = (d) => dn.format(d)
export const dayMonth = (d) => dm.format(d)
export function dayLabel(d) {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const diff = Math.round((d - t) / 864e5)
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'فردا'
  return weekday(d)
}
export const isWeekend = (d) => d.getDay() === 4 || d.getDay() === 5

export const fa = (n) => Number(n).toLocaleString('fa-IR')
export const toman = (n) => fa(Math.round(n / 1000) * 1000) + ' تومان'
export function hourLabel(h) {
  const hh = Math.floor(h), mm = h % 1 ? '۳۰' : '۰۰'
  return `${fa(hh).padStart(2, '۰')}:${mm}`
}

// ساعت‌های آزاد یک باشگاه در یک روز برای مدت مشخص
export function freeSlots(club, sport, date, duration, daypart = 'any') {
  const dp = DAYPARTS.find((x) => x.id === daypart) || DAYPARTS[0]
  const now = new Date()
  const isToday = dayKey(date) === dayKey(now)
  const busy = (h) => hash(club.id + sport + dayKey(date) + h) < 0.42
  const slots = []
  for (let h = Math.max(7, dp.from); h < dp.to && h + duration <= 24; h++) {
    if (isToday && h <= now.getHours()) continue
    let ok = true
    for (let k = 0; k < Math.ceil(duration); k++) if (busy(h + k)) ok = false
    if (ok) slots.push(h)
  }
  return slots
}

// مسابقات — آخر هفته (دوستانه) و رسمی (رنکینگ‌دار)
const WEEKEND_FORMATS = ['امریکانو', 'میکسینو', 'کینگ آف کورت']
const OFFICIAL_NAMES = ['جام پاییزه', 'تور رنکینگ ملی', 'اوپن تهران', 'جام باشگاه‌ها']
export function tournaments(kind, sport, city) {
  const days = nextDays(28).filter((d) => (kind === 'weekend' ? isWeekend(d) : d.getDay() === 5))
  const clubs = CLUBS.filter((c) => c.city === city && c.sports.includes(sport))
  const list = []
  days.forEach((d, i) => {
    clubs.forEach((c, j) => {
      const r = hash(kind + sport + c.id + dayKey(d))
      if (r > (kind === 'weekend' ? 0.55 : 0.78)) return
      const start = kind === 'weekend' ? 16 + Math.floor(r * 4) : 9
      if (i === 0 && dayKey(d) === dayKey(new Date()) && start <= new Date().getHours()) return
      const cap = kind === 'weekend' ? 16 : 32
      const lvlStart = Math.floor(hash('lv' + c.id + i) * 6)
      list.push({
        id: `t-${kind}-${sport}-${c.id}-${dayKey(d)}`,
        kind, sport, clubId: c.id, date: dayKey(d),
        title: kind === 'weekend'
          ? `${WEEKEND_FORMATS[Math.floor(r * 30) % 3]} ${weekday(d)}`
          : `${OFFICIAL_NAMES[(i + j) % OFFICIAL_NAMES.length]} ${sportById(sport).name}`,
        format: kind === 'weekend' ? WEEKEND_FORMATS[Math.floor(r * 30) % 3] : 'حذفی + گروهی',
        start,
        levels: LEVELS.slice(lvlStart, lvlStart + (kind === 'weekend' ? 4 : 2)).map((l) => l.id),
        cap, taken: Math.floor(cap * (0.3 + hash('tk' + c.id + i) * 0.6)),
        fee: kind === 'weekend' ? 450000 + Math.floor(r * 4) * 50000 : 1200000 + Math.floor(r * 5) * 100000,
        prize: kind === 'weekend' ? 'جوایز نقدی + راکت' : `${fa(30 + Math.floor(r * 70))} میلیون تومان`,
        points: kind === 'official' ? 250 + Math.floor(r * 4) * 125 : 0,
        partner: sport !== 'tennis' || r > 0.5,
      })
    })
  })
  return list.sort((a, b) => fromKey(a.date) - fromKey(b.date))
}

// بازی‌های باز دیگران — برای فید خانه
export function openMatches(city, userLevel) {
  const ul = levelIndex(userLevel)
  const days = nextDays(5)
  const out = []
  CLUBS.filter((c) => c.city === city).forEach((c) => {
    c.sports.forEach((s) => {
      days.forEach((d, di) => {
        const r = hash('om' + c.id + s + dayKey(d))
        if (r > 0.33) return
        const sp = sportById(s)
        const total = sp.formats[0].players
        const lv = Math.max(0, Math.min(LEVELS.length - 2, ul - 1 + Math.floor(r * 3)))
        const levels = [LEVELS[lv].id, LEVELS[lv + 1].id]
        const filled = 1 + Math.floor(hash('f' + c.id + s + di) * (total - 1))
        const players = Array.from({ length: filled }, (_, k) => randomPlayer(c.id + s + di + k, levels))
        out.push({
          id: `om-${c.id}-${s}-${dayKey(d)}`, sport: s, clubId: c.id, date: dayKey(d),
          start: 8 + Math.floor(hash('st' + c.id + s + di) * 13), duration: 2, levels, players, total,
          price: c.price[s] * 2 / total,
        })
      })
    })
  })
  return out.sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.start - b.start)
}

// گیمیفیکیشن
export const RANKS = [
  { name: 'تازه‌وارد', xp: 0 },
  { name: 'گرم‌شده', xp: 150 },
  { name: 'رالی‌باز', xp: 400 },
  { name: 'اسمشر', xp: 800 },
  { name: 'استاد زمین', xp: 1400 },
  { name: 'افسانه', xp: 2200 },
]
export function rankOf(xp) {
  let i = 0
  while (i < RANKS.length - 1 && xp >= RANKS[i + 1].xp) i++
  const cur = RANKS[i], next = RANKS[i + 1]
  return { index: i, ...cur, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 }
}

export const BADGES = [
  { id: 'first', icon: '🎾', name: 'اولین سرو', desc: 'اولین رزروت رو انجام دادی' },
  { id: 'host', icon: '📣', name: 'بازی‌ساز', desc: 'یه بازی باز ساختی' },
  { id: 'full', icon: '🧩', name: 'تیم کامل', desc: 'همه جاهای خالی بازی پر شد' },
  { id: 'early', icon: '🌅', name: 'سحرخیز', desc: 'رزرو قبل از ساعت ۹ صبح' },
  { id: 'night', icon: '🌙', name: 'شب‌زنده‌دار', desc: 'رزرو بعد از ساعت ۲۱' },
  { id: 'multi', icon: '🌈', name: 'چندرشته‌ای', desc: 'دو رشته مختلف رو رزرو کردی' },
  { id: 'student', icon: '🧢', name: 'شاگرد', desc: 'اولین جلسه با مربی' },
  { id: 'champ', icon: '🏆', name: 'اهل رقابت', desc: 'ثبت‌نام در مسابقات' },
  { id: 'social', icon: '🤝', name: 'رفیق‌باز', desc: 'به بازی دیگران پیوستی' },
]

export const CREDITS = [
  'Unsplash — padel, tennis, pickleball & beach photos (Unsplash License)',
  'Nenad Stojković — padel courts aerial (CC BY 2.0, Wikimedia Commons)',
  'Anton Gustafsson — padel rackets and balls (CC BY 2.0, Wikimedia Commons)',
  'Samson Ssemakadde — padel court (CC0, Wikimedia Commons)',
  'Ainali — outdoor padel court Mariestad (CC BY-SA 4.0, Wikimedia Commons)',
  'SonSanchez — Beachtenis na Kapitolu (CC BY-SA 3.0, Wikimedia Commons)',
  'Giovanni from Catania — beach tennis (CC BY-SA 2.0, Wikimedia Commons)',
  'Kashtanskaya — Beach Tennis Play (CC BY-SA 4.0, Wikimedia Commons)',
]
