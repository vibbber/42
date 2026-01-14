# Vibbber - Vibe Coding Venture

## Project Overview

Vibbber is a vibe coding venture studio with a knowledge capture engine at its core.

**The Thesis:** AI tools are commoditized - everyone has access to the same AI. The edge is knowing HOW to use it (10-100x productivity difference). We capture those workflows and distribute them.

**Napkin Sketch:** https://vibbber.com

## Project Structure

```
Vibbber/
├── apps/
│   ├── bot/           # Telegram bot (@vibbber_bot)
│   └── desktop/       # Knowledge engine (Claude Code wrapper)
├── docs/              # Planning docs, screenshots
├── logs/              # Session logs
└── .env               # Shared credentials
```

## Apps

### Desktop App (apps/desktop/) - IN DEVELOPMENT
The core knowledge engine - a wrapper around Claude Code that:
- Captures workflows automatically from sessions
- Distributes best workflows to users
- Ranks vibe coder skill
- Surfaces top talent for recruitment

**Status:** Not yet started

### Telegram Bot (apps/bot/)
Community layer - @vibbber_bot for group discussions.

**Bot:** @vibbber_bot
**Repo:** github.com/vibbber/42
**Live URL:** https://vibbber.netlify.app
**Netlify Site ID:** `18f96a15-061a-4dc3-8115-994c2f4e7898`

See `apps/bot/README.md` for bot-specific docs.

## Quick Links

| Resource | URL |
|----------|-----|
| Napkin Sketch | https://vibbber.com |
| Napkin Netlify Site ID | `904115ce-2607-46fd-84aa-16cb02b13c3b` |
| Telegram Bot | https://t.me/vibbber_bot |
| Bot Deploy | https://vibbber.netlify.app |
| GitHub (bot) | github.com/vibbber/42 |

## Autonomous Development Workflow

### The Golden Rule - ALWAYS Follow This Pattern:
```bash
1. Make code changes
2. git add -A && git commit -m "feat: description" && git push origin main
3. IMMEDIATELY (within 5 seconds) start streaming logs:
   netlify logs:deploy
   # Watch until you see "Build script success" or an error
4. If build fails:
   - Analyze the error from the logs
   - Fix the issue immediately
   - Repeat from step 1
5. If build succeeds, verify deployment:
   netlify api listSiteDeploys --data '{"site_id": "SITE_ID"}' | jq '.[0].state'
   # Must show "ready"
6. Test the deployed changes
7. If tests fail:
   - Debug what's wrong
   - Fix and repeat from step 1
```

**NEVER**:
- Wait to push code "until it's ready"
- Test only locally
- Skip deployment verification
- Leave broken code undeployed

### Real-time Build Monitoring
```bash
# Stream deployment logs in real-time
netlify logs:deploy

# Get deployment details (bot)
netlify api listSiteDeploys --data '{"site_id": "18f96a15-061a-4dc3-8115-994c2f4e7898"}' | jq '.[0:3]'

# Get deployment details (napkin)
netlify api listSiteDeploys --data '{"site_id": "904115ce-2607-46fd-84aa-16cb02b13c3b"}' | jq '.[0:3]'
```

### Your Full Permissions

You have COMPLETE autonomous control:

**Supabase**:
- ✅ Full management key access (in .env)
- ✅ Can run ANY Supabase CLI command
- ✅ Can modify schema, RLS policies, functions
- ✅ Can access service role for admin operations

**Netlify**:
- ✅ Full deployment access
- ✅ Can add/modify environment variables
- ✅ Can trigger deployments
- ✅ Can check deployment status

**GitHub**:
- ✅ Full repository access (vibbber account)
- ✅ Can push directly to main
- ✅ Can create branches, PRs
- ✅ Can manage secrets

**You are expected to work autonomously. Don't ask for permission - just do it!**

## Environment Variables

