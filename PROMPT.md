# StudyMate — Full Project Execution Prompt

You are implementing StudyMate, a college study-partner matching PWA. I am the architect; you are the implementer. I decide the flow; you write the code. Follow this document exactly, in order. Do not skip ahead, do not invent features, do not refactor code I didn't ask you to touch.

---

## 1. PRODUCT OVERVIEW

StudyMate connects college students for real study sessions. A student verifies their college email (domain allowlist + OTP), sets up a profile, flips an "active switch" when they're up for a study session, sees a live pool of available matching students, sends a study request, and if accepted within a 2-minute window, they enter a paired study session with a timer + Pomodoro. Every user carries an accountability score that rewards showing up and staying focused, and punishes ghosting. After a match, a chat connection opens that auto-expires after 2 days unless both users vote to keep it.

Core loop: verify → profile → active switch → pool → request (2-min timer) → match → study session → score updates → chat (2-day expiry).

---

## 2. TECH STACK (FIXED — DO NOT CHANGE)

- Frontend: React + Vite + TypeScript (strict) + Tailwind CSS, built as an installable PWA (manifest + service worker via vite-plugin-pwa)
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Supabase (free tier) — Supabase Auth NOT used; we do our own OTP flow
- Realtime: Supabase Realtime for pool presence + chat messages (5-second polling acceptable fallback)
- Email (OTP): Resend (free tier)
- Background jobs: cron jobs (node-cron) inside the backend — NO Redis, NO BullMQ for MVP
- Push: Web Push with VAPID keys (Android  AND iOS; Safari limited don't promise it)
- Deployment: Vercel (frontend) + Render/Railway (backend + cron)

---

## 3. NON-NEGOTIABLE WORKING RULES

1. Build exactly ONE task per message. Do the task, show the result, STOP. Never "also improve", "also fix", or "also add" anything unasked.
2. Never refactor or modify files outside the current task. If a file works, leave it alone.
3. Ask ONE clarifying question before coding when a requirement is ambiguous. Never guess on architecture.
4. No speculative code: no unused imports, no placeholder functions, no "might be useful later" code.
5. TypeScript strict mode stays on. No `any` unless I explicitly approve. Every function has explicit return types.
6. Every API route and DB query has error handling. No silent failures. Errors return a clear message; never crash the server.
7. Before writing code for a task, reply with: (a) files you'll create/touch, (b) schema/API shape if any, (c) risks or decisions needing my confirmation. Wait for my go-ahead unless I say "just do it".
8. Keep diffs small and reviewable. If a task touches more than 3 files, warn me first and justify it.
9. No demo code, no fake data in production code, no default Vite boilerplate.
10. On task completion, reply in this exact format (under 5 lines):
    - What changed
    - How to test it
    - What the next task should be
11. When I paste an error: explain the cause in one sentence first, then fix it. Read the relevant file before guessin and mention the file and the line number also create a subsidary file with all the errors that occured during the task and update it to github as a separate file.
12. For any schema change: show me the SQL first and wait for approval before running anything.

---

## 4. FULL FEATURE SPEC

### 4.1 Auth — Domain allowlist + OTP (NO OAuth, NO Azure, NO money spent)

- Table `college_domains`: id, domain (unique), college_name, is_active, created_at. Only domains with is_active=true may sign up.
- Signup flow: user enters college email → backend extracts domain (text after @) → check allowlist:
  - If allowed: generate 6-digit OTP, store hash, send via Resend, show OTP entry screen.
  - If NOT allowed: show "Your college isn't registered yet" + a "Request access" form → inserts into `domain_requests` (pending) → admin approves later.
- OTP rules: expires in 10 minutes, max 5 verify attempts, rate limit 3 OTPs per 10 minutes per email and 5 per hour per IP. Never store plaintext OTP — store hash only.
- On successful verify: create user (if new), set email_verified_at, issue JWT (access token ~15 min + refresh token ~7 days, refresh token hashed in DB).
- Login (returning user): same flow — email → OTP → in. No passwords.
- After first login, redirect to onboarding; after onboarding_completed_at is set, redirect to main page.

### 4.2 Onboarding

Collect: full_name, department, graduation_year, gender (optional), bio (optional), preferred locations (multi-select from `locations`), subjects they need help with, subjects they can teach, study style (in_person / online / both), available time slots, group size preference. Save into `users` + `user_preferences`.

### 4.3 Main Page (after login)

Purpose: answer "am I up for a sesh right now, and who's available?" in one glance.
1. Hero: big "Up for a study sesh" toggle (the active switch). Off = idle. On = matching pool opens.
2. Active pool: cards of available users matching filters. Each card: name, dept, year, what they're studying, location block, accountability score badge, "Ask to study" button. Sorted by relevance (same dept/subject first, then nearest).
3. Pending requests strip: outgoing requests with live countdown timers; incoming requests with Accept / Decline buttons.
4. Quick filter chips (max 4): dept, subject, location block, group size.
5. Recent/upcoming sessions (2–3 items max).
6. Entry point to create/join a lobby (secondary, small button).
Deliberately NOT on main page: profile editing, settings, chat list, ratings history.

### 4.4 Matching — Request + 2-minute timer + atomic accept

- Sender taps "Ask to study" → insert `match_requests` (status=pending, expires_at = now() + 120 seconds) → sender sees countdown "Waiting for them to accept…".
- Receiver gets a notification + in-app card with Accept / Decline. If they do nothing, request auto-expires at 0 (cron every 30s: UPDATE match_requests SET status='expired' WHERE expires_at < now() AND status='pending').
- On expiry, sender sees: "They didn't respond in time. Want us to suggest similar people?"
- ACCEPT MUST BE ATOMIC — the race-condition fix, in one transaction:
  BEGIN;
  SELECT * FROM users WHERE id = $receiver_id FOR UPDATE;  -- lock receiver
  -- verify receiver still available (is_active=true, not already matched)
  UPDATE match_requests SET status='accepted', responded_at=now()
    WHERE id = $request_id AND status='pending';
  UPDATE users SET is_active=false WHERE id = $receiver_id;
  INSERT INTO matches (user_a_id, user_b_id, session_id) VALUES (...);
  INSERT INTO study_sessions (type='pair', status='active', ...) VALUES (...);
  INSERT INTO conversations (type='direct', connection_type='temporary', expires_at = now() + interval '2 days') VALUES (...);
  COMMIT;
- If the UPDATE affects 0 rows (someone else grabbed them first): rollback, sender sees "They just matched with someone else."
- Both users' is_active flips to false when matched (they're now in a session).
- No-show detection: cron marks sessions no_show when a participant never joins within X minutes of scheduled start → triggers accountability event −20.

