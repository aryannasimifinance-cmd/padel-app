// داده‌های نمونه — باشگاه‌ها، مربی‌ها، مسابقات و بازیکنان همه ساختگی هستند
const img = (n) => `./img/${n}.jpg`

export const SPORTS = [
  {
    id: 'padel', name: 'پدل', en: 'PADEL', color: '#3D5AFE', soft: '#E4E8FF',
    img: img('padel-hero'), alt: img('padel-aerial'),
    tagline: 'سریع، اجتماعی، همیشه چهار نفره',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }],
  },
  {
    id: 'tennis', name: 'تنیس', en: 'TENNIS', color: '#E2603A', soft: '#FCE6DD',
    img: img('tennis-player'), alt: img('tennis-courts'),
    tagline: 'کلاسیک، روی خاک یا هارد',
    formats: [{ id: 'singles', name: 'انفرادی', players: 2 }, { id: 'doubles', name: 'دونفره', players: 4 }],
  },
  {
    id: 'beach', name: 'تنیس ساحلی', en: 'BEACH TENNIS', color: '#E5A71E', soft: '#FCF0D2',
    img: img('beach-court'), alt: img('beach-sea'),
    tagline: 'پابرهنه روی شن، حس تابستان',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }, { id: 'singles', name: 'انفرادی', players: 2 }],
  },
  {
    id: 'pickle', name: 'پیکلبال', en: 'PICKLEBALL', color: '#17A866', soft: '#DAF4E7',
    img: img('pickleball'), alt: img('tennis-hard'),
    tagline: 'ساده برای شروع، اعتیادآور برای ادامه',
    formats: [{ id: 'doubles', name: 'دونفره', players: 4 }, { id: 'singles', name: 'انفرادی', players: 2 }],
  },
]
export const sportById = (id) => SPORTS.find((s) => s.id === id)

// سطوح مچ‌میکینگ — از بالاترین به پایین‌ترین
export const LEVELS = [
  { id: 'A', title: 'حرفه‌ای', desc: 'سابقه مسابقات رسمی، کنترل کامل همه ضربه‌ها', color: '#111311' },
  { id: 'B+', title: 'پیشرفته قوی', desc: 'تاکتیک تیمی، ضربه‌های تهاجمی قدرتمند', color: '#2B2D42' },
  { id: 'B', title: 'پیشرفته', desc: 'رالی‌های طولانی، بازی با زاویه و برنامه', color: '#3D5AFE' },
  { id: 'B-', title: 'نیمه‌پیشرفته', desc: 'ضربات ثابت، شروع بازی تاکتیکی', color: '#5C6BFF' },
  { id: 'C+', title: 'متوسط قوی', desc: 'رالی پیوسته، سرویس مطمئن', color: '#17A866' },
  { id: 'C', title: 'متوسط', desc: 'بازی منظم با چند ماه سابقه', color: '#3CC27F' },
  { id: 'C-', title: 'متوسط مبتدی', desc: 'ضربات پایه را بلدی ولی هنوز ناپایدار', color: '#E5A71E' },
  { id: 'D+', title: 'مبتدی با تجربه', desc: 'چند بار بازی کرده‌ای و قوانین را می‌دانی', color: '#EC8A2E' },
  { id: 'D', title: 'تازه‌کار', desc: 'تازه شروع کرده‌ای — خوش آمدی!', color: '#E2603A' },
]
export const levelIndex = (id) => LEVELS.findIndex((l) => l.id === id)
export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[5]
export const nearLevels = (id, k = 1) => { const i = levelIndex(id); return LEVELS.slice(Math.max(0, i - k), i + k + 1).map((l) => l.id) }
// تعیین سطح خودکار حداکثر تا B — سطح‌های بالاتر فقط با نتیجه‌ی مسابقه
export const QUIZ_LEVELS = LEVELS.slice(levelIndex('B'))
// سطح کاربر در هر رشته؛ برای حساب‌های قدیمی سطح کلی
export const levelOf = (user, sport) => user?.levels?.[sport] || user?.level || 'C'

