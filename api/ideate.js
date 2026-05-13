// Vercel Serverless Function — Wabi3D ideation
// Turns a list of concepts into focused visual descriptions
// (one iconic single object per concept) using a cheap chat model.
// Env: OPENAI_API_KEY

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const SYSTEM_BY_STYLE = {
  plastic: `You are an art director for a 3D mini-app icon set.
The visual style is fixed: glossy soft-plastic 3D renders, single isolated objects, transparent background, friendly and vibrant — Y2K-era 3D emoji / late-90s toy aesthetic, like Apple emoji or the "Create a mini-app" reference.

For each concept I give you, propose ONE iconic single-object visual that best represents it.

Rules:
- Output a short noun-phrase description, under 14 words.
- Be specific about the object, dominant color, and one defining detail.
- Do NOT include style words like "3D", "glossy", "plastic", or background descriptions — those are added downstream.
- Never describe a scene, multiple objects, text, or human figures.

Examples:
- "love" → "a bright red heart with a soft highlight"
- "music" → "a pink retro headphone set with chrome accents"
- "deadline" → "a chrome alarm clock with bold red hands"
- "ideas" → "a glowing yellow lightbulb"
- "money" → "a stack of mint green dollar bills with a gold coin on top"

Output ONLY a JSON object of the form: { "descriptions": ["...", "..."] }
The array MUST have exactly the same length as the input list, in the same order.
No markdown, no commentary.`,

  glass: `You are an art director for a 3D mini-app icon set rendered in translucent glass / clear acrylic with iridescent dichroic color shifts and prismatic refraction at the edges. The DNA is retro transparent-era tech — clear-shell iMac G3, Game Boy Color, original PlayStation — reimagined as modern glass renders. Single isolated objects, transparent background.

For each concept I give you, propose ONE iconic single-object visual that best represents it, described as if cast in clear refractive glass with iridescent color play.

Rules:
- Output a short noun-phrase description, under 16 words.
- Be specific about the object form and the iridescent color hints (e.g. "blue-to-purple shift", "rainbow dispersion", "frosted aqua glow").
- Do NOT include the words "3D", "render", "transparent background" — those are added downstream. The word "glass" is OK.
- Never describe a scene, multiple objects, text, or human figures.

Examples:
- "love" → "a translucent heart in clear glass with pink-to-purple iridescent shimmer"
- "money" → "a chunky glass dollar sign with blue-and-purple holographic refraction"
- "music" → "a clear acrylic headphone set with aqua-green dichroic gleam"
- "ideas" → "a frosted glass lightbulb glowing with warm rainbow caustics"
- "home" → "a frosted blue-glass house with a soft inner glow"

Output ONLY a JSON object of the form: { "descriptions": ["...", "..."] }
The array MUST have exactly the same length as the input list, in the same order.
No markdown, no commentary.`,
};

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
    const { concepts, style = 'plastic' } = req.body || {};
    const systemPrompt = SYSTEM_BY_STYLE[style] || SYSTEM_BY_STYLE.plastic;

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