### 4.5 Study Session Screen

- Pair session with a big timer + Pomodoro (25 min focus / 5 min break, configurable later).
- Focus tracking: user starts a focus block; it ONLY counts if COMPLETED in full. Abandoned/early-exit blocks count as 0. Store every block in `focus_timers` (type focus/break, started_at, ended_at, duration_min, completed).
- Session complete (both participants finish) → accountability event session_completed +10.
- No quiz, no water alarm, no notes in MVP — those are deferred features, do not build them.

### 4.6 Accountability Score (shown on matching cards)

Two components only (peer rating is deferred to v2):

- reliability: starts at 100. Completed session +10. No-show (ghost) −20. Clamp to 0–100. NO punctuality, NO late-cancel penalties, NO timing penalties — the ONLY reliability signal is ghosting vs showing up.
- focus: focusRatio = completed focus minutes ÷ total focus minutes attempted, then focus = 100 × focusRatio.

Overall score:

\[ \text{score} = 0.6 \cdot \text{reliability} + 0.4 \cdot \text{focus} \]

- Cache the score in `accountability_scores`; recompute via nightly cron or after each session ends. NEVER compute on the fly in a request handler.
- Display as a number (0–100) badge on matching cards and profile.

### 4.7 Chat — Connection-based with 2-day expiry

