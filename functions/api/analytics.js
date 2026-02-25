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
  if (!env.DB) {
    return json({ error: 'D1 binding "DB" is missing.' }, 500);
  }
  const url = new URL(request.url);
  const rangeMsRaw = Number(url.searchParams.get('rangeMs') || DEFAULT_RANGE_MS);
  const rangeMs = Math.max(60 * 1000, Math.min(MAX_RANGE_MS, Number.isFinite(rangeMsRaw) ? rangeMsRaw : DEFAULT_RANGE_MS));
  const end = Date.now();
  const start = end - rangeMs;

  const { results } = await env.DB.prepare(
    `SELECT type, timestamp, device, mode, style_key, style_label
     FROM analytics_events
     WHERE timestamp BETWEEN ?1 AND ?2`
  )
    .bind(start, end)
    .all();

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
  if (!env.DB) {
    return json({ error: 'D1 binding "DB" is missing.' }, 500);
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
    await env.DB.prepare(
      `INSERT OR IGNORE INTO analytics_events
        (type, timestamp, bucket_start, client_id, device, mode, style_key, style_label)
       VALUES ('visit', ?1, ?2, ?3, ?4, NULL, NULL, NULL)`
    )
      .bind(timestamp, bucketStart, clientId, device)
      .run();
    return json({ ok: true });
  }

  if (type === 'generation') {
    const mode = MODE_VALUES.has(body?.mode) ? body.mode : 'mosaic';
    const styleKey = String(body?.styleKey || mode);
    const styleLabel = String(body?.styleLabel || mode.toUpperCase());
    await env.DB.prepare(
      `INSERT INTO analytics_events
        (type, timestamp, bucket_start, client_id, device, mode, style_key, style_label)
       VALUES ('generation', ?1, NULL, ?2, ?3, ?4, ?5, ?6)`
    )
      .bind(timestamp, clientId, device, mode, styleKey, styleLabel)
      .run();
    return json({ ok: true });
  }

  return json({ error: 'Unsupported event type' }, 400);
}

export const onRequestGet = async ({ request, env }) => handleGet(request, env);
export const onRequestPost = async ({ request, env }) => handlePost(request, env);
