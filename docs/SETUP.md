# Vibbber - Claude Code Telegram Integration

Complete setup guide for connecting Claude Code instances to Telegram.

## System Overview

Vibbber allows multiple Claude Code instances to receive commands from Telegram and respond back. Each instance can have a unique name and role (e.g., `@ideas` for brainstorming, `@reviewer` for code review).

### Architecture

```
Telegram Group
     │
     ▼
┌─────────────────┐
│  Vibbber Bot    │  (Netlify Function)
│  - /cc @name    │  Stores requests in Supabase
│  - /instances   │  Shows connected instances
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│  claude_requests│  Pending requests queue
│  claude_instances│ Registered instances
│  vibbber_messages│ Chat history
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Poller (local) │  Polls every 5s for @name requests
│  node poller.js │  Injects into tmux session
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude Code    │  Running in tmux
│  (tmux session) │  Has MCP tools to respond
└─────────────────┘
```

## Prerequisites

- **Node.js** v18+
- **tmux** - `brew install tmux`
- **Claude Code** - `npm install -g @anthropic-ai/claude-code`
- Access to:
  - Telegram Bot (@BotFather)
  - Supabase project
  - Netlify account (for webhook hosting)

## Environment Variables

Create a `.env` file in the project root:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# GitHub (for self-modification feature)
GITHUB_TOKEN=your_github_pat
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo

# Optional: Default chat for announcements
DEFAULT_CHAT_ID=-1234567890
```

### Getting the Keys

| Key | How to get it |
|-----|---------------|
| `TELEGRAM_BOT_TOKEN` | Message @BotFather on Telegram, `/newbot`, follow prompts |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens |
| `DEFAULT_CHAT_ID` | Add bot to group, send `/groupid` command |

## Database Setup

Run these SQL commands in Supabase Dashboard → SQL Editor:

### Table: vibbber_messages
Stores all messages for context.
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

### Table: claude_requests
Queue for /cc requests.
```sql
CREATE TABLE claude_requests (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  request TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX idx_claude_requests_status ON claude_requests(status, created_at DESC);
```

### Table: claude_instances
Tracks connected Claude Code instances.
```sql
CREATE TABLE claude_instances (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  role TEXT,
  tmux_session TEXT,
  chat_id BIGINT,
  status TEXT DEFAULT 'offline',
  connected_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_claude_instances_status ON claude_instances(status);
```

## MCP Server

The MCP server (`mcp/index.js`) provides tools for Claude Code to interact with Telegram.

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_messages` | Fetch recent messages | `chat_id` (optional), `limit` (default 50, max 200) |
| `get_chats` | List all chat IDs | none |
| `send_message` | Send to Telegram | `chat_id` (required), `text` (required) |
| `call_instance` | Send request to another instance | `instance_name` (required), `request` (required), `chat_id` (required), `from_instance` (optional) |

**Note:** Use `call_instance` for instance-to-instance communication. Telegram doesn't relay bot messages to webhooks, so sending `/cc @reviewer` via `send_message` won't work. Use `call_instance` instead.

### Configuration

The `.mcp.json` file in project root auto-configures the MCP server:
```json
{
  "mcpServers": {
    "vibbber": {
      "command": "node",
      "args": ["mcp/index.js"]
    }
  }
}
```

Claude Code automatically loads this when started in the project directory.

## Running an Instance

### Step 1: Start tmux session
```bash
tmux new -s claude
```

### Step 2: Start Claude Code inside tmux
```bash
cd /path/to/Vibbber
claude
```

### Step 3: Start the poller (from within Claude Code or another terminal)
```bash
# Basic (defaults to @ideas)
node mcp/poller.js

# Custom instance
INSTANCE_NAME=reviewer INSTANCE_ROLE="Code review and quality" node mcp/poller.js

# Or run from within Claude Code as background task
```

### Environment Variables for Poller

| Variable | Default | Description |
|----------|---------|-------------|
| `INSTANCE_NAME` | `ideas` | The @name to respond to |
| `INSTANCE_ROLE` | `General assistant` | Description shown in /instances |
| `TMUX_SESSION` | `claude` | tmux session to inject into |
| `POLL_INTERVAL` | `5000` | Milliseconds between polls |

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Introduction and help |
| `/cc @name <request>` | Send request to specific instance |
| `/instances` | List all registered instances with status |
| `/status` | Show bot configuration |
| `/code` | Link to source code |

## Multi-Instance Example

Run multiple specialists simultaneously:

**Terminal 1 - Ideas Guy:**
```bash
tmux new -s ideas
cd /path/to/Vibbber && claude
# Then start poller:
INSTANCE_NAME=ideas INSTANCE_ROLE="Brainstorming features" node mcp/poller.js
```

**Terminal 2 - Code Reviewer:**
```bash
tmux new -s reviewer
cd /path/to/Vibbber && claude
# Then start poller:
INSTANCE_NAME=reviewer INSTANCE_ROLE="Code review" TMUX_SESSION=reviewer node mcp/poller.js
```

**From Telegram:**
```
/instances                          → Shows both instances
/cc @ideas what should we build?    → Goes to Ideas Guy
/cc @reviewer check my PR           → Goes to Code Reviewer
```

## Responding to Requests

When a request comes in, Claude Code receives a prompt like:
```
[Telegram from Marc] what features should we build next?
Reply to chat_id -5040367963 using the send_message MCP tool when done.
```

To respond, use the MCP `send_message` tool:
```
Use send_message to chat_id -5040367963 with your response
```

## Instance Lifecycle

1. **Startup**: Poller registers in `claude_instances`, announces to Telegram
2. **Running**: Heartbeat updates `last_seen` every 30 seconds
3. **Shutdown**: Ctrl+C triggers graceful shutdown, marks offline, announces departure

## Troubleshooting

### "tmux session not found"
The poller can't find the tmux session. Make sure:
- tmux is running: `tmux new -s claude`
- Session name matches: `TMUX_SESSION=claude`

### Message stuck in input box
The Enter key wasn't sent. This was fixed - make sure you have the latest `poller.js`.

### Bot not responding to /cc
- Check Netlify deploy is complete
- Verify webhook is set: `curl "https://api.telegram.org/bot$TOKEN/getWebhookInfo"`
- Check Supabase table exists

### Instance shows offline but is running
The heartbeat may have failed. Restart the poller.

## File Structure

```
Vibbber/
├── .env                    # Credentials (git-ignored)
├── .mcp.json              # MCP server config
├── CLAUDE.md              # Instructions for Claude Code
├── netlify/
│   └── functions/
│       └── webhook.js     # Telegram webhook handler
├── mcp/
│   ├── index.js           # MCP server
│   ├── poller.js          # Instance poller
│   └── package.json       # Dependencies
└── docs/
    └── SETUP.md           # This file
```

## Deploying Changes

```bash
git add -A && git commit -m "feat: description"
git push origin main
# Netlify auto-deploys
```

Check deploy status:
```bash
curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  "https://api.netlify.com/api/v1/sites/YOUR_SITE_ID/deploys?per_page=1" \
  | jq '.[0] | {state, created_at}'
```
