export type ArtMode = 'mosaic' | 'ascii' | 'emoji';
export type DeviceType =
  | 'android'
  | 'iphone'
  | 'ipad'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'other';

type VisitEvent = {
  type: 'visit';
  timestamp: number;
  bucketStart: number;
  clientId: string;
  device: DeviceType;
};

type GenerationEvent = {
  type: 'generation';
  timestamp: number;
  mode: ArtMode;
  styleKey: string;
  styleLabel: string;
  clientId: string;
  device: DeviceType;
};

type AnalyticsEvent = VisitEvent | GenerationEvent;

type AnalyticsStore = {
  version: 3;
  events: AnalyticsEvent[];
};

export type AnalyticsSummary = {
  visits: number;
  imagesCreated: number;
  modeCounts: Record<ArtMode, number>;
  styleCounts: Array<{ key: string; label: string; count: number }>;
  deviceCounts: Record<DeviceType, number>;
  visitsTrend: Array<{ label: string; value: number }>;
  generationsTrend: Array<{ label: string; value: number }>;
};

const STORAGE_KEY = 'pimxmoji_analytics_v3';
const LEGACY_STORAGE_KEYS = ['pimxmoji_analytics_v2', 'pimxmoji_analytics_v1'];
const CLIENT_ID_KEY = 'pimxmoji_client_id';
const LAST_VISIT_BUCKET_KEY = 'pimxmoji_last_visit_bucket';
const TEN_MINUTES_MS = 10 * 60 * 1000;
const MAX_EVENT_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const API_ENDPOINT = '/api/analytics';

function now() {
  return Date.now();
}

function detectDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone')) return 'iphone';
  if (ua.includes('ipad')) return 'ipad';
  if (ua.includes('macintosh') || ua.includes('mac os x')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'other';
}

function getClientId() {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function normalizeEvent(raw: any): AnalyticsEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.type === 'visit') {
    return {
      type: 'visit',
      timestamp: Number(raw.timestamp || 0),
      bucketStart: Number(raw.bucketStart || raw.timestamp || 0),
      clientId: String(raw.clientId || 'unknown'),
      device: raw.device || 'other',
    };
  }
  if (raw.type === 'generation') {
    const mode: ArtMode =
      raw.mode === 'mosaic' || raw.mode === 'ascii' || raw.mode === 'emoji'
        ? raw.mode
        : 'mosaic';
    return {
      type: 'generation',
      timestamp: Number(raw.timestamp || 0),
      mode,
      styleKey: String(raw.styleKey || mode),
      styleLabel: String(raw.styleLabel || mode.toUpperCase()),
      clientId: String(raw.clientId || 'unknown'),
      device: raw.device || 'other',
    };
  }
  return null;
}

function readLegacyEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  const all: AnalyticsEvent[] = [];
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.events)) continue;
      all.push(...parsed.events.map(normalizeEvent).filter(Boolean));
    } catch {
      // Ignore legacy parse errors.
    }
  }
  return all;
}

function readStore(): AnalyticsStore {
  if (typeof window === 'undefined') return { version: 3, events: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: 3, events: readLegacyEvents() };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) return { version: 3, events: [] };
    return {
      version: 3,
      events: parsed.events.map(normalizeEvent).filter(Boolean),
    };
  } catch {
    return { version: 3, events: [] };
  }
}

