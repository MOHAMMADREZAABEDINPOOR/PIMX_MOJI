import { ArrowUpRight, Aperture, Github, Keyboard, ShieldCheck } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { ArtPreview, type Translate } from "./ui";
import type { Page } from "./types";
export function Footer({ t, navigate, shortcuts }: { t: Translate; navigate: (page: Page) => void; shortcuts: () => void }) {
  return <footer className="creation-footer">
    <div className="footer-invitation"><div><h2>{t("There's another side to your photo.", "عکست هنوز حرف‌های تازه داره.")}</h2><button className="button primary large" onClick={() => navigate("studio")}>{t("Let's make something", "بیا یه چیزی بسازیم")}<ArrowUpRight size={21} /></button></div>
      <div className="footer-print" aria-hidden="true"><ArtPreview source="/samples/portrait.jpg" options={{ treatment: "risograph", treatmentScale: 1.6, textColor: "#a8baff", palette: ["#788dff", "#d0baff"], chars: " .:-=+*#@", resolution: 65, bgColor: "#10121b" }} /><span>PIMX MOJI / CHARACTER STUDY</span></div>
    </div>
    <div className="footer-links"><div className="footer-about"><BrandMark /><p>{t("Photos become characters. The creative part is yours.", "عکس‌ها به کاراکتر تبدیل می‌شن؛ خلاقیتش با توئه.")}</p><span><ShieldCheck size={16} />{t("Created and saved in your browser.", "ساخت و ذخیره، در مرورگر خودت.")}</span></div>
      <nav aria-label={t("Footer navigation", "ناوبری فوتر")}><button onClick={() => navigate("studio")}>{t("Create an artwork", "ساخت اثر")}<ArrowUpRight size={15} /></button><button onClick={() => navigate("styles")}>{t("Explore 300 styles", "دیدن ۳۰۰ استایل")}<ArrowUpRight size={15} /></button><button onClick={() => navigate("library")}>{t("Your library & backups", "تاریخچه و پشتیبان‌ها")}<ArrowUpRight size={15} /></button></nav>
      <div className="footer-social"><a href="https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI" target="_blank" rel="noreferrer"><Github size={16} />GitHub<ArrowUpRight size={14} /></a><a href="https://t.me/PIMX_PASS" target="_blank" rel="noreferrer">Telegram<ArrowUpRight size={14} /></a><a href="https://x.com/pimxpass" target="_blank" rel="noreferrer">X / Twitter<ArrowUpRight size={14} /></a></div>
    </div>
    <div className="footer-wordmark" aria-label="PIMX MOJI" dir="ltr">PIMX<span>MOJI</span><BrandMark /></div>
    <div className="footer-colophon"><small>© 2026 PIMX MOJI</small><span>{t("A photo. A few characters. Your point of view.", "یک عکس، چند کاراکتر، نگاه تو.")}</span><button onClick={shortcuts}><Keyboard size={15} />{t("Keyboard shortcuts", "میان‌برهای صفحه‌کلید")}</button></div>
  </footer>;
}