// ---------- آزمون تعیین سطح: ۱۰ سؤال برای هر رشته، هر جواب ۰ تا ۳ امتیاز ----------
const exp = (n) => ({ q: `چند وقته ${n} بازی می‌کنی؟`, a: ['تازه شروع کردم', 'کمتر از ۶ ماه', '۶ ماه تا ۲ سال', 'بیشتر از ۲ سال'] })
const freq = { q: 'هفته‌ای چند بار بازی می‌کنی؟', a: ['کمتر از یه بار', 'یه بار', 'دو سه بار', 'بیشتر از سه بار'] }
const rally = { q: 'یه رالی ۱۰ ضربه‌ای رو نگه می‌داری؟', a: ['نه هنوز', 'گاهی', 'معمولاً', 'تقریباً همیشه'] }
const serve = { q: 'سرویست چطوره؟', a: ['خیلی وقتا خطا می‌شه', 'بیشتر وقتا می‌ره تو', 'مطمئن و با جهت', 'با پیچ و برنامه'] }
const partner = { q: 'با هم‌تیمی‌ات هماهنگ جابه‌جا می‌شی؟', a: ['هنوز نه', 'گاهی', 'بیشتر وقتا', 'همیشه، با هم حرف می‌زنیم'] }
const comp = { q: 'تجربه‌ی مسابقه داری؟', a: ['نه', 'دوستانه', 'باشگاهی', 'مسابقه‌ی رسمی'] }
const volley = { q: 'جلوی تور (والی) چطوری؟', a: ['ترجیح می‌دم عقب بمونم', 'والی ساده رو می‌زنم', 'والی رو کنترل می‌کنم', 'جلوی تور امتیاز می‌گیرم'] }

export const QUIZ = {
  padel: [
    exp('پدل'), freq,
    { q: 'توپی که از دیوار پشتی برمی‌گرده رو چطور می‌زنی؟', a: ['معمولاً از دستم در می‌ره', 'گاهی برمی‌گردونم', 'بیشتر وقتا برمی‌گردونم', 'راحت و با کنترل'] },
    rally, serve, volley,
    { q: 'لاب (توپ بلند) رو بلدی؟', a: ['نه', 'گاهی، اتفاقی', 'بیشتر وقتا عمیق می‌ره', 'با لاب تور رو پس می‌گیرم'] },
    { q: 'بندخا یا ویبورا می‌زنی؟', a: ['اسمشون رو نشنیدم', 'دارم یاد می‌گیرم', 'بندخا رو مطمئن می‌زنم', 'هر دو رو با کنترل'] },
    partner, comp,
  ],
  tennis: [
    exp('تنیس'), freq,
    { q: 'فورهندت چطوره؟', a: ['هنوز ناپایدار', 'توپ رو برمی‌گردونم', 'با جهت و عمق', 'با پیچ و قدرت'] },
    { q: 'بک‌هندت چطوره؟', a: ['ازش فرار می‌کنم', 'گاهی می‌ره تو', 'مطمئنه', 'مطمئن و تهاجمی'] },
    rally,
    { q: 'سرویس اول و دومت؟', a: ['زیاد دوبل‌فالت می‌دم', 'بیشتر وقتا می‌ره تو', 'سرویس دوم امن و با پیچ', 'با سرویس اول امتیاز می‌گیرم'] },
    { q: 'تاپ‌اسپین و اسلایس می‌زنی؟', a: ['فرقشون رو نمی‌دونم', 'دارم یاد می‌گیرم', 'بیشتر وقتا', 'هر کدوم رو هر وقت بخوام'] },
    volley,
    { q: 'جابه‌جایی پاهات (فوت‌وورک)؟', a: ['معمولاً دیر می‌رسم', 'توپ‌های نزدیک رو می‌رسم', 'بیشتر توپ‌ها رو می‌رسم', 'همیشه سر جای درستم'] },
    comp,
  ],
  beach: [
    exp('تنیس ساحلی'), freq,
    { q: 'توپ رو قبل از زمین خوردن نگه می‌داری؟', a: ['سخته برام', 'گاهی', 'معمولاً', 'راحت'] },
    { q: 'روی شن چطور جابه‌جا می‌شی؟', a: ['زود خسته می‌شم', 'کند ولی می‌رسم', 'راحت جابه‌جا می‌شم', 'سریع و سبک'] },
    { q: 'ضربه‌ی بالای سر (اسمش) می‌زنی؟', a: ['نمی‌زنم', 'گاهی', 'با قدرت', 'با قدرت و جهت'] },
    serve,
    { q: 'باد و آفتاب رو تو بازی مدیریت می‌کنی؟', a: ['خیلی اذیتم می‌کنه', 'کمی', 'بیشتر وقتا', 'ازش به نفع خودم استفاده می‌کنم'] },
    rally, partner, comp,
  ],
  pickle: [
    exp('پیکلبال'), freq,
    { q: 'دینک (ضربه‌ی آروم نزدیک تور) رو بلدی؟', a: ['نمی‌دونم چیه', 'دارم یاد می‌گیرم', 'بیشتر وقتا کنترلش می‌کنم', 'رالی دینک طولانی رو می‌برم'] },
    { q: 'قانون «کیچن» رو رعایت می‌کنی؟', a: ['هنوز قاطی می‌کنم', 'بیشتر وقتا', 'همیشه', 'ازش تاکتیکی استفاده می‌کنم'] },
    { q: 'ضربه‌ی سوم (درآپ) می‌زنی؟', a: ['نه', 'گاهی', 'معمولاً', 'مطمئن'] },
    { q: 'سرویس و برگردوندن سرویس؟', a: ['هنوز ناپایدار', 'بیشتر وقتا خوبه', 'عمیق و مطمئن', 'با برنامه و جهت'] },
    volley, rally, partner, comp,
  ],
}
// امتیاز ۰ تا ۳۰ → از D تا B (بالاتر از B نمی‌رود)
export function quizLevel(score, max = 30) {
  const steps = QUIZ_LEVELS.length - 1
  return QUIZ_LEVELS[steps - Math.round((Math.min(score, max) / max) * steps)].id
}

