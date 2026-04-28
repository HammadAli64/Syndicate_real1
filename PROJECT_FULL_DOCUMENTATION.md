# Syndicate Project Full Documentation

This document explains the full project flow from landing page to dashboard modules, including AI challenges (agents), affiliate portal, programs, membership, authentication, and backend APIs.

## 1) Project Overview

Syndicate is a full-stack platform with:

- **Frontend**: Next.js App Router (`Frontend-Dashboard`)
- **Backend**: Django + DRF (`Backend`)
- **Core features**:
  - Marketing homepage and public pages
  - Main dashboard with module-based navigation
  - AI mission/challenge system ("Syndicate Mode")
  - Programs and secure playlists/courses
  - Membership content (articles + videos)
  - Affiliate referral and tracking portal
  - OTP + JWT/Token authentication flows

## 2) High-Level Architecture

- **Frontend app entry**: `Frontend-Dashboard/src/app/layout.tsx`
- **Backend URL root**: `Backend/syndicate_backend/urls.py`
- **Frontend-to-backend connection**:
  - Next rewrites proxy `/api/*` routes to Django via `next.config.js`
  - Backend base controlled by `BACKEND_INTERNAL_URL` / `DJANGO_API_BASE`

### Important Rewrite Paths

From `Frontend-Dashboard/next.config.js`:

- `/api/portal-proxy/:path*` -> Django `/api/:path*`
- `/api/portal/:path*` -> Django portal
- `/api/affiliate/:path*` -> Django affiliate auth
- `/api/track/:path*` -> Django affiliate tracking
- `/api/courses/*`, `/api/videos/*`, `/api/streaming/*`, `/api/auth/*` -> mapped to Django

## 3) Frontend Route Map

Main user-facing routes discovered in `src/app`:

- `/` -> Homepage
- `/programs` -> Public programs showcase
- `/dashboard` -> Main logged-in dashboard shell
- `/login`, `/signup`, `/verify-otp`
- `/syndicate-otp/*` -> OTP onboarding flow (login/signup/verify)
- `/checkout`, `/checkout/success`
- `/membership/content`, `/membership/articles/[slug]`, `/membership/brief/[id]`
- `/affiliate/[affiliateId]` and `/r/[affiliateId]` -> referral landing flows
- `/streaming/videos`, `/streaming/videos/[id]`
- `/our-methods`, `/what-you-get`

## 4) Homepage Flow (`/`)

Main file: `Frontend-Dashboard/src/app/page.tsx`

The homepage is designed as full-screen cinematic sections:

1. **Hero section**
   - Top navigation (`NavApp`)
   - Glitch/typing effects
   - ONEM logo centerpiece
   - Featured media logo strip

2. **Featured Programs dome**
   - Background Vimeo loop
   - Dome gallery of featured program cards
   - Click-through to `/programs`

3. **Social proof / viewed/informative reels**
   - Pulls founder images from `public/assets/founder`
   - Marquee rows with Instagram/TikTok links

4. **Bottom sections**
   - Pricing
   - Paywall snapshots
   - Certificates
   - FAQ
   - Global footer sections

### Header Navigation Behavior

From `NavApp.tsx`:

- `home` -> `/`
- `whatYouGet` -> `/what-you-get`
- `ourMethods` -> `/our-methods`
- `programs` -> `/programs`
- `joinNow` -> `/login`

## 5) Dashboard Main Shell (`/dashboard`)

Primary file: `Frontend-Dashboard/src/app/dashboard/page.tsx`

The dashboard uses a module nav and renders sections based on `selectedNavKey`.

### Dashboard Nav Modules

- `dashboard` -> Dashboard overview panel
- `programs` -> Programs/Course section
- `monk` -> Syndicate Mode (AI challenges)
- `resources` -> Membership section
- `affiliate` -> Affiliate portal
- `support` -> Support section
- `quickaccess` -> Quick tools grid
- `settings` -> User/profile/settings section

### Dashboard Core UX

- Heavy use of GSAP + Framer Motion + HUD styles
- Profile/avatar persistence in local storage
- Sidebar + responsive layouts
- Integrates multiple sub-features into one shell

## 6) Syndicate Mode / Challenges / Agents

Main UI component: `Frontend-Dashboard/src/components/SyndicateAiChallengePanel.tsx`

This module is the AI challenge engine in the dashboard ("agents/challenges mode").

### Key Capabilities

- Fetches daily AI missions/challenges by mood/category
- Supports custom user-created tasks
- Mission scoring and evaluation
- Streak recording/restoration
- Leaderboard + sync
- Admin-assigned tasks (active, submit, claim points)
- Progress persistence/sync with backend

### Frontend API Client

File: `Frontend-Dashboard/src/app/challenges/services/challengesApi.ts`

- Uses base `${API_BASE}/challenges/*`
- Handles token/session expiration (`ensureSyndicateSessionOrRedirect`)
- Polling support for incremental daily generation

### Backend Challenge Endpoints

Mounted under `/api/challenges/` from `Backend/apps/challenges/urls.py`:

- `me/progress/`
- `me/streak_record/`
- `me/streak_restore/`
- `today/`
- `user_task/`
- `generate/`, `generate_daily/`, `generate_pair/`
- `score_response/`
- `history/`, `recent/`
- `agent_quote/`
- `leaderboard/`, `leaderboard/sync/`
- `admin_tasks/active/`, `admin_tasks/submit/`, `admin_tasks/claim_points/`
- referral-related challenge routes (`referral/create|redeem|status|claim`)

## 7) Programs Module