function writeStore(store: AnalyticsStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function cleanupOldEvents(store: AnalyticsStore) {
  const threshold = now() - MAX_EVENT_AGE_MS;
  store.events = store.events.filter((e) => e.timestamp >= threshold);
}

function appendEventLocal(event: AnalyticsEvent) {
  const store = readStore();
  cleanupOldEvents(store);
  store.events.push(event);
  writeStore(store);
}

async function sendEventRemote(event: AnalyticsEvent) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Analytics API failed: ${res.status}`);
}

async function appendEvent(event: AnalyticsEvent) {
  appendEventLocal(event);
  try {
    await sendEventRemote(event);
  } catch {
    // API may not exist in local/dev; local store remains as fallback.
  }
}

export function trackVisit10MinuteBucket() {
  if (typeof window === 'undefined') return false;
  const bucketStart = Math.floor(now() / TEN_MINUTES_MS) * TEN_MINUTES_MS;
  const lastBucket = localStorage.getItem(LAST_VISIT_BUCKET_KEY);
  if (lastBucket && Number(lastBucket) === bucketStart) return false;

  localStorage.setItem(LAST_VISIT_BUCKET_KEY, String(bucketStart));
  void appendEvent({
    type: 'visit',
    timestamp: now(),
    bucketStart,
    clientId: getClientId(),
    device: detectDeviceType(),
  });
  return true;
}

export function trackImageGeneration(payload: {
  mode: ArtMode;
  styleKey?: string;
  styleLabel?: string;
}) {
  const mode = payload.mode;
  void appendEvent({
    type: 'generation',
    timestamp: now(),
    mode,
    styleKey: payload.styleKey || mode,
    styleLabel: payload.styleLabel || mode.toUpperCase(),
    clientId: getClientId(),
    device: detectDeviceType(),
  });
}

function getIntervalMs(rangeMs: number) {
  if (rangeMs <= 60 * 60 * 1000) return 5 * 60 * 1000;
  if (rangeMs <= 6 * 60 * 60 * 1000) return 30 * 60 * 1000;
  if (rangeMs <= 24 * 60 * 60 * 1000) return 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

function bucketLabel(ts: number, intervalMs: number) {
  const d = new Date(ts);
  if (intervalMs < 60 * 60 * 1000) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
}

function buildTrend(
  events: AnalyticsEvent[],
  rangeStart: number,
  rangeEnd: number,
  intervalMs: number,
  type: 'visit' | 'generation'
) {
  const buckets = Math.max(1, Math.ceil((rangeEnd - rangeStart) / intervalMs));
  const data = Array.from({ length: buckets }, (_, i) => ({
    ts: rangeStart + i * intervalMs,
    value: 0,
  }));

  for (const event of events) {
    if (event.type !== type) continue;
    if (event.timestamp < rangeStart || event.timestamp > rangeEnd) continue;
    const index = Math.min(data.length - 1, Math.floor((event.timestamp - rangeStart) / intervalMs));
    data[index].value += 1;
  }

  return data.map((d) => ({ label: bucketLabel(d.ts, intervalMs), value: d.value }));
}

function summarizeEvents(rangeMs: number, events: AnalyticsEvent[]): AnalyticsSummary {
  const end = now();
  const start = end - rangeMs;
  const filtered = events.filter((e) => e.timestamp >= start && e.timestamp <= end);
  const visits = filtered.filter((e) => e.type === 'visit').length;
  const generations = filtered.filter((e) => e.type === 'generation') as GenerationEvent[];

  const modeCounts: Record<ArtMode, number> = { mosaic: 0, ascii: 0, emoji: 0 };
  const deviceCounts: Record<DeviceType, number> = {
    android: 0,
    iphone: 0,
    ipad: 0,
    windows: 0,
    macos: 0,
    linux: 0,
    other: 0,
  };
  const styleMap = new Map<string, { key: string; label: string; count: number }>();

  for (const event of filtered) {
    if (deviceCounts[event.device] === undefined) {
      deviceCounts.other += 1;
    } else {
      deviceCounts[event.device] += 1;
    }
  }

  for (const generation of generations) {
    modeCounts[generation.mode] += 1;
    const key = generation.styleKey || generation.mode;
    const prev = styleMap.get(key);
    if (prev) prev.count += 1;
    else {
      styleMap.set(key, {
        key,
        label: generation.styleLabel || generation.mode.toUpperCase(),
        count: 1,
      });
    }
  }

  const intervalMs = getIntervalMs(rangeMs);
  return {
    visits,
    imagesCreated: generations.length,
    modeCounts,
    styleCounts: Array.from(styleMap.values()).sort((a, b) => b.count - a.count),
    deviceCounts,
    visitsTrend: buildTrend(filtered, start, end, intervalMs, 'visit'),
    generationsTrend: buildTrend(filtered, start, end, intervalMs, 'generation'),
  };
}

async function fetchRemoteSummary(rangeMs: number): Promise<AnalyticsSummary | null> {
  try {
    const res = await fetch(`${API_ENDPOINT}?rangeMs=${encodeURIComponent(rangeMs)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as AnalyticsSummary;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAnalyticsSummary(rangeMs: number): Promise<AnalyticsSummary> {
  const remote = await fetchRemoteSummary(rangeMs);
  if (remote) return remote;
  const store = readStore();
  return summarizeEvents(rangeMs, store.events);
}
