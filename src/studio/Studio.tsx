import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Upload,
  Download,
  Undo2,
  Redo2,
  Save,
  Share2,
  Image,
  Palette,
  SlidersHorizontal,
  Paintbrush,
  Play,
  Pause,
  Camera,
  Video,
  Layers3,
  ArrowUpRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  Columns2,
  Sparkles,
  X,
  Plus,
  Check,
  RotateCcw,
  Copy,
  FileText,
  MousePointer2,
  Eraser,
  ScanLine,
  Type,
  Smile,
  LoaderCircle,
} from "lucide-react";
import { MARK_TREATMENTS } from "./treatments";
import { PresetChooser } from "./PresetChooser";
import { PRESETS, type Preset } from "../constants/presets";
import { ArtPreview, Busy, Modal, type Translate } from "./ui";
import {
  DEFAULTS,
  EMOJI_SETS,
  SAMPLE_IMAGES,
  type BrushMode,
  type Effect,
  type Page,
  type Project,
  type SavedStyle,
  type Stroke,
  type StudioOptions,
} from "./types";
import {
  artworkText,
  buildArtwork,
  drawArtwork,
  loadImage,
  readImage,
  thumbnail,
  type Artwork,
} from "./engine";
import { useTimeline } from "./useTimeline";
import { BatchDialog, ExportDialog, LiveDialog } from "./StudioDialogs";
import { canvasBlob, download } from "./export";
type Props = {
  t: Translate;
  language: string;
  source: string;
  loadingSource: boolean;
  setSource: (s: string) => void;
  name: string;
  setName: (name: string) => void;
  projectId?: string;
  timeline: ReturnType<typeof useTimeline>;
  upload: () => void;
  notify: (m: string, error?: boolean) => void;
  saveProject: (p: Project, silent?: boolean) => Promise<void>;
  saveStyle: (s: SavedStyle) => Promise<void>;
  savedStyles: SavedStyle[];
  projects: Project[];
  openProject: (project: Project) => void;
  navigate: (p: Page) => void;
  effect: Effect;
  setEffect: (e: Effect) => void;
  generated: (project: Project, art: Artwork, saved: boolean) => void;
};
export function Studio({
  t,
  source,
  loadingSource,
  setSource,
  name,
  setName,
  projectId,
  timeline,
  upload,
  notify,
  saveProject,
  saveStyle,
  savedStyles,
  projects,
  openProject,
  navigate,
  effect,
  setEffect,
  generated,
}: Props) {
  const { options, change, undo, redo, canUndo, canRedo } = timeline;
  const [tab, setTab] = useState("style"),
    [art, setArt] = useState<Artwork>(),
    [rendering, setRendering] = useState(false);
  const [requestedOptions, setRequestedOptions] = useState<StudioOptions>();
  const initialPreset = useRef(PRESETS.find((preset) => Object.entries(preset.options).every(([key, value]) => JSON.stringify(options[key as keyof StudioOptions]) === JSON.stringify(value))));
  const [selectedStyle, setSelectedStyle] = useState(initialPreset.current?.name || t("Custom style", "سبک دلخواه"));
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const generationAbort = useRef<AbortController | null>(null);
  const generatedSuccessfully = useRef(false);
  const [previewPreset, setPreviewPreset] = useState<Preset | null>(null);
  const [hoverArt, setHoverArt] = useState<Artwork>();
  const shownArt = hoverArt || art;
  const [playing, setPlaying] = useState(true),
    [zoom, setZoom] = useState(1);
  const [compare, setCompare] = useState(false),
    [split, setSplit] = useState(50),
    [dialog, setDialog] = useState(""),
    [saving, setSaving] = useState(false),
    [autoStatus, setAutoStatus] = useState("");
  const [styleName, setStyleName] = useState(""),
    [brush, setBrush] = useState<BrushMode>("detail"),
    [radius, setRadius] = useState(0.06),
    [dragging, setDragging] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    frame = useRef<HTMLDivElement>(null),
    paintCanvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]),
    drawing = useRef(false),
    image = useRef<HTMLImageElement | null>(null);
  const reduced = useReducedMotion();
  const [canvasWidth, setCanvasWidth] = useState(560);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const fit = () => {
      const style = getComputedStyle(element);
      const availableWidth =
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const availableHeight =
        element.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const ratio = shownArt ? shownArt.width / shownArt.height : 4 / 5;
      setCanvasWidth(
        Math.max(160, Math.min(560, availableWidth, availableHeight * ratio)),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => observer.disconnect();
  }, [shownArt]);
  const saveRef = useRef(saveProject);
  saveRef.current = saveProject;
  const snapshot = useRef({ options, source, name, effect, art, projectId });
  const pendingProject = useRef({ source: "", id: "" });
  snapshot.current = { options, source, name, effect, art, projectId };
  useEffect(() => { setRequestedOptions(undefined); }, [options, source]);
  useEffect(() => () => generationAbort.current?.abort(), []);
  const renderOptions = tab === "brush" ? options : requestedOptions;
  useEffect(() => {
    if (!renderOptions) { setArt(undefined); setRendering(false); return; }
    const controller = new AbortController();
    setRendering(true);
    const timer = setTimeout(async () => {
      try {
        const loaded = await loadImage(source);
        if (controller.signal.aborted) return;
        image.current = loaded;
        const built = await buildArtwork(
          loaded,
          loaded.width,
          loaded.height,
          renderOptions,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setArt(built);
          setRendering(false);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setRendering(false);
          notify((e as Error).message, true);
        }
      }
    }, 90);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [source, renderOptions, notify]);
  useEffect(() => {
    setHoverArt(undefined);
    if (!previewPreset) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const image = await loadImage(source);
        if (abort.signal.aborted) return;
        const preview = await buildArtwork(
          image,
          image.width,
          image.height,
          { ...DEFAULTS, ...previewPreset.options, strokes: [] },
          abort.signal,
        );
        if (!abort.signal.aborted) setHoverArt(preview);
      } catch (e) {
        if (!abort.signal.aborted)
          notify(
            t(
              "Style preview could not be rendered.",
              "پیش‌نمایش ساخته نشد؛ استایل دیگه‌ای رو امتحان کن.",
            ),
            true,
          );
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [previewPreset, source, notify, t]);
  useEffect(() => {
    if (!shownArt || !canvas.current) return;
    drawArtwork(canvas.current, shownArt, "still", 0, 960);
    let raf = 0;
    let resume = () => {};
    if (
      !previewPreset &&
      effect !== "still" &&
      playing &&
      !reduced &&
      !compare &&
      tab !== "brush"
    ) {
      const start = performance.now();
      let last = 0;
      let interval = 40;
      const animate = (now: number) => {
        if (document.hidden) return;
        if (now - last >= interval && canvas.current) {
          const began = performance.now();
          drawArtwork(
            canvas.current,
            shownArt,
            effect,
            (now - start) / 1000,
            960,
          );
          interval = Math.max(
            40,
            Math.min(120, (performance.now() - began) * 1.4),
          );
          last = now;
        }
        raf = requestAnimationFrame(animate);
      };
      resume = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) raf = requestAnimationFrame(animate);
      };
      document.addEventListener("visibilitychange", resume);
      resume();
    }
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [shownArt, previewPreset, effect, playing, reduced, compare, tab]);
  const save = useCallback(
    async (silent = false) => {
      const current = snapshot.current;
      if (
        !current.projectId &&
        pendingProject.current.source !== current.source
      )
        pendingProject.current = {
          source: current.source,
          id: crypto.randomUUID(),
        };
      const out = document.createElement("canvas");
      if (current.art) drawArtwork(out, current.art, "still", 0, 360);
      const project: Project = {
        id: current.projectId || pendingProject.current.id,
        name: current.name.trim() || "Untitled experiment",
        source: current.source,
        thumbnail: current.art ? thumbnail(out) : current.source,
        options: structuredClone(current.options),
        effect: current.effect,
        updated: Date.now(),
      };
      if (!silent) setSaving(true);
      try {
        await saveRef.current(project, silent);
        setAutoStatus(t("All changes saved", "همه تغییرات ذخیره شدن"));
      } catch (e) {
        notify((e as Error).message, true);
        setAutoStatus(t("Save failed", "ذخیره نشد"));
      } finally {
        setSaving(false);
      }
    },
    [notify, t],
  );
  useEffect(() => {
    if (loadingSource || generating) return;
    if (
      !projectId &&
      !source.startsWith("data:") &&
      name === "Untitled experiment" &&
      effect === "still" &&
      JSON.stringify(options) === JSON.stringify(DEFAULTS)
    )
      return;
    setAutoStatus(t("Saving changes…", "ذخیره تغییرات…"));
    const timer = setTimeout(() => void save(true), 1200);
    return () => clearTimeout(timer);
  }, [options, source, name, effect, projectId, art, loadingSource, generating, save, t]);
  const saveLatest = useRef(save);
  saveLatest.current = save;
  useEffect(
    () => () => {
      const current = snapshot.current;
      const untouchedSample =
        !current.projectId &&
        !current.source.startsWith("data:") &&
        current.name === "Untitled experiment" &&
        current.effect === "still" &&
        JSON.stringify(current.options) === JSON.stringify(DEFAULTS);
      if (!untouchedSample && !generatedSuccessfully.current) void saveLatest.current(true);
    },
    [],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) ||
        document.querySelector('[role="dialog"]')
      )
        return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        }
        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          void save();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo, save]);
  async function dropped(file?: File) {
    if (!file) return;
    try {
      setSource(await readImage(file));
      change({ strokes: [] });
      notify(t("New source loaded.", "تصویر جدید آماده شد."));
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  function paint(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !paintCanvas.current) return;
    const rect = paintCanvas.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const last = strokes.current[strokes.current.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < radius / 3) return;
    if (strokes.current.length >= 1200) return;
    strokes.current.push({ x, y, radius, mode: brush });
    const ctx = paintCanvas.current.getContext("2d")!;
    ctx.fillStyle =
      brush === "erase"
        ? "#f78c8c55"
        : brush === "emoji"
          ? "#c9b5ff55"
          : "#8ba8ff44";
    ctx.beginPath();
    ctx.ellipse(
      x * paintCanvas.current.width,
      y * paintCanvas.current.height,
      radius * paintCanvas.current.width,
      radius * paintCanvas.current.height,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  function endPaint() {
    if (!drawing.current) return;
    drawing.current = false;
    change({ strokes: [...options.strokes, ...strokes.current].slice(-1200) });
    strokes.current = [];
    const c = paintCanvas.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }
  async function textAction(copy: boolean) {
    try {
      if (!art) return;
      const text = artworkText(art);
      if (copy) {
        await navigator.clipboard.writeText(text);
        notify(t("Text art copied.", "هنر متنی کپی شد."));
      } else
        download(
          new Blob([text], { type: "text/plain;charset=utf-8" }),
          `${name}.txt`,
        );
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function quickDownload() {
    if (!art) return;
    try {
      const out = document.createElement("canvas");
      drawArtwork(out, art);
      download(await canvasBlob(out), `${name || "pimx-art"}.png`);
      notify(t("Your artwork is ready.", "خروجی آماده شد."));
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function generate() {
    if (generating || loadingSource) return;
    const abort = new AbortController();
    generationAbort.current = abort;
    const settings = structuredClone(options);
    const currentSource = source;
    setGenerating(true);
    setGenerationProgress(0.05);
    try {
      const loaded = await loadImage(currentSource);
      if (abort.signal.aborted) return;
      setGenerationProgress(0.2);
      const result = await buildArtwork(loaded, loaded.width, loaded.height, settings, abort.signal, (p) => setGenerationProgress(0.2 + p * 0.65));
      if (abort.signal.aborted) return;
      setGenerationProgress(0.9);
      const out = document.createElement("canvas");
      drawArtwork(out, result, "still", 0, 360);
      const project: Project = { id: projectId || pendingProject.current.id || crypto.randomUUID(), name: name.trim() || "Untitled experiment", source: currentSource, options: settings, effect, thumbnail: thumbnail(out), updated: Date.now() };
      pendingProject.current = { source: currentSource, id: project.id };
      let saved = true;
      try {
        await saveRef.current(project, true);
      } catch {
        saved = false;
        if (!abort.signal.aborted) notify(t("Your artwork is ready, but browser storage couldn't save it. Download a copy from the result page.", "اثرت آماده‌ست، ولی حافظهٔ مرورگر نتونست ذخیره‌اش کنه. از صفحهٔ نتیجه دانلودش کن."), true);
      }
      if (!abort.signal.aborted) { generatedSuccessfully.current = true; setGenerationProgress(1); generated(project, result, saved); }
    } catch (e) {
      if (!abort.signal.aborted) notify((e as Error).message, true);
    } finally {
      setGenerating(false);
    }
  }
  const sourceControls = (
    <section
      id="control-source"
      className="settings-section"
      aria-label={t("Source image", "تصویر ورودی")}
    >
      <h2 className="settings-title">{t("Source image", "تصویر ورودی")}</h2>

      <div
        className="upload-zone"
        role="button"
        tabIndex={0}
        onClick={upload}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") upload();
        }}
      >
        <img
          className="source-current-image"
          src={source}
          alt={t("Your source image", "عکس ورودی تو")}
        />
        <Upload size={25} />
        <strong>{t("Drop in something good.", "یه عکس خوب انتخاب کن.")}</strong>
        <span>
          {t("JPG, PNG, WEBP · up to 25 MB", "JPG، PNG، WEBP تا ۲۵ مگابایت")}
        </span>
        <small>
          {t(
            "Or drop an image anywhere on the canvas.",
            "یا عکس رو روی بوم رها کن.",
          )}
        </small>
      </div>
      <div className="control-section">
        <h3>
          {t("Just exploring? Try these.", "برای شروع اینا رو امتحان کن.")}
        </h3>
        <div className="source-samples">
          {SAMPLE_IMAGES.map((s, i) => (
            <button
              className={source === s ? "selected" : ""}
              key={s}
              onClick={() => {
                change({ strokes: [] });
                setSource(s);
              }}
            >
              <img src={s} alt={t(`Sample ${i + 1}`, `نمونه ${i + 1}`)} />
            </button>
          ))}
        </div>
      </div>
      <details className="source-import-tools"><summary>{t("Camera, video & batch", "دوربین، ویدئو و خروجی گروهی")}</summary><div className="control-section source-tools">
        <button
          className="button secondary"
          onClick={() => setDialog("camera")}
        >
          <Camera size={17} />
          {t("Open live camera", "دوربین زنده")}
          <ArrowUpRight size={15} />
        </button>
        <button className="button secondary" onClick={() => setDialog("video")}>
          <Video size={17} />
          {t("Transform a video", "تبدیل ویدئو")}
          <ArrowUpRight size={15} />
        </button>
        <button className="button secondary" onClick={() => setDialog("batch")}>
          <Layers3 size={17} />
          {t("Batch image export", "خروجی گروهی عکس")}
          <ArrowUpRight size={15} />
        </button>
      </div></details>
    </section>
  );
  const controls = (
    <>
      <div className="all-settings">
        <details
          id="control-style"
          className="settings-section"
          aria-label={t("Style & characters", "سبک و کاراکترها")}
        >
          <summary className="settings-title">
            {t("Style & characters", "سبک و کاراکترها")}
          </summary>

          <div className="control-section">
            <h3>{t("Choose your engine", "موتور تبدیل")}</h3>
            <div className="engine-selector">
              {[
                ["ascii", "Aa", "ASCII"],
                ["mosaic", "Ww", t("Words", "کلمات")],
                ["emoji", "☺", t("Emoji", "ایموجی")],
              ].map(([id, glyph, label]) => (
                <button
                  key={id}
                  className={options.mode === id ? "selected" : ""}
                  onClick={() =>
                    change({
                      mode: id as StudioOptions["mode"],
                      chars:
                        id === "emoji"
                          ? EMOJI_SETS.hearts
                          : id === "mosaic"
                            ? "MAKE ART"
                            : DEFAULTS.chars,
                    })
                  }
                >
                  <b>{glyph}</b>
                  <span>{label}</span>
                  {options.mode === id && <Check size={11} />}
                </button>
              ))}
            </div>
          </div>
          <label className="field-label">
            {t("Mark making", "روش ساخت تصویر")}
            <select
              aria-label={t("Mark making", "روش ساخت تصویر")}
              value={options.treatment || "classic"}
              onChange={(e) =>
                change({
                  treatment: e.target.value as StudioOptions["treatment"],
                })
              }
            >
              {MARK_TREATMENTS.map((id) => (
                <option key={id} value={id}>
                  {id === "classic"
                    ? t("Classic characters", "کاراکترهای کلاسیک")
                    : id.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="control-section">
            <label className="field-label">
              {options.mode === "mosaic"
                ? t("Your words, name or poem", "کلمات، اسم یا شعر دلخواه")
                : t("Character palette", "مجموعه کاراکترها")}
              <textarea
                dir="auto"
                rows={3}
                maxLength={500}
                value={options.chars}
                onChange={(e) => change({ chars: e.target.value }, "chars")}
              />
            </label>
            {options.mode === "emoji" && (
              <div className="emoji-sets">
                {Object.entries(EMOJI_SETS).map(([key, chars]) => (
                  <button
                    key={key}
                    title={key}
                    className={options.chars === chars ? "selected" : ""}
                    onClick={() => change({ chars })}
                  >
                    {Array.from(chars).slice(0, 3).join("")}
                  </button>
                ))}
              </div>
            )}
            {options.mode === "mosaic" && (
              <Range
                label={t("Text direction", "زاویه نوشته")}
                value={options.direction}
                min={-45}
                max={45}
                suffix="°"
                onChange={(value) => change({ direction: value }, "direction")}
              />
            )}
          </div>
          {!!savedStyles.length && (
            <div className="control-section">
              <h3>{t("Your styles", "سبک‌های تو")}</h3>
              <select
                aria-label={t("Saved style", "سبک ذخیره‌شده")}
                defaultValue=""
                onChange={(e) => {
                  const s = savedStyles.find((x) => x.id === e.target.value);
                  if (s) change(s.options);
                }}
              >
                <option value="" disabled>
                  {t("Choose a signature style…", "انتخاب سبک اختصاصی…")}
                </option>
                {savedStyles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            className="button secondary full"
            onClick={() => setDialog("style-save")}
          >
            <Plus size={16} />
            {t("Save as a style", "ذخیره به‌عنوان سبک")}
          </button>
        </details>
        <details
          id="control-adjust"
          className="settings-section"
          aria-label={t("Fine-tune your image", "تنظیم جزئیات")}
        >
          <summary className="settings-title">
            {t("Fine-tune your image", "تنظیم جزئیات")}
          </summary>

          <div className="control-section">
            <h3>{t("Detail & spacing", "جزئیات و فاصله")}</h3>
            <Range
              label={t("Density", "تراکم")}
              value={options.resolution}
              min={30}
              max={400}
              onChange={(value) => change({ resolution: value }, "density")}
            />
            <Range
              label={t("Character spacing", "فاصله کاراکترها")}
              value={options.spacing || 1}
              min={0.7}
              max={1.8}
              step={0.05}
              onChange={(value) => change({ spacing: value }, "spacing")}
            />
            <Range
              label={t("Character size", "اندازه کاراکتر")}
              value={options.fontSize || 12}
              min={8}
              max={24}
              suffix="px"
              onChange={(value) => change({ fontSize: value }, "size")}
            />
          </div>
          <div className="control-section">
            <h3>{t("Light & color", "نور و رنگ")}</h3>
            {[
              ["brightness", t("Brightness", "روشنایی"), 200],
              ["contrast", t("Contrast", "کنتراست"), 250],
              ["saturation", t("Saturation", "اشباع رنگ"), 250],
              ["threshold", t("Shadow cutoff", "حذف سایه‌ها"), 180],
            ].map(([key, label, max]) => (
              <Range
                key={key}
                label={label as string}
                value={options[key as keyof StudioOptions] as number}
                min={0}
                max={max as number}
                onChange={(value) => change({ [key]: value }, key as string)}
              />
            ))}
            <Toggle
              label={t("Original image colors", "رنگ‌های عکس اصلی")}
              checked={options.colorize}
              onChange={(value) => change({ colorize: value })}
            />
            <Toggle
              label={t("Invert character mapping", "معکوس‌کردن ترتیب حروف")}
              checked={options.invert}
              onChange={(value) => change({ invert: value })}
            />
          </div>
          <div className="control-section">
            <h3>{t("Typography & canvas", "تایپوگرافی و بوم")}</h3>
            <div className="color-fields">
              <label>
                {t("Characters", "کاراکتر")}
                <input
                  type="color"
                  value={options.textColor}
                  onChange={(e) =>
                    change(
                      {
                        textColor: e.target.value,
                        ...(options.palette
                          ? {
                              palette: [
                                ...options.palette.slice(0, -1),
                                e.target.value,
                              ],
                            }
                          : {}),
                      },
                      "text-color",
                    )
                  }
                />
              </label>
              <label>
                {t("Background", "پس‌زمینه")}
                <input
                  type="color"
                  value={
                    options.bgColor === "transparent"
                      ? "#080b18"
                      : options.bgColor
                  }
                  onChange={(e) =>
                    change({ bgColor: e.target.value }, "bg-color")
                  }
                />
              </label>
            </div>
            <Toggle
              label={t("Transparent background", "پس‌زمینه شفاف")}
              checked={options.bgColor === "transparent"}
              onChange={(value) =>
                change({ bgColor: value ? "transparent" : "#080b18" })
              }
            />
            <label className="field-label">
              {t("Font", "فونت")}
              <select
                value={options.fontFamily}
                onChange={(e) => change({ fontFamily: e.target.value })}
              >
                <option value="monospace">Mono / مونو</option>
                <option value="serif">Serif / سریف</option>
                <option value="sans-serif">Sans / سنس</option>
                <option value="Vazirmatn">Vazirmatn / وزیرمتن</option>
              </select>
            </label>
            <Toggle
              label={t("Bold characters", "حروف ضخیم")}
              checked={options.fontWeight === "bold"}
              onChange={(value) =>
                change({ fontWeight: value ? "bold" : "normal" })
              }
            />
            <Range
              label={t("Glow", "درخشش")}
              value={options.shadowBlur || 0}
              min={0}
              max={12}
              onChange={(value) =>
                change(
                  { shadowBlur: value, shadowColor: options.textColor },
                  "glow",
                )
              }
            />
          </div>
          <button
            className="button secondary full"
            onClick={() => change(structuredClone(DEFAULTS))}
          >
            <RotateCcw size={15} />
            {t("Reset settings", "تنظیمات اولیه")}
          </button>
        </details>
        <details
          id="control-brush"
          className="settings-section"
          aria-label={t("Brush edits", "ویرایش با قلم‌مو")}
        >
          <summary className="settings-title">
            {t("Brush edits", "ویرایش با قلم‌مو")}
          </summary>
          <Toggle
            label={t("Enable brush", "فعال‌کردن قلم‌مو")}
            checked={tab === "brush"}
            onChange={(value) => {
              setTab(value ? "brush" : "style");
              if (value) { setCompare(false); document.getElementById("style-preview")?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" }); }
            }}
          />

          <p className="tool-description">
            {t(
              "Paint directly on the artwork. Mix engines, bring details forward, or clear space for something new.",
              "مستقیم روی بوم بکش؛ موتورهای مختلف رو ترکیب کن، جزئیات رو بیشتر کن یا بخشی از اثر رو پاک کن.",
            )}
          </p>
          <div className="brush-tools">
            {[
              {
                id: "detail",
                icon: ScanLine,
                label: t("More detail", "جزئیات بیشتر"),
              },
              { id: "erase", icon: Eraser, label: t("Erase", "پاک‌کن") },
              {
                id: "ascii",
                icon: Type,
                label: t("ASCII layer", "لایه حروف"),
              },
              {
                id: "emoji",
                icon: Smile,
                label: t("Emoji layer", "لایه ایموجی"),
              },
            ].map((tool) => (
              <button
                key={tool.id}
                className={brush === tool.id ? "selected" : ""}
                onClick={() => {
                  setBrush(tool.id as BrushMode);
                  setTab("brush");
                  setCompare(false);
                  document.getElementById("style-preview")?.scrollIntoView({ behavior: "instant", block: "center" });
                }}
              >
                <tool.icon size={18} />
                {tool.label}
                {brush === tool.id && <Check size={15} />}
              </button>
            ))}
          </div>
          <Range
            label={t("Brush size", "اندازه قلم")}
            value={Math.round(radius * 100)}
            min={2}
            max={18}
            suffix="%"
            onChange={(value) => setRadius(value / 100)}
          />
          <p className="hint">
            {t(
              "Brush edits support Undo / Redo. Motion pauses while you paint.",
              "ویرایش با قلم‌مو قابلیت بازگشت داره؛ موقع نقاشی حرکت بوم متوقف می‌شه.",
            )}
          </p>
          <button
            className="button secondary full"
            disabled={!options.strokes.length}
            onClick={() => change({ strokes: [] })}
          >
            <Eraser size={16} />
            {t("Clear all brush edits", "پاک‌کردن ویرایش قلم‌مو")}
          </button>
        </details>

      </div>
    </>
  );
  return (
    <div className="studio-shell guided-studio" aria-busy={generating}>
      <div className="studio-topbar">
        <div className="project-title">
          <span className="status-dot" />
          <input
            aria-label={t("Project name", "نام پروژه")}
            disabled={loadingSource}
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
          <span className="project-save-state">
            {projectId
              ? autoStatus || t("Saved project", "پروژه ذخیره‌شده")
              : t("Unsaved experiment", "تجربه ذخیره‌نشده")}
          </span>
        </div>
        <div className="studio-actions">


          <div className="undo-redo">
            <button
              className="icon-button"
              disabled={!canUndo}
              title={t("Undo (Ctrl+Z)", "بازگشت (Ctrl+Z)")}
              aria-label="Undo"
              onClick={undo}
            >
              <Undo2 size={17} />
            </button>
            <button
              className="icon-button"
              disabled={!canRedo}
              title={t("Redo (Ctrl+Shift+Z)", "انجام دوباره")}
              aria-label="Redo"
              onClick={redo}
            >
              <Redo2 size={17} />
            </button>
          </div>
          <button
            className="button secondary compact"
            disabled={saving || loadingSource || generating}
            onClick={() => void save()}
          >
            {saving ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>{t("Save", "ذخیره")}</span>
          </button>

        </div>
      </div>

      <div className="studio-intro">
        <div><h1>{t("Make it your own.", "تصویرت رو از نو بساز.")}</h1><p>{t("One photo. Pick a look, then generate your artwork.", "یک عکس انتخاب کن، استایلت رو پیدا کن و اثر خودت رو بساز.")}</p></div>
        <ol className="creation-steps" aria-label={t("Creation steps", "مراحل ساخت")}>
          <li><span>1</span>{t("Your photo", "عکس تو")}</li><li><span>2</span>{t("Your style", "استایل تو")}</li><li><span>3</span>{t("Generate", "ساخت اثر")}</li>
        </ol>
      </div>
      <div className="studio-layout guided-layout" inert={generating || undefined}>
        <aside className="source-pane">
          <h2 className="step-heading">{t("Your photo", "عکس تو")}</h2>
          {sourceControls}
          <p className="source-privacy"><ShieldCheckIcon />{t("Only in your browser. Your photo stays yours.", "فقط در مرورگر تو؛ عکست پیش خودت می‌مونه.")}</p>
          <details className="studio-history"><summary>{t("Recent projects", "پروژه‌های اخیر")}</summary>
            <div>
              <h2>{t("History", "سابقه آثار")}</h2>
              <button
                className="text-button"
                onClick={() => navigate("library")}
              >
                {t("Library", "تاریخچه")}
                <ArrowUpRight size={15} />
              </button>
            </div>
            <p>
              {t(
                "Your recent work, saved in this browser.",
                "کارهای اخیرت که در همین مرورگر ذخیره شدن.",
              )}
            </p>
            {projects.length ? (
              <div className="studio-history-grid">
                {projects.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    aria-label={`${t("Open", "بازکردن")} ${p.name}`}
                    onClick={async () => {
                      if (p.id === projectId) return;
                      await save(true);
                      openProject(p);
                    }}
                  >
                    <img src={p.thumbnail} alt={p.name} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                <Image size={28} />
                <strong>
                  {t(
                    "Your next creation goes here.",
                    "جای اثر بعدی‌ات اینجاست.",
                  )}
                </strong>
                <span>
                  {t(
                    "Edits save automatically in your local library.",
                    "ویرایش‌ها خودکار در تاریخچه محلی ذخیره می‌شن.",
                  )}
                </span>
              </div>
            )}
          </details>
        </aside>
        <section className="configuration-pane">
          <div className="style-stage-heading"><div><h2>{previewPreset ? previewPreset.name : selectedStyle}</h2><p>{previewPreset ? t("A quick look on your photo. This hasn't changed your selection.", "یک نگاه روی عکس خودت؛ استایل انتخاب‌شده تغییر نکرده.") : t("Preview your selection here, or hover a style name for a quick look.", "روی استایل‌های پایین هاور کن یا دکمهٔ پیش‌نمایش رو بزن.")}</p></div>
            <button className="button secondary compact" onClick={() => { setPreviewPreset(null); if (shownArt) setRequestedOptions(undefined); else setRequestedOptions(structuredClone(options)); }}>{shownArt ? t("Original photo", "عکس اصلی") : t("Preview selection", "پیش‌نمایش انتخاب")}</button>
          </div>
          <motion.section
            id="style-preview"
            initial={false}
            animate={{ height: shownArt || tab === "brush" ? (tab === "brush" ? 460 : 330) : 0, opacity: shownArt || tab === "brush" ? 1 : 0, marginBottom: shownArt || tab === "brush" ? 24 : 0 }}
            transition={{ duration: reduced ? .1 : .34, ease: [.16, 1, .3, 1] }}
            inert={!shownArt && tab !== "brush"}
            aria-hidden={!shownArt && tab !== "brush"}
            className={`canvas-workspace style-preview-stage ${tab === "brush" ? "brush-preview" : ""} ${shownArt ? "has-preview" : "shows-original"} ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void dropped(e.dataTransfer.files?.[0]);
            }}
          >
            {previewPreset && (
              <div className="hover-preview-banner" role="status">
                {t("Preview", "پیش‌نمایش")}:{" "}
                <strong>{previewPreset.name}</strong>
                <span>
                  {t("Click its name to apply", "برای انتخاب روی اسم کلیک کن")}
                </span>
              </div>
            )}
            <div className="canvas-toolbar">
              <div>
                <span className="canvas-label">
                  <span className="status-dot" />
                  {t("STYLE PREVIEW", "پیش‌نمایش استایل")}
                </span>
                <span className="canvas-mode">
                  {options.mode.toUpperCase()}
                </span>
              </div>
              <div>
                <button
                  className={`toolbar-button ${compare ? "selected" : ""}`}
                  aria-label={t("Before / after", "قبل و بعد")}
                  onClick={() => {
                    setCompare(!compare);
                    if (tab === "brush") setTab("style");
                    setRequestedOptions(structuredClone(options));
                  }}
                >
                  <Columns2 size={15} />
                  <span>{t("Before / after", "قبل و بعد")}</span>
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => setDialog("compare")}
                  aria-label={t("Compare styles", "مقایسه سبک‌ها")}
                >
                  <Layers3 size={15} />
                  <span>{t("Compare styles", "مقایسه سبک‌ها")}</span>
                </button>
                <button
                  className="icon-button"
                  title={t("Fullscreen", "تمام‌صفحه")}
                  aria-label="Fullscreen canvas"
                  onClick={() => {
                    const el = frame.current;
                    if (!el?.requestFullscreen) {
                      notify(
                        t(
                          "Fullscreen is unavailable in this browser.",
                          "تمام‌صفحه در این مرورگر در دسترس نیست.",
                        ),
                        true,
                      );
                      return;
                    }
                    void el
                      .requestFullscreen()
                      .catch((e) => notify(e.message, true));
                  }}
                >
                  <Maximize size={15} />
                </button>
              </div>
            </div>
            {tab === "brush" && <div className="brush-preview-tools">
              <label>{t("Brush", "قلم")}<select aria-label={t("Brush tool", "ابزار قلم")} value={brush} onChange={(e) => setBrush(e.target.value as BrushMode)}>
                <option value="detail">{t("More detail", "جزئیات بیشتر")}</option><option value="erase">{t("Erase", "پاک‌کن")}</option><option value="ascii">ASCII</option><option value="emoji">{t("Emoji", "ایموجی")}</option>
              </select></label>
              <label>{t("Size", "اندازه")}<input aria-label={t("Preview brush size", "اندازهٔ قلم پیش‌نمایش")} type="range" min={2} max={18} value={Math.round(radius * 100)} onChange={(e) => setRadius(Number(e.target.value) / 100)} /></label>
              <button className="text-button" onClick={() => { setTab("style"); setRequestedOptions(structuredClone(options)); }}>{t("Done", "تمام")}</button>
            </div>}
            <div className="canvas-scroll" ref={frame}>
              <div
                className="canvas-frame"
                style={{
                  width: `${Math.round(canvasWidth * zoom)}px`,
                  flexShrink: 0,
                  aspectRatio: shownArt
                    ? `${shownArt.width}/${shownArt.height}`
                    : "4/5",
                }}
              >
                {!shownArt && <img className="preview-source-image" src={source} alt={t("Your source photo", "عکس ورودی تو")} />}
                <canvas hidden={!shownArt}
                  ref={canvas}
                  aria-label={t("Style preview", "پیش‌نمایش استایل")}
                />
                {compare && !previewPreset && (
                  <>
                    <img
                      className="comparison-original"
                      src={source}
                      alt={t("Original image", "عکس اصلی")}
                      style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                    />
                    <div
                      className="comparison-line"
                      style={{ left: `${split}%` }}
                    >
                      <span>
                        <Columns2 size={18} />
                      </span>
                    </div>
                    <input
                      className="comparison-slider"
                      aria-label={t(
                        "Before and after comparison",
                        "مقایسه قبل و بعد",
                      )}
                      type="range"
                      min={0}
                      max={100}
                      value={split}
                      onChange={(e) => setSplit(Number(e.target.value))}
                    />
                    <span className="compare-label before">
                      {t("ORIGINAL", "اصلی")}
                    </span>
                    <span className="compare-label after">
                      {t("YOUR ART", "اثر تو")}
                    </span>
                  </>
                )}
                {tab === "brush" && !previewPreset && (
                  <canvas
                    className="paint-overlay"
                    ref={paintCanvas}
                    width={art?.width || 600}
                    height={art?.height || 600}
                    aria-label={t("Paint on the artwork", "روی اثر نقاشی کن")}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      drawing.current = true;
                      strokes.current = [];
                      paint(e);
                    }}
                    onPointerMove={paint}
                    onPointerUp={endPaint}
                    onPointerCancel={endPaint}
                  />
                )}
              </div>
              {rendering && (
                <div className="render-indicator">
                  <LoaderCircle size={15} className="spin" />
                  {t("Finding the details…", "در حال ساخت جزئیات…")}
                </div>
              )}
              {dragging && (
                <div className="drop-overlay">
                  <Upload size={40} />
                  <strong>
                    {t("Drop it. Make it art.", "رهاش کن؛ تبدیلش کن به هنر.")}
                  </strong>
                </div>
              )}
            </div>
            <div className="canvas-bottom">
              <span>
                {art ? `${art.width} × ${art.height}` : "—"}
                <i />
                {art?.cells.length.toLocaleString() || "0"}{" "}
                {t("characters", "کاراکتر")}
              </span>
              <div className="zoom-controls">
                <button
                  className="icon-button"
                  aria-label="Zoom out"
                  disabled={zoom <= 0.5}
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut size={16} />
                </button>
                <button className="zoom-value" onClick={() => setZoom(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  className="icon-button"
                  aria-label="Zoom in"
                  disabled={zoom >= 3}
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <button
                className="toolbar-button"
                onClick={() => setPlaying(!playing)}
                disabled={effect === "still"}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                <span>
                  {effect === "still"
                    ? t("Still frame", "فریم ثابت")
                    : effect.toUpperCase()}
                </span>
              </button>
            </div>
          </motion.section>

          <div className="configuration-surface">
            <PresetChooser source={source} t={t} initialId={initialPreset.current?.id} preview={setPreviewPreset} onSelect={(p) => setSelectedStyle(p.name)}
              apply={(preset) => change({ ...DEFAULTS, ...preset, strokes: options.strokes, colorize: preset.colorize ?? preset.mode === "emoji" })} />
            <div className="optional-settings-heading"><h2>{t("Make a few tweaks?", "می‌خوای دقیق‌تر تنظیمش کنی؟")}</h2><p>{t("Optional. Your chosen style is already ready to generate.", "اختیاریه؛ استایل انتخابی‌ات همین حالا آمادهٔ ساخته.")}</p></div>
            <aside className="control-panel">{controls}</aside>
          </div>
        </section>
      </div>
      <div className="generate-dock">
        <div><strong>{selectedStyle}</strong><span>{t("Ready when you are. The finished artwork opens on its own page.", "آماده‌ای؟ اثر نهایی در صفحهٔ مخصوص خودش باز می‌شه.")}</span></div>
        <button className="button primary generate-button" disabled={generating || loadingSource} onClick={() => void generate()}><Sparkles size={19} />{t("Generate artwork", "جنریت تصویر")}<ArrowUpRight size={18} /></button>
      </div>
      <AnimatePresence>{generating && <motion.div className="generation-screen" role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="generation-sculpture" aria-hidden="true">{[0,1,2].map((i) => <div key={i} className={`generation-slice slice-${i}`}><img src={source} alt="" /></div>)}<div className="generation-scan" /></div>
        <h2>{generationProgress < 0.2 ? t("Reading your photo…", "در حال خواندن عکس…") : generationProgress < 0.9 ? t("Finding a new form…", "در حال ساختن تصویری تازه…") : t("Preparing your artwork…", "در حال آماده‌کردن اثر…")}</h2>
        <div className="generation-track" role="progressbar" aria-label={t("Generating artwork", "ساخت تصویر")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(generationProgress * 100)}><span style={{ transform: `scaleX(${generationProgress})` }} /></div>
        <p>{t("Made right here, on your device.", "همین‌جا، روی دستگاه خودت ساخته می‌شه.")}</p>
        <button className="text-button" onClick={() => generationAbort.current?.abort()}>{t("Cancel", "لغو")}</button>
      </motion.div>}</AnimatePresence>
      <AnimatePresence>
        {dialog === "export" && art && (
          <ExportDialog
            t={t}
            art={art}
            name={name}
            effect={effect}
            close={() => setDialog("")}
            notify={notify}
          />
        )}
        {dialog === "batch" && (
          <BatchDialog
            t={t}
            options={options}
            close={() => setDialog("")}
            notify={notify}
          />
        )}
        {(dialog === "camera" || dialog === "video") && (
          <LiveDialog
            t={t}
            kind={dialog}
            options={options}
            close={() => setDialog("")}
            notify={notify}
            capture={(s) => {
              setSource(s);
              setDialog("");
            }}
          />
        )}
        {dialog === "style-save" && (
          <Modal
            title={t("Give your style a name.", "برای سبکت یه اسم بذار.")}
            close={() => setDialog("")}
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await saveStyle({
                    id: crypto.randomUUID(),
                    name: styleName.trim(),
                    options: { ...structuredClone(options), strokes: [] },
                  });
                  setDialog("");
                  setStyleName("");
                } catch (e) {
                  notify((e as Error).message, true);
                }
              }}
            >
              <label className="field-label">
                {t("Style name", "نام سبک")}
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder={t("My signature look", "سبک اختصاصی من")}
                />
              </label>
              <button
                type="submit"
                disabled={!styleName.trim()}
                className="button primary full"
              >
                <Save size={16} />
                {t("Save style", "ذخیره سبک")}
              </button>
            </form>
          </Modal>
        )}
        {dialog === "compare" && (
          <Modal
            title={t(
              "Same image. Different worlds.",
              "یک عکس؛ چند دنیای متفاوت.",
            )}
            wide
            close={() => setDialog("")}
          >
            <div className="compare-grid">
              {["matrix", "hearts", "newspaper", "gold"].map((id) => {
                const p = PRESETS.find((x) => x.id === id)!;
                return (
                  <button
                    className="style-card"
                    key={id}
                    onClick={() => {
                      change({
                        ...DEFAULTS,
                        ...p.options,
                        colorize:
                          p.options.colorize ?? p.options.mode === "emoji",
                      });
                      setDialog("");
                    }}
                  >
                    <div className="style-image">
                      <ArtPreview source={source} options={p.options} />
                    </div>
                    <div className="style-info">
                      <h3>{p.name}</h3>
                      <ArrowUpRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
function ShieldCheckIcon() {
  return <Check size={13} />;
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span>
        {label}
        <output dir="ltr">
          {Number(value.toFixed(2))}
          {suffix}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={
          {
            "--range-progress": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-switch">
        <i />
      </span>
    </label>
  );
}
