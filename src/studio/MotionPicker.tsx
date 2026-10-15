import { MOTIONS } from "./motions";
import type { Effect } from "./types";
import type { Translate } from "./ui";
export function MotionPicker({ value, onChange, t, disabled }: { value: Effect; onChange: (effect: Effect) => void; t: Translate; disabled?: boolean }) {
  return <section className="result-motion" aria-label={t("Motion", "حرکت")}>
    <div className="result-motion-heading"><h2>{t("Give it movement.", "اثرت را به حرکت دربیار.")}</h2><p>{t("Try a motion here. Keep it in a GIF or video.", "همین‌جا حرکت را ببین؛ با GIF یا ویدئو ذخیره‌اش کن.")}</p></div>
    <div className="result-motion-grid">{MOTIONS.map((m, i) => <button key={m.id} disabled={disabled} aria-pressed={value === m.id} onClick={() => onChange(m.id)} className={value === m.id ? "selected" : ""}><svg viewBox="0 0 36 24" aria-hidden="true"><path d={i === 0 ? "M6 12h24" : `M3 12Q11 ${i % 2 ? 0 : 24} 18 12T33 12`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx={6 + i % 5 * 6} cy="12" r="2.7" fill="currentColor"/></svg><span>{t(m.en, m.fa)}</span></button>)}</div>
  </section>;
}
