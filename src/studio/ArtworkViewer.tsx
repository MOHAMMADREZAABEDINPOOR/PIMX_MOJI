import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Scan, Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { drawArtwork, drawArtworkAsync, type Artwork } from "./engine";
import type { Effect } from "./types";
import { Modal, type Translate } from "./ui";

function Surface({ art, effect, playing, expanded, t, frame }: { art: Artwork; effect: Effect; playing: boolean; expanded: boolean; t: Translate; frame?: HTMLCanvasElement }) {
  const canvas = useRef<HTMLCanvasElement>(null), viewport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const fit = () => setView({ zoom: 1, x: 0, y: 0 });
  const zoom = (factor: number) => setView(v => { const next = Math.max(.5, Math.min(6, v.zoom * factor)); return { zoom: next, x: v.x * next / v.zoom, y: v.y * next / v.zoom }; });
  useEffect(fit, [art, frame]);
  useEffect(() => {
    const target = canvas.current!;
    const abort = new AbortController();
    if (frame && effect === "still") {
      const ratio = 1;
      target.width = Math.round(frame.width * ratio); target.height = Math.round(frame.height * ratio);
      target.getContext("2d")!.drawImage(frame, 0, 0, target.width, target.height);
    } else if (!playing || effect === "still") {
      void drawArtworkAsync(target, art, abort.signal).catch(() => {});
    } else drawArtwork(target, art, "still", 0, expanded ? 1200 : 800);
    if (!playing || effect === "still") return () => abort.abort();
    let raf = 0, visible = false, last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!visible || document.hidden) return;
      if (now - last >= 32) { drawArtwork(target, art, effect, (now - start) / 1000, expanded ? 1200 : 800); last = now; }
      raf = requestAnimationFrame(tick);
    };
    const resume = () => { cancelAnimationFrame(raf); if (visible && !document.hidden) raf = requestAnimationFrame(tick); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    observer.observe(target);
    document.addEventListener("visibilitychange", resume);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", resume); };
  }, [art, effect, playing, expanded, frame]);
  useEffect(() => {
    const element = viewport.current!;
    const wheel = (e: WheelEvent) => {
      if (!expanded && document.activeElement !== element && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault(); zoom(Math.exp(-e.deltaY * .002));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [expanded]);
  return <div className={`viewer-surface ${expanded ? "viewer-expanded" : ""}`}>
    <div ref={viewport} className={`artwork-viewport ${view.zoom > 1 ? "is-zoomed" : ""}`} tabIndex={0} role="region" aria-label={t("Artwork viewer", "نمایشگر اثر")} onKeyDown={e => {
      if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === "+" || e.key === "=") zoom(1.25);
      if (e.key === "-") zoom(.8);
      if (e.key === "0") fit();
      if (e.key.startsWith("Arrow")) setView(v => ({ ...v, x: v.x + (e.key === "ArrowLeft" ? 35 : e.key === "ArrowRight" ? -35 : 0), y: v.y + (e.key === "ArrowUp" ? 35 : e.key === "ArrowDown" ? -35 : 0) }));
    }} onDoubleClick={() => view.zoom > 1 ? fit() : zoom(2)} onPointerDown={e => {
      e.currentTarget.focus({ preventScroll: true });
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch.current = 0;
    }} onPointerMove={e => {
      const previous = pointers.current.get(e.pointerId); if (!previous) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.current) zoom(distance / pinch.current);
        pinch.current = distance;
      } else if (view.zoom > 1) setView(v => ({ ...v, x: v.x + e.clientX - previous.x, y: v.y + e.clientY - previous.y }));
    }} onPointerUp={e => { pointers.current.delete(e.pointerId); pinch.current = 0; }} onPointerCancel={e => { pointers.current.delete(e.pointerId); pinch.current = 0; }}>
      <canvas ref={canvas} aria-label={t("Export preview", "پیش‌نمایش خروجی")} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }} />
    </div>
    <div className="viewer-tools" aria-label={t("Image controls", "کنترل تصویر")}>
      <button className="icon-button" aria-label={t("Zoom out", "کوچک‌نمایی")} disabled={view.zoom <= .5} onClick={() => zoom(.8)}><ZoomOut size={18} /></button>
      <output aria-label={t("Zoom level", "میزان بزرگ‌نمایی")}>{Math.round(view.zoom * 100)}%</output>
      <button className="icon-button" aria-label={t("Zoom in", "بزرگ‌نمایی")} disabled={view.zoom >= 6} onClick={() => zoom(1.25)}><ZoomIn size={18} /></button>
      <span className="viewer-divider" />
      <button className="text-button" onClick={fit}><Scan size={17} />{t("Fit", "اندازه مناسب")}</button>
      <small>{t("Double-click to zoom · Drag to explore", "دو ضربه برای زوم؛ بکش و جابه‌جا کن")}</small>
    </div>
  </div>;
}

export function ArtworkViewer({ art, effect, t, frame }: { art: Artwork; effect: Effect; t: Translate; frame?: HTMLCanvasElement }) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false), [playing, setPlaying] = useState(!reduced);
  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  return <div className="artwork-viewer">
    <div className="viewer-heading"><span>{t("Your artwork", "اثر تو")}</span><div>{effect !== "still" && <button className="text-button" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? t("Pause preview", "توقف پیش‌نمایش") : t("Play preview", "پخش پیش‌نمایش")}</button>}<button className="text-button" onClick={() => setExpanded(true)}><Maximize2 size={16} />{t("Open large", "نمایش بزرگ")}</button></div></div>
    <Surface art={art} effect={effect} playing={playing && !expanded} expanded={false} t={t} frame={frame} />
    {expanded && <Modal wide title={t("Explore your artwork", "جزئیات اثرت را ببین")} close={() => setExpanded(false)}><div className="artwork-expanded"><Surface art={art} effect={effect} playing={playing} expanded t={t} frame={frame} /><div className="expanded-controls">{effect !== "still" && <button className="text-button" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? t("Pause preview", "توقف پیش‌نمایش") : t("Play preview", "پخش پیش‌نمایش")}</button>}<button className="text-button" onClick={() => setExpanded(false)}><Minimize2 size={16} />{t("Back to result", "بازگشت به نتیجه")}</button></div></div></Modal>}
  </div>;
}
