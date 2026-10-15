import { useRef, useState } from "react";
import { Download, Upload, HardDrive, Check, FileArchive } from "lucide-react";
import { exportLibrary, restoreLibrary } from "./storage";
import { download } from "./export";
import type { Translate } from "./ui";

export function BackupPanel({
  t,
  refresh,
  notify,
}: {
  t: Translate;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [summary, setSummary] = useState("");
  async function backup() {
    setBusy("export");
    try {
      const data = await exportLibrary();
      download(
        new Blob([JSON.stringify(data)], { type: "application/json" }),
        `pimx-library-${new Date().toISOString().slice(0, 10)}.pimx-library.json`,
      );
      setSummary(
        t(
          `Backup downloaded: ${data.projects.length} projects and ${data.styles.length} custom styles.`,
          `پشتیبان دانلود شد: ${data.projects.length} پروژه و ${data.styles.length} سبک شخصی.`,
        ),
      );
    } catch {
      notify(
        t(
          "Backup failed. Please try again.",
          "پشتیبان ساخته نشد؛ دوباره امتحان کن.",
        ),
        true,
      );
    } finally {
      setBusy("");
    }
  }
  async function restore(file?: File) {
    if (!file) return;
    setBusy("import");
    setSummary("");
    try {
      if (file.size > 150 * 1024 * 1024)
        throw new Error(
          t(
            "This file is larger than 150 MB.",
            "حجم فایل بیشتر از ۱۵۰ مگابایته.",
          ),
        );
      const result = await restoreLibrary(JSON.parse(await file.text()));
      await refresh();
      setSummary(
        t(
          `Restored ${result.projects} projects and ${result.styles} custom styles. Your library is ready.`,
          `${result.projects} پروژه و ${result.styles} سبک شخصی بازیابی شد؛ تاریخچه‌ات آماده‌ست.`,
        ),
      );
    } catch (e) {
      notify(
        e instanceof SyntaxError
          ? t(
              "This is not a readable backup JSON file.",
              "فایل پشتیبان قابل‌خواندن نیست؛ فایل JSON اصلی رو انتخاب کن.",
            )
          : (e as Error).message,
        true,
      );
    } finally {
      setBusy("");
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="backup-panel" id="backup">
      <div className="backup-intro">
        <HardDrive size={28} />
        <h2>
          {t("Take your library with you.", "تاریخچه‌ات رو با خودت ببر.")}
        </h2>
        <p>
          {t(
            "Your photos, projects and custom styles are stored in this browser. Download one backup file to keep them safe or move them to another browser.",
            "عکس‌ها، پروژه‌ها و سبک‌های شخصی‌ات داخل همین مرورگر ذخیره می‌شن. با یک فایل پشتیبان، همه‌شون رو نگه دار یا به مرورگر و دستگاه دیگه منتقل کن.",
          )}
        </p>
        <div className="backup-actions">
          <button
            className="button primary"
            disabled={!!busy}
            onClick={() => void backup()}
          >
            <Download size={17} />
            {busy === "export"
              ? t("Preparing…", "در حال آماده‌سازی…")
              : t("Download full backup", "دانلود پشتیبان کامل")}
          </button>
          <button
            className="button secondary"
            disabled={!!busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={17} />
            {busy === "import"
              ? t("Restoring…", "در حال بازیابی…")
              : t("Restore backup", "بازیابی پشتیبان")}
          </button>
        </div>
        <input
          className="sr-only"
          type="file"
          accept=".json,application/json"
          aria-label={t(
            "Restore library backup",
            "بازیابی فایل پشتیبان تاریخچه",
          )}
          ref={input}
          onChange={(e) => void restore(e.target.files?.[0])}
        />
        {summary && (
          <p className="backup-result" role="status">
            <Check size={17} />
            {summary}
          </p>
        )}
      </div>
      <div className="backup-guide">
        <FileArchive size={25} />
        <h3>
          {t("Moving to another browser?", "می‌خوای بری یه مرورگر دیگه؟")}
        </h3>
        <ol>
          <li>
            {t(
              "Here, choose “Download full backup”. Keep the downloaded .json file.",
              "اینجا «دانلود پشتیبان کامل» رو بزن و فایل .json دانلودشده رو نگه دار.",
            )}
          </li>
          <li>
            {t(
              "Open this website in your other browser or device and go to Library.",
              "سایت رو تو مرورگر یا دستگاه جدید باز کن و برو به تاریخچه.",
            )}
          </li>
          <li>
            {t(
              "Choose “Restore backup” and select that file. Your photos, settings and custom styles appear here.",
              "«بازیابی پشتیبان» رو بزن و همون فایل رو انتخاب کن. عکس‌ها، تنظیمات پروژه‌ها و سبک‌هات برمی‌گردن.",
            )}
          </li>
        </ol>
        <p>
          {t(
            "Import adds to your current library. For the same project, the newer version wins; existing custom styles are kept. Nothing is uploaded to a server.",
            "بازیابی به تاریخچه فعلی اضافه می‌کنه؛ از یک پروژه، نسخه جدیدتر نگه داشته می‌شه و سبک‌های شخصی موجود حفظ می‌شن. هیچ فایلی به سرور ارسال نمی‌شه.",
          )}
        </p>
        <p className="storage-warning">
          {t(
            "Clearing website data or using private browsing can remove local projects. Keep a backup somewhere safe; it contains your photos. Downloads already on your device cannot be found automatically.",
            "پاک‌کردن داده‌های سایت یا استفاده از حالت ناشناس ممکنه پروژه‌های محلی رو پاک کنه. پشتیبان رو جای امن نگه دار؛ عکس‌هات داخلشه. سایت به فایل‌های دانلودشده خارج از مرورگر دسترسی خودکار نداره.",
          )}
        </p>
      </div>
    </section>
  );
}
