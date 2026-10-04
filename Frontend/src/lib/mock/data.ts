/**
 * Mock seed content: doctors, patients and session-note templates.
 * Only used when USE_MOCK is true. Safe to delete once the backend is live.
 */

export interface Topic {
  title: string
  excerpt: string
  summary: string
  discussed: string[]
  quote: string
  meds: [string, string, string][]
  plan: string[]
  followUps: { text: string; done: boolean }[]
}

export const TOPICS: Topic[] = [
  {
    title: 'Sleep, stress and a gentler evening routine',
    excerpt: 'Restless nights linked to late work; a calmer wind-down agreed.',
    summary:
      'We talked about the past three weeks of broken sleep. Most nights you fall asleep easily but wake around 3 a.m. and find it hard to settle. Work has been unusually demanding, and screens have crept later into the evening.',
    discussed: [
      'Waking between **2 and 4 a.m.** most nights, roughly five nights a week',
      'Caffeine after 2 p.m. on busy days, usually two cups',
      'No snoring or breathing pauses reported by your partner',
      'Mood is steady overall, with some evening worry about work',
    ],
    quote: 'Protect the last hour of the day. It belongs to you, not to your inbox.',
    meds: [
      ['Magnesium glycinate', '200 mg', 'Evening, with food'],
      ['Melatonin (short course)', '1 mg', '60 min before bed, 2 weeks only'],
    ],
    plan: [
      'Keep a simple sleep diary for 14 days (bedtime, wake time, wakings)',
      'Last caffeine before **1 p.m.**',
      'Screens off 45 minutes before bed; reading or a short walk instead',
      'Same wake-up time every day, including weekends',
    ],
    followUps: [
      { text: 'Start the sleep diary tonight', done: true },
      { text: 'Book a follow-up in three weeks', done: false },
      { text: 'Try the breathing exercise we practised (4–7–8)', done: false },
    ],
  },
  {
    title: 'Blood pressure review',
    excerpt: 'Home readings improving; continuing current dose with a lighter salt plan.',
    summary:
      'Your home readings over the last month have come down nicely, averaging **132/84**, compared with 146/92 at our last visit. You have been walking most days and cooking at home more often.',
    discussed: [
      'Home readings taken mornings and evenings, seated, after five minutes rest',
      'One mild headache last week, no dizziness or chest discomfort',
      'Salt intake is lower, but takeaway meals twice a week remain',
      'Ankle swelling has not returned',
    ],
    quote: 'Small daily choices are doing more for your heart than any single tablet.',
    meds: [
      ['Amlodipine', '5 mg', 'Once daily, morning'],
      ['Aspirin', '—', 'Not needed at this stage'],
    ],
    plan: [
      'Continue amlodipine at the same dose',
      'Aim for **150 minutes** of brisk walking per week',
      'Swap one takeaway meal for a home-cooked one',
      'Blood test for kidney function and cholesterol before next visit',
    ],
    followUps: [
      { text: 'Blood test at the clinic lab (fasting)', done: false },
      { text: 'Send home readings in four weeks', done: false },
      { text: 'Collect repeat prescription', done: true },
    ],
  },
  {
    title: 'Knee recovery after arthroscopy',
    excerpt: 'Healing well at six weeks; physiotherapy to progress to strength work.',
    summary:
      'Six weeks after your right knee arthroscopy, the wounds have healed cleanly and the swelling is much reduced. You can now climb stairs normally, though kneeling remains uncomfortable.',
    discussed: [
      'Pain is **2 out of 10** at rest, 4 after long walks',
      'Full straightening of the knee; bending to about 120°',
      'Some stiffness first thing in the morning, easing within 20 minutes',
      'No fever, redness or calf pain',
    ],
    quote: 'Your knee is ready to be trusted a little more each week.',
    meds: [
      ['Ibuprofen', '400 mg', 'With food, only if needed'],
      ['Paracetamol', '1 g', 'Up to four times daily, if needed'],
    ],
    plan: [
      'Progress physiotherapy to strengthening (quads and glutes)',
      'Cycling on a stationary bike is encouraged',
      'Avoid running and deep squats for another four weeks',
      'Ice for 15 minutes after exercise if swollen',
    ],
    followUps: [
      { text: 'Book three physiotherapy sessions', done: true },
      { text: 'Review at the 12-week mark', done: false },
    ],
  },
  {
    title: 'Understanding your migraines',
    excerpt: 'Patterns around sleep and skipped meals; a preventive plan to try.',
    summary:
      'You have had four migraines this month, each lasting most of a day. Looking at your notes together, they tend to follow short nights or long gaps between meals.',
    discussed: [
      'Throbbing pain on the left side with sensitivity to light',
      'Visual aura before two of the four episodes',
      'Rescue medication helps if taken early',
      'No new neurological symptoms between attacks',
    ],
    quote: 'We are looking for your pattern, not a perfect day.',
    meds: [
      ['Sumatriptan', '50 mg', 'At the start of a migraine, max 2 per day'],
      ['Propranolol', '40 mg', 'Twice daily, preventive (trial)'],
    ],
    plan: [
      'Keep a headache diary with sleep, meals and triggers',
      'Regular meals, no longer than **four hours** apart',
      'Trial preventive treatment for eight weeks',
      'Seek urgent care for a sudden, severe or unusual headache',
    ],
    followUps: [
      { text: 'Start the headache diary', done: true },
      { text: 'Review in eight weeks', done: false },
      { text: 'Eye test with an optician', done: false },
    ],
  },
  {
    title: 'Annual wellness review',
    excerpt: 'A calm, healthy year; screening and vaccinations brought up to date.',
    summary:
      'A good year overall. Your weight, blood pressure and bloods are all within healthy ranges. We went through screening and vaccinations and agreed a few small goals for the year ahead.',
    discussed: [
      'Blood pressure **118/76**, resting heart rate 64',
      'Cholesterol and blood sugar within the normal range',
      'Exercise: yoga twice weekly and weekend hikes',
      'Alcohol: around six units per week',
    ],
    quote: 'Nothing to fix today. Just keep doing what is working.',
    meds: [['Vitamin D', '1000 IU', 'Daily, October to March']],
    plan: [
      'Flu vaccination this month',
      'Cervical screening is due in the spring',
      'Add one strength session per week',
    ],
    followUps: [
      { text: 'Flu vaccination', done: false },
      { text: 'Next annual review in twelve months', done: false },
    ],
  },
  {
    title: 'Asthma check and inhaler technique',
    excerpt: 'Better control since the spacer; reliever use down to once a week.',
    summary:
      'Your asthma is much better controlled since we added a spacer. You now use your reliever inhaler about once a week, down from daily, and have not woken at night with symptoms.',
    discussed: [
      'Peak flow is **92%** of your personal best',
      'Mild wheeze with cold air on morning runs',
      'Inhaler technique reviewed and looks excellent',
      'No courses of steroids needed since our last visit',
    ],
    quote: 'Your lungs are telling us the plan is working.',
    meds: [
      ['Beclometasone (preventer)', '100 mcg', 'Two puffs, twice daily'],
      ['Salbutamol (reliever)', '100 mcg', 'As needed'],
    ],
    plan: [
      'Continue preventer every day, even when well',
      'Use reliever 15 minutes before cold-weather runs',
      'Updated written asthma action plan given',
    ],
    followUps: [
      { text: 'Keep the action plan on the fridge', done: true },
      { text: 'Annual asthma review', done: false },
    ],
  },
  {
    title: 'Thyroid results and next steps',
    excerpt: 'Mildly underactive thyroid; starting a low dose and rechecking in six weeks.',
    summary:
      'Your blood test shows a mildly underactive thyroid, which may explain the tiredness, feeling cold and dry skin you described. This is common and very treatable.',
    discussed: [
      'TSH is raised at **7.8** with a low-normal T4',
      'Tiredness most afternoons for about three months',
      'Weight up by two kilograms over the same period',
      'No family history of thyroid conditions',
    ],
    quote: 'This explains a lot, and it is something we can steady together.',
    meds: [['Levothyroxine', '25 mcg', 'Every morning, 30 min before breakfast']],
    plan: [
      'Start levothyroxine and take it on an empty stomach',
      'Keep it apart from iron or calcium supplements by four hours',
      'Repeat blood test in six weeks to adjust the dose',
    ],
    followUps: [
      { text: 'Collect prescription', done: true },
      { text: 'Blood test in six weeks', done: false },
    ],
  },
  {
    title: 'Fatigue and iron levels',
    excerpt: 'Low ferritin found; iron supplements and diet changes agreed.',
    summary:
      'Your recent bloods show low iron stores (ferritin **11**), which fits with the fatigue and breathlessness on stairs you have noticed. Heavy periods are the likely cause.',
    discussed: [
      'Energy dips in the afternoon, needing to sit down',
      'Hair shedding more than usual',
      'Diet is mostly vegetarian',
      'Periods heavier over the past year',
    ],
    quote: 'Rebuilding iron takes a little patience. You should feel the difference within weeks.',
    meds: [
      ['Ferrous fumarate', '210 mg', 'Once daily, with orange juice'],
      ['Tranexamic acid', '1 g', 'Three times daily during heavy days'],
    ],
    plan: [
      'Iron supplements for three months',
      'Add iron-rich foods: lentils, spinach, fortified cereal',
      'Avoid tea and coffee within an hour of the tablet',
      'Pelvic ultrasound to look at the cause of heavy periods',
    ],
    followUps: [
      { text: 'Ultrasound appointment', done: false },
      { text: 'Repeat bloods in eight weeks', done: false },
    ],
  },
  {
    title: 'Lower back pain after lifting',
    excerpt: 'Muscular strain with no warning signs; staying active is the best medicine.',
    summary:
      'You strained your lower back moving furniture last weekend. The examination today points to a muscular strain. There are no signs of nerve involvement.',
    discussed: [
      'Pain across the lower back, worse when bending',
      'No pain, numbness or tingling down the legs',
      'No bladder or bowel changes',
      'Sleeping is uncomfortable but possible on your side',
    ],
    quote: 'Gentle movement heals backs faster than rest.',
    meds: [
      ['Naproxen', '250 mg', 'Twice daily with food, up to 5 days'],
      ['Heat pack', '—', '20 minutes, a few times a day'],
    ],
    plan: [
      'Keep moving: short walks every couple of hours',
      'Gentle stretches shown in clinic, twice daily',
      'Return to work with lighter duties this week',
    ],
    followUps: [
      { text: 'Stretches twice daily', done: false },
      { text: 'Return if pain spreads to the legs or does not ease in 4 weeks', done: false },
    ],
  },
  {
    title: 'Cholesterol and a heart-healthy plan',
    excerpt: 'Raised LDL; three months of lifestyle changes before considering statins.',
    summary:
      'Your cholesterol is moderately raised (LDL **4.1 mmol/L**). Your overall heart risk score is low-to-moderate, so we agreed to start with diet and activity and recheck in three months.',
    discussed: [
      'Family history: father had a heart attack at 61',
      'Breakfast is often pastries; lunch is usually a sandwich',
      'Walking about 4,000 steps a day',
      'Non-smoker, light alcohol',
    ],
    quote: 'Three months of good habits will tell us a great deal.',
    meds: [['None for now', '—', 'Review statins after repeat test']],
    plan: [
      'Oats or wholegrain breakfast most days',
      'Oily fish twice a week; a handful of nuts daily',
      'Build up to **8,000 steps** a day',
      'Repeat fasting cholesterol in three months',
    ],
    followUps: [
      { text: 'Repeat fasting lipid test', done: false },
      { text: 'Try the Mediterranean recipes leaflet', done: true },
    ],
  },
]