// ---------- شهرها و ناحیه‌ها (مختصات تقریبی محله‌ها) ----------
export const CITIES = [
  { id: 'tehran', name: 'تهران', center: [35.735, 51.395], zoom: 11 },
  { id: 'karaj', name: 'کرج', center: [35.805, 50.955], zoom: 12 },
]
export const cityById = (id) => CITIES.find((c) => c.id === id)
export const REGIONS = [
  { id: 'north', city: 'tehran', name: 'شمال', center: [35.802, 51.445], r: 3600 },
  { id: 'west', city: 'tehran', name: 'غرب', center: [35.758, 51.305], r: 5200 },
  { id: 'center', city: 'tehran', name: 'مرکز', center: [35.722, 51.41], r: 3400 },
  { id: 'east', city: 'tehran', name: 'شرق', center: [35.75, 51.515], r: 4000 },
  { id: 'south', city: 'tehran', name: 'جنوب', center: [35.657, 51.4], r: 3600 },
  { id: 'mehrshahr', city: 'karaj', name: 'مهرشهر', center: [35.817, 50.905], r: 2300 },
  { id: 'gohardasht', city: 'karaj', name: 'گوهردشت', center: [35.845, 50.955], r: 2000 },
  { id: 'azimieh', city: 'karaj', name: 'عظیمیه', center: [35.846, 51.006], r: 1900 },
  { id: 'fardis', city: 'karaj', name: 'فردیس', center: [35.727, 50.985], r: 2300 },
]
export const regionById = (id) => REGIONS.find((r) => r.id === id)

