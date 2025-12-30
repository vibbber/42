#!/usr/bin/env node

/**
 * Claude Code Request Poller
 *
 * Polls Supabase for new /cc requests from Telegram and injects them
 * into a running Claude Code tmux session.
 *
 * Usage:
 *   1. Start Claude Code in tmux: tmux new -s claude
 *   2. Run this poller: node mcp/poller.js
 *   3. Send /cc requests from Telegram
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
const POLL_INTERVAL = 5000; // 5 seconds
const TMUX_SESSION = process.env.TMUX_SESSION || 'claude';

let lastCheckTime = new Date().toISOString();

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function getPendingRequests() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/claude_requests?status=eq.pending&order=created_at.asc&limit=1`,
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

function checkTmuxSession() {
  try {
    execSync(`tmux has-session -t ${TMUX_SESSION} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

function sendToTmux(message) {
  // Escape special characters for tmux
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

async function poll() {
  try {
    const requests = await getPendingRequests();

    if (requests.length === 0) {
      return;
    }

    const req = requests[0];
    console.log(`📨 New request from ${req.first_name || req.username}: ${req.request.substring(0, 50)}...`);

    // Check tmux session exists
    if (!checkTmuxSession()) {
      console.error(`❌ tmux session '${TMUX_SESSION}' not found. Start Claude Code in tmux first.`);
      await sendTelegram(req.chat_id, `❌ Claude Code is not running. Please start it first.`);
      return;
    }

    // Mark as processing
    await markAsProcessing(req.id);

    // Build the prompt for Claude Code
    const prompt = `[Telegram request from ${req.first_name || req.username}] ${req.request}

After completing this request, use the send_message MCP tool to respond to chat_id ${req.chat_id}`;

    // Send to tmux
    if (sendToTmux(prompt)) {
      console.log(`✅ Sent to Claude Code`);
      await markAsCompleted(req.id);
    } else {
      await sendTelegram(req.chat_id, `❌ Failed to send to Claude Code. Try again.`);
    }

  } catch (e) {
    console.error('Poll error:', e);
  }
}

// Main loop
console.log(`🔄 Polling for Claude Code requests (every ${POLL_INTERVAL/1000}s)`);
console.log(`📺 tmux session: ${TMUX_SESSION}`);
console.log(`   Press Ctrl+C to stop\n`);

// Initial check for tmux
if (!checkTmuxSession()) {
  console.warn(`⚠️  tmux session '${TMUX_SESSION}' not found.`);
  console.warn(`   Start it with: tmux new -s ${TMUX_SESSION}`);
  console.warn(`   Then run Claude Code inside it.\n`);
}

setInterval(poll, POLL_INTERVAL);
poll(); // Run immediately
