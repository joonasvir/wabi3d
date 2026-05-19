// Vercel Serverless Function — Wabi3D image generation
// Uses OpenAI's gpt-image-1 with transparent background.
// Also saves every generated asset to Vercel Blob for the searchable library.
// Env: OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN (auto-set when Blob store is connected)

import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { STYLE_PREAMBLES, NEGATIVE } from './_prompts.js';

const OPENAI_URL = 'https://api.openai.com/v1/images/generations';

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
    const {
      prompt,
      concept,
      size = '1024x1024',
      quality = 'high',
      style = 'plastic',
      // Optional overrides from the Prompt template UI:
      stylePreamble,
      negative,
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // `concept` is the human-friendly label (e.g. "love"); `prompt` is the
    // detailed ideated description used for generation. In single mode they're
    // the same; in batch mode they differ.
    const displayConcept = (typeof concept === 'string' && concept.trim()) ? concept.trim() : prompt.trim();
    const generationPrompt = prompt.trim();

    const preamble = (typeof stylePreamble === 'string' && stylePreamble.trim())
      ? stylePreamble.trim()
      : (STYLE_PREAMBLES[style] || STYLE_PREAMBLES.plastic);
    const neg = (typeof negative === 'string' && negative.trim()) ? negative.trim() : NEGATIVE;
    const fullPrompt = `Subject: ${generationPrompt}.\n\nStyle: ${preamble}\n\n${neg}`;

    const openaiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        size,
        quality,
        background: 'transparent',
        output_format: 'png',
        n: 1,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      const message = data?.error?.message || 'OpenAI request failed';
      return res.status(openaiRes.status).json({ error: message, details: data });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: 'No image returned by OpenAI', details: data });
    }

    // Save to Vercel Blob (image + metadata) for the searchable library.
    // Wrapped so blob failures don't break image delivery.
    let asset = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const id = randomUUID();
        const slug = displayConcept
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || 'asset';

        const buffer = Buffer.from(b64, 'base64');
        const imgBlob = await put(`images/${id}.png`, buffer, {
          access: 'public',
          contentType: 'image/png',
          addRandomSuffix: false,
        });

        asset = {
          id,
          concept: displayConcept,
          description: generationPrompt,
          slug,
          style,
          size,
          quality,
          imageUrl: imgBlob.url,
          createdAt: Date.now(),
        };

        await put(`meta/${id}.json`, JSON.stringify(asset), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
        });
      } catch (blobErr) {
        console.error('blob save failed:', blobErr);
        // Don't fail the request — image still goes back to the user.
      }
    }

    return res.status(200).json({
      success: true,
      imageData: `data:image/png;base64,${b64}`,
      prompt: generationPrompt,
      concept: displayConcept,
      style,
      fullPrompt,
      asset,
    });
  } catch (err) {
    console.error('generate error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
