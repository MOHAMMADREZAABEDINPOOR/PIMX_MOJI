import type { ArtOptions } from "../utils/imageProcessing";

export type Page = "home" | "studio" | "styles" | "library" | "result";
export type Effect = import("./motions").MotionEffect;
export type BrushMode = "detail" | "erase" | "ascii" | "emoji";
export interface Stroke {
  x: number;
  y: number;
  radius: number;
  mode: BrushMode;
}
export interface StudioOptions extends ArtOptions {
  direction: number;
  strokes: Stroke[];
}
export interface Project {
  id: string;
  name: string;
  source: string;
  thumbnail: string;
  options: StudioOptions;
  updated: number;
  effect: Effect;
}
export interface SavedStyle {
  id: string;
  name: string;
  options: StudioOptions;
}
export const DEFAULTS: StudioOptions = {
  mode: "ascii",
  chars: " .,:;i1tfLCG08@",
  resolution: 110,
  colorize: false,
  bgColor: "#080b18",
  textColor: "#a8baff",
  brightness: 110,
  contrast: 145,
  saturation: 100,
  invert: false,
  fontFamily: "monospace",
  fontWeight: "normal",
  spacing: 1.08,
  fontSize: 12,
  threshold: 15,
  shadowBlur: 0,
  shadowColor: "#a8baff",
  direction: 0,
  strokes: [],
  treatment: "classic",
  treatmentScale: 1,
  treatmentAngle: 0,
  palette: undefined,
};
export const EMOJI_SETS = {
  faces: "😀😄😎🥳😍😡😈💀🤖👻🌚🌝",
  nature: "🌑🌿🌲🌻🌸🌺🍁🍄🌊☁️🔥❄️",
  food: "🍇🍎🍊🍋🥑🥦🍆🍒🍩🍫🥐🍙",
  hearts: "🖤🤎❤️🧡💛💚💙💜🤍",
  symbols: "⬛🟫🟥🟧🟨🟩🟦🟪⬜",
};
export const SAMPLE_IMAGES = ["/samples/portrait.jpg"];