Public page: `Frontend-Dashboard/src/app/programs/page.tsx`  
Dashboard module component: `Frontend-Dashboard/src/components/programs/ProgramsCourseSection.tsx`

### What It Does

- Displays public marketing/program path on `/programs`
- In dashboard, loads secure courses + stream playlists
- Supports staff checks and secure detail panels
- Handles playlist checkout session + post-checkout refresh

### Data Sources

- Courses API
- Streaming/playlist API
- Portal identity (staff/non-staff gating)

## 8) Membership Module

Main component: `Frontend-Dashboard/src/components/membership/MembershipContentHub.tsx`

### Features

- Two content tabs: **Articles** and **Videos**
- Search, sort, and date filtering (articles)
- Auto-generate brief article logic
- Secure PDF fetching for protected article docs
- Membership video gallery with status-aware refresh polling
- Reader mode for web/pdf content

### Main API Paths Used

- `/api/portal/membership/articles/`
- `/api/portal/membership/secure-videos/`
- `/api/portal/membership/generated-article/`

## 9) Affiliate Portal Module

Components:

- `Frontend-Dashboard/src/components/affiliate/AffiliatePortalSection.tsx`
- `Frontend-Dashboard/src/components/affiliate/AffiliatePortal.tsx`
- `Frontend-Dashboard/src/components/affiliate/ReferralLanding.tsx`

### Capabilities

- Loads affiliate stats, visitors, funnel, recent referrals
- Generates referral links for different offer types
- Copy/share link actions
- Referral performance cards + momentum signals
- Embedded mode inside dashboard module

### Frontend API Client

File: `Frontend-Dashboard/src/lib/affiliateApi.ts`

- Uses `/api/track/*` and auth header (affiliate token if present)
- Optional override: `NEXT_PUBLIC_AFFILIATE_API_BASE_URL`
- Default behavior: same origin `/api` (rewritten by Next)

### Backend Affiliate Endpoints

Tracking (`/api/track/`):

- `health`
- `stats`
- `click`
- `lead`
- `sale`
- `affiliate-visitors`
- `funnel`
- `recent-referrals`

Affiliate OTP auth (`/api/affiliate/auth/`):

- `login`
- `request-otp`
- `verify-otp`

## 10) Authentication Model

The project uses multiple auth paths:

1. **Portal JWT auth** (`/api/auth/login/`, refresh/logout/me)
2. **Syndicate DRF token auth** (`/api/syndicate-auth/*`) for challenge-related session behavior
3. **OTP auth flow** in accounts routes for onboarding + checkout
4. **Affiliate OTP auth** under `/api/affiliate/auth/*`

Frontend auth client and session helpers live in:

- `Frontend-Dashboard/src/lib/portal-api.ts`
- `Frontend-Dashboard/src/lib/syndicateAuth.ts` (used indirectly in features)

## 11) Backend API Root Map

From `Backend/syndicate_backend/urls.py`:

- `/api/auth/*` -> portal + account auth routes
- `/api/portal/*` -> portal app
- `/api/challenges/*` -> challenge system
- `/api/track/*` -> affiliate tracking
- `/api/affiliate/auth/*` -> affiliate OTP auth
- `/api/*` -> fallback include (`Backend/api/urls.py`) for courses, streaming, syndicate-auth, portal, membership, health, docs bootstrap

## 12) Environment Variables (Operationally Important)

### Frontend

- `BACKEND_INTERNAL_URL` (rewrite target)
- `DJANGO_API_BASE` (alternate backend origin)
- `NEXT_PUBLIC_API_BASE` / `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SYNDICATE_API_URL` (challenge/affiliate base in merged setup)
- `NEXT_PUBLIC_AFFILIATE_API_BASE_URL` (optional dedicated affiliate API override)
- `NEXT_PUBLIC_AUTH_REQUIRED`
- `NEXT_PUBLIC_REFERRAL_BASE_URL`

### Backend

- Django app secrets + DB settings
- OpenAI config (`OPENAI_MODEL` noted in repo README)

## 13) End-to-End User Journey (Practical)

1. User lands on `/` and navigates from marketing sections.
2. User signs up/logs in (OTP/JWT depending route).
3. User enters `/dashboard`.
4. Inside dashboard user can:
   - monitor overview
   - open Programs and secure playlists
   - run Syndicate Mode missions (AI + scoring + streak + leaderboard)
   - consume Membership content
   - use Affiliate module for referral analytics
5. API calls flow through Next rewrites to Django unified backend.

## 14) Key Files For Future Maintenance

### Frontend Core

- `Frontend-Dashboard/src/app/page.tsx`
- `Frontend-Dashboard/src/app/dashboard/page.tsx`
- `Frontend-Dashboard/src/components/SyndicateAiChallengePanel.tsx`
- `Frontend-Dashboard/src/components/programs/ProgramsCourseSection.tsx`
- `Frontend-Dashboard/src/components/membership/MembershipContentHub.tsx`
- `Frontend-Dashboard/src/components/affiliate/AffiliatePortal.tsx`
- `Frontend-Dashboard/src/lib/portal-api.ts`
- `Frontend-Dashboard/src/lib/affiliateApi.ts`
- `Frontend-Dashboard/src/app/challenges/services/challengesApi.ts`
- `Frontend-Dashboard/next.config.js`

### Backend Core

- `Backend/syndicate_backend/urls.py`
- `Backend/api/urls.py`
- `Backend/apps/challenges/urls.py`
- `Backend/apps/affiliate_tracking/urls_track.py`
- `Backend/apps/affiliate_tracking/urls_auth.py`

---

If you want, I can also generate a **second version** of this document as:

- a non-technical business flow doc, or
- a developer handover doc with API request/response examples for each module.
