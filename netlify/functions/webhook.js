// Vibbber 42 - Self-Improving Telegram Bot
// This bot can modify its own code when asked

// Environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'vibbber';
const GITHUB_REPO = process.env.GITHUB_REPO || '42';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// LLM Configuration - easily switchable
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'deepseek'; // 'deepseek', 'openai', 'kimi'
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-chat';

const LLM_CONFIGS = {
  deepseek: { url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  kimi: { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' }
};

// Store message in Supabase
async function storeMessage(chatId, userId, username, firstName, text) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/vibbber_messages`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ chat_id: chatId, user_id: userId, username, first_name: firstName, text })
    });
  } catch (e) { console.error('Store message error:', e); }
}

// Get recent messages from Supabase
async function getRecentMessages(chatId, limit = 20) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/vibbber_messages?chat_id=eq.${chatId}&order=created_at.desc&limit=${limit}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const messages = await response.json();
    return messages.reverse(); // Chronological order
  } catch (e) { console.error('Get messages error:', e); return []; }
}

// Send message to Telegram
async function sendTelegram(chatId, text, replyMarkup = null) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

// Call LLM API (provider-agnostic)
async function askLLM(messages) {
  const config = LLM_CONFIGS[LLM_PROVIDER] || LLM_CONFIGS.deepseek;
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL || config.model,
        messages,
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (data.error) {
      console.error('LLM Error:', data.error);
      return `LLM Error: ${data.error.message || 'Unknown error'}`;
    }
    return data.choices?.[0]?.message?.content || 'No response from LLM';
  } catch (e) {
    console.error('LLM request failed:', e);
    return 'LLM request failed';
  }
}

// Get file from GitHub
async function getGitHubFile(path) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'Vibbber42' } }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
}

// Update file on GitHub
async function updateGitHubFile(path, content, message, sha) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vibbber42'
      },
      body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha })
    }
  );
  return response.ok;
}

// Pending proposals storage (in-memory, resets on deploy - could move to Supabase)
const pendingProposals = new Map();

// Main handler
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'Vibbber 42 is alive!' };
  }

  try {
    const body = JSON.parse(event.body);

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const callback = body.callback_query;
      const data = callback.data;
      const chatId = callback.message.chat.id;
      const messageId = callback.message.message_id;

      if (data.startsWith('approve_')) {
        const proposalId = data.replace('approve_', '');
        await sendTelegram(chatId, `Approved! Implementing proposal ${proposalId}...`);
        // TODO: Implement the approved proposal
      } else if (data.startsWith('reject_')) {
        await sendTelegram(chatId, `Rejected. Let's discuss more and try again with another approach.`);
      }

      // Answer the callback to remove loading state
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id })
      });

      return { statusCode: 200, body: 'ok' };
    }

    const message = body.message;
    if (!message?.text) return { statusCode: 200, body: 'ok' };

    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from?.id;
    const username = message.from?.username || 'unknown';
    const firstName = message.from?.first_name || '';

    console.log(`[${chatId}] ${username}: ${text}`);

    // Store every message for context
    await storeMessage(chatId, userId, username, firstName, text);

    // === COMMANDS ===

    // /start - Introduction
    if (text === '/start' || text === '/start@vibbber_bot') {
      await sendTelegram(chatId,
        `*Vibbber 42* - Self-Improving Bot\n\n` +
        `Chat naturally in your group. When ready to build:\n\n` +
        `Send the rocket emoji to activate me. I'll read the last 100 messages, propose what to build, and wait for your approval.\n\n` +
        `Other commands:\n` +
        `/status - Check my status\n` +
        `/code - View my source code\n` +
        `/modify <request> - Direct modification`
      );
      return { statusCode: 200, body: 'ok' };
    }

    // /status - Show status
    if (text === '/status' || text === '/status@vibbber_bot') {
      await sendTelegram(chatId,
        `*Vibbber 42 Status*\n\n` +
        `LLM: ${LLM_PROVIDER} (${LLM_MODEL})\n` +
        `Repo: github.com/${GITHUB_OWNER}/${GITHUB_REPO}\n` +
        `Supabase: ${SUPABASE_URL ? 'Connected' : 'Not configured'}\n` +
        `Self-modification: Enabled`
      );
      return { statusCode: 200, body: 'ok' };
    }

    // /code - Show source code
    if (text === '/code' || text === '/code@vibbber_bot') {
      const file = await getGitHubFile('netlify/functions/webhook.js');
      if (file) {
        const lines = file.content.split('\n').length;
        await sendTelegram(chatId, `My source: ${lines} lines\nhttps://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/main/netlify/functions/webhook.js`);
      } else {
        await sendTelegram(chatId, 'Could not fetch source code.');
      }
      return { statusCode: 200, body: 'ok' };
    }

    // /modify <request> - Direct modification
    if (text.startsWith('/modify ') || text.startsWith('/modify@vibbber_bot ')) {
      const request = text.replace(/^\/modify(@vibbber_bot)? /, '');
      await sendTelegram(chatId, `Analyzing: "${request}"...`);

      const file = await getGitHubFile('netlify/functions/webhook.js');
      if (!file) {
        await sendTelegram(chatId, 'Error: Could not fetch source code.');
        return { statusCode: 200, body: 'ok' };
      }

      const llmResponse = await askLLM([
        {
          role: 'system',
          content: `You are a code modification assistant. Output ONLY the complete modified JavaScript code. No explanations, no markdown code blocks, just raw code. The code runs as a Netlify Function.`
        },
        {
          role: 'user',
          content: `Current source code:\n\n${file.content}\n\n---\n\nModification request: ${request}\n\nOutput the complete modified source code:`
        }
      ]);

      if (!llmResponse.includes('export async function handler')) {
        await sendTelegram(chatId, `Modification failed - invalid code. Error: ${llmResponse.substring(0, 200)}`);
        return { statusCode: 200, body: 'ok' };
      }

      const success = await updateGitHubFile('netlify/functions/webhook.js', llmResponse, `Self-mod: ${request.substring(0, 50)}`, file.sha);

      if (success) {
        await sendTelegram(chatId, `Committed! Auto-deploying...\nhttps://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commits/main`);
      } else {
        await sendTelegram(chatId, 'Failed to commit. Check GitHub permissions.');
      }
      return { statusCode: 200, body: 'ok' };
    }

    // ROCKET TRIGGER - Analyze conversation and propose
    if (text.includes('🚀')) {
      await sendTelegram(chatId, `Analyzing your conversation...`);

      const recentMessages = await getRecentMessages(chatId, 100);

      if (recentMessages.length < 2) {
        await sendTelegram(chatId, `Not enough conversation history yet. Chat more, then try again!`);
        return { statusCode: 200, body: 'ok' };
      }

      const conversation = recentMessages
        .filter(m => !m.text.includes('🚀') && !m.text.startsWith('/'))
        .map(m => `${m.first_name || m.username}: ${m.text}`)
        .join('\n');

      const file = await getGitHubFile('netlify/functions/webhook.js');

      const proposal = await askLLM([
        {
          role: 'system',
          content: `You are analyzing a group chat discussion to identify what feature or improvement they want to build for their Telegram bot.

Based on their conversation, propose what to implement. Be specific and actionable.

Format your response as:
**Proposal:** [One sentence summary]

**What I'll do:**
1. [Step 1]
2. [Step 2]
...

**Changes to make:**
[Brief description of code changes]

Keep it concise. If the discussion is unclear, ask clarifying questions instead.`
        },
        {
          role: 'user',
          content: `Recent discussion:\n${conversation}\n\nCurrent bot capabilities (${file ? file.content.split('\n').length : '?'} lines of code).\n\nWhat should we build based on this discussion?`
        }
      ]);

      // Send proposal with approval buttons
      const proposalId = Date.now().toString();
      await sendTelegram(chatId, proposal, {
        inline_keyboard: [
          [
            { text: '👍 Approve', callback_data: `approve_${proposalId}` },
            { text: '👎 Reject', callback_data: `reject_${proposalId}` }
          ]
        ]
      });

      return { statusCode: 200, body: 'ok' };
    }

    // Default: Don't respond to every message in groups (only when mentioned or triggered)
    if (message.chat.type !== 'private') {
      // Only respond if bot is mentioned
      if (!text.includes('@vibbber_bot')) {
        return { statusCode: 200, body: 'ok' };
      }
    }

    // Chat response for direct messages or mentions
    const response = await askLLM([
      {
        role: 'system',
        content: 'You are Vibbber 42, a self-improving Telegram bot. Keep responses concise. Mention the rocket emoji trigger if users want to build something based on their discussion.'
      },
      { role: 'user', content: text.replace('@vibbber_bot', '').trim() }
    ]);

    await sendTelegram(chatId, response);
    return { statusCode: 200, body: 'ok' };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 200, body: 'error handled' };
  }
}
