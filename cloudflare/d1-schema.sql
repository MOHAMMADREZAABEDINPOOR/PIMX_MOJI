CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('visit', 'generation')),
  timestamp INTEGER NOT NULL,
  bucket_start INTEGER,
  client_id TEXT NOT NULL,
  device TEXT NOT NULL,
  mode TEXT,
  style_key TEXT,
  style_label TEXT
);

-- One visit per client per 10-minute bucket
CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_client_bucket
ON analytics_events (type, client_id, bucket_start);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events (type);
