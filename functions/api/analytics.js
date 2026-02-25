const DEVICE_VALUES = new Set([
  'android',
  'iphone',
  'ipad',
  'windows',
  'macos',
  'linux',
  'other',
]);
const MODE_VALUES = new Set(['mosaic', 'ascii', 'emoji']);
const MAX_RANGE_MS = 10 * 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_MS = 60 * 60 * 1000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function serverError(message, details) {
  return json({ error: message, details }, 500);
}

function resolveDbBinding(env) {
  if (!env || typeof env !== 'object') return null;
  if (env.DB && typeof env.DB.prepare === 'function') return env.DB;
  return null;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        bucket_start INTEGER,
        client_id TEXT,
        device TEXT,
        mode TEXT,
        style_key TEXT,
        style_label TEXT
      )`
    )
    .run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_visit_lookup ON analytics_events(type, bucket_start, client_id)`).run();
}

function getBucketLabel(ts, intervalMs) {
  const d = new Date(ts);
  const hh = `${d.getUTCHours()}`.padStart(2, '0');
  const mm = `${d.getUTCMinutes()}`.padStart(2, '0');
  const mo = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  if (intervalMs < 60 * 60 * 1000) return `${hh}:${mm}`;
  return `${mo}/${day} ${hh}:00`;
}

function getIntervalMs(rangeMs) {
  if (rangeMs <= 60 * 60 * 1000) return 5 * 60 * 1000;
  if (rangeMs <= 6 * 60 * 60 * 1000) return 30 * 60 * 1000;
  if (rangeMs <= 24 * 60 * 60 * 1000) return 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

function buildTrend(events, rangeStart, rangeEnd, intervalMs, type) {
  const buckets = Math.max(1, Math.ceil((rangeEnd - rangeStart) / intervalMs));
  const data = Array.from({ length: buckets }, (_, i) => ({
    ts: rangeStart + i * intervalMs,
    value: 0,
  }));

  for (const event of events) {
    if (event.type !== type) continue;
    if (event.timestamp < rangeStart || event.timestamp > rangeEnd) continue;
    const idx = Math.min(data.length - 1, Math.floor((event.timestamp - rangeStart) / intervalMs));
    data[idx].value += 1;
  }
  return data.map((d) => ({ label: getBucketLabel(d.ts, intervalMs), value: d.value }));
}

async function handleGet(request, env) {
  const db = resolveDbBinding(env);
  if (!db) {
    return json(
      {
        error: 'D1 binding "DB" is missing.',
        envKeys: Object.keys(env || {}),
      },
      500
    );
  }
  try {
    await ensureSchema(db);
  } catch (error) {
    return serverError('Failed to ensure analytics schema', error instanceof Error ? error.message : String(error));
  }
  const url = new URL(request.url);
  const rangeMsRaw = Number(url.searchParams.get('rangeMs') || DEFAULT_RANGE_MS);
  const rangeMs = Math.max(60 * 1000, Math.min(MAX_RANGE_MS, Number.isFinite(rangeMsRaw) ? rangeMsRaw : DEFAULT_RANGE_MS));
  const end = Date.now();
  const start = end - rangeMs;

  let results = [];
  try {
    const queryResult = await db.prepare(
      `SELECT type, timestamp, device, mode, style_key, style_label
       FROM analytics_events
       WHERE timestamp BETWEEN ?1 AND ?2`
    )
      .bind(start, end)
      .all();
    results = queryResult.results || [];
  } catch (error) {
    return serverError('Failed to read analytics data', error instanceof Error ? error.message : String(error));
  }

  const events = (results || []).map((r) => ({
    type: r.type,
    timestamp: Number(r.timestamp || 0),
    device: r.device || 'other',
    mode: r.mode || null,
    styleKey: r.style_key || null,
    styleLabel: r.style_label || null,
  }));

  const visits = events.filter((e) => e.type === 'visit').length;
  const generations = events.filter((e) => e.type === 'generation');

  const modeCounts = { mosaic: 0, ascii: 0, emoji: 0 };
  for (const g of generations) {
    if (g.mode === 'mosaic' || g.mode === 'ascii' || g.mode === 'emoji') modeCounts[g.mode] += 1;
  }

  const deviceCounts = { android: 0, iphone: 0, ipad: 0, windows: 0, macos: 0, linux: 0, other: 0 };
  for (const e of events) {
    const key = DEVICE_VALUES.has(e.device) ? e.device : 'other';
    deviceCounts[key] += 1;
  }

  const styleMap = new Map();
  for (const g of generations) {
    const key = g.styleKey || g.mode || 'unknown';
    const label = g.styleLabel || key;
    const prev = styleMap.get(key);
    if (prev) prev.count += 1;
    else styleMap.set(key, { key, label, count: 1 });
  }

  const intervalMs = getIntervalMs(rangeMs);
  const payload = {
    visits,
    imagesCreated: generations.length,
    modeCounts,
    styleCounts: Array.from(styleMap.values()).sort((a, b) => b.count - a.count),
    deviceCounts,
    visitsTrend: buildTrend(events, start, end, intervalMs, 'visit'),
    generationsTrend: buildTrend(events, start, end, intervalMs, 'generation'),
  };

  return json(payload, 200);
}

async function handlePost(request, env) {
  const db = resolveDbBinding(env);
  if (!db) {
    return json(
      {
        error: 'D1 binding "DB" is missing.',
        envKeys: Object.keys(env || {}),
      },
      500
    );
  }
  try {
    await ensureSchema(db);
  } catch (error) {
    return serverError('Failed to ensure analytics schema', error instanceof Error ? error.message : String(error));
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const type = body?.type;
  const timestamp = Number(body?.timestamp || Date.now());
  const clientId = String(body?.clientId || 'unknown');
  const device = DEVICE_VALUES.has(body?.device) ? body.device : 'other';

  if (type === 'visit') {
    const bucketStart = Number(body?.bucketStart || timestamp);
    try {
      const existingVisit = await db
        .prepare(
          `SELECT id FROM analytics_events
           WHERE type = 'visit' AND bucket_start = ?1 AND client_id = ?2
           LIMIT 1`
        )
        .bind(bucketStart, clientId)
        .first();
      if (!existingVisit) {
        await db
          .prepare(
            `INSERT INTO analytics_events
              (type, timestamp, bucket_start, client_id, device, mode, style_key, style_label)
             VALUES ('visit', ?1, ?2, ?3, ?4, NULL, NULL, NULL)`
          )
          .bind(timestamp, bucketStart, clientId, device)
          .run();
      }
    } catch (error) {
      return serverError('Failed to write visit event', error instanceof Error ? error.message : String(error));
    }
    return json({ ok: true });
  }

  if (type === 'generation') {
    const mode = MODE_VALUES.has(body?.mode) ? body.mode : 'mosaic';
    const styleKey = String(body?.styleKey || mode);
    const styleLabel = String(body?.styleLabel || mode.toUpperCase());
    try {
      await db
        .prepare(
          `INSERT INTO analytics_events
            (type, timestamp, bucket_start, client_id, device, mode, style_key, style_label)
           VALUES ('generation', ?1, NULL, ?2, ?3, ?4, ?5, ?6)`
        )
        .bind(timestamp, clientId, device, mode, styleKey, styleLabel)
        .run();
    } catch (error) {
      return serverError('Failed to write generation event', error instanceof Error ? error.message : String(error));
    }
    return json({ ok: true });
  }

  return json({ error: 'Unsupported event type' }, 400);
}

export const onRequestGet = async ({ request, env }) => handleGet(request, env);
export const onRequestPost = async ({ request, env }) => handlePost(request, env);
