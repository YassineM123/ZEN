import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const defaultSourceRoot = path.resolve(appRoot, "..");
const preferredSourceRoot = path.join(defaultSourceRoot, "zen web");
const sourceRoot = await pathExists(preferredSourceRoot)
  ? preferredSourceRoot
  : defaultSourceRoot;
const publicRoot = path.join(appRoot, "public");
const migratedPagesRoot = path.join(publicRoot, "migrated-pages");
const generatedRoot = path.join(appRoot, "src", "generated");

const assetEntries = [
  "_next",
  "images",
  "videos",
  "apple-touch-icon.png",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-v2.ico",
  "favicon.ico",
  "manifest.json",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
  "sw.js",
  "_redirects",
  "zen-fallback-icon.svg",
];

await ensureDir(publicRoot);
await ensureDir(generatedRoot);
await resetDir(migratedPagesRoot);
await copyAssets();

const htmlFiles = await collectHtmlFiles(sourceRoot);

if (htmlFiles.length === 0) {
  throw new Error("No exported HTML files were found in the parent folder.");
}

const pages = [];
let siteConfig = null;
let fallbackRoute = "/404";
const routeAliases = {
  "/_not-found": "/404",
  "/blog/automatisation-utile": "/blog/automatisation-des-ventes-b2b-sans-crm-lourd-676008",
  "/blog/credibilite-immediate": "/blog/site-web-qui-convertit-check-list-2026",
  "/blog/performance-operationnelle": "/blog/tableaux-de-bord-utiles-10-kpi-vraiment-actionnables",
};

for (const absolutePath of htmlFiles) {
  const relativePath = normalizeSlashes(path.relative(sourceRoot, absolutePath));
  const html = await fs.readFile(absolutePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  if (!siteConfig) {
    siteConfig = extractSiteConfig($);
  }

  const route = toRoutePath(relativePath);

  if (relativePath === "_not-found.html") {
    fallbackRoute = route;
  }

  if (route.startsWith("/blogs")) {
    routeAliases[route] = route.replace(/^\/blogs/, "/blog");
  }

  const pageId = createPageId(relativePath);
  const pagePayload = extractPagePayload($, route, relativePath);
  const dataPath = `/migrated-pages/${pageId}.json`;
  const outputPath = path.join(migratedPagesRoot, `${pageId}.json`);

  await fs.writeFile(outputPath, `${JSON.stringify(pagePayload, null, 2)}\n`, "utf8");

  pages.push({
    route,
    dataPath,
    title: pagePayload.title,
    sourceFile: relativePath,
  });
}

pages.sort((left, right) => left.route.localeCompare(right.route));

const manifest = Object.fromEntries(
  pages.map((page) => [
    page.route,
    {
      dataPath: page.dataPath,
      title: page.title,
      sourceFile: page.sourceFile,
    },
  ]),
);

const manifestSource = [
  `export const siteConfig = ${JSON.stringify(siteConfig, null, 2)};`,
  "",
  `export const pageManifest = ${JSON.stringify(manifest, null, 2)};`,
  "",
  `export const routeAliases = ${JSON.stringify(routeAliases, null, 2)};`,
  "",
  `export const fallbackRoute = ${JSON.stringify(fallbackRoute)};`,
  "",
].join("\n");

await fs.writeFile(path.join(generatedRoot, "siteManifest.js"), manifestSource, "utf8");

console.log(`Migrated ${pages.length} pages into ${path.relative(appRoot, migratedPagesRoot)}.`);

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function resetDir(target) {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });
}

async function copyAssets() {
  for (const entry of assetEntries) {
    const sourcePath = path.join(sourceRoot, entry);
    const destinationPath = path.join(publicRoot, entry);

    try {
      await fs.rm(destinationPath, { recursive: true, force: true });
      await fs.cp(sourcePath, destinationPath, { recursive: true });
    } catch (error) {
      if (error && error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }
}

async function collectHtmlFiles(root) {
  const files = [];
  await walk(root, files);
  return files;
}

async function walk(currentPath, files) {
  const directoryEntries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of directoryEntries) {
    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = normalizeSlashes(path.relative(sourceRoot, absolutePath));

    if (shouldSkip(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(absolutePath, files);
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith(".html")) {
      files.push(absolutePath);
    }
  }
}

function shouldSkip(relativePath) {
  if (!relativePath) {
    return false;
  }

  const topLevel = relativePath.split("/")[0];

  return topLevel === "react-app" || topLevel === "node_modules";
}

function normalizeSlashes(value) {
  return value.replaceAll("\\", "/");
}

function toRoutePath(relativePath) {
  let route = relativePath.replace(/\.html$/i, "");

  if (route === "index") {
    return "/";
  }

  if (route.endsWith("/index")) {
    route = route.slice(0, -"/index".length);
  }

  return `/${route}`;
}

function createPageId(relativePath) {
  const safeName = relativePath
    .toLowerCase()
    .replace(/\.html$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "index";
  const hash = createHash("sha1").update(relativePath).digest("hex").slice(0, 8);

  return `${safeName}-${hash}`;
}

function extractSiteConfig($) {
  return {
    htmlLang: $("html").attr("lang") || "fr",
    htmlClassName: $("html").attr("class") || "",
    htmlStyle: $("html").attr("style") || "",
    bodyClassName: $("body").attr("class") || "",
    stylesheetHref: $('link[rel="stylesheet"]').first().attr("href") || "",
  };
}

function extractPagePayload($, route, sourceFile) {
  const title = repairText($("title").text().trim());
  const description = repairText($('meta[name="description"]').attr("content")?.trim() || "");
  const canonicalHref = $('link[rel="canonical"]').attr("href") || route;
  const keywords = repairText($('meta[name="keywords"]').attr("content")?.trim() || "");
  const structuredData = $('script[type="application/ld+json"]')
    .map((_, element) => repairText($(element).html()?.trim() || ""))
    .get()
    .filter(Boolean);

  $("body script").remove();
  $('body template[data-dgst]').remove();
  $("body div[hidden]").remove();
  $('body div[role="region"][aria-label^="Notifications"]').remove();

  const bodyHtml = repairText($("body").html()?.trim() || "");

  return {
    route,
    sourceFile,
    title,
    description,
    canonicalPath: toCanonicalPath(canonicalHref, route),
    keywords,
    structuredData,
    bodyHtml,
  };
}

function toCanonicalPath(value, route) {
  try {
    const parsedUrl = new URL(value);
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || route;
  } catch {
    return value || route;
  }
}

function repairText(value) {
  if (!value) {
    return value;
  }

  if (!/[ÃÂâ€™â€œâ€\u00c2]/.test(value)) {
    return value;
  }

  const repairedValue = Buffer.from(value, "latin1").toString("utf8");

  return scoreText(repairedValue) >= scoreText(value) ? repairedValue : value;
}

function scoreText(value) {
  if (!value) {
    return 0;
  }

  let score = value.length;

  const penalties = ["Ã", "Â", "â€", "\uFFFD"];

  for (const marker of penalties) {
    score -= (value.split(marker).length - 1) * 8;
  }

  return score;
}
