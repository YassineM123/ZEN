import { startTransition, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import PageRenderer from "./components/PageRenderer";
import { fallbackRoute, siteConfig } from "./generated/siteManifest";
import { getPageEntry, loadPageData, normalizePathname, resolveCanonicalRoute } from "./lib/pageData";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = normalizePathname(location.pathname);
  const canonicalPathname = resolveCanonicalRoute(pathname);
  const pageEntry = getPageEntry(pathname) ?? getPageEntry(fallbackRoute);
  const [pageState, setPageState] = useState({
    error: null,
    page: null,
    status: "idle",
  });
  const currentPage = pageState.page?.route === canonicalPathname ? pageState.page : null;

  useLegacyDocumentChrome(siteConfig);
  useLegacyStylesheet(siteConfig.stylesheetHref);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [canonicalPathname]);

  useEffect(() => {
    if (pathname !== canonicalPathname) {
      navigate(canonicalPathname, {
        replace: true,
        state: location.state,
      });
    }
  }, [canonicalPathname, location.state, navigate, pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      if (!pageEntry) {
        setPageState({
          error: new Error("No page manifest entry matched the current route."),
          page: null,
          status: "error",
        });
        return;
      }

      startTransition(() => {
        setPageState((currentState) => ({
          ...currentState,
          error: null,
          status: "loading",
        }));
      });

      try {
        const page = await loadPageData(canonicalPathname);

        if (!cancelled) {
          startTransition(() => {
            setPageState({
              error: null,
              page,
              status: "ready",
            });
          });
        }
      } catch (error) {
        if (!cancelled) {
          setPageState({
            error,
            page: null,
            status: "error",
          });
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [canonicalPathname, pageEntry]);

  const canonicalUrl = useMemo(() => {
    const canonicalPath = currentPage?.canonicalPath || canonicalPathname;

    if (typeof window === "undefined") {
      return canonicalPath;
    }

    return `${window.location.origin}${canonicalPath}`;
  }, [canonicalPathname, currentPage]);

  return (
    <>
      <Helmet>
        <title>{currentPage?.title || pageEntry?.title || "ZEN Groupe"}</title>
        {currentPage?.description ? (
          <meta name="description" content={currentPage.description} />
        ) : null}
        {currentPage?.keywords ? (
          <meta name="keywords" content={currentPage.keywords} />
        ) : null}
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={currentPage?.title || pageEntry?.title || "ZEN Groupe"} />
        {currentPage?.description ? (
          <meta property="og:description" content={currentPage.description} />
        ) : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={currentPage?.title || pageEntry?.title || "ZEN Groupe"} />
        {currentPage?.description ? (
          <meta name="twitter:description" content={currentPage.description} />
        ) : null}
        {currentPage?.structuredData?.map((entry, index) => (
          <script key={`${currentPage.route}-ld-${index}`} type="application/ld+json">
            {normalizeStructuredDataOrigin(entry)}
          </script>
        ))}
      </Helmet>

      {pageState.page ? (
        <PageRenderer
          hash={location.hash}
          page={pageState.page}
          pathname={canonicalPathname}
        />
      ) : null}

      {pageState.status === "loading" && pageState.page ? (
        <div className="premium-route-loader" aria-hidden="true" />
      ) : null}

      {pageState.status === "loading" && !pageState.page ? (
        <LoadingScreen title={pageEntry?.title || "Chargement"} />
      ) : null}

      {pageState.status === "error" && !pageState.page ? (
        <ErrorScreen error={pageState.error} />
      ) : null}
    </>
  );
}

function normalizeStructuredDataOrigin(value) {
  if (typeof window === "undefined" || !value) {
    return value;
  }

  return value
    .replaceAll("http://localhost:3000", window.location.origin)
    .replaceAll("https://localhost:3000", window.location.origin);
}

function useLegacyDocumentChrome(config) {
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const htmlClassNames = new Set((config.htmlClassName || "").split(/\s+/).filter(Boolean));
    const storedTheme = window.localStorage.getItem("theme");
    const themeClass = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";

    htmlClassNames.add(themeClass);
    htmlElement.lang = config.htmlLang || "fr";
    htmlElement.className = Array.from(htmlClassNames).join(" ");
    htmlElement.style.cssText = config.htmlStyle || "";
    htmlElement.style.colorScheme = themeClass;
    bodyElement.className = config.bodyClassName || "";
  }, [config]);
}

function useLegacyStylesheet(stylesheetHref) {
  useEffect(() => {
    if (!stylesheetHref) {
      return undefined;
    }

    const existingLink = document.getElementById("legacy-site-stylesheet");

    if (existingLink instanceof HTMLLinkElement) {
      existingLink.href = stylesheetHref;
      return undefined;
    }

    const linkElement = document.createElement("link");
    linkElement.id = "legacy-site-stylesheet";
    linkElement.rel = "stylesheet";
    linkElement.href = stylesheetHref;
    document.head.appendChild(linkElement);

    return () => {
      if (linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
      }
    };
  }, [stylesheetHref]);
}

function LoadingScreen({ title }) {
  return (
    <div className="status-screen">
      <div className="status-card">
        <div className="status-kicker">React Migration</div>
        <h1>{title}</h1>
        <p>Chargement de la page migree depuis l export statique.</p>
        <div className="status-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div className="status-screen">
      <div className="status-card">
        <div className="status-kicker">Migration Error</div>
        <h1>La page n a pas pu etre chargee.</h1>
        <p>{error?.message || "Une erreur inconnue est survenue."}</p>
      </div>
    </div>
  );
}
