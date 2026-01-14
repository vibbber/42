# Session 01: Strategic Discussion & Failed Startups Research

**Date:** January 14, 2026

---

## Summary

Major strategic planning session covering why automated app builders won't work, the three project types for Vibbber, app architecture design, and comprehensive research on failed startups with PMF as rebuild candidates.

---

## Key Decisions

### Why Automated App Builders Won't Work
- Models aren't good enough yet, context windows too small
- Things break down at "pretty low" complexity
- Once tech IS ready, you'll use Claude directly - wrappers solve temporary problems
- **The knowledge layer gives a stronger moat** - knowing HOW to use AI is the edge

### Three Project Types Identified
1. **Type 1:** Failed startups with PMF (failed due to cost, not product)
2. **Type 2:** Niche market apps (too small for traditional dev costs)
3. **Type 3:** AI innovation apps (things that weren't possible before)

### The Interview → Match Pattern (Type 3)
Recurring pattern across app ideas:
- Deep AI interview → Profile/Data → Match with database
- Examples: Soulmate finder, hiring, child support (Bloom), Vibbber itself

### App Architecture
- Companion model, NOT controller
- Terminal stays open, user can deviate anytime
- System watches and learns from what works
- Flexible workflows, not rigid checklists

---

## Files Created

| File | Purpose |
|------|---------|
| `docs/workflow-landing-page-design.html` | First workflow skill - 5-step landing page creation process |
| `docs/failed-startups-index.html` | Research doc with 12 PMF candidates |
| `docs/session-167-strategic-discussion.md` | Full strategic discussion capture |

---

## Deployed Changes

**vibbber.com:**
- Added hamburger menu navigation (top right)
- Added `/failed-startup-list.html` with 12 failed startups analysis
- Removed inline link from middle of napkin, moved to nav

---

## Failed Startups Research Summary

### Tier 1 (Best AI Rebuild Candidates)
| Startup | Raised | Why It's Hot |
|---------|--------|--------------|
| **Zirtual** | $5.5M | Virtual assistants → AI can do 80-90% now |
| **Tally** | $172M | Debt automation → execution failure, not tech |
| **Atrium** | $75M | Legal for startups → AI contract review now possible |
| **ScaleFactor** | $100M+ | AI accounting that actually works now |
| **Homejoy** | $65M | Home cleaning marketplace → AI retention/matching |
| **Convoy** | $1B+ | Digital freight → optimization is AI-native |

### Tier 2 (Strong PMF, Moderate AI Opportunity)
- Braid (shared wallets), Fast (one-click checkout), Fuzzy (pet telehealth), Artifact (AI news)

### Tier 3 (Less Clear AI Advantage)
- Eaze (cannabis delivery), Boosted (e-skateboards), Mandolin (virtual concerts)

---

## Next Steps

1. Review failed startups list with Kevin
2. Pick 3-5 most interesting candidates
3. Decision: Type 1 (rebuild) vs Type 3 (AI innovation)
4. Build app tailored for chosen direction

---

## Context for Future Sessions

The strategic discussion is fully captured in `docs/session-167-strategic-discussion.md` - this includes:
- Full app architecture details
- Onboarding flow (Gmail → GitHub → Supabase → Netlify)
- Workflow philosophy (flexible, not rigid)
- Build phase workflow
- Marketing phase approach
- Talent flow model
