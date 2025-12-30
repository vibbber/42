#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Load env from parent directory
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Supabase REST API helper
async function supabaseQuery(table, query = '') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return response.json();
}

async function supabaseInsert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Telegram API helper
async function sendTelegram(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    }),
  });
  return response.json();
}

// Create MCP server
const server = new Server(
  { name: 'vibbber-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_messages',
      description: 'Get recent messages from a Vibbber Telegram chat. Returns messages stored in Supabase.',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: {
            type: 'number',
            description: 'Telegram chat ID (negative for groups). Leave empty to get all chats.',
          },
          limit: {
            type: 'number',
            description: 'Number of messages to retrieve (default: 50, max: 200)',
          },
        },
      },
    },
    {
      name: 'get_chats',
      description: 'List all Telegram chats that have sent messages to the Vibbber bot.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'send_message',
      description: 'Send a message to a Telegram chat via the Vibbber bot.',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: {
            type: 'number',
            description: 'Telegram chat ID to send message to',
          },
          text: {
            type: 'string',
            description: 'Message text to send (supports Markdown)',
          },
        },
        required: ['chat_id', 'text'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_messages': {
        const limit = Math.min(args.limit || 50, 200);
        let query = `?order=created_at.desc&limit=${limit}`;
        if (args.chat_id) {
          query += `&chat_id=eq.${args.chat_id}`;
        }

        const messages = await supabaseQuery('vibbber_messages', query);

        // Format for readability
        const formatted = messages.reverse().map(m => ({
          id: m.id,
          chat_id: m.chat_id,
          from: m.first_name || m.username,
          text: m.text,
          time: new Date(m.created_at).toLocaleString(),
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formatted, null, 2),
          }],
        };
      }

      case 'get_chats': {
        const messages = await supabaseQuery('vibbber_messages', '?select=chat_id');
        const uniqueChats = [...new Set(messages.map(m => m.chat_id))];

        return {
          content: [{
            type: 'text',
            text: `Active chats: ${JSON.stringify(uniqueChats)}`,
          }],
        };
      }

      case 'send_message': {
        if (!args.chat_id || !args.text) {
          throw new Error('chat_id and text are required');
        }

        const result = await sendTelegram(args.chat_id, args.text);

        if (result.ok) {
          return {
            content: [{
              type: 'text',
              text: `Message sent successfully to chat ${args.chat_id}`,
            }],
          };
        } else {
          throw new Error(`Telegram error: ${result.description}`);
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vibbber MCP server running');
}

main().catch(console.error);