// courts: تعداد زمین هر رشته، price: هر ساعت کل زمین در ساعت عادی
export const CLUBS = [
  { id: 'c1', name: 'باشگاه آبی‌نیلی', city: 'tehran', region: 'west', area: 'سعادت‌آباد', at: [35.781, 51.376], courts: { padel: 4, tennis: 2 }, price: { padel: 900000, tennis: 700000 }, rating: 4.9, reviews: 312, indoor: true, img: img('padel-hero'), amenities: ['سرپوشیده', 'پارکینگ', 'کافه', 'رختکن'] },
  { id: 'c2', name: 'کلاب شیشه‌ای', city: 'tehran', region: 'west', area: 'چیتگر', at: [35.742, 51.215], courts: { padel: 6 }, price: { padel: 800000 }, rating: 4.7, reviews: 204, indoor: true, img: img('padel-indoor'), amenities: ['سرپوشیده', 'اجاره راکت', 'دوش'] },
  { id: 'c3', name: 'آکادمی خاک‌رس', city: 'tehran', region: 'north', area: 'نیاوران', at: [35.812, 51.47], courts: { tennis: 5 }, price: { tennis: 850000 }, rating: 4.8, reviews: 188, indoor: false, img: img('tennis-clay'), amenities: ['زمین خاک', 'مربی', 'کافه'] },
  { id: 'c4', name: 'ساحل شنی', city: 'tehran', region: 'west', area: 'دریاچه چیتگر', at: [35.752, 51.195], courts: { beach: 4 }, price: { beach: 600000 }, rating: 4.6, reviews: 97, indoor: false, img: img('beach-court'), amenities: ['شن ساحلی', 'دوش', 'نور شب'] },
  { id: 'c5', name: 'پیکل‌هاوس', city: 'tehran', region: 'center', area: 'یوسف‌آباد', at: [35.731, 51.402], courts: { pickle: 4, padel: 2 }, price: { pickle: 450000, padel: 850000 }, rating: 4.8, reviews: 156, indoor: true, img: img('pickleball'), amenities: ['سرپوشیده', 'اجاره راکت', 'کافه'] },
  { id: 'c6', name: 'باغ راکت', city: 'tehran', region: 'east', area: 'لویزان', at: [35.772, 51.505], courts: { tennis: 3, padel: 3, pickle: 3 }, price: { tennis: 650000, padel: 750000, pickle: 400000 }, rating: 4.5, reviews: 141, indoor: false, img: img('padel-aerial'), amenities: ['فضای سبز', 'پارکینگ', 'رختکن'] },
  { id: 'c7', name: 'سنترکورت', city: 'tehran', region: 'east', area: 'پاسداران', at: [35.768, 51.465], courts: { tennis: 4 }, price: { tennis: 780000 }, rating: 4.7, reviews: 120, indoor: false, img: img('tennis-courts'), amenities: ['هارد کورت', 'نور شب', 'پارکینگ'] },
  { id: 'c8', name: 'اسپین‌پارک', city: 'tehran', region: 'north', area: 'زعفرانیه', at: [35.801, 51.415], courts: { padel: 3, beach: 2 }, price: { padel: 950000, beach: 650000 }, rating: 4.9, reviews: 266, indoor: false, img: img('padel-outdoor'), amenities: ['روف‌تاپ', 'کافه', 'دوش'] },
  { id: 'c9', name: 'ونک اسپرت', city: 'tehran', region: 'center', area: 'ونک', at: [35.758, 51.41], courts: { padel: 3, pickle: 2 }, price: { padel: 880000, pickle: 420000 }, rating: 4.6, reviews: 88, indoor: true, img: img('padel-racket'), amenities: ['سرپوشیده', 'مترو نزدیک', 'کافه'] },
  { id: 'c10', name: 'تهرانپارس کلاب', city: 'tehran', region: 'east', area: 'تهرانپارس', at: [35.735, 51.545], courts: { padel: 4, tennis: 2 }, price: { padel: 700000, tennis: 600000 }, rating: 4.4, reviews: 73, indoor: true, img: img('padel-indoor'), amenities: ['سرپوشیده', 'پارکینگ', 'دوش'] },
  { id: 'c11', name: 'جنوب کورت', city: 'tehran', region: 'south', area: 'نازی‌آباد', at: [35.648, 51.405], courts: { tennis: 3, pickle: 2 }, price: { tennis: 480000, pickle: 320000 }, rating: 4.3, reviews: 54, indoor: false, img: img('tennis-hard'), amenities: ['هارد کورت', 'نور شب'] },
  { id: 'c12', name: 'شهرک کورت', city: 'tehran', region: 'west', area: 'شهرک غرب', at: [35.762, 51.362], courts: { tennis: 3, padel: 2 }, price: { tennis: 820000, padel: 920000 }, rating: 4.8, reviews: 175, indoor: false, img: img('tennis-shadow'), amenities: ['فضای سبز', 'مربی', 'کافه'] },
  { id: 'k1', name: 'پدل‌پوینت', city: 'karaj', region: 'mehrshahr', area: 'مهرشهر', at: [35.818, 50.908], courts: { padel: 4, pickle: 2 }, price: { padel: 600000, pickle: 350000 }, rating: 4.7, reviews: 110, indoor: true, img: img('padel-racket'), amenities: ['سرپوشیده', 'اجاره راکت', 'پارکینگ'] },
  { id: 'k2', name: 'باشگاه سبز', city: 'karaj', region: 'gohardasht', area: 'گوهردشت', at: [35.846, 50.952], courts: { tennis: 4 }, price: { tennis: 500000 }, rating: 4.5, reviews: 82, indoor: false, img: img('tennis-shadow'), amenities: ['هارد کورت', 'مربی', 'رختکن'] },
  { id: 'k3', name: 'شن‌زار', city: 'karaj', region: 'azimieh', area: 'عظیمیه', at: [35.847, 51.004], courts: { beach: 3, padel: 2 }, price: { beach: 450000, padel: 650000 }, rating: 4.6, reviews: 69, indoor: false, img: img('beach-play'), amenities: ['شن ساحلی', 'نور شب', 'کافه'] },
  { id: 'k4', name: 'کورت‌لند', city: 'karaj', region: 'fardis', area: 'فردیس', at: [35.726, 50.982], courts: { tennis: 3, pickle: 2, padel: 3 }, price: { tennis: 480000, pickle: 320000, padel: 580000 }, rating: 4.4, reviews: 61, indoor: true, img: img('tennis-hard'), amenities: ['سرپوشیده', 'پارکینگ', 'دوش'] },
]
export const clubById = (id) => CLUBS.find((c) => c.id === id)
export const clubSports = (club) => SPORTS.filter((s) => club.courts[s.id])
export const courtsOf = (club, sport) => Array.from({ length: club.courts[sport] || 0 }, (_, k) => ({
  id: k + 1, name: `زمین ${fa(k + 1)}`, kind: club.indoor ? (k % 3 === 2 ? 'روباز' : 'سرپوشیده') : 'روباز',
}))
export const clubsIn = (city, sport, region) => CLUBS.filter((c) => c.city === city && (!sport || c.courts[sport]) && (!region || c.region === region))

