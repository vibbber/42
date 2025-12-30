#!/usr/bin/env node

/**
 * Claude Code Instance Poller
 *
 * Registers a Claude Code instance and polls for requests from Telegram.
 * Supports multiple named instances (e.g., @ideas, @reviewer, @coder).
 *
 * Usage:
 *   INSTANCE_NAME=ideas INSTANCE_ROLE="Brainstorming and feature ideas" node mcp/poller.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.DEFAULT_CHAT_ID || -5040367963;

const POLL_INTERVAL = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const TMUX_SESSION = process.env.TMUX_SESSION || 'claude';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'ideas';
const INSTANCE_ROLE = process.env.INSTANCE_ROLE || 'General assistant';

// ============ Telegram ============

async function sendTelegram(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  return response.json();
}

// ============ Instance Registration ============

async function registerInstance() {
  // Upsert instance record
  const response = await fetch(`${SUPABASE_URL}/rest/v1/claude_instances`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      name: INSTANCE_NAME,
      role: INSTANCE_ROLE,
      tmux_session: TMUX_SESSION,
      chat_id: DEFAULT_CHAT_ID,
      status: 'online',
      connected_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    }),
  });

  const data = await response.json();
  return data[0] || data;
}

async function updateHeartbeat() {
  await fetch(`${SUPABASE_URL}/rest/v1/claude_instances?name=eq.${INSTANCE_NAME}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'online',
      last_seen: new Date().toISOString(),
    }),
  });
}

async function markOffline() {
  await fetch(`${SUPABASE_URL}/rest/v1/claude_instances?name=eq.${INSTANCE_NAME}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'offline',
    }),
  });
}

// ============ Request Handling ============

async function getPendingRequests() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/claude_requests?status=eq.pending&request=ilike.*@${INSTANCE_NAME}*&order=created_at.asc&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  return response.json();
}

async function markAsProcessing(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/claude_requests?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'processing' }),
  });
}

async function markAsCompleted(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/claude_requests?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'completed',
      responded_at: new Date().toISOString()
    }),
  });
}

// ============ tmux ============

function checkTmuxSession() {
  try {
    execSync(`tmux has-session -t ${TMUX_SESSION} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

function sendToTmux(message) {
  const escaped = message
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');

  try {
    execSync(`tmux send-keys -t ${TMUX_SESSION} "${escaped}" Enter`);
    return true;
  } catch (e) {
    console.error('Failed to send to tmux:', e.message);
    return false;
  }
}

// ============ Main Poll Loop ============

async function poll() {
  try {
    const requests = await getPendingRequests();

    if (requests.length === 0) {
      return;
    }

    const req = requests[0];
    console.log(`📨 New request from ${req.first_name || req.username}: ${req.request.substring(0, 50)}...`);

    if (!checkTmuxSession()) {
      console.error(`❌ tmux session '${TMUX_SESSION}' not found.`);
      await sendTelegram(req.chat_id, `❌ @${INSTANCE_NAME} is not running. Please start it first.`);
      return;
    }

    await markAsProcessing(req.id);

    // Build prompt - strip the @instance tag for cleaner prompt
    const cleanRequest = req.request.replace(new RegExp(`@${INSTANCE_NAME}\\s*`, 'gi'), '').trim();
    const prompt = `[Telegram from ${req.first_name || req.username}] ${cleanRequest}

Reply to chat_id ${req.chat_id} using the send_message MCP tool when done.`;

    if (sendToTmux(prompt)) {
      console.log(`✅ Sent to Claude Code`);
      await markAsCompleted(req.id);
    } else {
      await sendTelegram(req.chat_id, `❌ Failed to reach @${INSTANCE_NAME}. Try again.`);
    }

  } catch (e) {
    console.error('Poll error:', e);
  }
}

// ============ Startup ============

async function startup() {
  console.log(`\n🤖 Starting instance: @${INSTANCE_NAME}`);
  console.log(`📋 Role: ${INSTANCE_ROLE}`);
  console.log(`📺 tmux session: ${TMUX_SESSION}`);
  console.log(`🔄 Poll interval: ${POLL_INTERVAL/1000}s`);
  console.log(`💓 Heartbeat: ${HEARTBEAT_INTERVAL/1000}s\n`);

  // Check tmux
  if (!checkTmuxSession()) {
    console.warn(`⚠️  tmux session '${TMUX_SESSION}' not found.`);
    console.warn(`   Start it with: tmux new -s ${TMUX_SESSION}\n`);
  }

  // Register instance
  try {
    await registerInstance();
    console.log(`✅ Registered in Supabase`);
  } catch (e) {
    console.error('❌ Failed to register:', e.message);
  }

  // Announce to Telegram
  const announcement = `🤖 *@${INSTANCE_NAME}* is now online!

📋 *Role:* ${INSTANCE_ROLE}

Call me with: \`/cc @${INSTANCE_NAME} <request>\``;

  await sendTelegram(DEFAULT_CHAT_ID, announcement);
  console.log(`📢 Announced to Telegram\n`);

  // Start polling
  setInterval(poll, POLL_INTERVAL);
  poll();

  // Start heartbeat
  setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);
}

// ============ Graceful Shutdown ============

async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down...`);

  try {
    await markOffline();
    await sendTelegram(DEFAULT_CHAT_ID, `👋 @${INSTANCE_NAME} is now offline.`);
    console.log(`✅ Marked offline and announced`);
  } catch (e) {
    console.error('Shutdown error:', e.message);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start
startup().catch(console.error);
