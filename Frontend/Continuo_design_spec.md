# Continuo — Website Design & Build Specification

**Audience:** React.js developer
**Product:** Continuo, a clinical session companion for doctors. The doctor records or uploads a consultation, and Continuo turns it into a clean markdown session note that the patient can later read.
**Brand promise:** *Every conversation, continued.*
**Design goal:** Aesthetic and luxury. It should feel like a private clinic's concierge, not a SaaS dashboard. Calm, quiet, expensive, unhurried.

---

## 1. Design Philosophy

1. **Quiet luxury.** Generous whitespace, restrained palette, large serif headlines, hairline borders, almost no shadows. Luxury comes from restraint.
2. **Warm, not clinical.** No hospital blue and no stock stethoscope imagery. Think boutique hotel meets private library.
3. **Slow, soft motion.** Animations ease in over 600–900ms with long, gentle curves. Nothing bounces or snaps.
4. **Typography leads.** Layout is built from type and space first, imagery second.
5. **Trust cues.** Privacy language, lock icons and calm microcopy appear wherever the user is asked for something sensitive (IDs, audio).

---

## 2. Color System

Define as CSS variables in `src/styles/tokens.css` and mirror in Tailwind config.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0F1A17` | Primary dark background, main text on light |
| `--forest` | `#16302A` | Dark panels, sidebar, hero overlays |
| `--moss` | `#2F4A41` | Secondary dark surfaces, hover on dark |
| `--ivory` | `#F7F3EC` | Primary light background |
| `--linen` | `#EDE6DA` | Cards, subtle sections on light |
| `--champagne` | `#C8A96A` | Accent: buttons, underlines, icons, highlights |
| `--champagne-soft` | `#E4D3A8` | Accent hover, glows, selected states |
| `--sage` | `#8FA89A` | Muted secondary text on dark, success tint |
| `--stone` | `#6B6B63` | Muted text on light |
| `--hairline` | `rgba(200,169,106,0.28)` | 1px borders |
| `--danger` | `#9B3D3D` | Errors (muted red, never bright) |

**Rules**
- Landing (`/`) and doctor/admin auth screens use the **dark** theme (`--ink` to `--forest` gradient).
- Dashboard, patient view and session screens use the **light** theme (`--ivory` background, `--linen` cards).
- Champagne is used sparingly: one primary action per screen, thin underlines and small icons only.
- Never use pure black or pure white. Use `--ink` and `--ivory`.
- Subtle film-grain overlay (SVG noise, 4% opacity) on dark backgrounds for a tactile, printed-paper feel.

---

## 3. Typography

Load via Google Fonts (or self-host with `@fontsource`).

- **Display / headlines:** `Cormorant Garamond` (weights 400, 500, 600 and italic 400). Alternative: `Fraunces`.
- **UI / body:** `Manrope` (400, 500, 600).
- **Markdown reading view (patient sessions):** `Newsreader` or `Source Serif 4` at 18–19px with a 1.75 line-height. It should feel like reading a letter.

| Role | Font | Size (desktop / mobile) | Notes |
|---|---|---|---|
| Hero H1 | Cormorant 500 | 88 / 44px | Tight leading (1.02), letter-spacing -0.02em |
| H2 | Cormorant 500 | 48 / 32px | |
| H3 | Cormorant 600 | 28 / 22px | |
| Eyebrow | Manrope 600 | 12px | Uppercase, letter-spacing 0.22em, champagne |
| Body | Manrope 400 | 16px | line-height 1.65 |
| Button | Manrope 600 | 13px | Uppercase, letter-spacing 0.14em |
| Stat numerals | Cormorant 500 | 56px | Use lining numerals |

Use italic Cormorant for one emphasized word per headline, e.g. "Every conversation, *continued.*"

---

## 4. Spacing, Shape & Elevation