export const COACHES = [
  { id: 'm1', name: 'کاوه رحیمی', sports: ['padel'], level: 'A', exp: 9, rating: 4.9, price: 1800000, clubs: ['c1', 'c2', 'c5', 'c9'], bio: 'مربی درجه یک فدراسیون، متخصص بازی کنار دیوار' },
  { id: 'm2', name: 'نازنین فرهی', sports: ['tennis'], level: 'A', exp: 12, rating: 5.0, price: 2000000, clubs: ['c3', 'c7', 'c12'], bio: 'قهرمان سابق کشور، آموزش تکنیک و فوت‌وورک' },
  { id: 'm3', name: 'آرش کیانی', sports: ['padel', 'pickle'], level: 'B+', exp: 5, rating: 4.7, price: 1200000, clubs: ['c5', 'c6', 'c9', 'k1', 'c10'], bio: 'صبور و دقیق؛ مخصوص شروع از صفر' },
  { id: 'm4', name: 'شیدا مقدم', sports: ['beach'], level: 'A', exp: 7, rating: 4.8, price: 1400000, clubs: ['c4', 'c8', 'k3'], bio: 'عضو تیم ملی تنیس ساحلی' },
  { id: 'm5', name: 'بهراد صالحی', sports: ['tennis'], level: 'B+', exp: 6, rating: 4.6, price: 1100000, clubs: ['k2', 'k4', 'c6', 'c10', 'c11'], bio: 'برنامه تمرینی شخصی و آنالیز ویدیویی' },
  { id: 'm6', name: 'ترانه نوری', sports: ['padel', 'beach'], level: 'B+', exp: 4, rating: 4.8, price: 1300000, clubs: ['c8', 'k3', 'k1', 'c12', 'k4'], bio: 'کلاس‌های گروهی پرانرژی برای بانوان و آقایان' },
  { id: 'm7', name: 'مانی اصلانی', sports: ['pickle', 'tennis'], level: 'B', exp: 3, rating: 4.5, price: 900000, clubs: ['c5', 'k4', 'c7', 'c11', 'c6'], bio: 'مربی جوان، تمرکز روی بازی دونفره' },
]
export const coachById = (id) => COACHES.find((m) => m.id === id)
export const coachesAt = (club, sport) => COACHES.filter((m) => m.clubs.includes(club.id) && m.sports.includes(sport))

