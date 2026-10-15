import { drawArtwork, type Artwork } from "./engine";
import type { Effect } from "./types";
export type ExportTemplate =
  "original" | "avatar" | "story" | "wallpaper" | "poster";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Export failed / خروجی ساخته نشد.")),
      type,
    ),
  );
}
export function compose(
  source: HTMLCanvasElement,
  template: ExportTemplate,
  border: number,
  signature: string,
  background: string,
) {
  if (template === "original" && border === 0 && !signature.trim()) return source;
  const sizes: Record<ExportTemplate, number[]> = {
    original: [source.width, source.height],
    avatar: [1080, 1080],
    story: [1080, 1920],
    wallpaper: [1920, 1080],
    poster: [2480, 3508],
  };
  const [width, height] = sizes[template];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  const padding = (Math.min(width, height) * border) / 100;
  const footer = signature.trim() ? Math.max(32, height * 0.05) : 0;
  const scale = Math.min(
    (width - padding * 2) / source.width,
    (height - padding * 2 - footer) / source.height,
  );
  const w = source.width * scale,
    h = source.height * scale;
  ctx.drawImage(source, (width - w) / 2, (height - footer - h) / 2, w, h);
  if (signature.trim()) {
    ctx.font = `${Math.max(15, width * 0.018)}px Vazirmatn, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = background === "#ffffff" ? "#080b18" : "#a8baff";
    ctx.fillText(
      signature.slice(0, 100),
      width / 2,
      height - Math.max(20, padding * 0.4),
      width * 0.85,
    );
  }
  return canvas;
}
export async function exportGif(
  art: Artwork,
  effect: Effect,
  progress: (n: number) => void,
  signal: AbortSignal,
) {
  const worker = new Worker(new URL("./gif.worker.ts", import.meta.url), {
    type: "module",
  });
  const canvas = document.createElement("canvas");
  const send = (data: any, transfers: Transferable[] = []) =>
    new Promise<any>((resolve, reject) => {
      const abort = () => {
        worker.terminate();
        reject(new DOMException("Cancelled", "AbortError"));
      };
      signal.addEventListener("abort", abort, { once: true });
      worker.onmessage = (e) => {
        signal.removeEventListener("abort", abort);
        e.data.error ? reject(new Error(e.data.error)) : resolve(e.data);
      };
      worker.onerror = (e) => {
        signal.removeEventListener("abort", abort);
        reject(new Error(e.message));
      };
      worker.postMessage(data, transfers);
    });
  try {
    for (let frame = 0; frame < 40; frame++) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      drawArtwork(
        canvas,
        {
          ...art,
          background:
            art.background === "transparent" ? "#080b18" : art.background,
        },
        effect,
        frame / 10,
        480,
      );
      const pixels = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data.buffer;
      await send(
        { pixels, width: canvas.width, height: canvas.height, delay: 100 },
        [pixels],
      );
      progress(((frame + 1) / 40) * 100);
    }
    const result = await send({ finish: true });
    return new Blob([result.bytes], { type: "image/gif" });
  } finally {
    worker.terminate();
  }
}
export function recorderType() {
  if (typeof MediaRecorder === "undefined")
    throw new Error(
      "Video recording is unavailable in this browser. Use GIF instead. / از خروجی GIF استفاده کنید.",
    );
  return (
    [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) || ""
  );
}
export async function recordCanvas(
  canvas: HTMLCanvasElement,
  render: (time: number) => Promise<void> | void,
  seconds: number,
  progress: (n: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const type = recorderType();
  if (!canvas.captureStream)
    throw new Error(
      "Canvas recording is unavailable. / ضبط بوم در این مرورگر پشتیبانی نمی‌شود.",
    );
  await render(0);
  const stream = canvas.captureStream(20);
  const recorder = new MediaRecorder(
    stream,
    type ? { mimeType: type, videoBitsPerSecond: 5_000_000 } : {},
  );
  const chunks: Blob[] = [];
  const completed = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.onerror = () =>
      reject(new Error("Video recording failed. / ضبط ویدئو ناموفق بود."));
  });
  // Install a handler immediately so a recorder error cannot become unhandled during rendering.
  void completed.catch(() => {});
  recorder.start(200);
  const start = performance.now();
  try {
    while ((performance.now() - start) / 1000 < seconds) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const elapsed = (performance.now() - start) / 1000;
      await render(elapsed);
      progress(Math.min(99, (elapsed / seconds) * 100));
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    if (recorder.state !== "inactive") recorder.stop();
    const blob = await completed;
    progress(100);
    return blob;
  } finally {
    if (recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}
