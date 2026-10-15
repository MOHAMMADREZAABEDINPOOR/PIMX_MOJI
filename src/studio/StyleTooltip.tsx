import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArtPreview } from "./ui";
import type { Preset } from "../constants/presets";
import { useSettings } from "../contexts/SettingsContext";

export type StyleAnchor = { preset: Preset; element: HTMLElement };
export function StyleTooltip({ anchor, source, close, id, keep, leave }: { anchor: StyleAnchor | null; source: string; close: () => void; id: string; keep: () => void; leave: () => void }) {
  const reduced = useReducedMotion();
  const { language } = useSettings();
  const [position, setPosition] = useState({ left: 0, top: 0, below: false, arrow: 96 });
  useLayoutEffect(() => {
    if (!anchor) return;
    const place = () => {
      const rect = anchor.element.getBoundingClientRect();
      const width = Math.min(192, innerWidth - 24);
      const below = rect.top < 244;
      const center = rect.left + rect.width / 2;
      const left = Math.max(12, Math.min(innerWidth - width - 12, center - width / 2));
      setPosition({ left, top: below ? rect.bottom + 10 : rect.top - 10, below, arrow: Math.max(16, Math.min(width - 16, center - left)) });
    };
    place();
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, [anchor, close]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const outside = (e: PointerEvent) => { if (!(e.target as Element).closest('.preset-item, .style-hover-card')) close(); };
    window.addEventListener("keydown", escape);
    window.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", escape); window.removeEventListener("pointerdown", outside); };
  }, [close]);
  return createPortal(<AnimatePresence>{anchor && <motion.div key={anchor.preset.id} id={id} role="tooltip" onPointerEnter={keep} onPointerLeave={leave} className={`style-hover-card ${position.below ? "tooltip-below" : ""}`} style={{ left: position.left, top: position.top, "--tooltip-arrow": `${position.arrow}px` } as CSSProperties} initial={{ opacity: 0, y: position.below ? -6 : 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={{ duration: reduced ? 0 : .24, ease: [.16, 1, .3, 1] }} dir={language === "fa" ? "rtl" : "ltr"}>
    <div className="tooltip-art" key={anchor.preset.id}><ArtPreview source={source} options={anchor.preset.options} /><span className="tooltip-rendering">{language === "fa" ? "در حال ساخت پیش‌نمایش…" : "Rendering preview…"}</span><span className="tooltip-error">{language === "fa" ? "پیش‌نمایش آماده نشد؛ دوباره امتحان کن." : "Preview unavailable. Try again."}</span></div>
    <strong>{anchor.preset.name}</strong>
  </motion.div>}</AnimatePresence>, document.body);
}
