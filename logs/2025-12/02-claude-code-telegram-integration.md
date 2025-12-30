# Session 02: Claude Code Telegram Integration

**Date:** December 30, 2025

## Summary

Built a complete system for connecting Claude Code instances to Telegram, enabling remote control and multi-agent workflows.

## What Was Built

### 1. MCP Server (`mcp/index.js`)
- `get_messages` - Fetch messages from Supabase
- `get_chats` - List active chat IDs
- `send_message` - Send to Telegram

### 2. Multi-Instance Poller (`mcp/poller.js`)
- Polls Supabase for `/cc @name` requests
- Injects prompts into tmux sessions via `tmux send-keys`
- Registers instances in `claude_instances` table
- Heartbeat every 30s to track online status
- Graceful shutdown with offline announcement

### 3. Database Tables
- `claude_requests` - Queue for /cc requests
- `claude_instances` - Registered instances with status

### 4. Bot Commands
- `/cc @name <request>` - Send to specific instance
- `/instances` - Show all connected instances

### 5. Documentation
- `docs/SETUP.md` - Comprehensive setup guide

## Key Decisions

- **tmux for injection** - Only reliable way to "wake up" an idle Claude Code session
- **Supabase polling** - Simpler than ngrok/webhooks, no external dependencies
- **@name routing** - Each poller filters by its instance name
- **Same group, multiple instances** - Chat ID differentiates, @name routes

## Architecture

```
Telegram /cc @ideas → Supabase queue → Poller → tmux send-keys → Claude Code
                                                                      ↓
                                                            MCP send_message
                                                                      ↓
                                                              Telegram reply
```

## Security Notes

- This is essentially RCE via Telegram - only safe for private/trusted groups
- Anyone in the group can control Claude Code instances
- Mitigation: Use private groups with only yourself

## Files Changed

- `netlify/functions/webhook.js` - Added /cc, /instances commands
- `mcp/index.js` - MCP server (new)
- `mcp/poller.js` - Instance poller (new)
- `mcp/package.json` - Dependencies
- `.mcp.json` - MCP config
- `docs/SETUP.md` - Documentation (new)
- `CLAUDE.md` - Updated with integration docs

## Next Steps

- Test multi-instance communication (@ideas → @coder handoffs)
- Add user allowlist for security
- Consider approval flow for sensitive requests
- Explore persistent instance state across restarts
