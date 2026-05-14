// Vercel Serverless Function — Wabi3D library
// Lists all generated assets from Vercel Blob, returns metadata for search.
// Env: BLOB_READ_WRITE_TOKEN (auto-set when a Blob store is connected)

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Short cache so repeated visits are snappy but new assets show up quickly.
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({
      success: true,
      assets: [],
      count: 0,
      warning: 'No Blob store connected. Connect a Blob store in the Vercel dashboard.',
    });
  }

  try {
    // Page through all metadata blobs.
    let cursor;
    const metaBlobs = [];
    do {
      const page = await list({ prefix: 'meta/', limit: 1000, cursor });
      metaBlobs.push(...page.blobs);
      cursor = page.cursor;
    } while (cursor);

    // Fetch all JSON in parallel, in batches of 50 to avoid hammering.
    const assets = [];
    for (let i = 0; i < metaBlobs.length; i += 50) {
      const batch = metaBlobs.slice(i, i + 50);
      const results = await Promise.all(
        batch.map((b) =>
          fetch(b.url)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      for (const meta of results) if (meta) assets.push(meta);
    }

    assets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ success: true, assets, count: assets.length });
  } catch (err) {
    console.error('library list error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