- Conversation created at match time with connection_type='temporary', expires_at = matched_at + 2 days.
- Only the matched pair can chat. Text messages only (images deferred).
- Day 1 (24h before expiry): banner in chat — "This chat expires in 24h. Want to keep it?" with Keep chat / Let it expire buttons. Buttons set user_a_keep / user_b_keep flags.
- When BOTH flags are true → connection_type='permanent', clear expires_at, conversation moves to a "contacts" list.
- If either declines or does nothing → cron closes the conversation at expiry (status='closed'). Both see: "Chat with X closed. You can re-match anytime."
- Tone must be friendly, never punishing.

### 4.8 Notifications1

- In-app notification rows in `notifications` (type: match_request, match_accepted, request_expired, chat_expiring, session_reminder).
- Web Push (VAPID) for match_request and match_accepted on Android. iOS Safari: in-app only, no false promises.

### 4.9 PWA Installability (Phase 1, non-negotiable)

- manifest.json: name, short_name, display='standalone', start_url='/', theme color, 192px + 512px icons.
- Service worker via vite-plugin-pwa with registerType='autoUpdate' and a basic offline shell.
- Install banner component: Android uses the beforeinstallprompt event; iOS shows a custom overlay with "Share → Add to Home Screen" instructions + screenshot.
- After signup, show one-time "Add to Home Screen" guidance screen.

---

## 5. DATABASE SCHEMA (PostgreSQL, UUID primary keys, created_at TIMESTAMPTZ DEFAULT now())

### auth
- college_domains: id, domain TEXT UNIQUE, college_name, is_active BOOL, created_at
- domain_requests: id, email, domain, college_name, status (pending/approved/rejected), created_at
- otp_verifications: id, email, otp_hash, purpose (signup/login), attempts INT DEFAULT 0, expires_at, verified_at NULL, created_at
- users: id, email UNIQUE, email_verified_at NULL, full_name, phone NULL, avatar_url NULL, department, graduation_year INT, gender NULL, bio NULL, is_active BOOL DEFAULT false, account_status TEXT DEFAULT 'active', onboarding_completed_at NULL, created_at, updated_at
- user_sessions (refresh tokens): id, user_id FK, token_hash, device_info JSONB, expires_at, revoked_at NULL
- user_devices (push): id, user_id FK, device_token, platform, last_seen_at

### profile
- locations: id, name, block, floor NULL, is_active
- user_preferences: user_id PK FK, preferred_location_ids UUID[], walk_radius TEXT, preferred_departments TEXT[], department_tolerance TEXT, year_tolerance TEXT, group_size_pref INT[], study_style_pref TEXT[], time_slots TEXT[], subjects_need_help TEXT[], subjects_can_teach TEXT[], gender_pref TEXT, created_at, updated_at

### matching
- match_requests: id, sender_id FK, receiver_id FK, message NULL, status (pending/accepted/rejected/expired/cancelled), expires_at, responded_at NULL, created_at — index (receiver_id, status)
- matches: id, user_a_id FK, user_b_id FK, session_id FK NULL, status (active/completed/blocked), matched_at

### sessions
- study_sessions: id, type (pair/group/lobby/alone), subject, topic NULL, location_id FK NULL, scheduled_start_at, scheduled_end_at NULL, actual_start_at NULL, actual_end_at NULL, status (scheduled/active/completed/cancelled/no_show/expired), created_by FK, created_at
- session_participants: id, session_id FK, user_id FK, role (host/participant), joined_at, left_at NULL, UNIQUE (session_id, user_id)

### accountability
- accountability_events: id, user_id FK, event_type (session_completed/no_show), points_delta INT, session_id FK NULL, created_at — index (user_id)
- accountability_scores: user_id PK FK, reliability INT, focus_ratio NUMERIC(5,4), score INT, updated_at
- focus_timers: id, user_id FK, session_id FK NULL, type (focus/break), started_at, ended_at NULL, duration_min INT, completed BOOL

### chat
- conversations: id, type (direct/group), connection_type (temporary/permanent), expires_at NULL, user_a_keep BOOL DEFAULT false, user_b_keep BOOL DEFAULT false, status (open/closed), session_id FK NULL, created_at
- conversation_participants: conversation_id FK, user_id FK, last_read_at, UNIQUE (conversation_id, user_id)
- chat_messages: id, conversation_id FK, sender_id FK, message_type (text/system), content, created_at — index (conversation_id, created_at)

