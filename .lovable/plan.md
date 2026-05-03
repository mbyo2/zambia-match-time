
# MatchTime — Production-Readiness Roadmap

A 6-milestone plan to take MatchTime from feature-complete MVP to App Store / Play Store launch quality. Each milestone is independently shippable.

---

## Milestone 1 — Finish Phase 5 (Calls) [1–2 sessions]

**Goal:** Calls work reliably across networks and reach users even when the app is closed.

- **Incoming call UI overhaul** — Replace the current toast-based ringer in `IncomingCallListener` with a full-screen ringing modal (caller photo, name, accept/decline buttons, ringtone loop, vibration via `useHapticFeedback`).
- **Push wake-up for calls** — Extend the `incoming_call` notification trigger to call `send-push-notification` edge function with high-priority payload; on native (Capacitor), use a dedicated channel with sound.
- **Missed-call badge + deep link** — Add unread call count to bottom nav, tapping the call notification deep-links into `/app/matches?tab=calls`.
- **TURN server fallback** — Add Twilio/Metered TURN credentials via secrets; fetch on-demand via a `get-ice-servers` edge function so credentials never ship to the bundle.
- **Call lifecycle correctness** — Caller marks `cancelled` on hang-up before accept; callee writes `accepted_at`; both write `duration_seconds` on `ended`. Auto-mark `missed` after 45s ringing via scheduled job or callee timer.
- **Reconnection & quality** — Handle ICE restart on `disconnected`; surface "Reconnecting…" banner; show dot indicator for poor connection from `getStats()`.
- **Permissions UX** — Pre-call mic/cam permission prompt with friendly copy; explain on denial how to re-enable in OS settings.

---

## Milestone 2 — Security & Privacy Hardening [2–3 sessions]

**Goal:** Pass a third-party security audit; protect user PII end-to-end.

- **RLS audit pass** — Re-review every table policy (calls, messages, profile_photos, stories, swipes, gift_transactions). Document each policy's intent in comments.
- **Resolve linter warnings** — Fix `Function Search Path Mutable` on all `SECURITY DEFINER` functions; revoke EXECUTE from `anon` where not needed; lock down public storage bucket listings.
- **Secrets review** — Confirm Stripe, Twilio, push keys live in Supabase secrets (never in `.env` shipped to client).
- **Rate limiting expansion** — Add limits to: call initiation (max 5/min), message sending, report creation, photo uploads.
- **PII leakage scan** — Verify `get_discovery_profiles` masks DOB → age, no exact lat/lng, no email/last_name.
- **Account deletion completeness** — Audit `delete-account` edge function for orphaned rows (calls, stories, reactions, push_subscriptions).
- **Content moderation** — Image moderation hook on photo upload (e.g. Sightengine / Hive); auto-quarantine on flag.
- **Session security** — Idle timeout + force-reauth for sensitive actions (delete account, change email, view ID verification).

---

## Milestone 3 — UX Polish & Accessibility [2 sessions]

**Goal:** Feel as smooth as Tinder/Hinge on every screen.

- **Empty states** — Designed empty states for: no matches, no messages, no calls, no likes, no stories, no venues nearby.
- **Loading skeletons** — Replace spinners with skeletons on Discover deck, Matches list, Chat history, Profile, Likes grid.
- **Animations & haptics** — Swipe-card spring physics tuning; haptic on like/super-like/match; subtle confetti on first match of day only (avoid fatigue).
- **Dark/light parity** — Sweep every component for hardcoded colors → semantic tokens; verify all images/icons in both modes.
- **Accessibility** — Aria-labels on all icon buttons, focus rings on interactive elements, color-contrast pass, screen-reader labels on swipe deck (announce profile name on focus).
- **Mobile gestures** — Pull-to-refresh on Discover/Matches; long-press on chat message → reaction picker (already present, polish); swipe-to-reply on chat bubble.
- **Onboarding micro-tour** — First-run coach marks on Discover (swipe hint), Matches (tap to chat), Profile (edit hint).
- **Internationalization scaffold** — Add `i18next` with English baseline; structure copy for future locales (Bemba/Nyanja for Zambia market).

---

