// Vercel Serverless Function — Wabi3D prompt defaults
// Returns the built-in prompt templates so the frontend can render them
// in the editable "Prompt template" panel.

import { STYLE_PREAMBLES, NEGATIVE, SYSTEM_BY_STYLE } from './_prompts.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Defaults don't change at runtime; cache aggressively.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    success: true,
    defaults: {
      stylePreamble: STYLE_PREAMBLES,   // { plastic, glass }
      negative: NEGATIVE,                // string
      ideateSystem: SYSTEM_BY_STYLE,     // { plastic, glass }
    },
  });
}
