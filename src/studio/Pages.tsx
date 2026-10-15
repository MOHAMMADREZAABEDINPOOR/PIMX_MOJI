import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Search,
  Download,
  Upload,
  Trash2,
  Plus,
  RefreshCw,
  Flag,
  ShieldCheck,
  Eye,
  EyeOff,
  FolderOpen,
  SlidersHorizontal,
  FileJson,
} from "lucide-react";
import { PRESETS } from "../constants/presets";
import {
  DEFAULTS,
  type Project,
  type SavedStyle,
  type StudioOptions,
} from "./types";
import { ArtPreview, Busy, Empty, Modal, type Translate } from "./ui";
import { validateOptions } from "./storage";
import { buildArtwork, drawArtwork, loadImage } from "./engine";
import { canvasBlob, download } from "./export";
import { BackupPanel } from "./BackupPanel";
import { ProjectComparison } from "./ProjectComparison";
type Notify = (message: string, error?: boolean) => void;
function PageHeading({
  label,
  title,
  text,
  children,
}: {
  label: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="inner-heading">
      <div>
        <div className="eyebrow muted">PIMX / {label}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function StylesPage({
  t,
  custom,
  apply,
  notify,
  addStyle,
  remove,
}: {
  t: Translate;
  custom: SavedStyle[];
  apply: (o: Partial<StudioOptions>) => void;
  notify: Notify;
  addStyle: (s: SavedStyle) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState(""),
    [mode, setMode] = useState("all"),
    [visible, setVisible] = useState(12);
  const input = useRef<HTMLInputElement>(null);
  const filtered = PRESETS.filter(
    (p) =>
      (mode === "all" || p.options.mode === mode) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100000)
        throw new Error(
          t(
            "Style files must be under 100 KB.",
            "فایل سبک باید کمتر از ۱۰۰ کیلوبایت باشد.",
          ),
        );
      const value = JSON.parse(await file.text());
      const options = validateOptions(value.options || value);
      await addStyle({
        id: crypto.randomUUID(),
        name:
          typeof value.name === "string"
            ? value.name.slice(0, 60)
            : "Imported style",
        options,
      });
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <div className="content-width inner-page">
      <PageHeading
        label="STYLE LAB"
        title={t("Find your next look.", "سبک بعدی‌ات رو پیدا کن.")}
        text={t(
          `${PRESETS.length} styles. Pick one, then adjust it on your own photo.`,
          `${PRESETS.length} سبک آماده؛ یکی رو انتخاب کن و روی عکس خودت تغییرش بده.`,
        )}
      >
        <button
          className="button secondary"
          onClick={() => input.current?.click()}
        >
          <Upload size={16} />
          {t("Import style", "ورود سبک")}
        </button>
      </PageHeading>
      <input
        ref={input}
        type="file"
        accept=".json"
        className="sr-only"
        aria-label="Import style JSON"
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {custom.length > 0 && (
        <section className="custom-style-section">
          <h2>
            {t("Your signature styles", "سبک‌های اختصاصی تو")}
            <span>{custom.length}</span>
          </h2>
          <div className="custom-styles">
            {custom.map((style) => (
              <div className="custom-style" key={style.id}>
                <button onClick={() => apply(style.options)}>
                  <span
                    className="custom-swatch"
                    style={{
                      background: style.options.bgColor,
                      color: style.options.textColor,
                    }}
                  >
                    Aa
                  </span>
                  <span>
                    {style.name}
                    <small>{style.options.mode.toUpperCase()}</small>
                  </span>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Export ${style.name}`}
                  onClick={() =>
                    download(
                      new Blob(
                        [
                          JSON.stringify(
                            { schema: "pimx-style-v2", ...style },
                            null,
                            2,
                          ),
                        ],
                        { type: "application/json" },
                      ),
                      `${style.name}.pimx-style.json`,
                    )
                  }
                >
                  <Download size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${style.name}`}
                  onClick={() =>
                    remove(style.id).catch((e) => notify(e.message, true))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="style-engine-guide">
        <div>
          <h2>
            {t(
              "Compare the same portrait, then make it yours.",
              "همه استایل‌ها روی یک پرتره؛ انتخابش با تو.",
            )}
          </h2>
          <p>
            {t(
              "Every preview uses the same sample so you can compare the styles. In the studio, hover over any name to preview it on your own photo.",
              "همه پیش‌نمایش‌ها از یک عکس نمونه استفاده می‌کنن تا راحت مقایسه کنی. در استودیو روی نام هر استایل برو تا روی عکس خودت ببینیش.",
            )}
          </p>
        </div>
        <div className="engine-summary">
          {[
            [
              "ascii",
              "ASCII",
              t(
                "Light and shade, drawn in characters.",
                "نور و سایه با کاراکترها",
              ),
            ],
            [
              "mosaic",
              t("Words", "کلمات"),
              t("Your own text becomes the image.", "متن خودت، سازنده تصویر"),
            ],
            [
              "emoji",
              t("Emoji", "ایموجی"),
              t(
                "A portrait made from small colored symbols.",
                "پرتره با نمادهای رنگی",
              ),
            ],
          ].map(([id, label, description]) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setVisible(12);
              }}
            >
              <strong>
                {label}
                <span>
                  {PRESETS.filter((p) => p.options.mode === id).length}
                </span>
              </strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="filter-bar">
        <div className="segmented">
          {[
            ["all", t("All styles", "همه سبک‌ها")],
            ["ascii", "ASCII"],
            ["mosaic", t("Words", "کلمات")],
            ["emoji", t("Emoji", "ایموجی")],
          ].map(([id, label]) => (
            <button
              className={mode === id ? "active" : ""}
              key={id}
              onClick={() => {
                setMode(id);
                setVisible(12);
              }}
            >
              {mode === id && <motion.span layoutId="style-filter" />}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            placeholder={t("Find a style…", "جست‌وجوی سبک…")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(12);
            }}
          />
        </label>
      </div>
      <div className="styles-grid">
        {filtered.slice(0, visible).map((preset, i) => (
          <button
            className="style-card"
            key={preset.id}
            onClick={() => apply(preset.options)}
          >
            <div className="style-image">
              <ArtPreview
                source="/samples/portrait.jpg"
                options={{
                  ...preset.options,
                  colorize:
                    preset.options.mode === "emoji" ||
                    preset.options.colorize === true,
                }}
              />
              <span className="style-number">
                {String(i + 1).padStart(3, "0")}
              </span>
              <span className="style-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
            <div className="style-info">
              <h3>{preset.name}</h3>
              <span>{preset.options.mode?.toUpperCase()}</span>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title={t("No matching styles", "سبکی پیدا نشد")}
          text={t(
            "Try a different name or engine.",
            "نام یا حالت دیگری رو امتحان کن.",
          )}
        />
      )}
      {visible < filtered.length && (
        <div className="load-more">
          <button
            className="button secondary"
            onClick={() => setVisible((n) => n + 12)}
          >
            <Plus size={17} />
            {t("More possibilities", "سبک‌های بیشتر")}
            <span>{filtered.length - visible}</span>
          </button>
        </div>
      )}
    </div>
  );
}
export function LibraryPage({
  t,
  projects,
  ready,
  create,
  open,
  remove,
  notify,
  importProject,
  refresh,
}: {
  t: Translate;
  projects: Project[];
  ready: boolean;
  create: () => void;
  open: (p: Project) => void;
  remove: (id: string) => Promise<void>;
  notify: Notify;
  importProject: (p: Project) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [showOriginals, setShowOriginals] = useState(false);
  const [query, setQuery] = useState(""),
    [deleting, setDeleting] = useState<Project>(),
    [working, setWorking] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function exportImage(p: Project) {
    setWorking(p.id);
    try {
      const image = await loadImage(p.source);
      const art = await buildArtwork(
        image,
        image.width,
        image.height,
        p.options,
      );
      const canvas = document.createElement("canvas");
      drawArtwork(canvas, art);
      download(await canvasBlob(canvas), `${p.name}.png`);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setWorking("");
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error(
          t(
            "Project file is too large (20 MB maximum).",
            "حداکثر حجم فایل پروژه ۲۰ مگابایت است.",
          ),
        );
      const p = JSON.parse(await file.text());
      if (
        p.schema !== "pimx-project-v2" ||
        typeof p.source !== "string" ||
        !(
          /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
            p.source,
          ) ||
          [
            "/samples/portrait.jpg",
            "/samples/muse.jpg",
            "/samples/landscape.jpg",
          ].includes(p.source)
        )
      )
        throw new Error(
          t("This is not a valid PIMX project.", "فایل پروژه PIMX معتبر نیست."),
        );
      const options = validateOptions(p.options);
      const image = await loadImage(p.source);
      const art = await buildArtwork(image, image.width, image.height, options);
      const canvas = document.createElement("canvas");
      drawArtwork(canvas, art, "still", 0, 400);
      await importProject({
        id: crypto.randomUUID(),
        name:
          typeof p.name === "string" ? p.name.slice(0, 80) : "Imported project",
        source: p.source,
        thumbnail: canvas.toDataURL("image/jpeg", 0.8),
        options,
        updated: Date.now(),
        effect: [
          "still",
          "reveal",
          "rain",
          "wave",
          "glitch",
          "scatter",
        ].includes(p.effect)
          ? p.effect
          : "still",
      });
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <div className="content-width inner-page">
      <PageHeading
        label="YOUR LIBRARY"
        title={t("A collection of you.", "مجموعه‌ای از خلاقیت تو.")}
        text={t(
          "Your experiments, saved on this device. Pick up where inspiration left off.",
          "تجربه‌هات روی همین دستگاه ذخیره می‌شن؛ هر وقت خواستی از همون‌جا ادامه بده.",
        )}
      >
        <button
          className="button secondary"
          onClick={() => input.current?.click()}
        >
          <Upload size={16} />
          {t("Import project", "ورود پروژه")}
        </button>
        <button className="button primary" onClick={create}>
          <Plus size={17} />
          {t("New experiment", "تجربه جدید")}
        </button>
      </PageHeading>
      <input
        type="file"
        accept=".json"
        className="sr-only"
        ref={input}
        aria-label="Import project JSON"
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <BackupPanel t={t} refresh={refresh} notify={notify} />
      <div className="library-notice">
        <ShieldCheck size={18} />
        <span>
          {t(
            "Everything stays in this browser: original photos, edits and custom styles. New studio work saves automatically. Use a full backup to move your library.",
            "عکس اصلی، ویرایش‌ها و سبک‌های تو داخل همین مرورگر می‌مونن. کارهای جدید استودیو خودکار ذخیره می‌شن؛ برای انتقال همه‌شون، پشتیبان کامل بگیر.",
          )}
        </span>
      </div>
      <div className="library-view-picker segmented">
        <button
          className={!showOriginals ? "active" : ""}
          aria-pressed={!showOriginals}
          onClick={() => setShowOriginals(false)}
        >
          {t("Before & after", "\u0642\u0628\u0644 \u0648 \u0628\u0639\u062f")}
        </button>
        <button
          className={showOriginals ? "active" : ""}
          aria-pressed={showOriginals}
          onClick={() => setShowOriginals(true)}
        >
          {t("Original photos", "عکس‌های اصلی")}
        </button>
      </div>
      {!ready ? (
        <Busy label={t("Opening your library…", "در حال بازکردن تاریخچه…")} />
      ) : !projects.length ? (
        <Empty
          title={t(
            "Your first experiment is waiting.",
            "جای اولین اثرت اینجاست.",
          )}
          text={t(
            "Create something in the studio and save it here. Your original image and every setting stay editable.",
            "در استودیو اثر بساز و ذخیره کن؛ عکس اصلی و همه تنظیمات برای ادامه کار حفظ می‌شن.",
          )}
          action={t("Open the studio", "ورود به استودیو")}
          onClick={create}
        />
      ) : (
        <>
          <div className="filter-bar">
            <span className="muted">
              {projects.length} {t("saved experiments", "اثر ذخیره‌شده")}
            </span>
            <label className="search">
              <Search size={17} />
              <input
                placeholder={t("Search your projects…", "جست‌وجوی پروژه…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="styles-grid library-grid">
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.article
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="project-card"
                  key={p.id}
                >
                  <div className="project-image">
                    {showOriginals ? <img src={p.source} alt={p.name} loading="lazy" /> : <ProjectComparison project={p} t={t} />}
                    <button className="style-arrow" aria-label={`${t("Open project", "\u0628\u0627\u0632\u06a9\u0631\u062f\u0646 \u067e\u0631\u0648\u0698\u0647")}: ${p.name}`} onClick={() => open(p)}>
                      <FolderOpen size={19} />
                    </button>
                  </div>
                  <div className="project-details">
                    <button onClick={() => open(p)}>
                      <h3>{p.name}</h3>
                    </button>
                    <span>
                      {new Intl.DateTimeFormat(t("en", "fa-IR"), {
                        dateStyle: "medium",
                      }).format(p.updated)}
                    </span>
                    <div className="project-actions">
                      <button
                        disabled={!!working}
                        onClick={() => void exportImage(p)}
                      >
                        <Download size={15} />
                        {working === p.id ? t("Rendering…", "پردازش…") : "PNG"}
                      </button>
                      <button
                        onClick={() =>
                          download(
                            new Blob(
                              [
                                JSON.stringify({
                                  schema: "pimx-project-v2",
                                  ...p,
                                }),
                              ],
                              { type: "application/json" },
                            ),
                            `${p.name}.pimx-project.json`,
                          )
                        }
                      >
                        <FileJson size={15} />
                        {t("Project", "پروژه")}
                      </button>
                      <button
                        className="danger"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
          {!filtered.length && (
            <Empty
              title={t("No matching projects", "پروژه‌ای پیدا نشد")}
              text={t("Try another name.", "نام دیگری رو امتحان کن.")}
            />
          )}
        </>
      )}
      <AnimatePresence>
        {deleting && (
          <Modal
            title={t("Delete this experiment?", "این پروژه حذف بشه؟")}
            close={() => setDeleting(undefined)}
          >
            <p className="modal-description">
              {t(
                "This removes the saved project from this browser. Download a project backup first if you want to keep it.",
                "پروژه از این مرورگر حذف می‌شه. اگر لازمش داری اول فایل پشتیبان پروژه رو دانلود کن.",
              )}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setDeleting(undefined)}
              >
                {t("Keep it", "نگهش دار")}
              </button>
              <button
                className="button danger-button"
                onClick={() => {
                  void remove(deleting.id)
                    .then(() => setDeleting(undefined))
                    .catch((e) => notify(e.message, true));
                }}
              >
                {t("Delete project", "حذف پروژه")}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