// تعداد جلسه — رزرو زمین تکی یا پکیج هفتگی
export const SERIES = [
  { id: 'single', name: 'تک جلسه', sessions: 1, off: 0 },
  { id: 'p5', name: 'پکیج ۵ جلسه', sessions: 5, off: 0.1, tag: '۱۰٪ تخفیف' },
  { id: 'p10', name: 'پکیج ۱۰ جلسه', sessions: 10, off: 0.15, tag: '۱۵٪ تخفیف' },
]
export const COACH_PACKS = [
  { id: 'one', name: 'تک جلسه', sessions: 1, off: 0 },
  { id: 'five', name: '۵ جلسه', sessions: 5, off: 0.1, tag: '۱۰٪ تخفیف' },
  { id: 'ten', name: '۱۰ جلسه', sessions: 10, off: 0.15, tag: '۱۵٪ تخفیف' },
  { id: 'group', name: 'گروهی ۴ نفره', sessions: 1, off: 0, mult: 0.4, tag: 'هر نفر' },
]
export const coachPackPrice = (coach, pack) => Math.round(coach.price * pack.sessions * (1 - pack.off) * (pack.mult || 1) / 10000) * 10000

export const DAYPARTS = [
  { id: 'any', name: 'هر ساعتی', from: 7, to: 24 },
  { id: 'morning', name: 'صبح', from: 7, to: 12 },
  { id: 'noon', name: 'ظهر', from: 12, to: 17 },
  { id: 'evening', name: 'عصر', from: 17, to: 21 },
  { id: 'night', name: 'شب', from: 21, to: 24 },
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
export const FRIENDS = Array.from({ length: 10 }, (_, k) => randomPlayer('friend' + k))

// تعداد بازیکنان فعال هر سطح در هر شهر — برای نمایش «اعلان برای X نفر ارسال شد»
export function poolSize(sport, city, levelIds) {
  return levelIds.reduce((sum, l) => sum + 12 + Math.floor(hash(sport + city + l) * 70), 0)
}

// ---------- تاریخ و زمان ----------
export function nextDays(n = 14) {
  const out = []
  const base = new Date(); base.setHours(0, 0, 0, 0)
  for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() + i); out.push(d) }
  return out
}
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
export const todayKey = () => dayKey(new Date())
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dayKey(d) }
const wd = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' })
const dm = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
const dn = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' })
export const weekday = (d) => wd.format(d)
export const dayNum = (d) => dn.format(d)
export const dayMonth = (d) => dm.format(d)
export function dayLabel(d) {
  if (typeof d === 'string') d = fromKey(d)
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const diff = Math.round((d - t) / 864e5)
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'فردا'
  return weekday(d)
}
export const isWeekend = (d) => { if (typeof d === 'string') d = fromKey(d); return d.getDay() === 4 || d.getDay() === 5 }

export const fa = (n) => Number(n).toLocaleString('fa-IR')
export const toman = (n) => fa(Math.round(n / 1000) * 1000) + ' تومان'
export const short = (n) => (n >= 1e6 ? fa(+(n / 1e6).toFixed(2)) + ' میلیون' : fa(Math.round(n / 1000)) + ' هزار')
export function hourLabel(h) {
  const hh = Math.floor(h) % 24, mm = h % 1 ? '۳۰' : '۰۰'
  return `${fa(hh).padStart(2, '۰')}:${mm}`
}
export const range = (s, d) => `${hourLabel(s)}–${hourLabel(s + d)}`

// ---------- قیمت و ظرفیت زمین ----------
export const isPeak = (date, h) => isWeekend(date) || h >= 17
export const priceAt = (club, sport, date, h) => Math.round(club.price[sport] * (isPeak(date, h) ? 1.2 : 1) / 10000) * 10000
export function priceFor(club, sport, date, start, dur) {
  let sum = 0
  for (let h = start; h < start + dur; h++) sum += priceAt(club, sport, date, h)
  return sum
}
// رزروهای ساختگی دیگران؛ عصرها شلوغ‌ترند
export const seededBusy = (club, sport, court, date, h) => hash(`${club.id}|${sport}|${court}|${date}|${h}`) < (h >= 17 && h < 22 ? 0.5 : 0.3)

