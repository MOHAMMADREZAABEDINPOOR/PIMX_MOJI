import { createStore, get, set, setMany } from "idb-keyval";
import { MARK_TREATMENTS } from "./treatments";
import { MOTIONS } from "./motions";
import {
  DEFAULTS,
  type Project,
  type StudioOptions,
  type SavedStyle,
} from "./types";
const store = createStore("pimx-studio-v2", "projects");
export const getProjects = () =>
  get<Project[]>("projects", store).then((x) => x || []);
export const saveProjects = (projects: Project[]) =>
  set("projects", projects, store);
export const getStyles = () =>
  get<SavedStyle[]>("styles", store).then((x) => x || []);
export const saveStyles = (styles: SavedStyle[]) =>
  set("styles", styles, store);

export interface LibraryBackup {
  schema: "pimx-library-v1";
  exportedAt: string;
  projects: Project[];
  styles: SavedStyle[];
}
export async function exportLibrary(): Promise<LibraryBackup> {
  const [projects, styles] = await Promise.all([getProjects(), getStyles()]);
  return {
    schema: "pimx-library-v1",
    exportedAt: new Date().toISOString(),
    projects,
    styles,
  };
}
const validImage = (value: unknown) =>
  typeof value === "string" &&
  ((value.length <= 40 * 1024 * 1024 &&
    /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(
      value,
    )) ||
    [
      "/samples/portrait.jpg",
      "/samples/muse.jpg",
      "/samples/landscape.jpg",
    ].includes(value));

