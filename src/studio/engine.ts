import type { StudioOptions, Effect, Stroke } from "./types";
import { treatCell } from "./treatments";

export interface Cell {
  x: number;
  y: number;
  char: string;
  color: string;
  size: number;
  angle: number;
  alpha: number;
  maxWidth: number;
  font: string;
  shape?: "dot" | "ring" | "line" | "cross" | "tile" | "triangle" | "bar";
  stroke?: number;
  echo?: string;
  echoOffset?: number;
}
export interface Artwork {
  width: number;
  height: number;
  cells: Cell[];
  background: string;
  font: string;
  weight: string;
  glow: number;
  glowColor: string;
  columns: number;
  rows: number;
  stepX: number;
  stepY: number;
}
const emojiCache = new Map<string, { char: string; rgb: number[] }[]>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();
// Rasterize native color glyphs once, then rotate/scale the small bitmap.
// Repeated rotated fillText calls are particularly costly on Windows.
const emojiSprites = new Map<string, { canvas: HTMLCanvasElement; pad: number }>();
function paintGlyph(ctx: CanvasRenderingContext2D, cell: Cell, x: number, y: number) {
  if (!/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(cell.char)) {
    ctx.fillText(cell.char, x, y, cell.maxWidth);
    return;
  }
  const key = `${cell.char}:${cell.font}:${cell.maxWidth}`;
  let sprite = emojiSprites.get(key);
  if (!sprite) {
    const pad = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(Math.max(cell.maxWidth, cell.size * 1.5) + pad * 2) * 2;
    canvas.height = Math.ceil(cell.size * 1.8 + pad * 2) * 2;
    const ink = canvas.getContext("2d", { willReadFrequently: true })!;
    ink.scale(2, 2);
    ink.font = cell.font;
    ink.textBaseline = "top";
    ink.fillText(cell.char, pad, pad, cell.maxWidth);
    sprite = { canvas, pad };
    if (emojiSprites.size >= 512) emojiSprites.delete(emojiSprites.keys().next().value!);
    emojiSprites.set(key, sprite);
  }
  ctx.drawImage(sprite.canvas, x - sprite.pad, y - sprite.pad, sprite.canvas.width / 2, sprite.canvas.height / 2);
}
export const pause = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
export function graphemes(text: string): string[] {
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
}
export function loadImage(source: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(source);
  if (cached) return cached;
  const result = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(source);
      reject(
        new Error("The image could not be opened. / تصویر قابل خواندن نیست."),
      );
    };
    image.src = source;
  });
  if (imageCache.size >= 6) imageCache.delete(imageCache.keys().next().value!);
  imageCache.set(source, result);
  return result;
}
export async function readImage(file: File): Promise<string> {
  if (
    ![
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/bmp",
    ].includes(file.type)
  )
    throw new Error(
      "Choose a JPG, PNG, WEBP, GIF or AVIF image. / یک فایل تصویری انتخاب کنید.",
    );
  if (file.size > 25 * 1024 * 1024)
    throw new Error(
      "Maximum image size is 25 MB. / حداکثر حجم عکس ۲۵ مگابایت است.",
    );
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
function emojiPalette(chars: string) {
  const cached = emojiCache.get(chars);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 24;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const result = graphemes(chars)
    .filter((c) => c.trim())
    .slice(0, 80)
    .map((char) => {
      ctx.clearRect(0, 0, 24, 24);
      ctx.font = '20px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textBaseline = "top";
      ctx.fillText(char, 1, 1);
      const pixels = ctx.getImageData(0, 0, 24, 24).data;
      const rgb = [0, 0, 0];
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3] / 255;
        for (let c = 0; c < 3; c++) rgb[c] += pixels[i + c] * a;
        count += a;
      }
      return { char, rgb: rgb.map((c) => c / (count || 1)) };
    });
  if (emojiCache.size > 24) emojiCache.clear();
  emojiCache.set(chars, result);
  return result;
}
function brushAt(x: number, y: number, strokes: Stroke[]) {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    if ((s.x - x) ** 2 + (s.y - y) ** 2 < s.radius ** 2) return s.mode;
  }
}
export async function buildArtwork(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: StudioOptions,
  signal?: AbortSignal,
  progress?: (value: number) => void,
): Promise<Artwork> {
  const cols = Math.max(
    20,
    Math.min(400, options.resolution),
  );
  const fontSize = options.fontSize || 12;
  const stepX =
    fontSize *
    (options.mode === "emoji" ? 1 : options.mode === "mosaic" ? 2 : 0.64) *
    (options.spacing || 1);
  const stepY = fontSize * (options.spacing || 1);
  const rows = Math.max(
    1,
    Math.min(
      500,
      Math.round((((cols * sourceHeight) / sourceWidth) * stepX) / stepY),
    ),
  );
  const canvas = document.createElement("canvas");
  canvas.width = cols * 2;
  canvas.height = rows * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const chars = graphemes(options.chars || " ");
  const words = options.chars.trim().split(/\s+/u).filter(Boolean);
  const palette =
    options.mode === "emoji" || options.strokes.some((s) => s.mode === "emoji")
      ? emojiPalette(
          options.mode === "emoji" ? options.chars : "🖤🤎❤️🧡💛💚💙💜🤍",
        )
      : [];
  const colorMap = new Map<number, string>();
  const cells: Cell[] = [];
  const glyphFonts = new Map<string, string>();
  const asciiBrushChars = graphemes(" .:-=+*#%@");
  // Index brush strokes in normalized image space. Long painting sessions
  // should not scan every stroke for every character on every adjustment.
  const buckets = new Map<number, Stroke[]>();
  const bucket = (value: number) =>
    Math.max(0, Math.min(23, Math.floor(value * 24)));
  for (const stroke of options.strokes) {
    for (
      let y = bucket(stroke.y - stroke.radius);
      y <= bucket(stroke.y + stroke.radius);
      y++
    )
      for (
        let x = bucket(stroke.x - stroke.radius);
        x <= bucket(stroke.x + stroke.radius);
        x++
      ) {
        const key = y * 24 + x;
        const list = buckets.get(key) || [];
        list.push(stroke);
        buckets.set(key, list);
      }
  }
  const strokeAt = (x: number, y: number) => {
    const nearby = buckets.get(bucket(y) * 24 + bucket(x));
    return nearby ? brushAt(x, y, nearby) : undefined;
  };
  const sample = (sx: number, sy: number) => {
    const i =
      (Math.max(0, Math.min(canvas.height - 1, sy)) * canvas.width +
        Math.max(0, Math.min(canvas.width - 1, sx))) *
      4;
    return pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
  };
  function addCell(x: number, y: number, subX = 0, subY = 0, scale = 1) {
    const offset = ((y * 2 + subY) * canvas.width + x * 2 + subX) * 4;
    if (pixels[offset + 3] < 20) return;
    const [r, g, b] = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const brush = strokeAt((x + 0.5) / cols, (y + 0.5) / rows);
    if (brush === "erase" || lum < (options.threshold || 0)) return;
    const mode = brush === "ascii" || brush === "emoji" ? brush : options.mode;
    let char: string;
    if (mode === "emoji") {
      const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
      char = colorMap.get(key) || "";
      if (!char) {
        let distance = Infinity;
        char = "⬛";
        for (const p of palette) {
          const d =
            2 * (r - p.rgb[0]) ** 2 +
            4 * (g - p.rgb[1]) ** 2 +
            3 * (b - p.rgb[2]) ** 2;
          if (d < distance) {
            distance = d;
            char = p.char;
          }
        }
        colorMap.set(key, char);
      }
    } else if (mode === "mosaic") {
      char = (
        words.length ? words[(y * cols + x) % words.length] : "PIMX"
      ).slice(0, 28);
    } else {
      const map =
        brush === "ascii" && options.mode !== "ascii" ? asciiBrushChars : chars;
      const index = Math.min(
        map.length - 1,
        Math.floor((lum / 256) * map.length),
      );
      char = map[options.invert ? map.length - index - 1 : index];
    }
    if (!char.trim()) return;
    const fontKey = `${char}:${scale}`;
    let font = glyphFonts.get(fontKey);
    if (!font) {
      const family = /\p{Extended_Pictographic}/u.test(char)
        ? '"Segoe UI Emoji", "Apple Color Emoji", sans-serif'
        : options.fontFamily;
      font = `${options.fontWeight} ${fontSize * scale}px ${family}`;
      glyphFonts.set(fontKey, font);
    }
    const cell: Cell = {
      x: (x + subX / 2) * stepX,
      y: (y + subY / 2) * stepY,
      char,
      color: options.colorize ? `rgb(${r},${g},${b})` : options.textColor,
      size: fontSize * scale,
      angle: options.direction || 0,
      alpha:
        mode === "mosaic" && !options.colorize ? Math.max(0.06, lum / 255) : 1,
      maxWidth: stepX * scale * 0.98,
      font,
    };
    const styled =
      options.treatment && options.treatment !== "classic"
        ? treatCell(cell, {
            x,
            y,
            lum,
            left: sample(x * 2 - 2, y * 2),
            right: sample(x * 2 + 2, y * 2),
            up: sample(x * 2, y * 2 - 2),
            down: sample(x * 2, y * 2 + 2),
            stepX,
            stepY,
            options,
          })
        : cell;
    if (styled) {
      if (!styled.shape && styled.size !== fontSize * scale) {
        // Quantized sizes reuse browser glyph caches, especially for color emoji.
        styled.size = Math.max(2, Math.round(styled.size * 2) / 2);
        const family =
          mode === "emoji"
            ? '"Segoe UI Emoji", "Apple Color Emoji", sans-serif'
            : options.fontFamily;
        styled.font = `${options.fontWeight} ${styled.size}px ${family}`;
      }
      cells.push(styled);
    }
  }
  let batchStarted = performance.now();
  for (let y = 0; y < rows; y++) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    for (let x = 0; x < cols; x++) {
      if (strokeAt((x + 0.5) / cols, (y + 0.5) / rows) === "detail") {
        for (let sy = 0; sy < 2; sy++)
          for (let sx = 0; sx < 2; sx++) addCell(x, y, sx, sy, 0.5);
      } else addCell(x, y);
    }
    if (performance.now() - batchStarted >= 8 || y === rows - 1) {
      progress?.((y + 1) / rows);
      await pause();
      batchStarted = performance.now();
    }
  }
  return {
    width: Math.ceil(cols * stepX),
    height: Math.ceil(rows * stepY),
    cells,
    background: options.bgColor,
    font:
      options.mode === "emoji"
        ? '"Segoe UI Emoji", "Apple Color Emoji", sans-serif'
        : options.fontFamily,
    weight: options.fontWeight,
    glow: options.shadowBlur || 0,
    glowColor: options.shadowColor || options.textColor,
    columns: cols,
    rows,
    stepX,
    stepY,
  };
}
export function artworkText(art: Artwork) {
  const grid = Array.from({ length: art.rows }, () =>
    Array<string>(art.columns).fill(" "),
  );
  for (const cell of art.cells) {
    const y = Math.min(art.rows - 1, Math.floor(cell.y / art.stepY));
    const x = Math.min(art.columns - 1, Math.floor(cell.x / art.stepX));
    grid[y][x] = cell.char;
  }
  return grid.map((row) => row.join("")).join("\n");
}
function* drawArtworkSteps(
  canvas: HTMLCanvasElement,
  art: Artwork,
  effect: Effect = "still",
  time = 0,
  maxWidth = 8192,
) {
  const ratio = Math.min(2, maxWidth / art.width, maxWidth / art.height, Math.sqrt(32_000_000 / (art.width * art.height)));
  const w = Math.max(1, Math.round(art.width * ratio)),
    h = Math.max(1, Math.round(art.height * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  // A software-backed surface avoids long GPU readback stalls with rotated
  // color emoji, and is shared by previews, thumbnails and downloadable files.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, w, h);
  if (art.background !== "transparent") {
    ctx.fillStyle = art.background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.save();
  ctx.scale(ratio, ratio);
  ctx.textBaseline = "top";
  ctx.shadowBlur = art.glow;
  ctx.shadowColor = art.glowColor;
  let font = "",
    color = "";
  let alpha = -1;
  const duration = time % 4;
  let batchStarted = performance.now();
  for (let i = 0; i < art.cells.length; i++) {
    if (i % 128 === 0 && performance.now() - batchStarted >= 8) {
      yield;
      batchStarted = performance.now();
    }
    const c = art.cells[i];
    let x = c.x,
      y = c.y;
    if (effect === "reveal" && c.y / art.height > Math.min(1, duration / 2.5))
      continue;
    // Rain travels through the light, not through the portrait's geometry.
    // Shifting individual rows destroys the face and wraps its features.
    let rainAlpha = 1;
    if (effect === "rain") {
      const phase = (Math.floor(c.x / art.stepX) * 0.61803398875) % 1;
      const head = ((time * 0.26 + phase) % 1) * art.height;
      const distance = (head - c.y + art.height) % art.height;
      rainAlpha = 0.66 + 0.34 * Math.exp(-distance / (art.height * 0.14));
    }
    if (effect === "wave") y += Math.sin(c.x / 70 + time * 2) * 12;
    if (
      effect === "glitch" &&
      Math.sin(c.y * 0.15 + Math.floor(time * 7)) > 0.92
    )
      x += Math.sin(time * 20) * 28;
    if (effect === "scatter") {
      const amount = (1 - Math.cos(time * 1.6)) * 0.5;
      x += Math.sin(i * 12.98) * amount * 100;
      y += Math.cos(i * 7.23) * amount * 100;
    }
    const cx = c.x - art.width / 2, cy = c.y - art.height / 2;
    const distanceFromCenter = Math.hypot(cx / art.width, cy / art.height);
    if (effect === "breathe") {
      const scale = 1 + Math.sin(time * Math.PI / 2) * 0.035;
      x = art.width / 2 + cx * scale;
      y = art.height / 2 + cy * scale;
    }
    if (effect === "drift") { x += Math.sin(time * Math.PI / 2) * 10; y += Math.cos(time * Math.PI / 2) * 8; }
    if (effect === "orbit" || effect === "vortex") {
      const angle = Math.sin(time * Math.PI / 2) * (effect === "orbit" ? 0.045 : distanceFromCenter * 0.25);
      x = art.width / 2 + cx * Math.cos(angle) - cy * Math.sin(angle);
      y = art.height / 2 + cx * Math.sin(angle) + cy * Math.cos(angle);
    }
    if (effect === "ripple") {
      const strength = Math.sin(distanceFromCenter * 30 - time * Math.PI * 2) * 7;
      x += cx / (Math.hypot(cx, cy) || 1) * strength;
      y += cy / (Math.hypot(cx, cy) || 1) * strength;
    }
    if (effect === "scan") {
      const beam = (Math.sin(time * Math.PI / 2) + 1) / 2;
      rainAlpha = 0.45 + 0.55 * Math.exp(-Math.abs(c.y / art.height - beam) * 12);
    }
    if (effect === "sparkle") rainAlpha = 0.5 + 0.5 * Math.pow((1 + Math.sin(i * 2.399 + time * Math.PI)) / 2, 3);
    if (effect === "tilt") {
      x = art.width / 2 + cx * (0.94 + 0.06 * Math.cos(time * Math.PI / 2));
      y += cx * Math.sin(time * Math.PI / 2) * 0.055;
    }
    if (effect === "shutter") rainAlpha = 0.25 + 0.75 * (0.5 + Math.sin(Math.floor(c.x / art.stepX / 5) * 0.7 - time * Math.PI) * 0.5);
    if (effect === "bounce") y -= (1 - Math.cos(time * Math.PI)) * 8;
    if (effect === "focus") rainAlpha = 0.18 + 0.82 * Math.exp(-Math.pow(distanceFromCenter - (1 + Math.sin(time * Math.PI / 2)) * 0.35, 2) * 18);
    if (effect === "chromatic") {
      x += Math.sin(time * Math.PI + c.y / 80) * 3;
      if (i % 5 === 0) {
        ctx.save();
        ctx.globalAlpha = c.alpha * 0.45;
        ctx.fillStyle = "#6f8cff";
        ctx.fillRect(x - Math.sin(time * Math.PI) * 9, y, Math.max(1, art.stepX * 0.25), Math.max(1, c.size));
        ctx.restore();
      }
    }
    const nextFont = c.font;
    if (font !== nextFont) {
      ctx.font = nextFont;
      font = nextFont;
    }
    if (color !== c.color) {
      ctx.fillStyle = c.color;
      color = c.color;
    }
    if (alpha !== c.alpha * rainAlpha) {
      ctx.globalAlpha = c.alpha * rainAlpha;
      alpha = c.alpha * rainAlpha;
    }
    if (c.shape) {
      ctx.save();
      ctx.translate(x + art.stepX / 2, y + art.stepY / 2);
      ctx.rotate((c.angle * Math.PI) / 180);
      const radius = c.size / 2;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.stroke || 1;
      if (c.shape === "dot" || c.shape === "ring") {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, radius), 0, Math.PI * 2);
        if (c.shape === "dot") ctx.fill();
        else ctx.stroke();
      } else if (c.shape === "tile")
        ctx.fillRect(-radius, -radius, c.size, c.size);
      else if (c.shape === "bar")
        ctx.fillRect(-art.stepX / 2, -radius, c.maxWidth, c.size);
      else if (c.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, radius);
        ctx.lineTo(-radius, radius);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        if (c.shape === "cross") {
          ctx.moveTo(0, -radius);
          ctx.lineTo(0, radius);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (c.echo) {
      ctx.save();
      ctx.fillStyle = c.echo;
      paintGlyph(
        ctx, c,
        x + (c.echoOffset || 2),
        y + (c.echoOffset || 2),
      );
      ctx.restore();
      paintGlyph(ctx, c, x, y);
    } else if (c.angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((c.angle * Math.PI) / 180);
      paintGlyph(ctx, c, 0, 0);
      ctx.restore();
    } else paintGlyph(ctx, c, x, y);
  }
  ctx.restore();
}
export function drawArtwork(...args: Parameters<typeof drawArtworkSteps>) {
  for (const _ of drawArtworkSteps(...args)) { /* synchronous small previews */ }
}
export async function drawArtworkAsync(canvas: HTMLCanvasElement, art: Artwork, signal?: AbortSignal, maxWidth = 8192) {
  const steps = drawArtworkSteps(canvas, art, "still", 0, maxWidth);
  try {
    for (const _ of steps) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      await pause();
    }
  } finally { steps.return(); }
}
export function thumbnail(canvas: HTMLCanvasElement, max = 480) {
  const out = document.createElement("canvas");
  const scale = Math.min(1, max / Math.max(canvas.width, canvas.height));
  out.width = Math.round(canvas.width * scale);
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#080b18";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.82);
}