Shared credentials in root `.env`:
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `GITHUB_TOKEN` - PAT for vibbber GitHub account
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` - Database
- `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` - AI provider config
- `NETLIFY_AUTH_TOKEN` - For deployments

## Session Logs

Session logs are organized by month in `logs/` with individual files per session for efficient context loading.

**Structure:**
```
logs/
├── 2026-01/          # January 2026
│   ├── INDEX.md      # One-liner per session
│   └── NN-title.md   # Individual session files
├── 2025-12/          # December 2025
└── ...
```

**Looking up past sessions:**
1. Start with latest month's INDEX.md (e.g., `logs/2026-01/INDEX.md`)
2. Scan one-liners to find relevant session
3. Open just that session file for full details

## Session Management

### Wrap Protocol
When the user says **"WRAP"** or "wrap this session", perform end-of-session cleanup:

1. **Determine Session Number:**
   - Read `logs/YYYY-MM/INDEX.md` for current month
   - Find highest session number, add 1

2. **Create Session Log File:**
   - File: `logs/YYYY-MM/NN-short-title.md`
   - Example: `logs/2026-01/05-desktop-app-mvp.md`
   - Include: Summary, changes made, decisions, next steps

3. **Update Monthly Index:**
   - Add one-liner to `logs/YYYY-MM/INDEX.md`
   - Format: `05: Desktop app MVP and initial testing`

4. **Inform User:**
   - Tell user: "Session N wrapped successfully"

5. **Commit & Push:**
   - If applicable, commit changes to git

### Mid-Task WRAP
If wrapping during incomplete work:
- Add "Next Session Notes" section to session log
- Document: current progress, next steps, important context

### Other Session Rules
- **File deprecation**: Mark old files immediately when creating new versions with reason
- **Incomplete work**: Document current state and next steps in session logs

## Autonomous Working Principles

### ✅ ALWAYS Do Without Asking:
- Deploy to production (for prototyping/MVP stages)
- Fix bugs and errors
- Run tests and diagnostics
- Create automation scripts
- Update documentation
- Add console.log statements for debugging
- Create backup branches
- Try up to 10 different approaches to solve problems
- Update dependencies if needed
- Create new API endpoints
- Modify database schema for features
- Implement security best practices
- **Open HTML/mockup files in browser after creating them** (use `open` command)

### ❌ ALWAYS Ask Before:
- Deleting user data
- Major architectural refactors
- Rolling back deployed changes
- Setting up paid services
- Changing core business logic
- Removing existing features
- Modifying authentication flow

### 🤔 Use Judgment For:
- Performance optimizations (minor = do, major = ask)
- UI/UX changes (small = do, significant = ask)
- New dependencies (common = do, unusual = ask)

## Development Rules

### Critical Rules (NEVER BREAK THESE):
1. **Never create fallback systems** without explicit request
2. **Always create backup** before major changes
3. **Do only what's asked** - nothing more, nothing less
4. **Never create files** unless absolutely necessary
5. **Always prefer editing** existing files to creating new ones
6. **API keys go in .env file** - never in code or CLAUDE.md
7. **Never proactively create documentation files** unless requested

### File Management:
- Mark deprecated files immediately in CLAUDE.md
- Use git branches for major changes
- Keep todo list updated in real-time
- Document file purposes clearly

### Testing Approach:
- Always verify in browser first
- Create automated tests for critical paths
- Test edge cases and error states
- Document test scenarios

## The Sunbeam Debugging Protocol
When debugging issues, follow this systematic 5-step approach:

### Step 1: Browser Testing (Always First!)
- Manually reproduce the issue in browser
- Note exact steps to reproduce
- Take screenshots/record console errors
- Never claim something works without verification

### Step 2: Investigate Root Cause
- Trace data flow through components
- Check API responses
- Verify state management
- Identify exact failure point

### Step 3: Implement Minimal Fix
- Fix only what's broken
- Avoid refactoring unless necessary
- Test fix immediately
- Document any assumptions

### Step 4: Verify with Automation
- Create browser automation test
- Verify fix works consistently
- Test edge cases
- Ensure no regressions

### Step 5: Document Everything
- Update CLAUDE.md immediately
- Note what was broken and why
- Document the fix approach
- Update test documentation

## Deployment Information

### Napkin Sketch (vibbber.com)
**Netlify Site ID:** `904115ce-2607-46fd-84aa-16cb02b13c3b`
**Live URL:** https://vibbber.com
**Deploy folder:** `/Users/marcschwyn/Desktop/projects/BambooValley/vibe-coding/`

**Deploy command:**
```bash
cp /Users/marcschwyn/Desktop/projects/BambooValley/vibe-coding-napkin.html /Users/marcschwyn/Desktop/projects/BambooValley/vibe-coding/index.html && netlify deploy --prod --site 904115ce-2607-46fd-84aa-16cb02b13c3b --dir /Users/marcschwyn/Desktop/projects/BambooValley/vibe-coding
```

### Telegram Bot (vibbber.netlify.app)
**GitHub Repository:** github.com/vibbber/42
**Netlify Site ID:** `18f96a15-061a-4dc3-8115-994c2f4e7898`
**Live URL:** https://vibbber.netlify.app
**Webhook:** https://vibbber.netlify.app/.netlify/functions/webhook

**Deploy (auto via GitHub):**
```bash
cd apps/bot
git add -A && git commit -m "feat: description"
git push https://vibbber:$GITHUB_TOKEN@github.com/vibbber/42.git main
```

### Desktop App (apps/desktop/) - TBD
To be set up when development begins.

## Credentials Summary

| Service | Account | Notes |
|---------|---------|-------|
| Email | vibbber42@gmail.com | Project email |
| GitHub | vibbber | Has repo `42` |
| Netlify | vibbber | Multiple sites |
| Telegram | @vibbber_bot | Token in .env |
| Supabase | (shared) | Using BambooValley project |

## Roadmap

### Phase 1: Build the Desktop App (2 weeks)
- [ ] Define MVP feature set
- [ ] Build first prototype
- [ ] Test with initial experts
- [ ] Launch Telegram community alongside

### Phase 2: Open the Villa
- [ ] First cohort (~10 people)
- [ ] Project pipeline ready
- [ ] Talent sourcing from app + network

## Project Status
- **Version:** 0.1.0
- **Last Updated:** January 14, 2026
- **Status:** Strategic planning complete, failed startups research done
- **Recent:** Session 01 - Strategic discussion, 12 PMF candidates researched, hamburger nav added to vibbber.com
- **Next:** Review candidates with Kevin, decide Type 1 vs Type 3, then build app

## Key Resources
- **Strategic Discussion:** `docs/session-167-strategic-discussion.md` - Full capture of app architecture, three project types, companion model, interview→match pattern
- **Failed Startups Research:** https://vibbber.com/failed-startup-list.html - 12 candidates with detailed analysis
- **Workflow #1:** `docs/workflow-landing-page-design.html` - First skill document
