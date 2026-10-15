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

CREATE INDEX IF NOT EXISTS idx_visit_client_bucket
ON analytics_events (type, client_id, bucket_start);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events (type);

CREATE TABLE IF NOT EXISTS gallery_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  image TEXT NOT NULL,
  options TEXT NOT NULL,
  created INTEGER NOT NULL,
  owner TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS gallery_created ON gallery_posts(created);
CREATE TABLE IF NOT EXISTS gallery_reports (
  post_id TEXT NOT NULL,
  reporter TEXT NOT NULL,
  PRIMARY KEY(post_id, reporter)
);
