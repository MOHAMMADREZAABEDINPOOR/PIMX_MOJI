import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Download,
  Film,
  Image,
  Layers3,
  LoaderCircle,
  Play,
  Share2,
  Square,
  Upload,
  Video,
  X,
} from "lucide-react";
import { zip } from "fflate";
import { Modal, Busy, type Translate } from "./ui";
import {
  buildArtwork,
  drawArtwork,
  drawArtworkAsync,
  loadImage,
  readImage,
  thumbnail,
  type Artwork,
} from "./engine";
import {
  canvasBlob,
  compose,
  download,
  exportGif,
  recordCanvas,
  type ExportTemplate,
} from "./export";
import type { Effect, StudioOptions } from "./types";
import { ArtworkViewer } from "./ArtworkViewer";
import { CanvasSizePicker } from "./CanvasSizePicker";
import { MotionPicker } from "./MotionPicker";
import { Range } from "./Studio";
type Base = {
  t: Translate;
  close: () => void;
  notify: (m: string, error?: boolean) => void;
};
export function ExportDialog({
  t,
  close,
  notify,
  art,
  name,
  effect,
  inline = false,
  onEffectChange,
}: Base & { art: Artwork; name: string; effect: Effect; inline?: boolean; onEffectChange?: (effect: Effect) => void }) {
  const [format, setFormat] = useState("png"),
    [template, setTemplate] = useState<ExportTemplate>("original"),
    [border, setBorder] = useState(0),
    [signature, setSignature] = useState(""),
    [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [selectedEffect, setSelectedEffect] = useState<Effect>(effect);
  const controller = useRef<AbortController | null>(null),
    exportCanvas = useRef<HTMLCanvasElement | null>(null);
  const [previewFrame, setPreviewFrame] = useState<HTMLCanvasElement>();
  const originalScale = Math.min(2, 8192 / art.width, 8192 / art.height, Math.sqrt(32_000_000 / (art.width * art.height)));
  useEffect(() => () => controller.current?.abort(), []);
  const [renderedSource, setRenderedSource] = useState<HTMLCanvasElement>();
  useEffect(() => {
    const abort = new AbortController();
    setRenderedSource(undefined);
    const source = document.createElement("canvas");
    void drawArtworkAsync(source, art, abort.signal).then(() => {
      if (!abort.signal.aborted) setRenderedSource(source);
    }).catch(e => { if (!abort.signal.aborted) notify((e as Error).message, true); });
    return () => abort.abort();
  }, [art]);
  useEffect(() => {
    exportCanvas.current = null;
    setPreviewFrame(undefined);
    if (!renderedSource) return;
    const framed = compose(renderedSource, template, border, signature, art.background);
    exportCanvas.current = framed;
    setPreviewFrame(framed);
  }, [renderedSource, template, border, signature, art.background]);
  useEffect(() => setSelectedEffect(effect), [effect]);
  async function run() {
    if (busy || !exportCanvas.current) return;
    setBusy(true);
    setProgress(0);
    const abort = new AbortController();
    controller.current = abort;
    try {
      let blob: Blob;
      if (format === "png") blob = await canvasBlob(exportCanvas.current!);
      else if (format === "gif")
        blob = await exportGif(
          art,
          selectedEffect === "still" ? "reveal" : selectedEffect,
          setProgress,
          abort.signal,
        );
      else {
        const canvas = document.createElement("canvas");
        blob = await recordCanvas(
          canvas,
          (time) =>
            drawArtwork(
              canvas,
              {
                ...art,
                background:
                  art.background === "transparent" ? "#080b18" : art.background,
              },
              selectedEffect === "still" ? "reveal" : selectedEffect,
              time,
              960,
            ),
          4,
          setProgress,
          abort.signal,
        );
      }
      if (abort.signal.aborted) return;
      const ext =
        format === "video"
          ? blob.type.includes("mp4")
            ? "mp4"
            : "webm"
          : format;
      download(blob, `${name || "pimx-art"}.${ext}`);
      notify(
        t(
          "Your creation is ready for the world.",
          "اثرت آماده‌ست تا دیده بشه.",
        ),
      );
    } catch (e) {
      if (!abort.signal.aborted) notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  const content = (
      <div className="export-layout">
        <div className="result-art-column">
          {previewFrame ? <ArtworkViewer art={art} effect={selectedEffect} t={t} frame={format === "png" ? previewFrame : undefined} /> : <Busy label={t("Preparing full-quality artwork...", "\u062f\u0631 \u062d\u0627\u0644 \u0622\u0645\u0627\u062f\u0647\u200c\u0633\u0627\u0632\u06cc \u062e\u0631\u0648\u062c\u06cc \u0628\u0627\u06a9\u06cc\u0641\u06cc\u062a...")} />}
          <MotionPicker value={selectedEffect} disabled={busy || !previewFrame} t={t} onChange={next => { setSelectedEffect(next); onEffectChange?.(next); }} />
        </div>
        <div className="export-options">
          {inline && <div className="download-heading"><h2>{t("Keep your creation.", "اثرت رو با خودت ببر.")}</h2><p>{t("Pick a format and make it fit wherever it goes next.", "فرمت و اندازه رو انتخاب کن و برای هر جا که می‌خوای خروجی بگیر.")}</p></div>}
          <label className="field-label">
            {t("File format", "نوع فایل")}
            <div className="format-buttons">
              {[
                ["png", "PNG", Image],
                ["gif", "GIF", Film],
                ["video", t("Video", "ویدئو"), Video],
              ].map(([id, label, Icon]) => {
                const C = Icon as typeof Image;
                return (
                  <button
                    key={id as string}
                    className={format === id ? "selected" : ""}
                    disabled={busy || !previewFrame}
                    onClick={() => setFormat(id as string)}
                  >
                    <C size={18} />
                    <span>{label as string}</span>
                  </button>
                );
              })}
            </div>
          </label>
          {format === "png" ? (
            <>
              <CanvasSizePicker label={t("Canvas size", "اندازه بوم")} value={template} disabled={busy || !previewFrame} onChange={setTemplate} options={[
                { value: "original", name: t("Original artwork", "ابعاد اصلی اثر"), size: `${Math.round(art.width * originalScale)} × ${Math.round(art.height * originalScale)}` },
                { value: "avatar", name: t("Avatar", "آواتار"), size: "1080 × 1080" },
                { value: "story", name: t("Story", "استوری"), size: "1080 × 1920" },
                { value: "wallpaper", name: t("Wallpaper", "والپیپر"), size: "1920 × 1080" },
                { value: "poster", name: t("Print poster", "پوستر چاپی"), size: "2480 × 3508" },
              ]} />
              <Range
                label={t("Breathing room", "حاشیه تصویر")}
                value={border}
                min={0}
                max={18}
                suffix="%"
                onChange={setBorder}
              />
              <label className="field-label">
                {t("Your signature (optional)", "امضای تو (اختیاری)")}
                <input
                  dir="auto"
                  disabled={busy || !previewFrame}
                  maxLength={100}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={t("Made by you.", "ساخته‌شده به دست تو.")}
                />
              </label>
            </>
          ) : (
            <p className="hint">
              {t(
                "Animated exports use the original canvas ratio. GIF is 480 px wide; video is up to 960 px. A still artwork uses the build-up effect. Motion exports have a solid background.",
                "خروجی متحرک با نسبت اصلی ساخته می‌شه؛ GIF با عرض حداکثر ۴۸۰ و ویدئو ۹۶۰ پیکسل. اثر ثابت با انیمیشن ساخته‌شدن خروجی می‌گیره. پس‌زمینه خروجی متحرک یکدسته.",
              )}
            </p>
          )}
          {format === "png" && selectedEffect !== "still" && <p className="hint">{t("PNG saves a still image. Choose GIF or Video to save the movement.", "برای ذخیره حرکت، GIF یا ویدئو را انتخاب کن؛ PNG تصویر ثابت است.")}</p>}
          {busy ? (
            <Busy
              label={t("Packing up the pixels…", "در حال آماده‌کردن پیکسل‌ها…")}
              progress={progress}
              cancel={() => controller.current?.abort()}
            />
          ) : (
            <button className="button primary full" disabled={!previewFrame} onClick={() => void run()}>
              <Download size={17} />
              {t("Download artwork", "دانلود اثر")}
            </button>
          )}
        </div>
      </div>
  );
  return inline ? content : <Modal title={t("Take your art places.", "اثرت رو با خودت ببر.")} close={() => { controller.current?.abort(); close(); }} wide>{content}</Modal>;
}
export function BatchDialog({
  t,
  close,
  notify,
  options,
}: Base & { options: StudioOptions }) {
  const [files, setFiles] = useState<File[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [status, setStatus] = useState("");
  const controller = useRef<AbortController | null>(null),
    input = useRef<HTMLInputElement>(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  async function run() {
    setBusy(true);
    setProgress(0);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const output: Record<string, Uint8Array> = {};
      for (let i = 0; i < files.length; i++) {
        if (abort.signal.aborted)
          throw new DOMException("Cancelled", "AbortError");
        if (mounted.current)
          setStatus(`${i + 1} / ${files.length} · ${files[i].name}`);
        const source = await readImage(files[i]);
        const image = await loadImage(source);
        const art = await buildArtwork(
          image,
          image.width,
          image.height,
          { ...options, strokes: [] },
          abort.signal,
        );
        const canvas = document.createElement("canvas");
        await drawArtworkAsync(canvas, art, abort.signal);
        output[
          `${String(i + 1).padStart(2, "0")}-${files[i].name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]/gu, "_")}.png`
        ] = new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer());
        if (mounted.current) setProgress(((i + 1) / files.length) * 90);
      }
      if (abort.signal.aborted)
        throw new DOMException("Cancelled", "AbortError");
      const bytes = await new Promise<Uint8Array>((resolve, reject) => {
        const stop = zip(output, { level: 0 }, (error, result) => {
          abort.signal.removeEventListener("abort", cancel);
          error ? reject(error) : resolve(result);
        });
        const cancel = () => {
          stop();
          reject(new DOMException("Cancelled", "AbortError"));
        };
        abort.signal.addEventListener("abort", cancel, { once: true });
      });
      if (!abort.signal.aborted) {
        download(
          new Blob([bytes as BlobPart], { type: "application/zip" }),
          "pimx-experiments.zip",
        );
        notify(
          t(
            "All your experiments, in one ZIP.",
            "همه آثارت در یک فایل ZIP آماده شدن.",
          ),
        );
        if (mounted.current) setProgress(100);
      }
    } catch (e) {
      if (!abort.signal.aborted) notify((e as Error).message, true);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Modal
      title={t("One style. A whole collection.", "یک سبک. یک مجموعه کامل.")}
      close={() => {
        controller.current?.abort();
        close();
      }}
    >
      <p className="modal-description">
        {t(
          "Apply your current style to up to 12 images and download the results as a ZIP. Each image can be up to 25 MB. Brush edits are excluded.",
          "سبک فعلی رو روی حداکثر ۱۲ عکس، هر کدوم تا ۲۵ مگابایت، اعمال کن و خروجی ZIP بگیر. ویرایش‌های قلم‌مو روی عکس‌های گروهی اعمال نمی‌شن.",
        )}
      </p>
      <input
        ref={input}
        className="sr-only"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        aria-label="Batch images"
        onChange={(e) => {
          const selected = Array.from(e.target.files || []);
          if (selected.length > 12)
            notify(
              t(
                "Choose up to 12 images at a time.",
                "هر بار حداکثر ۱۲ عکس انتخاب کن.",
              ),
              true,
            );
          setFiles(selected.slice(0, 12));
        }}
      />
      <button
        className="upload-zone full"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Layers3 size={28} />
        <strong>
          {files.length
            ? `${files.length} ${t("images selected", "عکس انتخاب شد")}`
            : t("Choose your images", "عکس‌ها رو انتخاب کن")}
        </strong>
        <span>
          {t("Click to select multiple images", "برای انتخاب چند عکس کلیک کن")}
        </span>
      </button>
      {!!files.length && (
        <div className="batch-files">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`}>{f.name}</span>
          ))}
        </div>
      )}
      {busy ? (
        <Busy
          label={status}
          progress={progress}
          cancel={() => controller.current?.abort()}
        />
      ) : (
        <button
          className="button primary full"
          disabled={!files.length}
          onClick={() => void run()}
        >
          <Download size={17} />
          {t("Create & download ZIP", "ساخت و دانلود ZIP")}
        </button>
      )}
    </Modal>
  );
}
export function LiveDialog({
  t,
  close,
  notify,
  options,
  kind,
  capture,
}: Base & {
  options: StudioOptions;
  kind: "camera" | "video";
  capture: (source: string) => void;
}) {
  const [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false),
    [progress, setProgress] = useState(0),
    [quality, setQuality] = useState(50),
    [mode, setMode] = useState(options.mode),
    [fileName, setFileName] = useState(""),
    [duration, setDuration] = useState(5),
    [elapsed, setElapsed] = useState(0),
    [starting, setStarting] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    input = useRef<HTMLInputElement>(null),
    stream = useRef<MediaStream | null>(null),
    url = useRef(""),
    alive = useRef(true),
    controller = useRef<AbortController | null>(null);
  const renderRef = useRef({ options, quality, mode });
  renderRef.current = { options, quality, mode };
  const controls = useRef({ recording: false });
  controls.current.recording = recording;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (url.current) URL.revokeObjectURL(url.current);
      video.current?.pause();
    };
  }, []);
  const liveOptions = () => {
    const current = renderRef.current;
    return {
      ...current.options,
      strokes: [],
      shadowBlur: 0,
      resolution: current.quality,
      mode: current.mode,
      chars:
        current.mode === current.options.mode
          ? current.options.chars
          : current.mode === "emoji"
            ? "🖤🤎❤️🧡💛💚💙💜🤍"
            : current.mode === "mosaic"
              ? "PIMX ART"
              : " .:-=+*#%@",
    };
  };
  useEffect(() => {
    if (!active) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const render = async () => {
      if (!alive.current || abort.signal.aborted) return;
      const v = video.current,
        c = canvas.current;
      if (v && c && v.readyState >= 2 && !controls.current.recording) {
        try {
          const art = await buildArtwork(
            v,
            v.videoWidth,
            v.videoHeight,
            liveOptions(),
            abort.signal,
          );
          if (!abort.signal.aborted && alive.current) {
            drawArtwork(c, art, "still", 0, 960);
            setElapsed(v.currentTime);
          }
        } catch (e) {
          if (!abort.signal.aborted) notify((e as Error).message, true);
        }
      }
      if (!abort.signal.aborted) timer = setTimeout(() => void render(), 90);
    };
    void render();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [active, notify]);
  async function startCamera() {
    if (starting) return;
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          t(
            "Camera needs HTTPS or localhost and a supported browser.",
            "دوربین به HTTPS یا localhost و مرورگر پشتیبان نیاز داره.",
          ),
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      if (!alive.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      video.current!.srcObject = media;
      await video.current!.play();
      if (alive.current) setActive(true);
    } catch (e) {
      if (alive.current)
        notify(
          t(
            "Camera could not start. Check your camera permission. ",
            "دوربین باز نشد؛ دسترسی دوربین رو بررسی کن. ",
          ) + (e as Error).message,
          true,
        );
    } finally {
      if (alive.current) setStarting(false);
    }
  }
  async function openVideo(file?: File) {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      notify(
        t(
          "Choose a video under 100 MB.",
          "ویدئوی کمتر از ۱۰۰ مگابایت انتخاب کن.",
        ),
        true,
      );
      return;
    }
    setActive(false);
    setStarting(true);
    try {
      const v = video.current!;
      v.pause();
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          v.onloadeddata = null;
          v.onerror = null;
          reject(
            new Error(
              t("Video loading timed out.", "بارگذاری ویدئو زمان زیادی برد."),
            ),
          );
        }, 15000);
        v.onloadeddata = () => {
          clearTimeout(timeout);
          v.onloadeddata = null;
          v.onerror = null;
          resolve();
        };
        v.onerror = () => {
          clearTimeout(timeout);
          v.onloadeddata = null;
          v.onerror = null;
          reject(
            new Error(
              t(
                "This video format is not supported.",
                "این فرمت ویدئو پشتیبانی نمی‌شه.",
              ),
            ),
          );
        };
        v.src = url.current;
        v.load();
      });
      if (!alive.current) return;
      if (!Number.isFinite(v.duration) || v.duration <= 0)
        throw new Error(
          t(
            "The video has no readable duration.",
            "مدت ویدئو قابل خواندن نیست.",
          ),
        );
      v.loop = true;
      await v.play();
      if (alive.current) {
        setFileName(file.name);
        setDuration(Math.min(15, v.duration));
        setActive(true);
      }
    } catch (e) {
      if (alive.current) notify((e as Error).message, true);
    } finally {
      if (alive.current) setStarting(false);
    }
  }
  async function record() {
    if (!active || recording) return;
    const abort = new AbortController();
    controller.current = abort;
    setRecording(true);
    controls.current.recording = true;
    setProgress(0);
    try {
      const v = video.current!;
      const out = document.createElement("canvas");
      if (kind === "video") {
        v.currentTime = 0;
        await v.play();
      }
      const seconds = kind === "camera" ? 5 : Math.min(15, duration);
      const blob = await recordCanvas(
        out,
        async () => {
          const art = await buildArtwork(
            v,
            v.videoWidth,
            v.videoHeight,
            liveOptions(),
            abort.signal,
          );
          drawArtwork(out, art, "still", 0, 960);
          if (canvas.current && alive.current) {
            const c = canvas.current;
            c.width = out.width;
            c.height = out.height;
            c.getContext("2d")!.drawImage(out, 0, 0);
          }
        },
        seconds,
        (n) => {
          if (alive.current) setProgress(n);
        },
        abort.signal,
      );
      if (!abort.signal.aborted && alive.current) {
        download(
          blob,
          `pimx-${kind}.${blob.type.includes("mp4") ? "mp4" : "webm"}`,
        );
        notify(t("Your moving artwork is ready.", "اثر متحرکت آماده شد."));
      }
    } catch (e) {
      if (!abort.signal.aborted && alive.current)
        notify((e as Error).message, true);
    } finally {
      if (alive.current) setRecording(false);
      controls.current.recording = false;
    }
  }
  function snapshot() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const source = document.createElement("canvas");
    source.width = v.videoWidth;
    source.height = v.videoHeight;
    source.getContext("2d")!.drawImage(v, 0, 0);
    capture(source.toDataURL("image/png"));
    notify(
      t(
        "Frame captured. Keep creating in the studio.",
        "فریم ثبت شد؛ ادامه‌اش رو در استودیو بساز.",
      ),
    );
  }
  async function saveFrame() {
    if (!canvas.current) return;
    setBusy(true);
    try {
      download(await canvasBlob(canvas.current), "pimx-live-frame.png");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        kind === "camera"
          ? t("Meet your character.", "نسخه کاراکتری خودت رو ببین.")
          : t("Every frame. Reimagined.", "هر فریم، یک نگاه تازه.")
      }
      wide={true}
      close={() => {
        controller.current?.abort();
        stream.current?.getTracks().forEach((t) => t.stop());
        close();
      }}
    >
      <div className="live-lab">
        <video
          ref={video}
          muted
          playsInline
          className="live-source-video"
          aria-hidden="true"
        />
        <div className="live-screen checkerboard">
          <canvas
            ref={canvas}
            aria-label={t("Live character preview", "پیش‌نمایش زنده کاراکتری")}
          />
          {!active && (
            <div className="live-start">
              {kind === "camera" ? <Camera size={40} /> : <Video size={40} />}
              <h3>
                {kind === "camera"
                  ? t("A whole new you.", "یه توی تازه.")
                  : t("Every frame. Reimagined.", "هر فریم، یک نگاه تازه.")}
              </h3>
              <p>
                {kind === "camera"
                  ? t(
                      "Your camera stays on your device. No audio is recorded.",
                      "تصویر دوربین روی دستگاهت می‌مونه. صدا ضبط نمی‌شه.",
                    )
                  : t(
                      "Transform the first 15 seconds of a video. Exports are silent.",
                      "تا ۱۵ ثانیه اول ویدئو رو تبدیل کن. خروجی بدون صداست.",
                    )}
              </p>
              <button
                className="button primary"
                disabled={starting}
                onClick={() =>
                  kind === "camera"
                    ? void startCamera()
                    : input.current?.click()
                }
              >
                {starting ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <Play size={17} />
                )}
                {kind === "camera"
                  ? t("Enable camera", "فعال‌کردن دوربین")
                  : t("Choose a video", "انتخاب ویدئو")}
              </button>
            </div>
          )}
          {active && (
            <span className="live-screen-badge">
              <i />
              {kind === "camera"
                ? "LIVE"
                : `${elapsed.toFixed(1)}s · ${fileName}`}
            </span>
          )}
        </div>
        <input
          type="file"
          ref={input}
          className="sr-only"
          accept="video/*"
          aria-label="Choose source video"
          onChange={(e) => {
            void openVideo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="live-controls">
          <label className="field-label">
            {t("Engine", "موتور")}
            <select
              disabled={recording}
              value={mode}
              onChange={(e) => setMode(e.target.value as StudioOptions["mode"])}
            >
              <option value="ascii">ASCII</option>
              <option value="mosaic">{t("Words", "کلمات")}</option>
              <option value="emoji">{t("Emoji", "ایموجی")}</option>
            </select>
          </label>
          <Range
            label={t("Live quality", "کیفیت زنده")}
            value={quality}
            min={25}
            max={85}
            onChange={setQuality}
          />
          {kind === "video" && active && (
            <Range
              label={t("Export duration", "مدت خروجی")}
              value={duration}
              min={Math.min(1, video.current?.duration || 1)}
              max={Math.min(15, video.current?.duration || 15)}
              step={0.1}
              suffix="s"
              onChange={setDuration}
            />
          )}
        </div>
        {recording ? (
          <Busy
            label={t("Recording your moving artwork…", "در حال ضبط اثر متحرک…")}
            progress={progress}
            cancel={() => controller.current?.abort()}
          />
        ) : (
          <div className="live-actions">
            <button
              className="button secondary"
              disabled={!active || busy}
              onClick={() => void saveFrame()}
            >
              <Download size={16} />
              {t("Save art frame", "دانلود فریم هنری")}
            </button>
            <button
              className="button secondary"
              disabled={!active}
              onClick={snapshot}
            >
              <Camera size={16} />
              {t("Edit a frame", "ویرایش یک فریم")}
            </button>
            {kind === "video" && (
              <button
                className="button secondary"
                onClick={() => input.current?.click()}
                disabled={starting}
              >
                <Upload size={16} />
                {t("Change video", "تغییر ویدئو")}
              </button>
            )}
            <button
              className="button primary"
              disabled={!active}
              onClick={() => void record()}
            >
              <Film size={16} />
              {kind === "camera"
                ? t("Record 5s", "ضبط ۵ ثانیه")
                : t("Export video", "خروجی ویدئو")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
