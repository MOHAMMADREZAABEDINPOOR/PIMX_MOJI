import { useEffect, useState } from "react";
import { ArrowLeft, Copy, FileText, FolderOpen, Maximize } from "lucide-react";
import { ExportDialog } from "./StudioDialogs";
import { artworkText, buildArtwork, loadImage, type Artwork } from "./engine";
import { download } from "./export";
import { Busy, type Translate } from "./ui";
import type { Project, Effect } from "./types";

export type GeneratedResult = { project: Project; art?: Artwork; saved?: boolean };
export function ResultPage({ result, ready, t, back, library, notify, onEffectChange }: {
  onEffectChange: (effect: Effect) => void; result?: GeneratedResult; ready: boolean; t: Translate; back: () => void; library: () => void; notify: (message: string, error?: boolean) => void;
}) {
  const [art, setArt] = useState(result?.art);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!result) return;
    if (result.art) { setArt(result.art); return; }
    const abort = new AbortController();
    setArt(undefined); setError("");
    const p = result.project;
    void loadImage(p.source).then((img) => buildArtwork(img, img.width, img.height, p.options, abort.signal)).then((art) => { if (!abort.signal.aborted) setArt(art); }).catch((e) => { if (!abort.signal.aborted) setError((e as Error).message); });
    return () => abort.abort();
  }, [result?.art, result?.project.id, result?.project.source, result?.project.options]);
  if (error || (ready && !result)) return <section className="result-empty"><h1>{t("Your next artwork starts with a photo.", "اثر بعدی‌ات با یک عکس شروع می‌شه.")}</h1><p>{error || t("Choose a photo and a style in the studio, then press Generate.", "در استودیو عکس و استایل رو انتخاب کن و دکمهٔ جنریت رو بزن.")}</p><button className="button primary" onClick={back}>{t("Open studio", "بازکردن استودیو")}</button></section>;
  if (!art || !result) return <Busy label={t("Opening your artwork…", "در حال بازکردن اثر…")} />;
  const { project } = result;
  async function copy() {
    try { await navigator.clipboard.writeText(artworkText(art!)); notify(t("Artwork text copied.", "متن اثر کپی شد.")); } catch { notify(t("Clipboard unavailable. Download the text file instead.", "کپی در این مرورگر ممکن نیست؛ فایل متنی رو دانلود کن."), true); }
  }
  return <section className="result-page">
    <div className="result-heading"><div><button className="text-button" onClick={back}><ArrowLeft size={16} />{t("Back to editing", "بازگشت به ویرایش")}</button><h1 dir="auto">{project.name}</h1><p>{result.saved === false ? t("Not saved in this browser. Download a copy to keep it.", "این اثر هنوز در تاریخچه ذخیره نشده؛ نسخه‌اش رو دانلود کن.") : t("Made by you. Saved in this browser.", "ساختهٔ تو؛ ذخیره‌شده در همین مرورگر.")}</p></div><button className="button secondary compact" onClick={library}><FolderOpen size={16} />{t("Library", "تاریخچه")}</button></div>
    <ExportDialog inline t={t} art={art} effect={project.effect} onEffectChange={onEffectChange} name={project.name} close={back} notify={notify} />
    <div className="result-extras"><span>{t("Need the characters themselves?", "خود کاراکترها رو می‌خوای؟")}</span><button className="text-button" onClick={() => void copy()}><Copy size={15} />{t("Copy text", "کپی متن")}</button><button className="text-button" onClick={() => download(new Blob([artworkText(art)], { type: "text/plain;charset=utf-8" }), `${project.name}.txt`)}><FileText size={15} />{t("Download TXT", "دانلود TXT")}</button></div>
  </section>;
}
