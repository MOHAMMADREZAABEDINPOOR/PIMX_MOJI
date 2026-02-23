

# PIMX_MOJI 🎨🤖

[![Persian Description](https://img.shields.io/badge/Read-Persian%20Description-0A66C2?style=for-the-badge)](#persian-description)

PIMX_MOJI is a modern bilingual (EN/FA) image-to-art bot/app that transforms ordinary images into creative visual outputs like ASCII art, Mosaic art, and Emoji art.  
Built for speed, style, and easy sharing across social media and messaging apps. ⚡

## ✨ Key Features

- 🖼️ Image to ASCII art conversion
- 🧩 Image to Mosaic-style conversion
- 😀 Image to Emoji-art generation
- 🌗 Bilingual interface (English / Persian)
- 🎛️ Adjustable generation settings for different styles
- 📋 Easy output copy for quick sharing

## 🤝 PIMX Ecosystem Bots

- **PIMX_MOJI 🎨**  
  AI-powered creative conversion bot for turning normal images into artistic text/emoji outputs.

- **PIMX_PASS_DNS 🚀**  
  Modern bilingual DNS scanner with smart testing, admin analytics dashboard, and Cloudflare D1 backend.

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies  
   `npm install`
2. Create `.env.local` and set your API key  
   `GEMINI_API_KEY=your_api_key_here`
3. Start development server  
   `npm run dev`
4. Open app on  
   `http://localhost:3000`

## 🛠️ Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Google GenAI SDK

## ☁️ Cloudflare Pages Deploy

Use these exact settings to avoid blank white page / MIME errors:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `18+` (recommended `20`)

If Cloudflare serves `main.tsx` directly, deployment is using source files instead of built files.

## Persian Description

[![Back to English](https://img.shields.io/badge/US-Back%20to%20English-002654?style=for-the-badge)](#pimx_moji-)

# PIMX_MOJI 🎨🤖

**PIMX_MOJI** یک بات/اپلیکیشن مدرن و دو‌زبانه (فارسی/انگلیسی) است که تصاویر معمولی را به خروجی‌های هنری مثل ASCII، موزاییکی و ایموجی تبدیل می‌کند.  
این پروژه برای سرعت بالا، ظاهر حرفه‌ای و اشتراک‌گذاری سریع خروجی‌ها طراحی شده است. ⚡

## ✨ امکانات اصلی

- 🖼️ تبدیل عکس به هنر متنی ASCII
- 🧩 تبدیل عکس به سبک موزاییکی
- 😀 تولید هنر ایموجی از تصویر
- 🌗 رابط کاربری دو زبانه (فارسی / انگلیسی)
- 🎛️ تنظیمات قابل شخصی‌سازی برای خروجی بهتر
- 📋 کپی آسان خروجی برای ارسال سریع

## 🤝 بات‌های اکوسیستم PIMX

- **PIMX_MOJI 🎨**  
  بات خلاق برای تبدیل تصاویر ساده به خروجی‌های هنری متنی و ایموجی.

- **PIMX_PASS_DNS 🚀**  
  پلتفرم اسکن DNS دو‌زبانه با تست هوشمند، داشبورد تحلیلی ادمین و بک‌اند Cloudflare D1.

## 🚀 اجرای پروژه در لوکال

**پیش‌نیاز:** Node.js نسخه 18 یا بالاتر

1. نصب وابستگی‌ها  
   `npm install`
2. ساخت فایل `.env.local` و وارد کردن کلید API  
   `GEMINI_API_KEY=your_api_key_here`
3. اجرای پروژه  
   `npm run dev`
4. آدرس اجرا  
   `http://localhost:3000`

## 🛠️ تکنولوژی‌ها

- React + TypeScript
- Vite
- Tailwind CSS
- Google GenAI SDK

## ☁️ دیپلوی روی Cloudflare Pages

برای جلوگیری از صفحه سفید و خطای MIME این تنظیمات را دقیق بگذارید:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: نسخه `18+` (پیشنهادی `20`)

اگر Cloudflare فایل `main.tsx` را مستقیم سرو کند یعنی خروجی Build دیپلوی نشده است.
