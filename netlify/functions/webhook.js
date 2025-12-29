// Vibbber 42 - Self-Improving Telegram Bot
// This bot can modify its own code when asked

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'vibbber';
const GITHUB_REPO = process.env.GITHUB_REPO || '42';

// Send message to Telegram
async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

// Call Kimi K2 API
async function askKimi(messages) {
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'kimi-k2-0711-preview',
      messages: messages,
      temperature: 0.7
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from Kimi';
}

// Get file from GitHub
async function getGitHubFile(path) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha
  };
}

// Update file on GitHub
async function updateGitHubFile(path, content, message, sha) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: Buffer.from(content).toString('base64'),
        sha: sha
      })
    }
  );
  return response.ok;
}

// Create new file on GitHub
async function createGitHubFile(path, content, message) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: Buffer.from(content).toString('base64')
      })
    }
  );
  return response.ok;
}

// Main handler
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'Vibbber 42 is alive!' };
  }

  try {
    const body = JSON.parse(event.body);
    const message = body.message;

    if (!message?.text) {
      return { statusCode: 200, body: 'ok' };
    }

    const chatId = message.chat.id;
    const text = message.text;
    const username = message.from?.username || 'unknown';

    console.log(`Message from ${username}: ${text}`);

    // Handle /start command
    if (text === '/start') {
      await sendTelegram(chatId,
        `Hello! I'm Vibbber 42, a self-improving bot.\n\n` +
        `Commands:\n` +
        `/status - Check my status\n` +
        `/code - View my source code\n` +
        `/modify <request> - Ask me to modify myself\n\n` +
        `Or just chat with me!`
      );
      return { statusCode: 200, body: 'ok' };
    }

    // Handle /status command
    if (text === '/status') {
      await sendTelegram(chatId,
        `*Vibbber 42 Status*\n\n` +
        `Brain: Kimi K2\n` +
        `Repo: github.com/${GITHUB_OWNER}/${GITHUB_REPO}\n` +
        `Self-modification: Enabled`
      );
      return { statusCode: 200, body: 'ok' };
    }

    // Handle /code command - show own source
    if (text === '/code') {
      const file = await getGitHubFile('netlify/functions/webhook.js');
      if (file) {
        const preview = file.content.substring(0, 500) + '...';
        await sendTelegram(chatId, `My source code (preview):\n\`\`\`javascript\n${preview}\n\`\`\``);
      } else {
        await sendTelegram(chatId, 'Could not fetch my source code.');
      }
      return { statusCode: 200, body: 'ok' };
    }

    // Handle /modify command - self-modification
    if (text.startsWith('/modify ')) {
      const request = text.substring(8);
      await sendTelegram(chatId, `Analyzing modification request: "${request}"...`);

      // Get current source code
      const file = await getGitHubFile('netlify/functions/webhook.js');
      if (!file) {
        await sendTelegram(chatId, 'Error: Could not fetch my source code.');
        return { statusCode: 200, body: 'ok' };
      }

      // Ask Kimi to modify the code
      const kimiResponse = await askKimi([
        {
          role: 'system',
          content: `You are a code modification assistant. You will receive the current source code of a Telegram bot and a modification request.

Your task is to output ONLY the complete modified source code, nothing else. No explanations, no markdown code blocks, just the raw JavaScript code.

The code runs as a Netlify Function. Keep the same structure but apply the requested changes.`
        },
        {
          role: 'user',
          content: `Current source code:\n\n${file.content}\n\n---\n\nModification request: ${request}\n\nOutput the complete modified source code:`
        }
      ]);

      // Basic validation - check if it looks like valid code
      if (!kimiResponse.includes('export async function handler')) {
        await sendTelegram(chatId, `Modification failed - invalid code generated. Try being more specific.`);
        return { statusCode: 200, body: 'ok' };
      }

      // Commit the changes
      const success = await updateGitHubFile(
        'netlify/functions/webhook.js',
        kimiResponse,
        `Self-modification: ${request}`,
        file.sha
      );

      if (success) {
        await sendTelegram(chatId,
          `Modification committed! Netlify will auto-deploy.\n\n` +
          `Request: ${request}\n` +
          `View changes: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commits/main`
        );
      } else {
        await sendTelegram(chatId, 'Failed to commit changes. Check GitHub permissions.');
      }

      return { statusCode: 200, body: 'ok' };
    }

    // Default: Chat with Kimi
    const response = await askKimi([
      {
        role: 'system',
        content: 'You are Vibbber 42, a helpful and friendly Telegram bot. Keep responses concise but helpful. You can tell users about your /modify command if they want to add features.'
      },
      {
        role: 'user',
        content: text
      }
    ]);

    await sendTelegram(chatId, response);
    return { statusCode: 200, body: 'ok' };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 200, body: 'error handled' };
  }
}
