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

export type AnalyticsSummary = {
  visits: number;
  imagesCreated: number;
  modeCounts: Record<ArtMode, number>;
  styleCounts: Array<{ key: string; label: string; count: number }>;
  deviceCounts: Record<DeviceType, number>;
  visitsTrend: Array<{ label: string; value: number }>;
  generationsTrend: Array<{ label: string; value: number }>;
};

const CLIENT_ID_KEY = 'pimxmoji_client_id';
const LAST_VISIT_BUCKET_KEY = 'pimxmoji_last_visit_bucket';
const TEN_MINUTES_MS = 10 * 60 * 1000;
const API_ENDPOINT = '/api/analytics';

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

async function sendEvent(event: AnalyticsEvent) {
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch {
    // Ignore network errors. DB is source of truth in deployed environment.
  }
}

export function trackVisit10MinuteBucket() {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  const bucketStart = Math.floor(now / TEN_MINUTES_MS) * TEN_MINUTES_MS;
  const lastBucket = localStorage.getItem(LAST_VISIT_BUCKET_KEY);
  if (lastBucket && Number(lastBucket) === bucketStart) return false;

  localStorage.setItem(LAST_VISIT_BUCKET_KEY, String(bucketStart));
  void sendEvent({
    type: 'visit',
    timestamp: now,
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
  void sendEvent({
    type: 'generation',
    timestamp: Date.now(),
    mode: payload.mode,
    styleKey: payload.styleKey || payload.mode,
    styleLabel: payload.styleLabel || payload.mode.toUpperCase(),
    clientId: getClientId(),
    device: detectDeviceType(),
  });
}

function emptySummary(): AnalyticsSummary {
  return {
    visits: 0,
    imagesCreated: 0,
    modeCounts: { mosaic: 0, ascii: 0, emoji: 0 },
    styleCounts: [],
    deviceCounts: { android: 0, iphone: 0, ipad: 0, windows: 0, macos: 0, linux: 0, other: 0 },
    visitsTrend: [],
    generationsTrend: [],
  };
}

export async function getAnalyticsSummary(rangeMs: number): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_ENDPOINT}?rangeMs=${encodeURIComponent(rangeMs)}`);
  if (!res.ok) {
    let details = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        details = body.details ? `${body.error}: ${body.details}` : body.error;
      }
    } catch {
      // keep default details
    }
    throw new Error(details);
  }
  const data = (await res.json()) as AnalyticsSummary;
  return data || emptySummary();
}
