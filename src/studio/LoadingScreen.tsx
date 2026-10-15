import { BrandMark } from "./BrandMark";
import { useSettings } from "../contexts/SettingsContext";

export function LoadingScreen({ full = false }: { full?: boolean }) {
  const { language } = useSettings();
  return <div className={`creative-loader ${full ? "loader-full" : ""}`} role="status" dir={language === "fa" ? "rtl" : "ltr"}>
    <div className="loader-emblem"><BrandMark /><span aria-hidden="true" className="loader-character">@</span><span aria-hidden="true" className="loader-character">Aa</span><span aria-hidden="true" className="loader-character">:)</span></div>
    <strong dir="ltr">PIMX MOJI</strong>
    <p>{language === "fa" ? "چند پیکسل تا یک دنیای تازه…" : "A few pixels from a new world…"}</p>
    <div className="loader-track" aria-hidden="true"><i /></div>
    <span className="sr-only">{language === "fa" ? "در حال آماده‌سازی" : "Loading"}</span>
  </div>;
}
