import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Upload,
  Play,
  Pause,
  ShieldCheck,
  Layers3,
  MoveUpRight,
  Camera,
  Video,
  Scan,
  SlidersHorizontal,
  Asterisk,
  Binary,
} from "lucide-react";
import { PRESETS } from "../constants/presets";
import { ArtPreview, type Translate } from "./ui";
import { HomeSections } from "./HomeSections";
import { LiveText } from "./LiveText";
import type { Page, StudioOptions } from "./types";

const heroStyles: Record<string, Partial<StudioOptions>> = {
  ascii: {
    mode: "ascii",
    chars: " .·:+=*%@",
    textColor: "#a8baff",
    bgColor: "#080b18",
    contrast: 170,
    threshold: 8,
  },
  mosaic: {
    mode: "mosaic",
    chars: "MAKE SOMETHING YOU",
    textColor: "#c3b2ff",
    bgColor: "#0c091a",
    contrast: 155,
    resolution: 65,
  },
  emoji: {
    mode: "emoji",
    chars: "🌑🌒🌓🌔🌕💙💜🤍",
    bgColor: "#080b18",
    colorize: true,
    resolution: 55,
  },
};

export function Home({
  t,
  navigate,
  upload,
  applyStyle,
}: {
  t: Translate;
  navigate: (page: Page) => void;
  upload: () => void;
  applyStyle: (options: Partial<StudioOptions>) => void;
}) {
  const [mode, setMode] = useState("ascii");
  const [moving, setMoving] = useState(true);
  const [original, setOriginal] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      element.classList.toggle("scene-visible", entry.isIntersecting);
    });
    observer.observe(element);
    const visibility = () =>
      element.classList.toggle("motion-paused-hidden", document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const featured = ["craft-risograph-1", "cyberpunk", "moon", "blueprint"]
    .map((id) => PRESETS.find((p) => p.id === id)!)
    .filter(Boolean);
  return (
    <div className="home-world">
      <section className="dimension-hero content-width">
        <div className="dimension-copy">
          <h1>
            <LiveText text={t("Pixels.", "پیکسل‌ها.")} />
            <br />
            <LiveText text={t("Reimagined.", "از نو بساز.")} />
          </h1>
          <p>
            {t(
              "Your photo, rebuilt in characters, words or emoji. Pick a look. Change the details. Make something that feels like you.",
              "عکست رو با حروف، کلمات یا ایموجی از نو بساز. یه سبک انتخاب کن، جزئیاتش رو تغییر بده و چیزی بساز که شبیه خودته.",
            )}
          </p>
          <div className="dimension-actions">
            <button className="button primary large" onClick={upload}>
              <Upload size={18} />
              {t("Start with your photo", "با عکس خودت شروع کن")}
              <ArrowUpRight size={19} />
            </button>
            <button className="button ghost" onClick={() => navigate("studio")}>
              {t("Try the playground", "اول امتحانش کن")}
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="privacy-note">
            <ShieldCheck size={16} />
            <span>
              {t(
                "Your photo stays on your device.",
                "عکست روی دستگاه خودت می‌مونه.",
              )}
            </span>
          </div>
          <div
            className="hero-engine-picker"
            aria-label={t("Preview style", "سبک پیش‌نمایش")}
          >
            {[
              ["ascii", "Aa", "ASCII"],
              ["mosaic", "Ww", t("Words", "کلمات")],
              ["emoji", "◉", t("Emoji", "ایموجی")],
            ].map(([id, symbol, label]) => (
              <button
                key={id}
                aria-pressed={mode === id}
                onClick={() => {
                  setMode(id);
                  setOriginal(false);
                }}
                className={mode === id ? "selected" : ""}
              >
                <b>{symbol}</b>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div
          ref={scene}
          className={`dimension-scene scene-visible ${moving ? "" : "motion-paused"}`}
        >
          <div className="scene-orbit dimension-orbit-a" aria-hidden="true" />
          <div className="scene-orbit dimension-orbit-b" aria-hidden="true" />
          <div className="scene-axis" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div
            className="depth-stack"
            onPointerMove={(e) => {
              if (
                e.pointerType !== "mouse" ||
                matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--tilt-y",
                `${((e.clientX - rect.left) / rect.width - 0.5) * 9}deg`,
              );
              e.currentTarget.style.setProperty(
                "--tilt-x",
                `${((e.clientY - rect.top) / rect.height - 0.5) * -7}deg`,
              );
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.setProperty("--tilt-y", "0deg");
              e.currentTarget.style.setProperty("--tilt-x", "0deg");
            }}
          >
            <div className="depth-sheet sheet-back" aria-hidden="true" />
            <div className="depth-sheet sheet-mid" aria-hidden="true" />
            <div className="dimension-art" data-ui>
              <div className="art-filebar">
                <span>
                  <Scan size={14} />
                  portrait.jpg
                </span>
                <span>
                  {original
                    ? "Original"
                    : mode === "mosaic"
                      ? "Word mosaic"
                      : mode.toUpperCase()}
                </span>
              </div>
              <div className="dimension-portrait">
                <ArtPreview options={heroStyles[mode]} />
                <img
                  src="/samples/portrait.jpg"
                  className={original ? "show-original" : ""}
                  alt={t(
                    "Original portrait for comparison",
                    "پرتره اصلی برای مقایسه",
                  )}
                  width={800}
                  height={800}
                />
                <div className="portrait-scan" aria-hidden="true" />
              </div>
              <div className="art-filebar art-filebar-bottom">
                <span>{t("Made of characters", "ساخته‌شده از کاراکترها")}</span>
                <button
                  aria-pressed={original}
                  onClick={() => setOriginal(!original)}
                >
                  {original
                    ? t("Show artwork", "نمایش اثر")
                    : t("See original", "دیدن عکس اصلی")}
                  <Layers3 size={14} />
                </button>
              </div>
            </div>
            <div className="floating-pixel pixel-one" aria-hidden="true">
              @
            </div>
            <div className="floating-pixel pixel-two" aria-hidden="true">
              <Asterisk size={40} />
            </div>
            <div className="floating-pixel pixel-three" aria-hidden="true">
              <Binary size={26} />
            </div>
          </div>
          <button
            className="scene-motion icon-button"
            aria-label={
              moving
                ? t("Pause scene animation", "توقف حرکت صحنه")
                : t("Play scene animation", "پخش حرکت صحنه")
            }
            aria-pressed={!moving}
            onClick={() => setMoving(!moving)}
          >
            {moving ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="scene-caption">
            <span className="status-dot" />
            {t("A different way to see yourself", "یه جور دیگه خودت رو ببین")}
          </div>
        </div>
      </section>
      <div className="format-ribbon content-width">
        <span>
          {t(
            "One image. Three ways to make it yours.",
            "یک عکس. سه راه برای ساختن.",
          )}
        </span>
        <div>
          <span>ASCII</span>
          <i />
          <span>Word mosaic</span>
          <i />
          <span>Emoji art</span>
        </div>
        <span>PNG / GIF / VIDEO / TXT</span>
      </div>
      <section className="signal-showcase content-width">
        <div className="signal-heading">
          <h2>{t("Find your signal.", "سبکت رو پیدا کن.")}</h2>
          <div>
            <p>
              {t(
                "300 looks to start from. Every one is yours to change.",
                "۳۰۰ سبک برای شروع؛ هر کدوم رو می‌تونی به سلیقه خودت تغییر بدی.",
              )}
            </p>
            <button className="text-button" onClick={() => navigate("styles")}>
              {t("Browse 300 styles", "دیدن ۳۰۰ سبک")}
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        <div className="signal-board">
          {featured.map((preset, index) => (
            <button
              className={`signal-work work-${index}`}
              key={preset.id}
              onClick={() => applyStyle(preset.options)}
            >
              <div className="signal-image" data-ui>
                <ArtPreview
                  source="/samples/portrait.jpg"
                  options={preset.options}
                />
                <span className="signal-open">
                  <MoveUpRight size={22} />
                </span>
              </div>
              <div className="signal-info">
                <h3>{preset.name}</h3>
                <span>
                  {preset.options.mode === "mosaic"
                    ? "Word mosaic"
                    : preset.options.mode?.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="workspace-intro content-width">
        <div className="workspace-copy">
          <SlidersHorizontal size={28} />
          <h2>{t("Less searching. More making.", "همه‌چیز، کنار دستت.")}</h2>
          <p>
            {t(
              "Choose a look and preview it on your photo. Adjust only what you need, then hit Generate. Your finished image gets a page of its own.",
              "استایلت رو روی عکس خودت امتحان کن. هر جزئیاتی که خواستی تغییر بده و جنریت رو بزن؛ اثر نهایی در صفحهٔ خودش باز می‌شه.",
            )}
          </p>
          <button
            className="button secondary"
            onClick={() => navigate("studio")}
          >
            {t("Open the studio", "بازکردن استودیو")}
            <ArrowUpRight size={18} />
          </button>
          <div className="workspace-capabilities">
            <span>
              <Camera size={16} />
              {t("Live camera", "دوربین زنده")}
            </span>
            <span>
              <Video size={16} />
              {t("Video", "ویدئو")}
            </span>
            <span>
              <Layers3 size={16} />
              {t("Batch export", "خروجی گروهی")}
            </span>
          </div>
        </div>
        <div className="workspace-demo" data-ui>
          <div className="demo-preview">
            <ArtPreview
              source="/samples/portrait.jpg"
              options={{
                chars: "01 ",
                textColor: "#ac99f6",
                bgColor: "#0d0c16",
                contrast: 170,
              }}
            />
          </div>
          <div className="demo-controls">
            <div>
              <span>{t("Your look", "سبک تو")}</span>
              <span>ASCII</span>
            </div>
            <label>
              {t("Detail", "جزئیات")}
              <span>110</span>
            </label>
            <div className="demo-track">
              <i />
            </div>
            <label>
              {t("Contrast", "کنتراست")}
              <span>145%</span>
            </label>
            <div className="demo-track second">
              <i />
            </div>
            <div className="demo-palette">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <button
              className="button primary"
              onClick={() => navigate("studio")}
            >
              {t("Make your own", "حالا نوبت توئه")}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <HomeSections t={t} navigate={navigate} upload={upload} />
      <section className="dimension-closing content-width">
        <h2>{t("Got a photo in mind?", "یه عکس تو ذهنت هست؟")}</h2>
        <button className="button primary large" onClick={upload}>
          {t("Let's see what it becomes", "ببینیم چی ازش درمیاد")}
          <Upload size={19} />
        </button>
        <p>
          {t(
            "Start with a photo. The rest is up to you.",
            "از یه عکس شروع کن. بقیه‌ش با خودته.",
          )}
        </p>
      </section>
    </div>
  );
}
