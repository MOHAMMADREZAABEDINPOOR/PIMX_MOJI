import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { Home } from "../src/studio/Home";
import { StylesPage } from "../src/studio/Pages";
import { BrandMark } from "../src/studio/BrandMark";
import { SettingsProvider } from "../src/contexts/SettingsContext";
import { metadata, SITE, pageUrl } from "../src/studio/seo";
import type { Page } from "../src/studio/types";

const template = await readFile("dist/index.html", "utf8");
const routes: string[] = [];
for (const language of ["en"] as ("en" | "fa")[]) {
  for (const page of ["home", "styles", "studio", "library", "result"] as const) {
    const t = (en: string, fa: string) => language === "fa" ? fa : en;
    const path = pageUrl(page, language);
    const [title, description] = metadata[language][page];
    const navigation = <nav aria-label={t("Main navigation", "ناوبری اصلی")}>{(["home", "studio", "styles"] as Page[]).map(p => <a key={p} href={pageUrl(p, language)}>{metadata[language][p][0].split(" | ")[0]}</a>)}</nav>;
    let content: React.ReactNode;
    if (page === "home") content = <Home t={t} navigate={() => {}} upload={() => {}} applyStyle={() => {}} />;
    else if (page === "styles") content = <StylesPage t={t} custom={[]} apply={() => {}} notify={() => {}} addStyle={async () => {}} remove={async () => {}} />;
    else content = <div className="content-width"><h1>{title.split(" | ")[0]}</h1><p>{description}</p><p>{t("Choose a photo, explore a style, then generate your artwork. Everything is processed on your device.", "عکس را انتخاب کن، یک استایل را امتحان کن و اثرت را بساز. پردازش روی دستگاه خودت انجام می‌شود.")}</p></div>;
    const html = renderToStaticMarkup(<SettingsProvider><div className="app-shell" dir={language === "fa" ? "rtl" : "ltr"}><header className="site-header"><a className="brand" href={pageUrl("home", language)}><BrandMark />PIMX MOJI</a>{navigation}</header><main>{content}</main></div></SettingsProvider>);
    let output = template.replace('<html lang="en">', `<html lang="${language}">`).replace(/<title>.*?<\/title>/, `<title>${title}</title>`).replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    const replaceMeta = (attribute: string, key: string, value: string) => {
      output = output.replace(new RegExp(`(<meta ${attribute}="${key}" content=")[^"]*("\\s*/?>)`), `$1${value}$2`);
    };
    replaceMeta("name", "description", description);
    replaceMeta("property", "og:title", title);
    replaceMeta("property", "og:description", description);
    replaceMeta("property", "og:url", SITE + path);
    replaceMeta("property", "og:locale", language === "fa" ? "fa_IR" : "en_US");
    replaceMeta("name", "twitter:title", title);
    replaceMeta("name", "twitter:description", description);
    if (page === "library" || page === "result") { replaceMeta("name", "robots", "noindex, follow"); replaceMeta("name", "googlebot", "noindex, follow"); }
    output = output.replace(/(<link rel="canonical" href=")[^"]*"/, `$1${SITE}${path}"`);
    const directory = path === "/" ? "dist" : `dist${path}`;
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/index.html`, output);
    if (page === "home" && language === "en") await writeFile("dist/index.html", output);
    if (page !== "library" && page !== "result") routes.push(path);
  }
}
await writeFile("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${SITE}${path}</loc></url>`).join("")}</urlset>`);
console.log(`Prerendered 5 clean routes and sitemap.`);