export function buildMarkdown(topic: Topic, opts: { patientName: string; doctorName: string; date: Date }): string {
  const { patientName, doctorName, date } = opts
  const first = patientName.split(' ')[0]
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `## In brief

${topic.summary}

## What we discussed

${topic.discussed.map((d) => `- ${d}`).join('\n')}

> ${topic.quote}
>
> — ${doctorName}

## Medication

| Medicine | Dose | When |
|---|---|---|
${topic.meds.map(([m, d, w]) => `| ${m} | ${d} | ${w} |`).join('\n')}

## The plan

${topic.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Before we meet again

${topic.followUps.map((f) => `- [${f.done ? 'x' : ' '}] ${f.text}`).join('\n')}

---

*${first}, if anything changes or you are worried before your next visit, please contact the clinic. This note was prepared on ${dateStr} from your consultation with ${doctorName}.*
`
}

export const SEED_DOCTORS = [
  {
    id: 'doc_1',
    name: 'Dr. Amara Whitfield',
    doctorId: 'DR-2048',
    password: 'continuo',
    specialty: 'General Practice',
    email: 'a.whitfield@continuo.health',
  },
  {
    id: 'doc_2',
    name: 'Dr. Julian Ashby',
    doctorId: 'DR-3117',
    password: 'continuo',
    specialty: 'Cardiology',
    email: 'j.ashby@continuo.health',
  },
  {
    id: 'doc_3',
    name: 'Dr. Selin Kaya',
    doctorId: 'DR-4402',
    password: 'continuo',
    specialty: 'Dermatology',
    email: 's.kaya@continuo.health',
  },
  {
    id: 'doc_4',
    name: 'Dr. Mateo Rinaldi',
    doctorId: 'DR-5590',
    password: 'continuo',
    specialty: 'Orthopaedics',
    email: 'm.rinaldi@continuo.health',
  },
]

