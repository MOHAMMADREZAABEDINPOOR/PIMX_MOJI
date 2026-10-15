import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowUpRight,
  Globe2,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Github,
  Keyboard,
  FolderOpen,
} from "lucide-react";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
const Studio = lazy(() =>
  import("./studio/Studio").then((module) => ({ default: module.Studio })),
);
import { pageUrl, updateMetadata } from "./studio/seo";
import { BrandMark } from "./studio/BrandMark";
import { LoadingScreen } from "./studio/LoadingScreen";
import { Home } from "./studio/Home";
import { Footer } from "./studio/Footer";
import type { GeneratedResult } from "./studio/ResultPage";
const ResultPage = lazy(() => import("./studio/ResultPage").then((m) => ({ default: m.ResultPage })));
const StylesPage = lazy(() =>
  import("./studio/Pages").then((module) => ({ default: module.StylesPage })),
);
const LibraryPage = lazy(() =>
  import("./studio/Pages").then((module) => ({ default: module.LibraryPage })),
);
import { Busy, Modal, Toasts, spring, type Toast } from "./studio/ui";
import {
  DEFAULTS,
  type Effect,
  type Page,
  type Project,
  type SavedStyle,
  type StudioOptions,
} from "./studio/types";
import {
  getProjects,
  getStyles,
  migrateHistory,
  saveProjects,
  saveStyles,
  getProjects as readProjects,
  validateOptions,
} from "./studio/storage";
import { readImage, loadImage } from "./studio/engine";
import { useTimeline } from "./studio/useTimeline";
const pages: Page[] = ["home", "studio", "styles", "library", "result"];
const getPage = (): Page => {
  const candidate = location.hash.slice(1) || location.pathname.split("/").filter(Boolean).filter(p => p !== "en" && p !== "fa")[0] || "home";
  return pages.includes(candidate as Page) ? candidate as Page : "home";
};
function StudioApp() {
  const { language, toggleLanguage, theme, toggleTheme } = useSettings();
  const t = useCallback(
    (en: string, fa: string) => (language === "fa" ? fa : en),
    [language],
  );
  const reduced = useReducedMotion();
  const [page, setPage] = useState<Page>(getPage),
    [mobileMenu, setMobileMenu] = useState(false),
    [shortcuts, setShortcuts] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]),
    [projects, setProjects] = useState<Project[]>([]),
    [styles, setStyles] = useState<SavedStyle[]>([]);
  const [source, setSource] = useState("/samples/portrait.jpg"),
    [projectId, setProjectId] = useState<string>(),
    [projectName, setProjectName] = useState("Untitled experiment"),
    [loadingSource, setLoadingSource] = useState(false),
    [dataReady, setDataReady] = useState(false);
  const timeline = useTimeline();
  const [effect, setEffect] = useState<Effect>("still");
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult>();
  const initialLoad = useRef<Promise<[Project[], SavedStyle[]]> | null>(null);
  const projectWrites = useRef<Promise<void>>(Promise.resolve());
  const uploadRef = useRef<HTMLInputElement>(null),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const notify = useCallback((message: string, error = false) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items.slice(-3), { id, message, error }]);
    timers.current.push(
      setTimeout(
        () => setToasts((items) => items.filter((item) => item.id !== id)),
        5000,
      ),
    );
  }, []);
  const navigate = useCallback((next: Page) => {
    if (location.hash) { if (getPage() !== next) location.hash = next; }
    else history.pushState(null, "", pageUrl(next, language));
    setPage(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [language]);
  useEffect(() => {
    const handle = () => {
      setPage(getPage());
      setMobileMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handle);
    window.addEventListener("popstate", handle);
    return () => { window.removeEventListener("hashchange", handle); window.removeEventListener("popstate", handle); };
  }, []);
  useEffect(() => {
    let alive = true;
    initialLoad.current ||= Promise.all([migrateHistory(), getStyles()]);
    initialLoad.current
      .then(([p, s]) => {
        if (alive) {
          setProjects(p);
          setStyles(s);
          let resultId: string | null = null;
          try { resultId = sessionStorage.getItem("pimx-result"); } catch { /* Browser storage may be restricted. */ }
          const lastResult = p.find((project) => project.id === resultId);
          if (lastResult) {
            setGeneratedResult({ project: lastResult });
            if (getPage() === "result") {
              setSource(lastResult.source); setProjectId(lastResult.id); setProjectName(lastResult.name);
              setEffect(lastResult.effect); timeline.reset(validateOptions(lastResult.options));
            }
          }
          setDataReady(true);
        }
      })
      .catch(() => {
        if (alive) setDataReady(true);
        if (alive)
          notify(
            t(
              "Browser storage is unavailable. Downloads still work.",
              "ذخیره‌سازی مرورگر در دسترس نیست؛ دانلود همچنان کار می‌کند.",
            ),
            true,
          );
      });
    return () => {
      alive = false;
    };
  }, [notify]);
  useEffect(() => {
    updateMetadata(page, language, theme);
    history.replaceState(null, "", location.hash ? `/${location.hash}` : pageUrl(page, language));
  }, [page, language, theme]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) ||
        document.querySelector('[role="dialog"]')
      )
        return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcuts(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        uploadRef.current?.click();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setLoadingSource(true);
    try {
      const nextSource = await readImage(file);
      const image = await loadImage(nextSource);
      const thumbnail = document.createElement("canvas");
      const scale = Math.min(1, 360 / Math.max(image.width, image.height));
      thumbnail.width = Math.round(image.width * scale);
      thumbnail.height = Math.round(image.height * scale);
      thumbnail
        .getContext("2d")!
        .drawImage(image, 0, 0, thumbnail.width, thumbnail.height);
      await saveProject(
        {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ""),
          source: nextSource,
          thumbnail: thumbnail.toDataURL("image/jpeg", 0.82),
          options: { ...structuredClone(timeline.options), strokes: [] },
          effect,
          updated: Date.now(),
        },
        true,
      );
      setSource(nextSource);
      timeline.change({ strokes: [] });
      setProjectName(file.name.replace(/\.[^.]+$/, ""));
      navigate("studio");
      notify(
        t(
          "Image is ready. Make it yours.",
          "تصویر آماده‌ست؛ حالا سبک خودت رو بساز.",
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoadingSource(false);
    }
  }
  function applyStyle(options: Partial<StudioOptions>) {
    timeline.change({ ...DEFAULTS, ...options, strokes: [] });
    navigate("studio");
  }
  async function saveProject(project: Project, silent = false) {
    const write = projectWrites.current.catch(() => {}).then(async () => {
      await initialLoad.current;
      const current = await getProjects();
      const next = [project, ...current.filter((p) => p.id !== project.id)];
      await saveProjects(next);
      setProjects(next);
      setProjectId(project.id);
    });
    projectWrites.current = write;
    await write;
    if (!silent)
      notify(
        t("Project saved to your library.", "پروژه در تاریخچه ذخیره شد."),
      );
  }
  async function addStyle(style: SavedStyle) {
    await initialLoad.current;
    const current = await getStyles();
    const next = [style, ...current];
    await saveStyles(next);
    setStyles(next);
    notify(t("Your signature style is saved.", "سبک اختصاصی‌ات ذخیره شد."));
  }
  const nav = [
    { id: "home", label: t("Discover", "کشف کن") },
    { id: "studio", label: t("Studio", "استودیو") },
    { id: "styles", label: t("Style lab", "آزمایشگاه سبک") },
    { id: "library", label: t("Library", "تاریخچه") },
  ];
  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <div className="app-shell" dir={language === "fa" ? "rtl" : "ltr"}>
        <AnimatePresence>{!dataReady && <motion.div key="boot" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}><LoadingScreen full /></motion.div>}</AnimatePresence>
        <header className="site-header">
          <button
            className="brand"
            aria-label="PIMX MOJI home"
            onClick={() => navigate("home")}
          >
            <span className="brand-icon">
              <BrandMark />
            </span>
            <span>
              PIMX<span className="brand-light">MOJI</span>
              <sup>®</sup>
            </span>
          </button>
          <nav
            className="desktop-nav"
            aria-label={t("Main navigation", "ناوبری اصلی")}
          >
            {nav.map((item) => (
              <a
                href={pageUrl(item.id as Page, language)}
                key={item.id}
                className={page === item.id ? "active" : ""}
                onClick={(event) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); navigate(item.id as Page); } }}
              >
                {page === item.id && (
                  <motion.span className="nav-active" layoutId="nav-pill" />
                )}
                <span>{item.label}</span>
                {item.id === "studio" && <i />}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className={`library-link ${page === "library" ? "selected" : ""}`}
              onClick={() => navigate("library")}
            >
              <FolderOpen size={16} />
              <span>{t("My library", "تاریخچه")}</span>
            </button>
            <span className="header-divider" />
            <button
              className="icon-button language-button"
              aria-label="Switch language / تغییر زبان"
              onClick={toggleLanguage}
            >
              <Globe2 size={17} />
              <small>{language === "en" ? "FA" : "EN"}</small>
            </button>
            <button
              className="icon-button theme-button"
              aria-label={t("Switch theme", "تغییر پوسته")}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="button primary header-create"
              onClick={() => uploadRef.current?.click()}
            >
              {t("Create art", "خلق اثر")}
              <Plus size={16} />
            </button>
            <button
              className="icon-button mobile-toggle"
              aria-label={t("Open menu", "بازکردن منو")}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>
        <AnimatePresence>
          {mobileMenu && (
            <motion.nav
              className="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {[...nav].map((n) => (
                <button key={n.id} onClick={() => navigate(n.id as Page)}>
                  {n.label}
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
        <input
          ref={uploadRef}
          type="file"
          className="sr-only"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          aria-label={t("Upload an image", "بارگذاری تصویر")}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={page}
            className={`page page-${page}`}
            initial={{
              opacity: 0,
              y: reduced ? 0 : 16,
            }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduced ? 0 : -10,
            }}
            transition={{
              duration: reduced ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Suspense
              fallback={<LoadingScreen />}
            >
              {page === "home" && (
                <Home
                  t={t}
                  navigate={navigate}
                  upload={() => uploadRef.current?.click()}
                  applyStyle={applyStyle}
                />
              )}
              {page === "studio" && (
                <Suspense
                  fallback={<LoadingScreen />}
                >
                  <Studio
                    t={t}
                    language={language}
                    source={source}
                    loadingSource={loadingSource}
                    generated={(project, art, saved) => {
                      setGeneratedResult({ project, art, saved });
                      try { if (saved) sessionStorage.setItem("pimx-result", project.id); else sessionStorage.removeItem("pimx-result"); } catch { /* Downloads remain available without session storage. */ }
                      navigate("result");
                    }}
                    setSource={(next) => {
                      if (next !== source) setProjectId(undefined);
                      setSource(next);
                    }}
                    name={projectName}
                    setName={setProjectName}
                    projectId={projectId}
                    effect={effect}
                    setEffect={setEffect}
                    timeline={timeline}
                    upload={() => uploadRef.current?.click()}
                    notify={notify}
                    saveProject={saveProject}
                    saveStyle={addStyle}
                    savedStyles={styles}
                    projects={projects}
                    openProject={(p) => {
                      setSource(p.source);
                      setProjectName(p.name);
                      setProjectId(p.id);
                      setEffect(p.effect);
                      timeline.reset(validateOptions(p.options));
                    }}
                    navigate={navigate}
                  />
                </Suspense>
              )}
              {page === "styles" && (
                <StylesPage
                  t={t}
                  custom={styles}
                  apply={applyStyle}
                  notify={notify}
                  addStyle={addStyle}
                  remove={async (id) => {
                    const next = styles.filter((s) => s.id !== id);
                    await saveStyles(next);
                    setStyles(next);
                  }}
                />
              )}
              {page === "result" && <ResultPage result={generatedResult} ready={dataReady} t={t} onEffectChange={(next) => {
                if (!generatedResult) return;
                const project = { ...generatedResult.project, effect: next, updated: Date.now() };
                setEffect(next); setGeneratedResult({ ...generatedResult, project });
                if (generatedResult.saved !== false) void saveProject(project, true).catch(() => notify(t("Motion could not be saved. Downloads still work.", "حرکت ذخیره نشد؛ دانلود همچنان کار می‌کند."), true));
              }} back={() => navigate("studio")} library={() => navigate("library")} notify={notify} />}
              {page === "library" && (
                <LibraryPage
                  t={t}
                  projects={projects}
                  ready={dataReady}
                  create={() => {
                    setProjectId(undefined);
                    setProjectName("Untitled experiment");
                    timeline.reset(structuredClone(DEFAULTS));
                    setSource("/samples/portrait.jpg");
                    setEffect("still");
                    navigate("studio");
                  }}
                  open={(p) => {
                    setSource(p.source);
                    setProjectName(p.name);
                    setProjectId(p.id);
                    setEffect(p.effect);
                    timeline.reset(validateOptions(p.options));
                    navigate("studio");
                  }}
                  remove={async (id) => {
                    const next = projects.filter((p) => p.id !== id);
                    await saveProjects(next);
                    setProjects(next);
                    if (id === projectId) setProjectId(undefined);
                    notify(t("Project deleted.", "پروژه حذف شد."));
                  }}
                  notify={notify}
                  importProject={saveProject}
                  refresh={async () => {
                    const [p, s] = await Promise.all([
                      readProjects(),
                      getStyles(),
                    ]);
                    setProjects(p);
                    setStyles(s);
                  }}
                />
              )}
            </Suspense>
          </motion.main>
        </AnimatePresence>
        {page !== "studio" && page !== "result" && (
          <Footer t={t} navigate={navigate} shortcuts={() => setShortcuts(true)} />
        )}
        <Toasts
          items={toasts}
          dismiss={(id) =>
            setToasts((items) => items.filter((x) => x.id !== id))
          }
        />
        <AnimatePresence>
          {shortcuts && (
            <Modal
              title={t("A faster creative flow", "سریع‌تر خلق کن")}
              close={() => setShortcuts(false)}
            >
              <div className="shortcut-list">
                {[
                  ["⌘ / Ctrl + O", t("Open an image", "بازکردن تصویر")],
                  ["⌘ / Ctrl + Z", t("Undo", "بازگشت")],
                  ["⌘ / Ctrl + Shift + Z", t("Redo", "انجام دوباره")],
                  ["⌘ / Ctrl + S", t("Save project", "ذخیره پروژه")],
                  ["?", t("Keyboard shortcuts", "میانبرهای صفحه‌کلید")],
                  ["Esc", t("Close dialog", "بستن پنجره")],
                ].map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <kbd dir="ltr">{key}</kbd>
                  </div>
                ))}
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
export default function App() {
  return (
    <SettingsProvider>
      <StudioApp />
    </SettingsProvider>
  );
}
