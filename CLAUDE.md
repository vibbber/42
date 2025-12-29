# Vibbber 42 - Self-Improving Telegram Bot

## Project Overview
A self-improving Telegram bot that can modify its own code based on group chat discussions. Built for vibe coding sessions with friends.

**Bot:** @vibbber_bot
**Repo:** github.com/vibbber/42
**Live URL:** https://vibbber.netlify.app
**Webhook:** https://vibbber.netlify.app/.netlify/functions/webhook

## How It Works
1. Add bot to group, make it admin
2. Chat naturally about what you want to build
3. Send 🚀 to trigger analysis
4. Bot reads last 20 messages, proposes what to build
5. Click 👍 to approve, 👎 to reject
6. Bot modifies its own code, commits to GitHub, auto-deploys

## Tech Stack
- **Runtime:** Netlify Functions (serverless)
- **Database:** Supabase (message storage)
- **LLM:** Configurable (DeepSeek, OpenAI, Kimi)
- **Version Control:** GitHub (vibbber/42)
- **Bot Platform:** Telegram Bot API

## Quick Commands

### Deploy Changes
```bash
cd /Users/marcschwyn/Desktop/projects/vibbber
git add -A && git commit -m "feat: description"
git push https://vibbber:$GITHUB_TOKEN@github.com/vibbber/42.git main
```

### Check Deploy Status
```bash
curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  "https://api.netlify.com/api/v1/sites/18f96a15-061a-4dc3-8115-994c2f4e7898/deploys?per_page=1" \
  | jq '.[0] | {state, created_at}'
```

### Add Netlify Env Var
```bash
curl -s -X POST "https://api.netlify.com/api/v1/accounts/695213bc916017ee0bbe33e8/env?site_id=18f96a15-061a-4dc3-8115-994c2f4e7898" \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '[{"key":"VAR_NAME","values":[{"context":"all","value":"VAR_VALUE"}]}]'
```

### Set Telegram Webhook
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://vibbber.netlify.app/.netlify/functions/webhook"
```

## Environment Variables

### Required (in Netlify)
| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `GITHUB_TOKEN` | PAT with repo scope |
| `GITHUB_OWNER` | `vibbber` |
| `GITHUB_REPO` | `42` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `LLM_PROVIDER` | `deepseek`, `openai`, or `kimi` |
| `LLM_API_KEY` | API key for chosen provider |
| `LLM_MODEL` | Model name (e.g., `deepseek-chat`) |

### Local (.env file)
All credentials stored in `/Users/marcschwyn/Desktop/projects/vibbber/.env`

## Database

### Table: vibbber_messages
```sql
CREATE TABLE vibbber_messages (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vibbber_messages_chat_created ON vibbber_messages(chat_id, created_at DESC);
```

Located in BambooValley Supabase project: `xunccqdrybxpwcvafvag`

## Bot Commands
- `/start` - Introduction message
- `/status` - Show LLM provider, Supabase status
- `/code` - Link to source code
- `/modify <request>` - Direct code modification

## Credentials Summary
| Service | Account | Notes |
|---------|---------|-------|
| Email | vibbber42@gmail.com | Project email |
| GitHub | vibbber | Has repo `42` |
| Netlify | vibbber | Site ID: 18f96a15-061a-4dc3-8115-994c2f4e7898 |
| Telegram | @vibbber_bot | Token in .env |
| Supabase | (shared) | Using BambooValley project |

## Project Status
- **Version:** 1.0.0
- **Last Updated:** December 29, 2025
- **Status:** Active - needs LLM API key to be fully functional

## Session Logs

Session logs are organized by month with individual files per session.

**Structure:**
```
logs/
└── 2025-12/
    ├── INDEX.md              # One-liner per session
    └── 01-vibbber-setup.md   # Full session details
```

**Looking up past sessions:**
1. Open `logs/YYYY-MM/INDEX.md` for the relevant month
2. Find session by one-liner description
3. Open the full session file for details

## Wrap Protocol

When wrapping a session:

1. **Determine Session Number:** Check `logs/YYYY-MM/INDEX.md`, find highest number, add 1
2. **Create Session Log:** `logs/YYYY-MM/NN-short-title.md` with summary, changes, next steps
3. **Update Monthly Index:** Add one-liner to `logs/YYYY-MM/INDEX.md`
4. **Inform User:** "Session N wrapped successfully"
5. **Commit & Push:** All changes to GitHub

## Autonomous Development Workflow

### The Golden Rule
```bash
1. Make code changes
2. git add -A && git commit -m "feat: description"
3. git push https://vibbber:$GITHUB_TOKEN@github.com/vibbber/42.git main
4. Netlify auto-deploys (check status if needed)
5. Test the deployed changes
6. If broken, fix and repeat
```

**Note:** Use the vibbber GitHub token for pushes (stored in .env)

## Roadmap
1. [x] Basic bot with self-modification
2. [x] Message storage in Supabase
3. [x] Rocket trigger + approval flow
4. [ ] Get working LLM API key
5. [ ] Build MCP server for Claude Code integration
6. [ ] Full approval → implementation flow
