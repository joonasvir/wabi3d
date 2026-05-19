// Vercel Serverless Function — Wabi3D ideation
// Turns a list of concepts into focused visual descriptions
// (one iconic single object per concept) using a cheap chat model.
// Env: OPENAI_API_KEY

import { SYSTEM_BY_STYLE } from './_prompts.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on the server.' });
  }

  try {
    const { concepts, style = 'plastic', ideateSystem } = req.body || {};
    const systemPrompt = (typeof ideateSystem === 'string' && ideateSystem.trim())
      ? ideateSystem.trim()
      : (SYSTEM_BY_STYLE[style] || SYSTEM_BY_STYLE.plastic);

    if (!Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({ error: 'concepts must be a non-empty array of strings' });
    }
    const cleaned = concepts
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter(Boolean);

    if (cleaned.length === 0) {
      return res.status(400).json({ error: 'No non-empty concepts provided' });
    }
    if (cleaned.length > 24) {
      return res.status(400).json({ error: 'Max 24 concepts per batch' });
    }

    const userMsg = `Concepts:\n${cleaned.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

    const openaiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      const message = data?.error?.message || 'OpenAI request failed';
      return res.status(openaiRes.status).json({ error: message });
    }

    let descriptions = [];
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      descriptions = Array.isArray(parsed.descriptions) ? parsed.descriptions : [];
    } catch (e) {
      return res.status(502).json({ error: 'Model returned malformed JSON' });
    }

    // Pad/truncate to match input length, just in case
    while (descriptions.length < cleaned.length) descriptions.push(cleaned[descriptions.length]);
    descriptions = descriptions.slice(0, cleaned.length);

    const items = cleaned.map((concept, i) => ({
      concept,
      description: String(descriptions[i] || concept),
    }));

    return res.status(200).json({ success: true, style, items });
  } catch (err) {
    console.error('ideate error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