- 8px base grid. Section padding on landing: 160px vertical desktop, 96px mobile.
- Max content width: 1240px (dashboard 1360px). Reading column for markdown: 720px.
- Radius: **buttons are pill-shaped (999px)**, cards are 20px, inputs are 14px.
- Borders: 1px `--hairline`. Avoid drop shadows. When needed use `0 30px 80px -40px rgba(15,26,23,0.35)`.
- Focus ring: 2px `--champagne` with 3px offset (accessibility, don't remove).

---

## 5. Tech Stack

- **React 18 + Vite**, TypeScript preferred
- **React Router v6** for routing
- **Tailwind CSS** (tokens above wired into `tailwind.config.js`)
- **Framer Motion** for page transitions, reveals, hover and layout animation
- **Lenis** for buttery smooth scrolling (landing page only)
- **GSAP + ScrollTrigger** *(optional)* only for the hero parallax if Framer Motion isn't enough
- **react-markdown + remark-gfm + rehype-sanitize** for rendering session markdown
- **@tanstack/react-query** for data fetching and caching
- **react-hook-form + zod** for forms and validation
- **lucide-react** for icons (stroke width 1.25 to stay delicate)
- **recharts** *(optional)* for a tiny sparkline in the weekly-sessions stat
- Audio: native `MediaRecorder` API plus `wavesurfer.js` for the waveform

### Suggested folder structure
```
src/
  app/            router.tsx, providers.tsx, layouts/
  pages/
    Landing/              (/)
    DoctorAuth/           (/doctor)
    DoctorDashboard/      (/doctor/dashboard)
    DoctorSession/        (/doctor/session)
    PatientEntry/         (/patient)
    PatientSessions/      (/patient/:id)
    AdminLogin/           (/admin)
    AdminPanel/           (/admin/panel)
  components/
    ui/           Button, Input, Card, Eyebrow, Stat, Skeleton, Toast, Modal
    motion/       Reveal, Stagger, PageTransition, MagneticButton, Cursor
    audio/        Recorder, Dropzone, Waveform
    markdown/     SessionMarkdown
  lib/            api.ts, auth.ts, format.ts
  styles/         tokens.css, globals.css
  assets/         images, noise.svg, logo.svg
```

---

## 6. Routes & Access

| Route | Priority | Access | Purpose |
|---|---|---|---|
| `/` | Low | Public | Choose role: Doctor or Patient |
| `/doctor` | High | Public | Doctor sign-in (ID + password) |
| `/doctor/dashboard` | High | Doctor | Overview and patient list |
| `/doctor/session` | High | Doctor | Start a new session (upload or record) |
| `/patient` | High | Public | Enter patient ID |
| `/patient/:id` | High | Patient | Session history plus markdown reader |
| `/admin` | Medium | Public | Admin login |
| `/admin/panel` | Medium | Admin | Add doctors |

Use a `<ProtectedRoute role="doctor|admin">` wrapper. Redirect to `/doctor` or `/admin` when there is no valid token. Unknown routes show a branded 404.

> **Note on the spec:** the brief says "signup" on `/doctor`. Since the admin creates doctors, treat this screen as **sign in**. If self sign-up is also wanted, add a small "Request access" link that shows a contact form. Confirm with the product owner.

---

## 7. Global Experience

### 7.1 Logo & brand mark
- Wordmark "Continuo" in Cormorant 500 with wide letter-spacing (0.08em).
- Small mark: a continuous single-line loop (an infinity-like ribbon) in champagne, drawn as SVG. Animate it with a stroke-dash draw-in (1.4s) on first load and on the landing hero.

### 7.2 Page transitions
Wrap routes in `AnimatePresence mode="wait"`:
- Exit: opacity 1 to 0, y 0 to -12px, 350ms `easeIn`
- Enter: opacity 0 to 1, y 16px to 0, 700ms `cubic-bezier(0.22, 1, 0.36, 1)`

### 7.3 Reusable motion presets (`components/motion`)
- **`<Reveal>`** fades up 24px with 800ms ease-out when 20% in view. Fires once.
- **`<Stagger>`** staggers children by 90ms.
- **`<MagneticButton>`** on primary CTAs, the button follows the cursor within 12px (spring stiffness 150, damping 15). Disable on touch devices.
- **Custom cursor** *(landing only, desktop)*: 10px champagne dot with a 36px ring that lags. The ring grows to 64px with "Enter" text over the role cards.
- **Reduced motion:** wrap everything with `useReducedMotion()`. If true, fall back to simple opacity fades and no parallax or magnetic effects.

### 7.4 Buttons
- **Primary:** champagne background, ink text, pill. Hover: background shifts to `--champagne-soft`, a soft light sweep (linear-gradient mask moving left to right, 700ms) passes across.
- **Secondary:** transparent, 1px hairline border, ivory (on dark) or ink (on light) text. Hover: fills with 8% champagne.
- **Text link:** animated underline that grows from the left (300ms).

### 7.5 Inputs
- Underline-style on dark screens (bottom hairline only). Floating label rises on focus; underline expands from the center in champagne.
- Soft rounded boxes on light screens (`--linen` background, hairline border).
- Inline error text in `--danger`, 13px, slides down 4px with a fade.

### 7.6 Loading & empty states
- Skeletons are linen blocks with a very slow shimmer (2.4s).
- Empty states use a line illustration (see Section 9) plus one calm sentence and one action.

### 7.7 Toasts
Top-right, ink card with champagne left border, auto-dismiss 4s, slide in from the right.

---

## 8. Page-by-Page Specification

### 8.1 `/` — Role Selection *(low priority, but the first impression)*

**Layout (dark theme, full viewport, 100vh):**
- Background: slow-moving gradient (`--ink` to `--forest`) with film grain. Two blurred champagne orbs (600px, 12% opacity) drifting slowly (30s loop, Framer Motion keyframes).
- Top-left: logo. Top-right: tiny text "Private. Secure. Yours." in sage.
- Centre: eyebrow "CONTINUO", then H1 "Every conversation, *continued.*" and one sub-line (sage, 18px): "A quiet companion for the consultation room."
- Below: the question **"Are you a…"** in Cormorant italic, then two large cards side by side (stacked on mobile):
  - **Doctor** (route `/doctor`): "Capture and continue your consultations."
  - **Patient** (route `/patient`): "Revisit what was said, anytime."

**Role cards**
- 440×300px, 24px radius, hairline border, glassy `rgba(255,255,255,0.03)` with `backdrop-filter: blur(14px)`.
- Contains a large thin-line icon (stethoscope-less: use a minimal caduceus-free glyph, a loop or leaf for Doctor, a heart-in-hand line drawing for Patient), title in Cormorant 36px, short line, and an arrow that slides right on hover.
- Hover: lifts 6px, border brightens to champagne, inner radial champagne glow follows the cursor (CSS variables `--mx`, `--my` updated on mousemove).
- Click: the chosen card expands (Framer Motion `layoutId`) to fill the screen while the other fades, then navigates. About 700ms.

**Entry animation sequence**
1. Logo mark draws itself (1.2s)
2. H1 words reveal one by one with a mask slide-up (60ms stagger)
3. Sub-line fades in
4. Cards rise in with a 150ms offset

**Optional below-the-fold** (if the client wants a fuller landing): three short sections ("Record", "Understand", "Continue") with Lenis smooth scroll, parallax images, and a footer. Keep each section as a full-width Reveal block. Treat as a stretch goal.

---

### 8.2 `/doctor` — Doctor Sign-in

**Layout:** split screen, 50/50 (stacked on mobile with the image on top at 30vh).
- **Left (dark panel):** the form, vertically centred, max-width 400px.
  - Eyebrow "DOCTOR PORTAL"
  - H2 "Welcome back." (italic on "back")
  - Fields: **Doctor ID**, **Password** (with show/hide eye icon)
  - Primary button **"Enter Continuo"** (full width)
  - Small text: "Access is provided by your clinic administrator." with a lock icon
  - Link "← Back" to `/`
- **Right (image panel):** full-bleed photograph (see Section 9, image A) with a `--forest` overlay at 35% and a slow Ken Burns zoom (scale 1.0 to 1.08 over 20s, alternate). A glass quote card bottom-left: *"Time returned to the conversation."*

**Behavior**
- Validate with zod (required, min 4 chars).
- On submit the button shows a champagne spinner ring and the text changes to "Opening your space…".
- Success: the whole screen fades to `--ivory` (500ms, a "curtain" wipe from the bottom) and navigates to `/doctor/dashboard`.
- Failure: the form shakes subtly (x ±6px, 3 cycles) and shows "That ID or password isn't right."
- Store the JWT in memory plus an httpOnly cookie if the backend supports it. If localStorage is the only option, note the risk in code comments.

---

### 8.3 `/doctor/dashboard` — Doctor Dashboard

**Layout (light theme):** left slim navigation rail (72px, `--forest`, icons only, tooltips on hover) with the logo mark at the top and a sign-out icon at the bottom. Main area on `--ivory`.

**Header row**
- Left: eyebrow with today's date ("SATURDAY, 3 OCTOBER"), H1 "Good afternoon, Dr. {lastName}." (greeting is time-aware: morning, afternoon, evening).
- **Top-right: primary pill button "+ New session"** → `/doctor/session`. It has a magnetic hover effect and a soft pulsing champagne ring every 6s.

**Insight cards (4-up grid, 24px gap)**
| Card | Value | Detail |
|---|---|---|
| Total patients | count | small label "under your care" |
| Total sessions | count | "all time" |
| This week | count | tiny sparkline (7 bars, Mon to Sun) |
| Today | count | "sessions today" |

- Card: `--linen`, 20px radius, hairline border, 28px padding. Number in Cormorant 56px, label in Manrope 13px uppercase stone.
- Numbers **count up** from 0 over 1.2s (ease-out) on first view. Cards stagger in 90ms apart.
- Hover: border turns champagne, the sparkline bars brighten.

**Patient list**
- Section title "Your patients" with a search input on the right (filters live by name or ID) and a sort dropdown (Recent, Name, Sessions).
- Rows (not a heavy table): each row is a 76px-high flat card containing: circular monogram avatar (initials in Cormorant on `--forest`/ivory), patient name, patient ID in stone monospace-ish small text, number of sessions, last session date, and a chevron arrow.
- Row hover: background lightens to white-ish (`#FBF8F2`), chevron slides right 6px, a 2px champagne bar grows on the left edge.
- Click: navigates to `/patient/:id`.
- Rows stagger-reveal. Pagination: "Load more" text button (not numbered pages), or virtualise if more than 200.
- Empty state: line illustration plus "No patients yet. Begin your first session." plus a button.

**Data needed:** `GET /doctor/overview` returns `{ totalPatients, totalSessions, weekSessions, weekByDay[7], todaySessions }` and `GET /doctor/patients` returns the list.

---

### 8.4 `/doctor/session` — New Session

**Layout (light, centered column 640px):**
- Back link "← Dashboard"
- Eyebrow "NEW SESSION", H1 "Begin a *conversation.*"
- **Step 1: Patient ID**
  - Large single input (underline style, 28px text) labelled "Patient ID".
  - On blur or after 300ms debounce, verify and show a small confirmation chip: avatar + patient name with a champagne check (animated draw). Invalid shows a gentle error.
- **Step 2: Choose a method** (appears after Step 1 is valid, using height auto-expand animation). Two large option cards side by side (segmented radio behavior, 280×200 each):
  1. **Upload audio** (cloud-up icon), "Add a recording you already have."
  2. **Record now** (mic icon), "Capture the conversation live."
  - Selected card: champagne 1.5px border, filled `#FBF8F2`, small check badge. The unselected card dims to 60%.
- **Step 3a: Upload panel** (when "Upload" is selected)
  - Dropzone with a dashed champagne hairline border, 240px tall. Text: "Drop your audio here or *browse*". Accept `.mp3, .wav, .m4a, .webm, .ogg`. Max size shown (e.g. 200MB).
  - Drag-over: border turns solid, background tints champagne at 6%, the icon floats up 6px.
  - After selection: show a file row (name, size, duration) with a small waveform preview (wavesurfer) and a remove (×) button.
- **Step 3b: Record panel** (when "Record" is selected)
  - Request mic permission with a polite pre-prompt ("Continuo needs your microphone to listen. Nothing is stored until you save.").
  - A large circular **record button** (96px, champagne ring). Idle: mic icon. Recording: the ring pulses (scale 1 to 1.12, 1.6s loop), a red-free design (use champagne, not red), the icon becomes a square stop, and a live timer (`00:42`) in Cormorant 40px shows above.
  - Live waveform bars below (use `AnalyserNode` to animate 40 thin vertical bars).
  - Controls: Pause/Resume and Stop. After stopping, show playback (play/pause plus scrubber) and options **"Re-record"** or **"Use this recording"**.
  - Create a `File`/`Blob` from `MediaRecorder` (prefer `audio/webm;codecs=opus`) named `session-{patientId}-{timestamp}.webm`.
- **Submit:** sticky bottom bar with primary button **"Create session"**, disabled until patient ID and audio are present.
  - On click: upload via `multipart/form-data` with a progress ring (percentage inside).
  - Then a processing screen: a full-width calm animation (the logo loop drawing itself repeatedly) and rotating microcopy every 3s ("Listening closely…", "Finding the important moments…", "Writing it up…").
  - On success: toast "Session saved" and a button "View session" → `/patient/:id`.
  - On failure: inline error with a **Retry** button (keep the audio in state).

**Edge cases to handle:** mic denied (show help text), unsupported browser (hide Record and show a note), large file warnings, navigating away mid-recording (confirm dialog).

---

### 8.5 `/patient` — Patient Entry

**Layout (dark, centered, 100vh):**
- Gentle background: forest gradient plus a faint, huge line-art loop (stroke champagne at 8% opacity) slowly rotating (120s).
- Eyebrow "PATIENT PORTAL", H2 "Your sessions, *whenever you need them.*"
- One large input (underline, centered, 32px Cormorant text, letter-spacing 0.12em) with placeholder "Enter your patient ID". Under it, a primary pill button **"View my sessions"**.
- Helper text: "Your ID was given to you by your doctor." with a lock icon.
- On submit, show a champagne loading ring in the button, then fade to `/patient/:id`. If not found: "We couldn't find that ID. Please check with your doctor's office."

> ⚠️ **Security note for the product owner:** accessing medical notes with an ID alone is weak. Recommend a second factor (date of birth, short PIN, or one-time code via SMS/email) or signed, expiring links. Build the UI so an additional field can be dropped in easily (field slot under the ID input).

---

### 8.6 `/patient/:id` — Session Viewer *(core reading experience)*

**Layout (light theme, two columns):**
- **Left sidebar (320px, `--linen`, full height, sticky):**
  - Top: patient monogram avatar, name, ID, doctor's name.
  - Title "Session history" with a count.
  - **Timeline list**: sessions grouped by month ("October 2026"). Each item shows date (e.g. "Sat, 3 Oct"), time, and a one-line title or summary excerpt. A thin vertical champagne line connects small dots (timeline). The selected item has a filled dot, bold text and an ivory pill background that slides between items using Framer Motion `layoutId`.
  - Search input at the top of the list (filter by date or text), optional.
  - Mobile: sidebar becomes a top "Sessions" button opening a left drawer.
- **Center (the reader):**
  - Max-width 720px, centered, with 96px top padding.
  - Meta row: eyebrow with date and duration; H1 session title (Cormorant 48px).
  - **Markdown body** rendered with `react-markdown`:
    - `h1, h2`: Cormorant, with a short champagne rule (40px × 1px) above h2
    - `p`: Source Serif, 18px, `--ink`, 1.75 line-height
    - `ul/ol`: custom champagne bullet dots, generous spacing
    - `blockquote`: left 2px champagne border, italic, padded, `--linen` background
    - `strong`: weight 600; `code`: small linen pill; `table`: hairline borders, striped linen rows
    - Checkbox task lists (GFM) render as custom circular checkboxes, read-only
  - Reading enhancements: a thin champagne **reading progress bar** at the top of the viewport, a floating "Back to top" pill after 600px scroll, and an optional "Print / Save as PDF" icon button (print stylesheet: white background, no sidebar).
  - **Switching sessions:** cross-fade the content (opacity and 12px y) in 450ms, scroll reset to top. Show skeleton lines while loading.
- States: no sessions yet (calm illustration plus "Your first session will appear here."), error with a retry button.
- Sanitize all markdown with `rehype-sanitize`. Never use `dangerouslySetInnerHTML`.

**Data:** `GET /patients/:id/sessions` returns `[{ id, date, durationSec, title, markdown }]` (the markdown may be lazy-loaded per session via `GET /sessions/:sessionId`).

---

### 8.7 `/admin` — Admin Login

- Same split-screen pattern as the doctor sign-in but **more austere**: no photograph. Dark `--ink` full screen with a single centered card (420px, hairline border, glass).
- Eyebrow "ADMINISTRATION", H2 "Admin access."
- Fields: **Username**, **Password**. Button "Sign in".
- Same shake-on-error and curtain-wipe-on-success behavior. Redirects to `/admin/panel`.
- Do not link to this page anywhere publicly (no link from `/`).

### 8.8 `/admin/panel` — Add Doctors

- **Light theme**, simple one-page layout (max-width 960px), top bar with logo, "Admin" tag, and sign-out.
- **Left (form card, 420px): "Add a doctor"**
  - Fields: Full name, Doctor ID (auto-suggest a generated ID with a "regenerate" icon), Temporary password (with a "generate" button and a copy-to-clipboard icon), optional Email and Specialty.
  - Button "Add doctor". Success: toast, the form clears, and the new row animates into the list from the top (layout animation, champagne highlight fading over 2s).
- **Right: "Doctors" list**: rows with monogram, name, doctor ID, specialty, date added. Optional actions (stretch): reset password, deactivate (confirm modal).
- Show the generated credentials once in a modal after creation, with "Copy credentials" so the admin can share them securely. Warn: "The password will not be shown again."

---

## 9. Imagery & Art Direction

**Mood:** warm, soft, natural light, shallow depth of field, muted greens and creams. People appear calm and unposed. No stock-photo smiles, no stethoscopes against white, no blue scrubs.

Source from Unsplash, Pexels (free) or commission/licence from Stocksy (paid, higher quality). Check licences before launch. Export hero images at 2400px wide (WebP + AVIF, quality ~75), provide `srcset`, and lazy-load below the fold.

| ID | Where | Brief | Suggested search terms |
|---|---|---|---|
| **A** | `/doctor` right panel | A doctor in a softly lit, warm-toned consulting room, photographed from behind or in profile, listening. Window light, plants, wooden desk, neutral tones. Faces not essential. | "doctor consultation warm light", "calm clinic interior", "doctor listening patient" |
| **B** | `/` background accent (optional) | Abstract: soft out-of-focus green leaves with light flares, or silk fabric in deep green. Used under the gradient at 15% opacity. | "dark green silk texture", "bokeh leaves dark" |
| **C** | `/patient` (optional small) | Hands holding a warm cup near a window, or a notebook with a pen. Quiet, personal. | "hands holding tea window", "notebook morning light" |
| **D** | Empty states | **Not photographs.** Custom single-line SVG illustrations (continuous line, champagne stroke on transparent): an open notebook, a microphone, a leaf. Commission or draw in Figma and animate with stroke-dash draw-in. | n/a |

Image treatment: apply a `--forest` multiply overlay (30–40%) so all photos share the palette, plus a subtle vignette. Add `alt` text to every image.

Iconography: lucide-react, stroke 1.25, champagne or ink only.

---

## 10. Animation Inventory (quick reference)

| Where | Animation | Tool | Timing |
|---|---|---|---|
| All routes | Fade and slide page transition | Framer Motion `AnimatePresence` | 350ms out / 700ms in |
| `/` background | Drifting blurred orbs | Framer Motion keyframes | 30s loop |
| `/` hero | Logo stroke draw, word-mask reveal, card rise | Framer Motion, SVG `pathLength` | 1.2s sequence |
| `/` cards | Cursor-follow glow, lift, expand-to-navigate | CSS vars, `layoutId` | 300ms / 700ms |
| Landing | Custom cursor ring | Framer Motion `useSpring` | continuous |
| Landing (stretch) | Smooth scroll and parallax | Lenis, GSAP ScrollTrigger | continuous |
| Buttons | Magnetic pull, light sweep | Framer Motion, CSS gradient | 700ms |
| Inputs | Floating label, center-grow underline | CSS transitions | 250ms |
| Auth screens | Shake on error, curtain wipe on success | Framer Motion | 400ms / 500ms |
| Doctor image | Ken Burns zoom | CSS keyframes | 20s alternate |
| Dashboard stats | Count-up, stagger reveal, sparkline grow | `useMotionValue`, Framer Motion | 1.2s / 90ms stagger |
| Patient rows | Stagger, hover bar grow, chevron slide | Framer Motion, CSS | 90ms stagger |
| Record button | Pulse ring, live waveform bars | CSS, Web Audio `AnalyserNode` | 1.6s loop |
| Processing | Looping logo draw, rotating microcopy | SVG, Framer Motion | 3s per line |
| Session history | Sliding active pill | `layoutId` | 400ms spring |
| Markdown content | Cross-fade on session change, progress bar | Framer Motion, scroll listener | 450ms |
| Admin list | New row slide-in and highlight fade | Framer Motion layout | 600ms / 2s |

Global easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Respect `prefers-reduced-motion` everywhere.

---

## 11. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| ≥1280px | Full layouts as described |
| 1024–1279px | Dashboard stats 2×2, sidebar narrower (280px) |
| 768–1023px | Split auth screens stack, patient sidebar becomes a drawer |
| <768px | Single column, 16px gutters, hero type scaled, role cards stacked, custom cursor and magnetic effects disabled, nav rail becomes a bottom tab bar |

Test touch targets (minimum 44px) and iOS Safari audio recording (requires a user gesture and has format limits, so fall back to `audio/mp4` if `webm` isn't supported).

---

## 12. API Contract (assumed, confirm with backend)

```
POST /auth/doctor/login        { doctorId, password }         -> { token, doctor }
POST /auth/admin/login         { username, password }         -> { token }
GET  /doctor/overview                                        -> { totalPatients, totalSessions, weekSessions, weekByDay, todaySessions }
GET  /doctor/patients                                        -> [{ id, name, sessionCount, lastSessionAt }]
GET  /patients/:id                                           -> { id, name, doctorName }
GET  /patients/:id/sessions                                  -> [{ id, date, durationSec, title }]
GET  /sessions/:sessionId                                    -> { id, date, markdown }
POST /sessions                 multipart: patientId, audio    -> { sessionId, status }
GET  /sessions/:sessionId/status                             -> { status: "processing" | "ready" | "failed" }
POST /admin/doctors            { name, doctorId, password, email?, specialty? } -> { doctor }
GET  /admin/doctors                                          -> [{ id, name, doctorId, specialty, createdAt }]
```

Poll `/sessions/:sessionId/status` every 3s on the processing screen until `ready`.

---

## 13. Accessibility & Quality Checklist

- [ ] Text contrast ≥ 4.5:1 (champagne on ink passes; check champagne on ivory, so use ink text there)
- [ ] All inputs have labels; errors announced via `aria-live="polite"`
- [ ] Full keyboard navigation and visible focus ring
- [ ] Role-card clicks, dropzone and record button operable by keyboard
- [ ] `prefers-reduced-motion` honored
- [ ] Audio controls labelled; recording state announced to screen readers
- [ ] Markdown rendered with sanitization
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95 on landing
- [ ] No tokens or medical content logged to the console
- [ ] `noindex` meta on all pages except `/`

---

## 14. Privacy & Trust Microcopy (use consistently)

- Footer on every screen: "Continuo · Private by design."
- Recording consent hint: "Please make sure the patient has agreed to be recorded."
- Sign-out confirmation: "Your session has been closed securely."
- Tone: calm, warm, short sentences. No exclamation marks, no jargon.

---

## 15. Build Order (suggested)

1. Set up Vite, Tailwind, tokens, fonts, router, layouts, motion primitives
2. UI kit: Button, Input, Card, Toast, Skeleton, Stat
3. `/doctor` and `/admin` auth plus protected routes
4. `/doctor/dashboard`
5. `/doctor/session` (upload first, then recording, then processing screen)
6. `/patient` and `/patient/:id` (markdown reader)
7. `/admin/panel`
8. `/` landing polish (cursor, glow, transitions), then the optional scroll sections
9. Responsive pass, accessibility pass, performance pass

---

*End of specification.*