# PIMX_MOJI 🎨✨

[![Persian Description](https://img.shields.io/badge/Read-Persian%20Description-0A66C2?style=for-the-badge)](#persian-description)
[![Website](https://img.shields.io/badge/Live-pimxmoji.pages.dev-0ea5e9?style=for-the-badge)](https://pimxmoji.pages.dev/)

**PIMX_MOJI** is a modern bilingual (EN/FA) image-to-art web app that transforms normal images into creative outputs like ASCII, Mosaic, and Emoji art.  
It currently includes **152 ready-to-use styles** and a complete setup/admin flow built for both creators and advanced users. 🚀

## 🌐 Live Website

- **Production URL:** https://pimxmoji.pages.dev/

## 🧩 What This Project Does

- Converts image pixels into artistic character-based outputs.
- Supports three core art modes:
  - **Mosaic Mode** 🧱
  - **ASCII Mode** 🔤
  - **Emoji Mode** 😀
- Provides **152 visual presets/styles** for fast, one-click styling.
- Supports full **Persian/English** language switching.
- Supports **Dark/Light** theme switching.
- Keeps generated image history in the user browser for privacy-first UX.

## ✨ Core Features

- 🎨 152 curated styles/presets
- 🖼️ Image upload + realtime render flow
- ⚙️ Advanced controls (resolution, spacing, brightness, contrast, saturation, typography, colorization)
- 🌍 Bilingual UI (FA/EN)
- 🌗 Dynamic dark/light UI
- 📥 Export outputs as image and text
- 🧠 Style hover previews and quick apply
- 📊 Admin analytics panel at `/pimxmojiadmin`

## 🔐 Data & Privacy Model

This project intentionally separates data types:

- **Stored in database (Cloudflare D1):**
  - Visit events (with 10-minute bucketing)
  - Device category (Android, iPhone, iPad, macOS, Linux, Windows, Other)
  - Style/mode usage analytics
- **Stored only in browser local storage:**
  - User-generated image history
  - User setup preferences/options

This ensures analytics are global while user-created history remains local/private. ✅

## 📈 Analytics Logic

- A visit is counted at most **once per 10-minute bucket per user/client**.
- Multiple refreshes within the same 10-minute bucket are still counted as **1 visit**.
- Style usage is tracked whenever a generation is completed.
- Admin panel can filter by time range and show:
  - Total visits
  - Total images generated
  - Mode usage
  - Full style usage breakdown
  - Device share
  - Visit and generation trends

## 🖥️ Admin Access

- Route: `/pimxmojiadmin`
- Username: `PIMX_MOJI`
- Password: `123456789PIMX_MOJI@#$%^&`

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion (animations)
- Cloudflare Pages Functions
- Cloudflare D1

## 🚀 Local Development

1. Install dependencies:
   `npm install`
2. Run dev server:
   `npm run dev`
3. Open:
   `http://localhost:3000`

## ☁️ Cloudflare Pages Deployment (Important)

To avoid raw-source/MIME deployment errors, use these exact settings in Pages:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `20` recommended

`wrangler.toml` for Pages should only include compatible keys such as:

- `pages_build_output_dir = "dist"`

Do **not** add unsupported `build` blocks in `wrangler.toml` for Pages.

## 🗄️ Cloudflare D1 Setup

Server-side analytics files:

- `functions/api/analytics.js`
- `cloudflare/d1-schema.sql`

Steps:

1. Create a D1 database in Cloudflare.
2. Apply schema:
   - Run SQL from `cloudflare/d1-schema.sql`
3. In Cloudflare Pages project, add D1 binding:
   - Variable: `DB`
   - Target: your D1 database
4. Redeploy project.

Without D1 binding, analytics requests cannot be persisted globally.

## 📁 Key Project Paths

- `src/App.tsx` main app flow
- `src/constants/presets.ts` all 152 style definitions
- `src/components/History.tsx` local browser history UI
- `src/services/analytics.ts` analytics client events
- `src/admin/PimxMojiAdmin.tsx` admin dashboard page
- `functions/api/analytics.js` server-side analytics endpoint
- `cloudflare/d1-schema.sql` D1 schema

## Persian Description

[![Back to English](https://img.shields.io/badge/US-Back%20to%20English-002654?style=for-the-badge)](#pimx_moji-)

## PIMX_MOJI 🎨✨

**PIMX_MOJI** یک ابزار مدرن دو زبانه (فارسی/انگلیسی) برای تبدیل تصویر به خروجی‌های هنری است و در حال حاضر **۱۵۲ سبک آماده** دارد.  
این پروژه برای سرعت، کیفیت خروجی، و تجربه کاربری حرفه‌ای طراحی شده است. 🚀

### 🌐 لینک سایت

- **آدرس اصلی:** https://pimxmoji.pages.dev/

### ✨ قابلیت‌های اصلی

- 🎨 دارای ۱۵۲ سبک آماده
- 🖼️ تبدیل عکس به سه حالت:
  - موزاییکی
  - ASCII
  - ایموجی
- ⚙️ تنظیمات پیشرفته خروجی (رزولوشن، فاصله کاراکتر، روشنایی، کنتراست، اشباع رنگ، تایپوگرافی و ...)
- 🌍 رابط کاربری کامل فارسی/انگلیسی
- 🌗 پشتیبانی از تم روشن/تاریک
- 📥 خروجی تصویر و متن
- 📊 پنل ادمین برای تحلیل بازدید و استفاده از سبک‌ها

### 🔐 مدل ذخیره‌سازی داده

این پروژه عمداً داده‌ها را جدا کرده است:

- **در دیتابیس Cloudflare D1 ذخیره می‌شود:**
  - بازدید کاربران (با باکت ۱۰ دقیقه‌ای)
  - نوع دستگاه کاربر
  - سبک/مود استفاده‌شده
- **فقط در مرورگر کاربر ذخیره می‌شود:**
  - تاریخچه عکس‌های ساخته‌شده
  - تنظیمات شخصی کاربر

یعنی آنالیتیکس سراسری است ولی تاریخچه تصاویر کاملاً محلی باقی می‌ماند. ✅

### 📈 منطق آنالیتیکس

- هر کاربر در هر ۱۰ دقیقه، حداکثر ۱ بازدید ثبت می‌کند.
- رفرش‌های متعدد در همان بازه ۱۰ دقیقه‌ای بازدید اضافی حساب نمی‌شود.
- با هر تولید موفق تصویر، سبک و مود ثبت می‌شود.

### 🖥️ اطلاعات ورود ادمین

- مسیر: `/pimxmojiadmin`
- نام کاربری: `PIMX_MOJI`
- رمز عبور: `123456789PIMX_MOJI@#$%^&`

### ☁️ دیپلوی صحیح روی Cloudflare Pages

برای جلوگیری از خطای MIME یا لود خام سورس:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

در `wrangler.toml` فقط تنظیمات سازگار با Pages را نگه دارید (مثل `pages_build_output_dir`).

### 🗄️ راه‌اندازی دیتابیس D1

فایل‌های مربوط:

- `functions/api/analytics.js`
- `cloudflare/d1-schema.sql`

مراحل:

1. ساخت دیتابیس D1
2. اجرای اسکیما
3. اتصال Binding با نام `DB` در Pages
4. دیپلوی مجدد