### ops
- notifications: id, user_id FK, type, title, body, data JSONB, read_at NULL, created_at — index (user_id, read_at)
- app_settings: key TEXT PK, value JSONB, updated_at

---

## 6. API ENDPOINTS (REST)

- POST /auth/request-otp {email} → validates domain, sends OTP
- POST /auth/verify-otp {email, otp} → verifies, creates/logs in user, returns {accessToken, refreshToken, isNewUser}
- POST /auth/refresh → new access token
- GET /auth/me, PATCH /auth/me (profile)
- POST /auth/domain-request {email, domain, college_name}
- GET /locations, GET /preferences, PUT /preferences
- PATCH /users/me/active {is_active} → flips switch, broadcasts presence
- GET /pool?dept=&subject=&location= → available users with scores, sorted by relevance
- POST /match-requests {receiver_id, message?}
- POST /match-requests/:id/accept → the atomic transaction above
- POST /match-requests/:id/decline
- GET /match-requests/pending (outgoing + incoming)
- GET /sessions/:id, POST /sessions/:id/start, POST /sessions/:id/complete
- POST /focus-timers (start/end focus block)
- GET /score/me, GET /users/:id/score
- GET /conversations, GET /conversations/:id/messages, POST /conversations/:id/messages
- POST /conversations/:id/keep {keep: true} → sets user_a_keep or user_b_keep; if both → permanent
- GET /notifications, POST /notifications/:id/read

## 7. CRON JOBS (node-cron in backend)

1. Every 30s: expire stale match_requests (status pending → expired).
2. Every 30 min: close temporary conversations past expires_at (status open → closed, notify both).
3. Every 5 min: detect no-shows (session scheduled, participant never joined → status no_show, accountability event −20).
4. Nightly: recompute all accountability_scores from events + focus_timers.

---

## 8. EXECUTION PHASES — build in this exact order, one task per message

Phase 1 — PWA skeleton: Vite + React + TS + Tailwind scaffold, manifest + icons + service worker, install banner, deploy to Vercel. ACCEPTANCE: opens full-screen on a phone home screen.
Phase 2 — Database + backend: all tables above, Express app with health check, env config, error middleware, cron scheduler shell. ACCEPTANCE: all migrations run, /health returns ok.
Phase 3 — Auth: domain allowlist, OTP send/verify, JWT, onboarding form, domain request flow. ACCEPTANCE: can sign up with a whitelisted email, land on main page.
Phase 4 — Matching: active switch, pool screen with filters, send request, 2-min timer UI, atomic accept, expiry cron. ACCEPTANCE: two phones can match end-to-end with no double-booking.
Phase 5 — Study session: pair session screen, timer + Pomodoro, focus_timers recording, session complete. ACCEPTANCE: completed focus blocks recorded, abandoned blocks count 0.
Phase 6 — Accountability: reliability + focus computation, cached scores, badge on matching cards, nightly cron. ACCEPTANCE: score changes correctly after a no-show and after a completed session.
Phase 7 — Chat: conversation at match time, messaging, keep/expire flow, expiry cron, expiring banner. ACCEPTANCE: chat auto-closes at 2 days unless both keep.
Phase 8 — Notifications + polish: in-app notifications, Web Push (Android), offline shell, install guidance after signup.
Phase 9 — Launch: seed allowlist with real college domains, QR-code landing page, feedback loop.

---

## 9. CONSTRAINTS & REMINDERS

- Free tier everything. No paid services, no OAuth, no Azure, no Redis, no BullMQ.
- The accountability score is ONLY reliability + focus. Goal progress, streaks, peer ratings, water alarms, quiz, notes, lobbies are ALL deferred — do not build them.
- The chat expiry design is mandatory: temporary at match, 2-day expiry, both-keep → permanent.
- Keep the tone of all user-facing copy friendly and non-punishing.
- If anything in this document conflicts with a later instruction from me, the later instruction wins — ask me to confirm the conflict first.
