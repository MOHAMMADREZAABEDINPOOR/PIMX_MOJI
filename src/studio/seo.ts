import type { Page } from "./types";
export const SITE = "https://pimxmoji.pages.dev";
export const pageUrl = (page: Page, _language?: string) => page === "home" ? "/" : `/${page}`;
export const metadata = {
  en: {
    home: ["Photo to ASCII & Emoji Art Generator | PIMX MOJI", "Turn photos into ASCII art, word mosaics and emoji portraits with 300 styles. Create and export in your browser. Your photos stay on your device."],
    studio: ["Image to ASCII, Text & Emoji Art Studio | PIMX MOJI", "Upload a photo, preview 300 styles on your image, adjust characters and colors, and download your ASCII, word or emoji artwork."],
    styles: ["300 ASCII, Emoji & Word Art Styles | PIMX MOJI", "Explore 300 photo art presets, from Matrix Rain and Cyberpunk to ink contours and emoji mosaics. Preview a style and make it yours."],
    library: ["Your Private Art Library | PIMX MOJI", "Your locally saved artworks, custom styles and portable backups."],
    result: ["Your Artwork | PIMX MOJI", "Preview and download the artwork you created on your device."],
  },
  fa: {
    home: ["تبدیل عکس به هنر اسکی و ایموجی | PIMX MOJI", "عکس را با ۳۰۰ استایل به نقاشی با حروف، موزاییک کلمات و ایموجی تبدیل کن. ساخت و دانلود در مرورگر؛ عکس‌ها روی دستگاه خودت می‌مانند."],
    studio: ["استودیوی تبدیل عکس به متن و ایموجی | PIMX MOJI", "عکست را بارگذاری کن، ۳۰۰ استایل را روی آن ببین، حروف و رنگ‌ها را تنظیم کن و اثر خودت را دانلود کن."],
    styles: ["۳۰۰ استایل هنر اسکی، کلمات و ایموجی | PIMX MOJI", "از ماتریکس و سایبرپانک تا طراحی با جوهر و موزاییک ایموجی؛ استایل‌های تبدیل عکس به هنر را ببین و امتحان کن."],
    library: ["تاریخچه خصوصی آثار تو | PIMX MOJI", "آثار، استایل‌های شخصی و نسخه‌های پشتیبان ذخیره‌شده در دستگاه خودت."],
    result: ["اثر هنری تو | PIMX MOJI", "پیش‌نمایش و دانلود اثری که روی دستگاه خودت ساخته‌ای."],
  },
};
export function updateMetadata(page: Page, language: "en" | "fa", theme: string) {
  const [title, description] = metadata[language][page];
  document.title = title;
  const set = (selector: string, value: string) => document.querySelector(selector)?.setAttribute("content", value);
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[name="twitter:title"]', title);
  set('meta[name="twitter:description"]', description);
  set('meta[property="og:locale"]', language === "fa" ? "fa_IR" : "en_US");
  set('meta[property="og:url"]', SITE + pageUrl(page, language));
  set('meta[name="theme-color"]', theme === "dark" ? "#08090e" : "#f2f4fb");
  const robots = page === "library" || page === "result" ? "noindex, follow" : "index, follow, max-image-preview:large";
  set('meta[name="robots"]', robots);
  set('meta[name="googlebot"]', robots);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", SITE + pageUrl(page, language));
  document.querySelectorAll('link[hreflang]').forEach(link => link.remove());
}