export const SEED_PATIENTS: { id: string; name: string; sessions: number }[] = [
  { id: 'PT-48213', name: 'Eleanor Hart', sessions: 6 },
  { id: 'PT-51907', name: 'Samuel Okafor', sessions: 4 },
  { id: 'PT-36624', name: 'Isabelle Moreau', sessions: 5 },
  { id: 'PT-70185', name: 'Theo Lindqvist', sessions: 2 },
  { id: 'PT-29340', name: 'Priya Raman', sessions: 3 },
  { id: 'PT-63318', name: 'Henry Caldwell', sessions: 4 },
  { id: 'PT-84052', name: 'Aisha Rahman', sessions: 2 },
  { id: 'PT-17763', name: 'Lucas Ferreira', sessions: 3 },
  { id: 'PT-55471', name: 'Margaret Ellison', sessions: 7 },
  { id: 'PT-90826', name: 'Noor Haddad', sessions: 1 },
  { id: 'PT-42697', name: 'Oliver Brandt', sessions: 2 },
  { id: 'PT-38154', name: 'Clara Montague', sessions: 3 },
  { id: 'PT-76540', name: 'Yusuf Demir', sessions: 2 },
  { id: 'PT-11208', name: 'Hannah Brooks', sessions: 0 },
]

export const ADMIN_CREDENTIALS = { username: 'admin', password: 'continuo' }
