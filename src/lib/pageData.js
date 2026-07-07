import { pageManifest, routeAliases } from "../generated/siteManifest";

const pageCache = new Map();

export function normalizePathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function resolveCanonicalRoute(pathname) {
  const normalizedPath = normalizePathname(pathname);

  return routeAliases[normalizedPath] || normalizedPath;
}

export function getPageEntry(pathname) {
  const canonicalPath = resolveCanonicalRoute(pathname);

  return pageManifest[canonicalPath] || null;
}

export async function loadPageData(pathname) {
  const pageEntry = getPageEntry(pathname);

  if (!pageEntry) {
    throw new Error(`No page manifest entry matched ${pathname}.`);
  }

  if (pageCache.has(pageEntry.dataPath)) {
    return pageCache.get(pageEntry.dataPath);
  }

  const response = await fetch(pageEntry.dataPath);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pageEntry.dataPath} (${response.status}).`);
  }

  const page = await response.json();
  pageCache.set(pageEntry.dataPath, page);

  return page;
}

export function prefetchPageData(pathname) {
  const pageEntry = getPageEntry(pathname);

  if (!pageEntry || pageCache.has(pageEntry.dataPath)) {
    return;
  }

  loadPageData(pathname).catch(() => {
    // Ignore prefetch failures. The route load will surface a real error if needed.
  });
}
