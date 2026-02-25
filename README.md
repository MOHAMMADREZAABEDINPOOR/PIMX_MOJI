# PIMX_MOJI 🎨

[![Persian Description](https://img.shields.io/badge/Read-Persian%20Description-0A66C2?style=for-the-badge)](#persian-description)

Modern bilingual (EN/FA) image-to-art generator with **152 styles** for ASCII, Mosaic, and Emoji outputs.

## Live Website

- https://pimxmoji.pages.dev/

## Features

- 152 ready styles/presets
- Image to ASCII/Mosaic/Emoji conversion
- Persian + English UI
- Theme-aware interface (dark/light)
- Admin analytics panel at `/pimxmojiadmin`
- 10-minute visit bucketing (multiple refreshes in the same bucket count as 1 visit)

## Run Locally

1. Install dependencies  
   `npm install`
2. Start dev server  
   `npm run dev`
3. Open  
   `http://localhost:3000`

## Cloudflare Pages Deploy (Important)

Use these exact settings to avoid raw-source/MIME issues:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `20` recommended

`wrangler.toml` already contains:

- `pages_build_output_dir = "dist"`
- build command `npm run build`

## Cloudflare D1 Analytics Setup

This project includes server-side analytics API for global stats across users/devices.

Files:

- `functions/api/analytics.js`
- `cloudflare/d1-schema.sql`

Steps:

1. Create a D1 database in Cloudflare.
2. Run schema from `cloudflare/d1-schema.sql`.
3. In Pages project settings, add D1 binding:
   - Variable: `DB`
   - Target: your D1 database
4. Deploy/redeploy the project.

Without D1 binding, frontend falls back to local browser storage for analytics.

## Persian Description

[![Back to English](https://img.shields.io/badge/US-Back%20to%20English-002654?style=for-the-badge)](#pimx_moji-)

## PIMX_MOJI 🎨

یک ابزار دو زبانه (فارسی/انگلیسی) برای تبدیل تصویر به خروجی‌های هنری متنی و ایموجی با **۱۵۲ سبک آماده**.

### لینک سایت

- https://pimxmoji.pages.dev/

### امکانات

- ۱۵۲ سبک آماده
- تبدیل تصویر به ASCII / Mosaic / Emoji
- رابط فارسی و انگلیسی
- سازگار با تم روشن/تاریک
- پنل ادمین در مسیر `/pimxmojiadmin`
- شمارش بازدید با باکت ۱۰ دقیقه‌ای (رفرش‌های متعدد در همان ۱۰ دقیقه = ۱ بازدید)

### راه‌اندازی در Cloudflare Pages

برای جلوگیری از بالا آمدن خام سایت، این تنظیمات را دقیق بگذارید:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

### راه‌اندازی آنالیتیکس D1

فایل‌های مربوط:

- `functions/api/analytics.js`
- `cloudflare/d1-schema.sql`

مراحل:

1. ساخت دیتابیس D1
2. اجرای اسکیما
3. اتصال Binding با نام `DB` در Pages
4. دیپلوی مجدد
