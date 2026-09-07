<div align="center">

<!-- ============================================================================== -->
<!-- DYNAMIC ANIMATED CAPSULE HEADER                                                -->
<!-- ============================================================================== -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,12,24,30&height=220&section=header&text=PIMX_MOJI&fontSize=42&fontAlignY=35&desc=%E2%9A%A1%20152%20Generative%20Styles%2C%20ASCII%20Studio%20%26%20Emoji%20Mosaics&descFontSize=16&descAlignY=62" alt="PIMX_MOJI Banner" width="100%" />

<!-- ============================================================================== -->
<!-- ANIMATED TYPING SVG TELEMETRY                                                 -->
<!-- ============================================================================== -->
<a href="https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=2800&pause=1000&color=00D2FF&center=true&vCenter=true&width=780&lines=High-Performance+Image-to-Art+Studio+with+152+Generative+Presets;High-Resolution+ASCII+Art+Generator+with+Custom+Ramps+%26+ANSI+Colors;Unicode+Emoji+Mosaic+Synthesizer+with+Euclidean+Color+Matching;Retro+8-Bit+Gaming+Palettes+(NES%2C+Game+Boy%2C+Commodore+64);Cyberpunk+Glitch+Art%2C+CRT+Phosphor+Scanlines+%26+Neon+Bloom;100%25+Client-Side+GPU+Rendering+via+HTML5+Canvas+2D+Context" alt="Typing SVG" />
</a>

<br/>

<!-- ============================================================================== -->
<!-- BADGES MATRIX                                                                  -->
<!-- ============================================================================== -->
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge&logo=gnu)](https://www.gnu.org/licenses/agpl-3.0)
[![React: 18+](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/Canvas-Hardware_Accelerated-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![Styles: 152](https://img.shields.io/badge/Styles-152_Creative_Presets-purple?style=for-the-badge)](https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI)
[![Read in Persian](https://img.shields.io/badge/مطالعه_به_فارسی-Persian_README-008080?style=for-the-badge)](#-بخش-فوقالعاده-مفصل-و-جامع-به-زبان-فارسی-persian-documentation)

<p align="center">
  <b>PIMX_MOJI</b> is a creative image transformation workstation and algorithmic art studio. Powered by high-speed HTML5 Canvas pixel manipulation, PIMX_MOJI transforms ordinary photographs into 152 distinct stylistic renderings, including ASCII text art, emoji mosaics, retro 8-bit game palettes, Cyberpunk neon matrices, and watercolor washes — entirely client-side.
</p>

<!-- ============================================================================== -->
<!-- QUICK NAVIGATION ANCHORS                                                       -->
<!-- ============================================================================== -->
[Artistic Presets](#-artistic-presets--filter-matrix) •
[Directory Anatomy](#-exhaustive-directory--file-anatomy) •
[Pixel Engine](#-pixel-processing-engine--algorithms) •
[Quick Start](#-quick-start--local-development) •
[توضیحات فارسی](#-بخش-فوقالعاده-مفصل-و-جامع-به-زبان-فارسی-persian-documentation) •
[Roadmap](#-strategic-engineering-roadmap) •
[License](#-copyleft-license--legal-attribution)

</div>

---

## 🎨 Artistic Presets & Filter Matrix

PIMX_MOJI features **152 distinct algorithmic presets** across 6 creative domains:
1. **ASCII & Typography Matrix**: High-contrast character ramps, inverted luminance, colored ANSI exports.
2. **Emoji Mosaic Synthesizer**: Converts pixel clusters into mathematically matched Unicode emojis.
3. **Retro 8-Bit Gaming**: Snaps colors to authentic retro palettes (NES, Sega Genesis, Game Boy green-scale).
4. **Cyberpunk & Glitch**: Color channel splitting, CRT scanline phosphor emulation, and neon bloom.
5. **Traditional Fine Arts**: Oil painting impasto, pencil sketch hatching, and watercolor bleeding.
6. **Abstract Halftones**: CMYK printing rosette patterns and newspaper dithering dots.

---

## 📂 Exhaustive Directory & File Anatomy

```
d:/code/PIMXMOJI/
│
├── index.html                       # Responsive HTML5 canvas viewport & font loaders
├── package.json                     # React 18, TypeScript, Vite, Lucide React dependencies
├── generate_presets.js              # Node utility script generating algorithmic presets matrix
├── README.md                        # Master comprehensive bilingual documentation
│
├── src/                             # Core Application Source
│   ├── main.tsx                     # React 18 createRoot bootstrap
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

## 🚀 Quick Start & Local Development

```bash
git clone https://github.com/MOHAMMADREZAABEDINPOOR/PIMX_MOJI.git
cd PIMX_MOJI

npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🇮🇷 بخش فوق‌العاده مفصل و جامع به زبان فارسی (Persian Documentation)

### ۱. مقدمه و چرایی توسعه استودیوی دیجیتال PIMX_MOJI
پروژه **PIMX_MOJI** یک آزمایشگاه پیشرفته پردازش تصویر و تبدیل عکس به آثار هنری است که به صورت ۱۰۰٪ کلاینت‌ساید و بر بستر **HTML5 Canvas** و زبان‌های **React** و **TypeScript** توسعه یافته است. کاربر می‌تواند در چند صدم ثانیه، هر عکسی را به نقاشی‌های اسکی‌آرت (ASCII)، موزاییک‌های ایموجی، و استایل‌های رترو و سایبرپانک تبدیل کرده و با کیفیت اصلی دانلود کند.

---

### ۲. تشریح ساختار فایل‌های پروژه
- **`src/constants/presets.ts`**: تعریف دقیق ۱۵۲ استایل هنری متنوع و ماتریس‌های پالت رنگی.
- **`src/utils/imageProcessing.ts`**: توابع محاسباتی خواندن پیکسل‌ها، تبدیل به مقادیر روشنایی (Luminance) و الگوریتم‌های دیترینگ فلوید-اشتاینبرگ.
- **`src/components/PresetPreview.tsx`**: پنجره پیش‌نمایش بلادرنگ فیلترها.

---

## 📜 Copyleft License & Legal Attribution

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

---

<div align="center">

<!-- ============================================================================== -->
<!-- ANIMATED CAPSULE FOOTER                                                        -->
<!-- ============================================================================== -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,12,24,30&height=120&section=footer" alt="Footer" width="100%" />

<sub>Crafted with creativity by <a href="https://github.com/MOHAMMADREZAABEDINPOOR"><b>MOHAMMADREZA ABEDINPOOR</b></a>. If PIMX_MOJI inspires your artistic journey, leave a ⭐!</sub>

</div>