export async function restoreLibrary(value: unknown) {
  const invalid = () =>
    new Error(
      "This backup is invalid. Choose a PIMX library backup. / این پشتیبان معتبر نیست؛ فایل پشتیبان آرشیو PIMX رو انتخاب کن.",
    );
  if (!value || typeof value !== "object") throw invalid();
  const data = value as Record<string, unknown>;
  if (
    data.schema !== "pimx-library-v1" ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.styles) ||
    data.projects.length > 2000 ||
    data.styles.length > 2000
  )
    throw invalid();
  const ids = new Set<string>();
  const projects: Project[] = data.projects.map((p: any) => {
    if (
      !p ||
      typeof p.id !== "string" ||
      !p.id ||
      p.id.length > 100 ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !validImage(p.source) ||
      !validImage(p.thumbnail) ||
      !Number.isFinite(p.updated) ||
      p.updated <= 0 ||
      !p.options ||
      typeof p.options !== "object" ||
      !MOTIONS.some((motion) => motion.id === p.effect)
    )
      throw invalid();
    ids.add(p.id);
    return {
      id: p.id,
      name: p.name.slice(0, 80),
      source: p.source,
      thumbnail: p.thumbnail,
      updated: p.updated,
      effect: p.effect,
      options: validateOptions(p.options),
    };
  });
  const styleIds = new Set<string>();
  const styles: SavedStyle[] = data.styles.map((s: any) => {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id ||
      s.id.length > 100 ||
      styleIds.has(s.id) ||
      typeof s.name !== "string" ||
      !s.options ||
      typeof s.options !== "object"
    )
      throw invalid();
    styleIds.add(s.id);
    return {
      id: s.id,
      name: s.name.slice(0, 60),
      options: validateOptions(s.options),
    };
  });
  // Validate everything before writing. Both collections commit in one IDB transaction.
  const [currentProjects, currentStyles] = await Promise.all([
    getProjects(),
    getStyles(),
  ]);
  const merged = new Map(currentProjects.map((p) => [p.id, p]));
  for (const p of projects)
    if (!merged.has(p.id) || merged.get(p.id)!.updated < p.updated)
      merged.set(p.id, p);
  const mergedStyles = new Map(styles.map((s) => [s.id, s]));
  for (const s of currentStyles) mergedStyles.set(s.id, s);
  await setMany(
    [
      ["projects", [...merged.values()].sort((a, b) => b.updated - a.updated)],
      ["styles", [...mergedStyles.values()]],
    ],
    store,
  );
  return { projects: projects.length, styles: styles.length };
}
export function validateOptions(value: unknown): StudioOptions {
  if (!value || typeof value !== "object")
    throw new Error("Invalid style file / فایل سبک نامعتبر است.");
  const v = value as Record<string, unknown>;
  const out = structuredClone(DEFAULTS);
  for (const [key, min, max] of [
    ["resolution", 30, 400],
    ["brightness", 0, 200],
    ["contrast", 0, 250],
    ["saturation", 0, 250],
    ["spacing", 0.7, 1.8],
    ["fontSize", 8, 24],
    ["threshold", 0, 180],
    ["shadowBlur", 0, 12],
    ["direction", -45, 45],
    ["treatmentScale", 0.2, 3],
    ["treatmentAngle", -180, 180],
  ] as const) {
    if (typeof v[key] === "number" && Number.isFinite(v[key]))
      (out as any)[key] = Math.max(min, Math.min(max, v[key] as number));
  }
  if (["ascii", "mosaic", "emoji"].includes(v.mode as string))
    out.mode = v.mode as StudioOptions["mode"];
  if (typeof v.chars === "string" && v.chars.length <= 500) out.chars = v.chars;
  if (MARK_TREATMENTS.includes(v.treatment as any))
    out.treatment = v.treatment as StudioOptions["treatment"];
  if (
    Array.isArray(v.palette) &&
    v.palette.length >= 2 &&
    v.palette.length <= 5 &&
    v.palette.every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c))
  )
    out.palette = [...v.palette];
  for (const key of ["bgColor", "textColor", "shadowColor"] as const)
    if (
      typeof v[key] === "string" &&
      (/^#[0-9a-f]{6}$/i.test(v[key] as string) ||
        (key === "bgColor" && v[key] === "transparent"))
    )
      out[key] = v[key] as string;
  for (const key of ["colorize", "invert"] as const)
    if (typeof v[key] === "boolean") out[key] = v[key] as boolean;
  if (
    ["monospace", "serif", "sans-serif", "Vazirmatn"].includes(
      v.fontFamily as string,
    )
  )
    out.fontFamily = v.fontFamily as string;
  if (["normal", "bold"].includes(v.fontWeight as string))
    out.fontWeight = v.fontWeight as string;
  if (Array.isArray(v.strokes))
    out.strokes = v.strokes
      .slice(0, 1200)
      .filter(
        (s) =>
          s &&
          ["detail", "erase", "ascii", "emoji"].includes(s.mode) &&
          [s.x, s.y, s.radius].every(
            (n) => typeof n === "number" && Number.isFinite(n),
          ) &&
          s.x >= 0 &&
          s.x <= 1 &&
          s.y >= 0 &&
          s.y <= 1 &&
          s.radius >= 0.005 &&
          s.radius <= 0.5,
      );
  return out;
}
export async function migrateHistory(): Promise<Project[]> {
  const existing = await getProjects();
  if (await get("legacy-migrated", store)) return existing;
  const readLegacy = () =>
    new Promise<any[]>((resolve) => {
      const request = indexedDB.open("pimxmoji-history-db", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("history"))
          request.result.createObjectStore("history", { keyPath: "id" });
      };
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("history")) {
          db.close();
          resolve([]);
          return;
        }
        const read = db.transaction("history").objectStore("history").getAll();
        read.onsuccess = () => {
          db.close();
          resolve(read.result || []);
        };
        read.onerror = () => {
          db.close();
          resolve([]);
        };
      };
    });
  let legacy = await readLegacy();
  try {
    legacy = [
      ...legacy,
      ...JSON.parse(localStorage.getItem("pimxmoji-history") || "[]"),
    ];
  } catch {
    /* Ignore invalid old storage. */
  }
  const ids = new Set(existing.map((p) => p.id));
  for (const item of legacy)
    if (item.id && item.imageData && !ids.has(item.id)) {
      existing.push({
        id: item.id,
        name: item.name || "Legacy artwork",
        source: item.imageData,
        thumbnail: item.imageData,
        options: validateOptions(item.options || {}),
        effect: "still",
        updated: item.timestamp || Date.now(),
      });
      ids.add(item.id);
    }
  await saveProjects(existing);
  await set("legacy-migrated", true, store);
  return existing;
}