// مسابقات — آخر هفته (دوستانه) و رسمی (رنکینگ‌دار)
export const EVENT_KIND = {
  weekend: { name: 'مسابقات آخر هفته', sub: 'امریکانو و میکسینو — هر دور با یار جدید، کلی بازی در یک عصر' },
  official: { name: 'تورنمنت‌های رسمی', sub: 'گروهی + حذفی، امتیاز رنکینگ و جایزه نقدی' },
}
const WEEKEND_FORMATS = ['امریکانو', 'میکسینو', 'کینگ آف کورت']
const OFFICIAL_NAMES = ['جام پاییزه', 'تور رنکینگ', 'اوپن تهران', 'جام باشگاه‌ها']
export function tournaments(kind, sport, city, clubId) {
  const days = nextDays(28).filter((d) => (kind === 'weekend' ? isWeekend(d) : d.getDay() === 5))
  const clubs = CLUBS.filter((c) => c.city === city && c.courts[sport] && (!clubId || c.id === clubId))
  const list = []
  days.forEach((d, i) => {
    clubs.forEach((c, j) => {
      const r = hash(kind + sport + c.id + dayKey(d))
      if (r > (kind === 'weekend' ? 0.5 : 0.75)) return
      const start = kind === 'weekend' ? 16 + Math.floor(r * 4) : 9
      if (i === 0 && dayKey(d) === todayKey() && start <= new Date().getHours()) return
      const cap = kind === 'weekend' ? 16 : 32
      const lvlStart = 2 + Math.floor(hash('lv' + c.id + i) * 5)
      list.push({
        id: `t-${kind}-${sport}-${c.id}-${dayKey(d)}`,
        kind, sport, clubId: c.id, date: dayKey(d),
        title: kind === 'weekend'
          ? `${WEEKEND_FORMATS[Math.floor(r * 30) % 3]} ${weekday(d)}`
          : `${OFFICIAL_NAMES[(i + j) % OFFICIAL_NAMES.length]} ${sportById(sport).name}`,
        format: kind === 'weekend' ? WEEKEND_FORMATS[Math.floor(r * 30) % 3] : 'گروهی + حذفی',
        start,
        levels: LEVELS.slice(lvlStart, lvlStart + (kind === 'weekend' ? 3 : 2)).map((l) => l.id),
        cap, taken: Math.floor(cap * (0.3 + hash('tk' + c.id + i) * 0.6)),
        fee: kind === 'weekend' ? 450000 + Math.floor(r * 4) * 50000 : 1200000 + Math.floor(r * 5) * 100000,
        prize: kind === 'weekend' ? 'جوایز نقدی + راکت' : `${fa(30 + Math.floor(r * 70))} میلیون تومان`,
        img: kind === 'weekend' ? img('tennis-fun') : img('ball-space'),
      })
    })
  })
  return list.sort((a, b) => fromKey(a.date) - fromKey(b.date))
}

// بازی‌های باز دیگران — برای فید خانه و مرحله‌ی «پیوستن»
export function openMatches({ city, sport, date, level, clubId }) {
  const ul = levelIndex(level)
  const days = date ? [fromKey(date)] : nextDays(5)
  const now = new Date()
  const out = []
  CLUBS.filter((c) => c.city === city && (!clubId || c.id === clubId)).forEach((c) => {
    Object.keys(c.courts).filter((s) => !sport || s === sport).forEach((s) => {
      days.forEach((d) => {
        const k = dayKey(d)
        for (let slot = 0; slot < 2; slot++) {
          const r = hash('om' + c.id + s + k + slot)
          if (r > 0.42) continue
          const start = 8 + Math.floor(hash('st' + c.id + s + k + slot) * 14)
          if (k === todayKey() && start <= now.getHours()) continue
          const total = sportById(s).formats[0].players
          const lv = Math.max(2, Math.min(LEVELS.length - 2, ul - 1 + Math.floor(r * 3.2)))
          const levels = [LEVELS[lv].id, LEVELS[lv + 1].id]
          const filled = 1 + Math.floor(hash('f' + c.id + s + k + slot) * (total - 1))
          const players = Array.from({ length: filled }, (_, j) => randomPlayer(c.id + s + k + slot + j, levels))
          const price = priceFor(c, s, k, start, 2)
          out.push({
            id: `om-${c.id}-${s}-${k}-${slot}`, sport: s, clubId: c.id, date: k, court: 1 + (slot % c.courts[s]),
            start, dur: 2, levels, players, total, price, share: price / total,
            gap: Math.min(...levels.map((l) => Math.abs(levelIndex(l) - ul))),
          })
        }
      })
    })
  })
  return out.sort((a, b) => fromKey(a.date) - fromKey(b.date) || a.gap - b.gap || a.start - b.start)
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
  { id: 'loyal', icon: '📦', name: 'پایه‌ثابت', desc: 'پکیج چندجلسه‌ای گرفتی' },
  { id: 'explorer', icon: '🗺', name: 'جهانگرد', desc: 'در دو باشگاه مختلف رزرو کردی' },
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
  'Map data and tiles © OpenStreetMap contributors (ODbL)',
]
