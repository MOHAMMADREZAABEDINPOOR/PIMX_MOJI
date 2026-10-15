import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Search, Eye } from "lucide-react";
import { PRESETS, type Preset } from "../constants/presets";
import type { StudioOptions } from "./types";
import type { Translate } from "./ui";
import { StyleTooltip, type StyleAnchor } from "./StyleTooltip";
const displayPresets = [
  ...PRESETS.filter((p) => !p.id.startsWith("craft-")),
  ...PRESETS.filter((p) => p.id.startsWith("craft-")),
];

export function PresetChooser({
  t,
  apply,
  preview,
  onSelect,
  initialId,
  source = "/samples/portrait.jpg",
}: {
  t: Translate;
  apply: (options: Partial<StudioOptions>) => void;
  preview: (preset: Preset | null) => void;
  onSelect?: (preset: Preset) => void;
  initialId?: string;
  source?: string;
}) {
  const [anchor, setAnchor] = useState<StyleAnchor | null>(null);
  const tooltipId = useId();
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keepTooltip = useCallback(() => clearTimeout(closeTimer.current), []);
  const closeTooltip = useCallback(() => { clearTimeout(openTimer.current); clearTimeout(closeTimer.current); setAnchor(null); }, []);
  const leaveTooltip = useCallback(() => { clearTimeout(openTimer.current); clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setAnchor(null), 140); }, []);
  useEffect(() => () => { clearTimeout(openTimer.current); clearTimeout(closeTimer.current); }, []);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [selected, setSelected] = useState(initialId || "");
  const filtered = useMemo(
    () =>
      displayPresets.filter(
        (p) =>
          (mode === "all" || p.options.mode === mode) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, mode],
  );
  return (
    <div
      className="preset-browser named-presets"
      onMouseLeave={() => { if (matchMedia('(hover: hover)').matches) { preview(null); leaveTooltip(); } }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) { preview(null); closeTooltip(); }
      }}
    >
      <div className="preset-browser-heading">
        <h2>{t("Choose a style", "استایلت رو انتخاب کن")}</h2>
        <span>{PRESETS.length}</span>
      </div>
      <p className="preset-instructions">
        {t(
          "Hover a name to see your photo in that style. Click to select. On mobile, tap Preview.",
          "با هاور، نتیجه رو بالا ببین؛ برای انتخاب روی اسم بزن. روی گوشی دکمهٔ «پیش‌نمایش» رو بزن.",
        )}
      </p>
      <label className="preset-search">
        <Search size={16} />
        <input
          aria-label={t("Search all 300 styles", "جست‌وجوی ۳۰۰ سبک")}
          placeholder={t("Search by name…", "جست‌وجو با نام…")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            preview(null); closeTooltip();
          }}
        />
      </label>
      <div className="preset-mode-filters">
        {[
          ["all", t("All", "همه")],
          ["ascii", "ASCII"],
          ["mosaic", t("Words", "کلمات")],
          ["emoji", t("Emoji", "ایموجی")],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={mode === id}
            className={mode === id ? "selected" : ""}
            onClick={() => {
              setMode(id);
              preview(null); closeTooltip();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="preset-match-count" aria-live="polite">
        {filtered.length} {t("styles", "استایل")}
      </span>
      <div className="preset-swatch-grid preset-name-list">
        {filtered.map((p) => (
          <div className="preset-item" key={p.id}>
          <button
            className={`preset-select ${selected === p.id ? "selected" : ""}`}
            aria-label={p.name}
            aria-pressed={selected === p.id}
            aria-describedby={anchor?.preset.id === p.id ? tooltipId : undefined}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") { keepTooltip(); clearTimeout(openTimer.current); const element = e.currentTarget; openTimer.current = setTimeout(() => setAnchor({ preset: p, element }), 100); } }}
            onPointerLeave={leaveTooltip}
            onFocus={(e) => setAnchor({ preset: p, element: e.currentTarget })}
            onBlur={closeTooltip}
            onClick={() => {
              setSelected(p.id);
              preview(null); closeTooltip();
              apply(p.options);
              onSelect?.(p);
            }}
          >
            <span
              className="style-color-dot"
              style={{ background: p.options.textColor || "#a8baff" }}
            />
            <span>
              {p.name}
              <small>
                {p.options.mode === "mosaic"
                  ? "Words"
                  : p.options.mode?.toUpperCase()}
              </small>
            </span>
            {selected === p.id && <Check size={14} />}
          </button>
          <button className="style-preview-trigger" aria-expanded={anchor?.preset.id === p.id} aria-controls={anchor?.preset.id === p.id ? tooltipId : undefined} aria-label={`${t("Preview", "پیش‌نمایش")} ${p.name}`} onClick={(e) => {
            keepTooltip();
            const nameButton = e.currentTarget.parentElement?.querySelector<HTMLElement>('.preset-select') || e.currentTarget;
            setAnchor(anchor?.preset.id === p.id ? null : { preset: p, element: nameButton });
          }}><Eye size={14} /><span>{t("Preview", "پیش‌نمایش")}</span></button>
          </div>
        ))}
      </div>
      <StyleTooltip anchor={anchor} source={source} close={closeTooltip} id={tooltipId} keep={keepTooltip} leave={leaveTooltip} />
      {!filtered.length && (
        <p className="hint">
          {t(
            "No match. Try another name.",
            "پیدا نشد؛ یه اسم دیگه رو امتحان کن.",
          )}
        </p>
      )}
    </div>
  );
}
