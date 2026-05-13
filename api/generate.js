// Vercel Serverless Function — Wabi3D image generation
// Uses OpenAI's gpt-image-1 with transparent background.
// Env: OPENAI_API_KEY

const OPENAI_URL = 'https://api.openai.com/v1/images/generations';

// Style presets baked into every prompt. Keeps output on-brand.
// Both lean retro — Y2K / transparent-era-tech DNA.
const STYLE_PREAMBLES = {
  plastic: [
    'A single isolated 3D rendered object floating in the center of the frame.',
    'Glossy candy-coated soft-plastic / soft-rubber material with bright specular highlights and a faint contact shadow.',
    'Playful, friendly, slightly chunky proportions with rounded bevels — Y2K-era 3D emoji, late-90s / early-2000s toy aesthetic, modern mini-app icon.',
    'Saturated joyful color palette with smooth gradients.',
    'Soft studio lighting from above-left, gentle ambient occlusion, no hard shadows.',
    'Pure transparent background. No scene, no ground, no environment.',
    'Centered composition with generous padding around the subject.',
    'Crisp, clean edges. High detail. Octane / Cinema 4D quality render.',
  ].join(' '),

  glass: [
    'A single isolated 3D rendered object floating in the center of the frame.',
    'Translucent clear-glass / clear-acrylic material with strong refraction, subtle chromatic dispersion and prismatic rainbow fringing at the edges.',
    'Iridescent dichroic color shifts across the surface — blues, purples, pinks, greens, and aqua blending smoothly, like holographic film or oil-slick reflections.',
    'Light passes through the object with soft internal caustics; gentle inner glow; subtle frosted texture in some areas, crystal-clear in others.',
    'Retro transparent-era-tech DNA — clear plastic shells of the iMac G3, Game Boy Color, and original PlayStation — reimagined with modern glass-render quality.',
    'Soft studio lighting with a delicate rim light and bokeh-like highlights inside the glass.',
    'Pure transparent background. No scene, no ground, no environment, no shadow on a floor.',
    'Centered composition with generous padding around the subject.',
    'Crisp, clean edges. High detail. Octane / Cinema 4D / Redshift quality render.',
  ].join(' '),
};

const NEGATIVE = 'Do not include: text, logos, watermarks, multiple objects, scenes, backgrounds, frames, borders, ground planes.';

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
    const { prompt, size = '1024x1024', quality = 'high', style = 'plastic' } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const preamble = STYLE_PREAMBLES[style] || STYLE_PREAMBLES.plastic;
    const fullPrompt = `Subject: ${prompt.trim()}.\n\nStyle: ${preamble}\n\n${NEGATIVE}`;

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

    return res.status(200).json({
      success: true,
      imageData: `data:image/png;base64,${b64}`,
      prompt: prompt.trim(),
      style,
      fullPrompt,
    });
  } catch (err) {
    console.error('generate error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