## Milestone 4 — Performance & Reliability [1–2 sessions]

**Goal:** Sub-2s cold start, smooth 60fps interactions, resilient under flaky networks.

- **Bundle splitting** — Route-level lazy loading for SubPageRoute children, admin panel, subscription page.
- **Image optimization** — Serve WebP via Supabase image transform; lazy-load below-the-fold; blur-up placeholders.
- **Query caching** — Migrate ad-hoc `useEffect`+`supabase.from()` calls to React Query (already installed) for: matches list, profile, who-liked-you, call history.
- **Realtime channel hygiene** — Audit all `supabase.channel(...)` usages for proper cleanup; consolidate where possible (one channel per page, not per component).
- **Offline-first** — Cache last Discover deck & Matches list in IndexedDB; show stale data with banner when offline.
- **Service worker upgrade** — Workbox-based precache + runtime caching; background sync for queued message sends.
- **Error monitoring** — Wire Sentry (or PostHog) to `ErrorBoundary` and edge functions; track call-failure reasons.

---

## Milestone 5 — Monetization & Growth [2 sessions]

**Goal:** Convert free users to Premium; create viral loops.

- **Premium gates polish** — Soft-paywall on: Who Liked You blur, unlimited swipes, advanced filters, video calls (if monetized), profile boosts.
- **Subscription paywall screens** — Designed paywall with tiers, trust badges, FAQ, restore-purchases button.
- **In-app purchase native bridge** — Capacitor Stripe / RevenueCat integration for iOS/Play compliance (web Stripe is fine but stores require IAP).
- **Referral system** — Invite-a-friend → both get 1 day Premium; deep links via Capacitor App Links.
- **Daily rewards expansion** — 7-day login streak with escalating rewards (extra swipes → super-like → 1 boost).
- **Push re-engagement** — Server-scheduled pushes: "Sara liked you back!", "3 new people in Lusaka", weekly recap.

---

## Milestone 6 — New Features Roadmap [phased]

**Goal:** Differentiation beyond standard dating apps.

- **Date Nights at Venues** — Calendar of sponsored events at lodge_manager venues; matched pairs RSVP together.
- **AI Icebreakers** — On match, suggest 3 personalized openers via Lovable AI Gateway (analyzing both bios/interests).
- **Voice Prompts** — 30s audio answers to prompts (replaces/augments text prompts).
- **Stories v2** — Reactions + reply-to-story → DM (Instagram-style).
- **Group Dates** — 2-on-2 matching opt-in for users with high mutual compatibility.
- **Compatibility Quiz** — 10-question vibe quiz; results boost discovery ranking and unlock a compat % badge.
- **Live Events** — Speed-dating rooms (timed video calls, rotate every 3min) on Friday nights.

---

## Cross-Cutting Tracks (run alongside milestones)

- **App Store prep** — Privacy nutrition labels, age rating, screenshots, demo account, App Tracking Transparency prompt.
- **Legal** — GDPR data-export endpoint, cookie banner (web), updated ToS/Privacy for calls + AI features.
- **Admin tooling** — Reports queue triage UI, user search, ban/unban, broadcast announcements.
- **Analytics** — Funnel events: signup → onboard → first swipe → first match → first message → first call → first paid. Dashboard via PostHog.

---

## Suggested Sequencing

```text
Sprint 1: Milestone 1 (Calls) + start Milestone 2 (Security)
Sprint 2: Finish Milestone 2 + Milestone 3 (UX Polish)
Sprint 3: Milestone 4 (Performance) + Milestone 5 (Monetization basics)
Sprint 4: App Store prep + Milestone 6 phase 1 (AI Icebreakers, Date Nights)
Post-launch: Milestone 6 phase 2 (Group Dates, Live Events)
```

---

## Open Questions Before Implementation

1. **Native-first or web-first launch?** Affects IAP priority and TURN cost model.
2. **Budget for TURN/AI/moderation services?** Determines free vs paid providers.
3. **Target launch region?** Zambia-only first, or broader Africa? Affects i18n + payment rails (Mobile Money via Flutterwave?).
4. **Calls — keep video, or audio-only for MVP?** Video doubles bandwidth + moderation surface.
