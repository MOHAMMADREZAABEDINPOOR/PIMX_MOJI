import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import type { ExportTemplate } from "./export";

export function CanvasSizePicker({ label, value, options, disabled, onChange }: {
  label: string; value: ExportTemplate; options: { value: ExportTemplate; name: string; size: string }[]; disabled: boolean; onChange: (value: ExportTemplate) => void;
}) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(0), [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find(o => o.value === value)!;
  const choose = (index: number) => { onChange(options[index].value); setOpen(false); button.current?.focus(); };
  useEffect(() => {
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const show = () => { setActive(options.findIndex(o => o.value === value)); setAbove(innerHeight - button.current!.getBoundingClientRect().bottom < 330); setOpen(true); };
  return <div className="size-picker field-label" ref={root}>
    <span id={`${id}-label`}>{label}</span>
    <button ref={button} className={`size-picker-trigger ${open ? "is-open" : ""}`} role="combobox" aria-label={label} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={disabled} onClick={() => open ? setOpen(false) : show()} onKeyDown={e => {
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === "Escape" || e.key === "Tab") setOpen(false);
      else if (e.key === "Enter" || e.key === " ") open ? choose(active) : show();
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { if (!open) show(); else setActive(i => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length); }
      else if (e.key === "Home") setActive(0);
      else if (e.key === "End") setActive(options.length - 1);
      else if (e.key.length === 1) { const index = options.findIndex(o => o.name.toLowerCase().startsWith(e.key.toLowerCase())); if (index >= 0) { if (!open) show(); setActive(index); } }
    }}><span><strong>{current.name}</strong><small dir="ltr">{current.size}</small></span><ChevronDown size={17} /></button>
    <AnimatePresence>{open && !disabled && <motion.div className={`size-picker-menu ${above ? "opens-above" : ""}`} role="listbox" id={id} aria-labelledby={`${id}-label`} initial={{ opacity: 0, y: above ? 5 : -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={{ duration: .16 }}>
      {options.map((o, index) => {
        const Icon = o.value === "avatar" ? Square : o.value === "wallpaper" ? RectangleHorizontal : RectangleVertical;
        return <div role="option" id={`${id}-${index}`} key={o.value} aria-selected={value === o.value} className={index === active ? "is-active" : ""} onPointerMove={() => setActive(index)} onPointerDown={e => e.preventDefault()} onClick={() => choose(index)}><Icon size={21} /><span><strong>{o.name}</strong><small dir="ltr">{o.size}</small></span>{value === o.value && <Check size={17} />}</div>;
      })}
    </motion.div>}</AnimatePresence>
  </div>;
}
