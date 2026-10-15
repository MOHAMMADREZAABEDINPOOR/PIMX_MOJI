import { AccordionItem } from "./AccordionItem";
import { useState } from "react";
import {
  Upload,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  HardDrive,
  ArrowUpRight,
  Camera,
  Video,
  Image,
  FileText,
  Play,
} from "lucide-react";
import { ArtPreview, type Translate } from "./ui";
import { DEFAULTS, type Effect, type Page } from "./types";
import { MOTIONS } from "./motions";

export function HomeSections({
  t,
  navigate,
  upload,
}: {
  t: Translate;
  navigate: (p: Page) => void;
  upload: () => void;
}) {
  const [split, setSplit] = useState(50);
  const [effect, setEffect] = useState<Effect>("rain");
  return (
    <>
      <section className="home-comparison content-width">
        <div className="section-story">
          <h2>
            {t("Same photo. A different language.", "همون عکس؛ با زبان حروف.")}
          </h2>
          <p>
            {t(
              "Drag across the portrait. The light, shadows and expression become thousands of characters. Your original photo stays untouched.",
              "دستگیره رو روی پرتره بکش. نور، سایه و حالت چهره با هزاران کاراکتر ساخته می‌شن؛ عکس اصلی دست‌نخورده می‌مونه.",
            )}
          </p>
          <button className="button secondary" onClick={upload}>
            <Upload size={17} />
            {t("Try your own photo", "با عکس خودت امتحان کن")}
          </button>
        </div>
        <div className="home-compare-art">
          <ArtPreview options={{ contrast: 170, textColor: "#c7caff" }} />
          <img
            src="/samples/portrait.jpg"
            alt={t("Original portrait", "پرتره اصلی")}
            width={800}
            height={800}
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          />
          <div className="home-compare-handle" style={{ left: `${split}%` }}>
            <span>↔</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(+e.target.value)}
            aria-label={t(
              "Compare original and character art",
              "مقایسه عکس اصلی با هنر متنی",
            )}
          />
          <span className="comparison-caption">
            {t("Original / Character art", "عکس اصلی / هنر متنی")}
          </span>
        </div>
      </section>
      <section className="home-workflow content-width">
        <h2>
          {t(
            "From your camera roll to your next post.",
            "از گالری گوشی تا اثر بعدی‌ات.",
          )}
        </h2>
        <ol>
          {[
            {
              icon: Upload,
              title: t("Choose a photo", "عکس رو انتخاب کن"),
              body: t(
                "Drop an image into the studio, upload from your device or take a frame with your camera.",
                "عکس رو انتخاب کن، روی بوم رها کن یا با دوربین یک فریم بگیر.",
              ),
            },
            {
              icon: SlidersHorizontal,
              title: t("Find the look", "استایلت رو پیدا کن"),
              body: t(
                "Browse all 300 names. Hover to try a style on your photo, then adjust color, density, light and characters.",
                "اسم هر ۳۰۰ استایل رو ببین. با هاور امتحانش کن و بعد رنگ، تراکم، نور و حروف رو تنظیم کن.",
              ),
            },
            {
              icon: Download,
              title: t("Keep what you make", "نتیجه رو نگه دار"),
              body: t(
                "Press Generate to open your finished artwork. Download PNG, GIF, video or text from its own page. Your editable project stays in your browser library.",
                "جنریت رو بزن تا صفحهٔ اثر نهایی باز بشه. همون‌جا عکس، متن، GIF یا ویدئو بگیر؛ نسخهٔ قابل‌ویرایش هم در تاریخچه مرورگرت می‌مونه.",
              ),
            },
          ].map((item) => (
            <li key={item.title}>
              <item.icon size={25} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="home-motion content-width">
        <div className="motion-demo">
          <ArtPreview
            options={{ ...DEFAULTS, contrast: 180, resolution: 90 }}
            animated={effect !== "still"}
            effect={effect}
          />
          <span>
            {t("Motion preview", "پیش‌نمایش حرکت")} / {effect}
          </span>
        </div>
        <div className="section-story">
          <h2>{t("Give your portrait a rhythm.", "به پرتره‌ات حرکت بده.")}</h2>
          <p>
            {t(
              "Choose a motion and see it here. Character rain lights up the image without moving its features. Keep a still version, or export an animated GIF or video from the studio.",
              "یک حرکت انتخاب کن و همین‌جا ببین. بارش حروف، نور رو روی تصویر حرکت می‌ده و اجزای چهره ثابت می‌مونن. در استودیو می‌تونی خروجی ثابت، GIF یا ویدئو بگیری.",
            )}
          </p>
          <div className="home-motion-controls">
            {MOTIONS.map(({ id, en, fa }) => (
              <button
                key={id}
                className={effect === id ? "selected" : ""}
                aria-pressed={effect === id}
                onClick={() => setEffect(id)}
              >
                {t(en, fa)}
              </button>
            ))}
          </div>
          <button className="text-button" onClick={() => navigate("studio")}>
            <Play size={17} />
            {t("Make a moving portrait", "ساخت پرتره متحرک")}
          </button>
        </div>
      </section>
      <section className="home-formats content-width">
        <div className="section-story">
          <h2>
            {t("Save it the way you need it.", "همون خروجی که لازم داری.")}
          </h2>
          <p>
            {t(
              "A profile image, a story, a moving loop or the actual text. Choose the format when your artwork is ready.",
              "عکس پروفایل، استوری، یک حرکت کوتاه یا خودِ متن؛ وقتی نتیجه آماده شد، قالبش رو انتخاب کن.",
            )}
          </p>
        </div>
        <div className="format-options">
          {[
            [
              Image,
              "PNG",
              t(
                "A still image, with avatar, story, wallpaper and poster sizes. Transparent backgrounds are supported.",
                "تصویر ثابت با اندازه آواتار، استوری، والپیپر و پوستر؛ با امکان پس‌زمینه شفاف.",
              ),
            ],
            [
              Play,
              "GIF",
              t(
                "A short animated loop you can share or keep.",
                "یک حرکت کوتاه و تکرارشونده برای ذخیره یا اشتراک‌گذاری.",
              ),
            ],
            [
              Video,
              "Video",
              t(
                "Animated artwork as a silent clip. Your browser chooses WebM or MP4 support.",
                "اثر متحرک به شکل کلیپ بی‌صدا؛ فرمت WebM یا MP4 به پشتیبانی مرورگرت بستگی داره.",
              ),
            ],
            [
              FileText,
              "TXT",
              t(
                "Copy or download the characters themselves.",
                "خود کاراکترها رو کپی کن یا به صورت متن دانلود کن.",
              ),
            ],
          ].map(([Icon, name, text]) => {
            const Glyph = Icon as typeof Image;
            return (
              <div key={name as string}>
                <Glyph size={23} />
                <h3>{name as string}</h3>
                <p>{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="home-private content-width">
        <div>
          <ShieldCheck size={30} />
          <h2>
            {t("Your photos live with you.", "عکس‌هات پیش خودت می‌مونن.")}
          </h2>
          <p>
            {t(
              "Processing happens in your browser. No account or server upload is needed. Photos, edits and personal styles stay in your local library.",
              "پردازش داخل مرورگر انجام می‌شه؛ حساب کاربری یا آپلود سروری لازم نیست. عکس‌ها، ویرایش‌ها و سبک‌های شخصی تو تاریخچه محلی می‌مونن.",
            )}
          </p>
        </div>
        <div>
          <HardDrive size={30} />
          <h3>
            {t("One file. Your whole library.", "یک فایل، کل تاریخچه‌ات.")}
          </h3>
          <p>
            {t(
              "Download a full backup before changing browsers or clearing website data. Restore that file on this website to bring your photos and settings back.",
              "قبل از عوض‌کردن مرورگر یا پاک‌کردن داده‌های سایت، پشتیبان کامل بگیر. با بازیابی همون فایل در سایت، عکس‌ها و تنظیماتت برمی‌گردن.",
            )}
          </p>
          <button
            className="button secondary"
            onClick={() => navigate("library")}
          >
            {t("Open library & backups", "تاریخچه و پشتیبان‌ها")}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </section>
      <section className="home-faq content-width">
        <h2>{t("Before you start.", "چند جواب، قبل از شروع.")}</h2>
        <div>
          {[
            [
              t("Where are my photos saved?", "عکس‌هام کجا ذخیره می‌شن؟"),
              t(
                "In this browser's local database. Each photo keeps its editable settings. Other browsers and devices have separate libraries until you import a backup.",
                "داخل پایگاه داده همین مرورگر. تنظیمات قابل‌ویرایش هر عکس هم نگه داشته می‌شه. مرورگر و دستگاه دیگه تاریخچه جدا دارن، مگر اینکه پشتیبان رو بازیابی کنی.",
              ),
            ],
            [
              t(
                "How do I move everything to another device?",
                "چطور همه‌چیز رو به دستگاه دیگه ببرم؟",
              ),
              t(
                "Go to Library, download a full backup, move the file to the other device, open this website and choose Restore backup. The file includes your photos, edits and custom styles.",
                "برو تاریخچه و پشتیبان کامل دانلود کن. فایل رو به دستگاه جدید ببر، همین سایت رو باز کن و «بازیابی پشتیبان» رو بزن. عکس‌ها، ویرایش‌ها و استایل‌های شخصی داخل همون فایل هستن.",
              ),
            ],
            [
              t(
                "Can I use my own words or Persian text?",
                "می‌تونم شعر یا متن فارسی خودم رو بذارم؟",
              ),
              t(
                "Yes. Choose Words in the studio, enter your name, poem or text, and adjust direction, font and spacing.",
                "بله؛ در استودیو حالت کلمات رو انتخاب کن، اسم، شعر یا متنت رو بنویس و زاویه، فونت و فاصله‌ها رو تنظیم کن.",
              ),
            ],
            [
              t(
                "Do I have to upload a photo to try it?",
                "برای امتحان‌کردن باید عکس بفرستم؟",
              ),
              t(
                "No. The studio and style collection include the same sample portrait. Upload your own photo whenever you want.",
                "نه؛ استودیو و مجموعه استایل‌ها با یک پرتره نمونه آماده‌ان. هر وقت خواستی عکس خودت رو از دستگاه انتخاب کن.",
              ),
            ],
            [
              t(
                "Will camera access start automatically?",
                "دوربین خودکار روشن می‌شه؟",
              ),
              t(
                "No. Open Live and enable the camera yourself. Camera access requires your permission and HTTPS or localhost.",
                "نه؛ باید بخش زنده رو باز کنی و خودت دوربین رو فعال کنی. دسترسی با اجازه تو و روی HTTPS یا localhost کار می‌کنه.",
              ),
            ],
            [
              t(
                "What happens if I clear browser data?",
                "اگر داده‌های مرورگر رو پاک کنم چی می‌شه؟",
              ),
              t(
                "Local projects may be removed. A backup downloaded outside the browser can restore them. Private browsing may clear projects when the private session ends.",
                "ممکنه پروژه‌های محلی پاک بشن. فایل پشتیبانی که قبلاً دانلود کردی می‌تونه برشون گردونه. در حالت ناشناس هم ممکنه با بسته‌شدن پنجره، اطلاعات پاک بشه.",
              ),
            ],
          ].map(([q, a]) => (
            <AccordionItem key={q} question={q} answer={a} />
          ))}
        </div>
      </section>
    </>
  );
}
