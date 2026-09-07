<div align="center">

# 🎨 PIMX_MOJI 🖼️✨
### High-Performance Image-to-Art Studio with 152 Generative Styles & ASCII Converters

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![React: 18+](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/Canvas-Hardware_Accelerated-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![Styles: 152](https://img.shields.io/badge/Styles-152_Creative_Presets-purple?style=for-the-badge)](https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI)
[![Read in Persian](https://img.shields.io/badge/مطالعه_به_فارسی-Persian_README-008080?style=for-the-badge)](#-توضیحات-فوقالعاده-جامع-فارسی-persian-documentation)

<p align="center">
  A high-speed client-side creative image transformation suite. Converts ordinary images into 152 distinct stylistic renderings, including high-resolution ASCII art, emoji mosaics, retro halftone prints, Cyberpunk neon matrices, watercolor washes, and pixelated 8-bit sprites using accelerated HTML5 Canvas algorithms.
</p>

[Artistic Presets](#-artistic-presets--filter-categories) •
[Directory Structure](#-directory--file-structure) •
[Pixel Processing Engine](#-pixel-processing-engine) •
[Quick Start](#-quick-start) •
[توضیحات فارسی](#-توضیحات-فوقالعاده-جامع-فارسی-persian-documentation) •
[License](#-license)

</div>

---

## 🎨 Artistic Presets & Filter Categories

- 🔤 **ASCII & Typography Matrix**: Converts pixel luminance into proportional character densities with custom ASCII ramp controls and colored ANSI exports.
- 😀 **Emoji Mosaic Generator**: Quantizes image blocks into nearest-neighbor Euclidean color matches mapped to standard Unicode emojis.
- 👾 **Retro Gaming & 8-Bit Pixelation**: Downsamples resolutions and snaps colors to classic retro palettes (Game Boy, NES, Commodore 64).
- ⚡ **Cyberpunk & Glitch Art**: Color channel offsets, scanline overlays, CRT phosphor simulation, and high-intensity neon glows.
- 🖌️ **Classical Fine Arts**: Simulates pencil sketches, oil painting impasto, and watercolor diffusion.

---

## 📂 Directory & File Structure

```
PIMXMOJI/
│
├── index.html                       # HTML5 canvas viewport and responsive layout
├── package.json                     # React, TypeScript, Lucide React dependencies
├── generate_presets.js              # Script generating algorithmic presets matrix
├── README.md                        # Master comprehensive bilingual documentation
│
├── src/                             # Application Core
│   ├── main.tsx                     # React root DOM bootstrap
│   ├── App.tsx                      # Primary visual workspace and filter controls
│   ├── index.css                    # Tailwind utility directives and custom canvas styling
│   │
│   ├── constants/
│   │   └── presets.ts               # Exhaustive registry of all 152 generative style definitions
│   │
│   ├── components/
│   │   ├── Navbar.tsx               # Brand navigation bar with export action buttons
│   │   ├── PresetPreview.tsx        # Thumbnail grid showing live preview of styles
│   │   ├── CharacterPicker.tsx      # Character ramp selector for custom ASCII conversions
│   │   ├── History.tsx              # Session transformation history and rollback manager
│   │   └── ZoomModal.tsx            # Fullscreen inspection lightbox for rendered art
│   │
│   ├── contexts/
│   │   └── SettingsContext.tsx      # Global canvas resolution and render setting context
│   │
│   ├── admin/
│   │   └── PimxMojiAdmin.tsx        # Administrative analytics and telemetry visualizer
│   │
│   └── utils/
│       └── imageProcessing.ts       # Low-level Canvas pixel manipulation & dithering filters
│
├── cloudflare/
│   └── d1-schema.sql                # Cloudflare D1 database schema for anonymous art metrics
│
└── functions/                       # Cloudflare Pages Serverless Edge API
    └── api/
        └── analytics.js             # Anonymous telemetry logger
```

---

## 🔬 Pixel Processing Engine (`imageProcessing.ts`)

Conversions are performed entirely on the client GPU using the HTML5 Canvas 2D Rendering Context:

```typescript
// Luminance Calculation for ASCII Quantization
export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
```
No images or private personal photos are ever sent to remote servers.

---

## 🚀 Quick Start

```bash
git clone https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI.git
cd PIMX_MOJI

npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🇮🇷 توضیحات فوق‌العاده جامع فارسی (Persian Documentation)

### ۱. معرفی استودیوی هنر دیجیتال PIMX_MOJI
پروژه **PIMX_MOJI** یک استودیوی قدرتمند و بسیار سریع برای تبدیل عکس‌ها به آثار هنری دیجیتال، متن‌های اسکی (ASCII Art)، موزاییک‌های ایموجی و سبک‌های کلاسیک و سایبرپانک است. پردازش تمامی افکت‌ها مستقیماً روی مرورگر کاربر و با استفاده از توان کارت گرافیک انجام می‌شود و حریم خصوصی کاربر کاملاً حفظ می‌گردد.

---

### ۲. تشریح ساختار فایل‌ها و کدهای پروژه
- **`src/constants/presets.ts`**: تعریف دقیق ۱۵۲ استایل هنری متنوع شامل کدهای اسکی، آبرنگ، هنر پیکسلی و ایموجی.
- **`src/utils/imageProcessing.ts`**: موتور الگوریتمی برنامه برای خواندن پیکسل‌ها، محاسبه روشنایی (Luminance)، اعمال فیلترهای نوری و جایگزینی با کاراکترها.
- **`src/components/PresetPreview.tsx`**: پنل پیش‌نمایش زنده استایل‌ها برای انتخاب سریع افکت دلخواه.
- **`src/components/CharacterPicker.tsx`**: ابزار سفارشی‌سازی حروف و کاراکترهای مورد استفاده در خروجی اسکی‌آرت.

---

## 📜 License

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

---

<div align="center">
  <sub>Crafted by <a href="https://github.com/MOHAMMADREZAABEDINPOOR">MOHAMMADREZA ABEDINPOOR</a>. Leave a ⭐ if you love generative art!</sub>
</div>
