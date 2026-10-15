import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useSettings } from "../contexts/SettingsContext";
import { Check, X, LoaderCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { buildArtwork, drawArtwork, drawArtworkAsync, loadImage, type Artwork } from "./engine";
import { DEFAULTS, type StudioOptions, type Effect } from "./types";
export type Translate = (en: string, fa: string) => string;
export const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const previewCache = new Map<string, HTMLCanvasElement>();
const previewSources = new Map<string, number>();
let previewSourceId = 0;
let previewQueue = Promise.resolve();
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const { language } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    const previouslyInert = appRoot?.inert ?? false;
    const previousHidden = appRoot?.getAttribute("aria-hidden");
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const targets = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        );
        if (!targets?.length) return;
        const first = targets[0],
          last = targets[targets.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          last.focus();
          e.preventDefault();
        }
        if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        appRoot.inert = previouslyInert;
        if (previousHidden == null) appRoot.removeAttribute("aria-hidden");
        else appRoot.setAttribute("aria-hidden", previousHidden);
      }
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <motion.div
      dir={language === "fa" ? "rtl" : "ltr"}
      className="modal-shade"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={spring}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close / بستن"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
export interface Toast {
  id: string;
  message: string;
  error?: boolean;
}
export function Toasts({
  items,
  dismiss,
}: {
  items: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            layout
            key={item.id}
            className={`toast ${item.error ? "error" : ""}`}
            initial={{ opacity: 0, y: 28, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={spring}
          >
            <span className="toast-symbol">
              {item.error ? <X size={17} /> : <Check size={17} />}
            </span>
            <span>{item.message}</span>
            <button
              aria-label="Dismiss / بستن اعلان"
              onClick={() => dismiss(item.id)}
            >
              <X size={14} />
            </button>
            <motion.i
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function ArtPreview({
  source = "/samples/portrait.jpg",
  options = {},
  className = "",
  animated = false,
  effect = "wave",
  fullDetail = false,
  label = "Character artwork preview / \u067e\u06cc\u0634\u200c\u0646\u0645\u0627\u06cc\u0634 \u0647\u0646\u0631 \u0645\u062a\u0646\u06cc",
}: {
  source?: string;
  options?: Partial<StudioOptions>;
  className?: string;
  animated?: boolean;
  effect?: Effect;
  fullDetail?: boolean;
  label?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const json = JSON.stringify(options);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const controller = new AbortController();
    let raf = 0;
    let alive = true;
    let started = false;
    let visible = false;
    let artwork: Artwork | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (!previewSources.has(source)) {
      if (previewSources.size >= 4) previewSources.delete(previewSources.keys().next().value!);
      previewSources.set(source, ++previewSourceId);
    }
    // Keep large uploaded data URLs out of every individual canvas cache key.
    const key = `${previewSources.get(source)}:${fullDetail}:${json}`;
    const start = performance.now();
    let last = 0;
    const animate = (now: number) => {
      if (!alive || !visible || document.hidden || reduced.matches || !artwork)
        return;
      if (now - last >= 65) {
        drawArtwork(target, artwork, effect, (now - start) / 1000, 420);
        last = now;
      }
      raf = requestAnimationFrame(animate);
    };
    const refreshAnimation = () => {
      cancelAnimationFrame(raf);
      if (
        animated &&
        visible &&
        !document.hidden &&
        !reduced.matches &&
        artwork
      )
        raf = requestAnimationFrame(animate);
    };
    const render = async () => {
      try {
        if (!alive) return;
        const cached = !animated && previewCache.get(key);
        if (cached) {
          target.width = cached.width;
          target.height = cached.height;
          target.getContext("2d")?.drawImage(cached, 0, 0);
          target.dataset.previewState = "ready";
          return;
        }
        const image = await loadImage(source);
        if (!alive) return;
        const settings = { ...DEFAULTS, ...JSON.parse(json) };
        settings.resolution = Math.min(
          settings.resolution,
          fullDetail ? 400 : settings.mode === "ascii" ? 84 : 52,
        );
        const art = await buildArtwork(
          image,
          image.width,
          image.height,
          settings,
          controller.signal,
        );
        if (!alive) return;
        artwork = art;
        await drawArtworkAsync(target, art, controller.signal, 420);
        if (!alive) return;
        target.dataset.previewState = "ready";
        if (!animated) {
          const copy = document.createElement("canvas");
          copy.width = target.width;
          copy.height = target.height;
          copy.getContext("2d")?.drawImage(target, 0, 0);
          if (previewCache.size >= 24)
            previewCache.delete(previewCache.keys().next().value!);
          previewCache.set(key, copy);
        }
        refreshAnimation();
      } catch {
        if (alive) target.dataset.previewState = "error";
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) {
          started = true;
          // Serialize small previews so a grid cannot saturate the main thread.
          previewQueue = previewQueue.then(render, render);
        }
        refreshAnimation();
      },
      { rootMargin: "100px" },
    );
    target.dataset.previewState = "pending";
    observer.observe(target);
    document.addEventListener("visibilitychange", refreshAnimation);
    reduced.addEventListener("change", refreshAnimation);
    return () => {
      alive = false;
      controller.abort();
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", refreshAnimation);
      reduced.removeEventListener("change", refreshAnimation);
    };
  }, [source, json, animated, effect, fullDetail]);
  return (
    <canvas
      ref={canvas}
      className={className}
      role="img"
      aria-label={label}
    />
  );
}
export function Busy({
  label,
  progress,
  cancel,
}: {
  label: string;
  progress?: number;
  cancel?: () => void;
}) {
  const { language } = useSettings();
  return (
    <div className="busy">
      <LoaderCircle className="spin" size={20} />
      <span>{label}</span>
      {progress !== undefined && (
        <>
          <strong>{Math.round(progress)}%</strong>
          <div className="progress-track">
            <motion.i animate={{ width: `${progress}%` }} />
          </div>
        </>
      )}
      {cancel && (
        <button onClick={cancel} className="text-button">
          <X size={15} /> {language === "fa" ? "لغو" : "Cancel"}
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string;
  text: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-symbol">
        <Sparkles size={32} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button className="button primary" onClick={onClick}>
          {action}
          <ArrowUpRight size={17} />
        </button>
      )}
    </div>
  );
}
