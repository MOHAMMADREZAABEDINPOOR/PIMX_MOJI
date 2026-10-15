import type { Cell } from "./engine";
import type { StudioOptions } from "./types";
export const MARK_TREATMENTS = [
  "classic",
  "contour",
  "stipple",
  "halftone",
  "rings",
  "tiles",
  "triangles",
  "hatch",
  "crosshatch",
  "etch",
  "weave",
  "risograph",
  "duotone",
  "poster",
  "solar",
  "pixel-sort",
  "type-flow",
  "bayer",
] as const;
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const mix = (a: string, b: string, t: number) => {
  const rgb = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const left = rgb(a),
    right = rgb(b);
  return `rgb(${left.map((v, i) => Math.round(v + (right[i] - v) * t)).join(",")})`;
};
export function treatCell(
  cell: Cell,
  env: {
    x: number;
    y: number;
    lum: number;
    left: number;
    right: number;
    up: number;
    down: number;
    stepX: number;
    stepY: number;
    options: StudioOptions;
  },
): Cell | null {
  const { x, y, lum, left, right, up, down, stepX, stepY, options } = env;
  const type = options.treatment || "classic";
  if (type === "classic") return cell;
  const value = lum / 255,
    scale = options.treatmentScale ?? 1,
    angle = options.treatmentAngle ?? 0;
  const dx = right - left,
    dy = down - up,
    edge = Math.hypot(dx, dy);
  const noise =
    ((Math.imul(x + 7, 374761393) ^ Math.imul(y + 13, 668265263)) >>> 0) /
    4294967295;
  const palette = options.palette || [
    options.bgColor === "transparent" ? "#08090e" : options.bgColor,
    options.textColor,
  ];
  const ink = palette[palette.length - 1];
  switch (type) {
    case "contour":
      if (edge < 12 + scale * 8) return null;
      cell.shape = "line";
      cell.size = stepY * (0.65 + scale * 0.2);
      cell.angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90 + angle;
      cell.alpha = Math.min(1, 0.25 + edge / 100);
      cell.stroke = 0.65 + scale * 0.35;
      break;
    case "stipple":
      if (value < noise * (0.35 + scale * 0.22)) return null;
      cell.shape = "dot";
      cell.size = Math.min(stepX, stepY) * (0.25 + Math.sqrt(value) * 0.7);
      cell.x += (noise - 0.5) * stepX * scale * 0.55;
      cell.y += Math.sin(x * 19 + y * 11) * 0.24 * stepY * scale;
      break;
    case "halftone":
      cell.shape = "dot";
      cell.size =
        Math.min(stepX, stepY) * Math.sqrt(value) * (0.7 + scale * 0.25);
      cell.x += (y % 2) * stepX * 0.5;
      cell.alpha = 1;
      break;
    case "rings":
      if (value < 0.1) return null;
      cell.shape = "ring";
      cell.size = Math.min(stepX, stepY) * (0.4 + value * 0.6) * scale;
      cell.stroke = 0.35 + value * 1.3;
      break;
    case "tiles":
      cell.shape = "tile";
      cell.size =
        Math.min(stepX, stepY) * (0.2 + value * 0.8) * Math.min(1.5, scale);
      cell.angle = angle + ((x + y) % 2) * (scale > 1.2 ? 45 : 0);
      break;
    case "triangles":
      cell.shape = "triangle";
      cell.size = Math.min(stepX, stepY) * (0.25 + Math.sqrt(value) * 0.85);
      cell.angle = angle + ((x + y) % 2) * 180;
      cell.alpha = Math.max(0.2, value);
      break;
    case "hatch":
    case "crosshatch":
      if (value < 0.12) return null;
      cell.shape = type === "hatch" ? "line" : "cross";
      cell.size = stepY * (0.5 + value * 0.7) * scale;
      cell.stroke = 0.4 + value * 1.6;
      cell.angle = angle + (type === "hatch" ? Math.atan2(dy, dx) * 12 : 0);
      cell.alpha = Math.max(0.15, value);
      break;
    case "etch":
      if (edge < 8 && value < 0.22) return null;
      cell.char = edge > 60 ? "/" : edge > 25 ? "|" : value > 0.65 ? "≋" : "·";
      cell.angle = angle + (Math.atan2(dy, dx) * 180) / Math.PI;
      cell.size *= 0.5 + value * 0.7;
      cell.alpha = Math.min(1, 0.15 + value * 0.6 + edge / 180);
      break;
    case "weave":
      cell.char = (x + y) % 2 ? "━" : "┃";
      cell.angle = angle;
      cell.size *= 0.45 + value * 0.75;
      cell.alpha = 0.12 + value * 0.88;
      cell.x += (y % 2) * stepX * 0.22 * scale;
      break;
    case "risograph":
      if (value < 0.1) return null;
      cell.echo = palette[0];
      cell.echoOffset = scale * 1.6;
      cell.color = ink;
      cell.alpha = Math.round(value * 4) / 4;
      cell.angle = angle;
      break;
    case "duotone":
      cell.color = mix(palette[0], ink, value);
      cell.size *= 0.8 + Math.sin((x + y) * scale) * 0.15;
      cell.angle = angle;
      break;
    case "poster":
      cell.shape = scale > 1.4 ? "triangle" : "tile";
      cell.size = Math.min(stepX, stepY) * 1.04;
      cell.color =
        palette[
          Math.min(palette.length - 1, Math.floor(value * palette.length))
        ];
      cell.angle = angle;
      break;
    case "solar":
      cell.color = mix(palette[0], ink, Math.abs(value - 0.5) * 2);
      cell.alpha = 0.2 + Math.abs(value - 0.5) * 1.6;
      cell.angle = angle;
      cell.size *= 0.65 + Math.abs(value - 0.5) * scale;
      break;
    case "pixel-sort":
      cell.shape = "bar";
      cell.size = stepY * 0.8;
      cell.maxWidth = stepX * (0.4 + value * scale * 3);
      cell.color = options.colorize ? cell.color : mix(palette[0], ink, value);
      cell.alpha = 0.3 + value * 0.7;
      break;
    case "type-flow":
      cell.angle =
        angle + Math.sin(x / (4 + scale * 3) + y / (9 + scale * 4)) * 25;
      cell.y += Math.sin(x / (6 + scale * 4)) * stepY * scale * 0.4;
      cell.size *= 0.6 + value * 0.65;
      cell.alpha = 0.2 + value * 0.8;
      break;
    case "bayer":
      if (value < (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16) return null;
      cell.shape = scale > 1.4 ? "tile" : "dot";
      cell.size = Math.min(stepX, stepY) * (0.45 + scale * 0.2);
      cell.color = ink;
      cell.angle = angle;
      break;
  }
  return cell;
}
