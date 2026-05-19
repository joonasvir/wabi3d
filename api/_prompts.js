// Wabi3D — shared default prompts.
// Files prefixed with `_` are not exposed as Vercel endpoints.
// Used by /api/generate, /api/ideate, and /api/prompts (which serves them
// to the frontend so users can see + override them in the control panel).

export const STYLE_PREAMBLES = {
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

export const NEGATIVE =
  'Do not include: text, logos, watermarks, multiple objects, scenes, backgrounds, frames, borders, ground planes.';

export const SYSTEM_BY_STYLE = {
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
