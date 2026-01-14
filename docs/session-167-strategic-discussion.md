# Session 167: Vibbber Strategic Discussion

**Date:** January 14, 2026

This document captures the strategic conversation about Vibbber before diving into startup research.

---

## 1. Why Automated App Builders Won't Work

Marc's response to Kevin showing another automated app builder:

> "I gave it a try. Feels similar to lovable.dev. There's a ton of teams building fully autonomous website and/or business builders.
>
> IMO it's the wrong approach. It doesn't work yet because the models aren't good enough yet and context windows are still too small - so these things break down as soon as you get to a certain level of complexity. Then you need to move to Claude Code to manage the backend directly.
>
> This could change when the next round of Claude, ChatGPT or Gemini arrive (probably 3-9 months). And once they all increase their context windows to 1M+ (Gemini is already there but their coding isn't good enough).
>
> When that happens you can probably just do everything directly with the frontier model. That's what Claude co-work is for. You won't need a wrapper.
>
> **The knowledge layer gives us a stronger advantage. It doesn't matter how good these models get... you'll always need to know how to use them to get the best results. Plus the knowledge database gives us a moat.**"

### Key Insights:

- Even at 200K context window, if you give Claude a 200K token prompt, things get "wonky" - instructions get missed, internal inconsistencies cause weird choices
- Full automation of everything is at least 1 year away
- All these wrapper apps use Claude in the background anyway - if they're not using Claude, they're using something inferior
- The complexity bar where things break down is actually "pretty low"
- Once the tech IS ready, you'll use Claude directly - wrappers solve temporary problems

**Bottom line:** Don't get distracted by wrapper announcements. Stay aware, but don't invest time testing them.

---

## 2. The Three Project Types

### Type 1: Failed Startups with PMF
- Apps that found product-market fit but failed because they needed big teams
- Now the same thing can be done with 1-2 person AI team
- **Concern:** Many might be outdated

### Type 2: Niche Market Apps
- Products that weren't feasible before (market too small for traditional dev costs)
- Similar workflow to Type 1
- Harder to find good ones

### Type 3: AI Innovation Apps
- Apps that do something that wasn't possible before
- Requires "quite a bit of tinkering"
- Less structured workflow, more open exploration

---

## 3. The Interview → Match Pattern (Type 3)

Marc identified a recurring pattern across multiple app ideas:

**Structure:** Deep AI interview → Profile/Data → Match with database

**Examples:**
- **Soulmate finder** - AI interviews people, stores profiles, uses psychological frameworks, matches when it finds compatible people (friends, business partners, romantic)
- **Hiring** - Interview companies AND candidates deeply, match based on fit
- **Child support (Bloom)** - Interview about the child, match with solutions
- **Vibbber itself** - Interview vibe coders, match with workflows

> "This is the same concept as Bloom, the same concept as our app that we want to build... we're basically the AI will be trained to get the right information out of you and then based on that information it will get the right information out of a database."

---

## 4. For Any Project Type: The Path is the Same

Regardless of which type of project Vibbber focuses on:

1. **Claude Code directly** (not wrappers)
2. **Own infrastructure** (Supabase, Netlify, etc.)
3. **Own custom app/workflows** for the team
4. **Train people** with a small crash course upfront
5. **Way more powerful** than any wrapper, especially if customized

---

## 5. The Vibbber App Architecture

### New Project Setup Flow

**Step 1: Create Project**
- Open app → "Create New Project" → enter name
- Auto-creates folder with:
  - `CLAUDE.md` (template)
  - `.env` (empty, ready for keys)
  - `logs/` folder
  - `mockups/` folder
  - Basic structure

**Step 2: Account Setup (guided by app)**
1. Create Gmail → store password in .env (for org access)
2. Create GitHub (via Gmail) → get API key → store in .env
3. Create Supabase (via GitHub) → get management API key → store in .env
4. Create Netlify (via GitHub) → get management API key → store in .env
5. CLAUDE.md auto-updates with project info

**Decision:** Individual accounts per project (not org keys) - keeps things clean and isolated

**Step 3: Fire Up Instances**
- App can open Claude Code instances directly (no need to cd to directory)
- App tracks all running instances with custom names
- **Notification feature:** Bing when any instance finishes working

---

## 6. Workflow Philosophy: Flexible, Not Rigid

- **No strict checklists** you MUST follow
- **Tasks you CAN pick from**
- Claude pulls relevant skills when you select a task
- Guided but not forced

### First Task: "Get Started with this project"

Loads the **Project Initiation Interview Skill**:
- Claude interviews you to learn everything about the project
- Things you don't know → you realize you need to find out
- Things Claude can find → web research, or you paste content
- Interview continues until everything necessary is figured out

**Key Constraint:** Projects must be **clear from start to end**
- No innovation needed
- Known scope, known approach
- If innovation IS needed → different process entirely

**Output of Interview:**
1. **CLAUDE.md** - populated with all project information
2. **planning.md** - basic bullet point overview:
   - What the project is
   - How we're going to build it
   - Critical/difficult parts
   - Basic roadmap

**Critical insight:** Don't get too detailed too quickly - things break down. Start with high-level overview, details come later.

---

## 7. Build Phase Workflow

1. Map out basic features
2. **UX/UI/Branding** → run the Landing Page Design skill → end with polished skin
3. Expand planning.md with detailed features (now visible in the design)
4. Break into phases → implement one by one
5. **Couple days → prototype ready**

---

## 8. The Companion Model (Critical Architecture Decision)

**The app is a companion, NOT a controller:**

- Terminal stays open, you can deviate anytime
- App runs in background, provides info when needed
- Use different workflows, different tools - your choice
- **But the system watches what you're doing** (because you're talking to AI through it)
- When something works really well → flagged, submitted, reviewed
- **This is how new workflows get discovered** → feeds the knowledge database

> "You're not locked into the app's way of doing things. The app is a helpful companion that tracks what works. Freedom to deviate = people discover new approaches = system learns = everyone benefits."

---

## 9. Marketing Phase (Same System)

After prototype is ready:
- Connect Claude to Google Analytics
- SEO automation
- Paid optimization
- All Claude-driven
- Knowledge database grows the same way

---

## 10. The Talent Flow

Once the decision is made on project type:

1. Design app architecture for that specific type
2. App handles so much that trainers just need to be available
3. Start with Marc + Kevin
4. Bring in juniors → they build projects
5. Best performers → become next trainers
6. Projects ship, system learns, cycle continues

---

## 11. The Decision That Needs to Be Made

**Before building the app:**
1. Look at actual projects in each category
2. Decide which is more interesting/viable
3. **Then** build the app tailored for that type

**Marc's gut feeling:** Type 1 (copying failed PMF apps) might be full of outdated stuff - need to validate by looking at real examples.

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `docs/workflow-landing-page-design.html` | First workflow skill - how to create a landing page |
| `docs/failed-startups-index.html` | Research on 12 failed startups with PMF |

---

## Key URLs

- **Napkin Sketch:** https://vibbber.com
- **Failed Startups Research:** https://vibbber.com/failed-startup-list.html
- **Netlify Site ID:** `904115ce-2607-46fd-84aa-16cb02b13c3b`

---

## Next Steps

1. Review failed startups list with Kevin
2. Pick 3-5 most interesting candidates
3. Decision: Type 1 (rebuild) vs Type 3 (AI innovation)
4. Build app tailored for chosen direction
