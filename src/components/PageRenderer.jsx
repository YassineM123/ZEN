import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prefetchPageData, resolveCanonicalRoute } from "../lib/pageData";

const CONTACT_EMAIL = "contact@zen-groupe.fr";
const ADMIN_TOKEN_STORAGE_KEY = "admin_token";

export default function PageRenderer({ hash, page, pathname }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [notice]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const cleanups = [];

    enhanceHeadings(container);
    enhanceMissingMobileMenu(container, pathname);
    cleanups.push(...enhanceAdminPages(container, pathname, navigate, setNotice));
    cleanups.push(...enhanceHeaderInteractions(container, pathname));
    cleanups.push(...enhanceServiceButtons(container, pathname, navigate));
    cleanups.push(...enhanceHeroMobileLayout(container, pathname));
    cleanups.push(...enhanceHomePageAnimations(container, pathname));
    cleanups.push(...enhanceLegacyAnimations(container, pathname));
    cleanups.push(...enhancePremiumMotion(container, pathname));

    const forms = container.querySelectorAll("form");
    forms.forEach((formElement) => {
      const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(formElement);
        const lines = [];

        formData.forEach((value, key) => {
          const normalizedValue = String(value).trim();

          if (normalizedValue) {
            lines.push(`${toFieldLabel(key)}: ${normalizedValue}`);
          }
        });

        if (lines.length === 0) {
          setNotice("Renseignez le formulaire avant de l envoyer.");
          return;
        }

        const subject = encodeURIComponent("Demande de strategie ZEN Groupe");
        const body = encodeURIComponent(lines.join("\n"));
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        setNotice("Votre messagerie s ouvre avec le message pre-rempli.");
      };

      formElement.addEventListener("submit", handleSubmit);
      cleanups.push(() => formElement.removeEventListener("submit", handleSubmit));
    });

    const menuButtons = container.querySelectorAll("button[aria-controls]");
    menuButtons.forEach((buttonElement) => {
      const targetId = buttonElement.getAttribute("aria-controls");

      if (!targetId) {
        return;
      }

      const targetElement = container.querySelector(`#${targetId}`);

      if (!targetElement) {
        return;
      }

      let hideTimerId = 0;

      const openMenu = () => {
        window.clearTimeout(hideTimerId);
        targetElement.hidden = false;
        targetElement.classList.remove("hidden");

        window.requestAnimationFrame(() => {
          targetElement.classList.add("legacy-mobile-menu--open");
        });
      };

      const closeMenu = () => {
        targetElement.classList.remove("legacy-mobile-menu--open");
        window.clearTimeout(hideTimerId);
        hideTimerId = window.setTimeout(() => {
          targetElement.hidden = true;
          targetElement.classList.add("hidden");
        }, 220);
      };

      const handleToggle = () => {
        const isExpanded = buttonElement.getAttribute("aria-expanded") === "true";
        buttonElement.setAttribute("aria-expanded", String(!isExpanded));

        if (isExpanded) {
          closeMenu();
          return;
        }

        openMenu();
      };

      const menuLinks = targetElement.querySelectorAll("a[href]");
      const handleMenuLinkClick = () => {
        buttonElement.setAttribute("aria-expanded", "false");
        closeMenu();
      };

      buttonElement.addEventListener("click", handleToggle);
      menuLinks.forEach((linkElement) => linkElement.addEventListener("click", handleMenuLinkClick));

      cleanups.push(() => {
        window.clearTimeout(hideTimerId);
        buttonElement.removeEventListener("click", handleToggle);
        menuLinks.forEach((linkElement) => linkElement.removeEventListener("click", handleMenuLinkClick));
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [navigate, page, pathname]);

  useEffect(() => {
    if (!hash) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(hash.slice(1));
      targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [hash, page]);

  function handleClick(event) {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const anchor = event.target.closest("a[href]");

    if (!anchor || !container.contains(anchor)) {
      return;
    }

    const href = anchor.getAttribute("href");

    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
      return;
    }

    if (anchor.target && anchor.target !== "_self") {
      return;
    }

    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();

    const nextPath = `${resolveCanonicalRoute(url.pathname)}${url.search}${url.hash}`;

    if (url.pathname === pathname && url.hash) {
      const hashTarget = document.getElementById(url.hash.slice(1));
      hashTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate(nextPath);
  }

  function handleMouseOver(event) {
    const anchor = event.target.closest("a[href]");

    if (!anchor) {
      return;
    }

    prefetchAnchor(anchor);
  }

  function handleFocus(event) {
    const anchor = event.target.closest("a[href]");

    if (!anchor) {
      return;
    }

    prefetchAnchor(anchor);
  }

  return (
    <div className="page-renderer">
      {notice ? <div className="page-notice">{notice}</div> : null}
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onFocus={handleFocus}
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
    </div>
  );
}

function toFieldLabel(value) {
  switch (value) {
    case "name":
      return "Nom";
    case "email":
      return "Email";
    case "phone":
      return "Telephone";
    case "company":
      return "Entreprise";
    case "message":
      return "Message";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function prefetchAnchor(anchor) {
  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return;
  }

  const url = new URL(href, window.location.origin);

  if (url.origin !== window.location.origin) {
    return;
  }

  prefetchPageData(url.pathname);
}

function enhanceHeadings(container) {
  const seenIds = new Set();
  const headings = container.querySelectorAll("h1, h2, h3");

  headings.forEach((headingElement) => {
    if (headingElement.id) {
      seenIds.add(headingElement.id);
      return;
    }

    const headingText = headingElement.textContent?.trim();

    if (!headingText) {
      return;
    }

    let candidateId = slugify(headingText);

    if (!candidateId) {
      return;
    }

    let suffix = 2;

    while (seenIds.has(candidateId)) {
      candidateId = `${slugify(headingText)}-${suffix}`;
      suffix += 1;
    }

    headingElement.id = candidateId;
    seenIds.add(candidateId);
  });
}

function enhanceMissingMobileMenu(container) {
  const header = container.querySelector("header");
  const menuButton = header?.querySelector('button[aria-controls="primary-navigation-mobile"]');

  if (!header || !menuButton || container.querySelector("#primary-navigation-mobile")) {
    return;
  }

  const desktopNavLinks = Array.from(
    header.querySelectorAll('nav[aria-label="Navigation principale"] a[href]'),
  );
  const ctaLink = header.querySelector('a[href="/contact"][data-magnetic="true"]');

  if (desktopNavLinks.length === 0) {
    return;
  }

  const menu = document.createElement("div");
  menu.id = "primary-navigation-mobile";
  menu.hidden = true;
  menu.className = "legacy-mobile-menu hidden";

  const menuInner = document.createElement("div");
  menuInner.className = "legacy-mobile-menu__inner";

  desktopNavLinks.forEach((linkElement) => {
    const link = document.createElement("a");
    link.href = linkElement.getAttribute("href") || "/";
    link.className = "legacy-mobile-menu__link";
    link.textContent = linkElement.textContent?.trim() || "Lien";
    menuInner.appendChild(link);
  });

  if (ctaLink) {
    const callLink = document.createElement("a");
    callLink.href = ctaLink.getAttribute("href") || "/contact";
    callLink.className = "legacy-mobile-menu__cta";
    callLink.textContent = ctaLink.textContent?.trim() || "Contact";
    menuInner.appendChild(callLink);
  }

  menu.appendChild(menuInner);
  header.appendChild(menu);
}

function enhanceHeaderInteractions(container, pathname) {
  const header = container.querySelector("header");
  const headerSurface = header?.querySelector('[class*="backdrop-blur-xl"]');

  if (!header || !headerSurface) {
    return [];
  }

  const cleanups = [];
  const updateHeaderSurface = () => {
    headerSurface.classList.toggle("legacy-header-scrolled", window.scrollY > 18);
  };

  const navLinks = header.querySelectorAll(
    'nav[aria-label="Navigation principale"] a[href], #primary-navigation-mobile a[href]',
  );

  navLinks.forEach((linkElement) => {
    const href = linkElement.getAttribute("href");
    const isActive = isRouteActive(href, pathname);
    const isMobileLink = linkElement.closest("#primary-navigation-mobile");
    let pillElement = linkElement.querySelector(".legacy-nav-pill");

    if (isActive) {
      linkElement.classList.add("legacy-nav-link-active");
      linkElement.setAttribute("aria-current", "page");

      if (isMobileLink) {
        linkElement.classList.add("legacy-mobile-menu__link--active");
      } else if (!pillElement) {
        pillElement = document.createElement("span");
        pillElement.className = "legacy-nav-pill";
        pillElement.setAttribute("aria-hidden", "true");
        linkElement.insertBefore(pillElement, linkElement.firstChild);
      }

      return;
    }

    linkElement.classList.remove("legacy-nav-link-active", "legacy-mobile-menu__link--active");
    linkElement.removeAttribute("aria-current");
    pillElement?.remove();
  });

  updateHeaderSurface();
  window.addEventListener("scroll", updateHeaderSurface, { passive: true });
  cleanups.push(() => {
    window.removeEventListener("scroll", updateHeaderSurface);
  });

  return cleanups;
}

function enhanceServiceButtons(container, pathname, navigate) {
  const serviceButtons = container.querySelectorAll("button[aria-pressed]");

  if (serviceButtons.length === 0) {
    return [];
  }

  const cleanups = [];

  serviceButtons.forEach((buttonElement) => {
    const label = buttonElement.textContent?.trim();

    if (!label) {
      return;
    }

    const handleClick = () => {
      const targetHash = `#${slugify(label)}`;

      if (pathname === "/services") {
        const targetElement = document.getElementById(targetHash.slice(1));
        targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      navigate(`/services${targetHash}`);
    };

    buttonElement.addEventListener("click", handleClick);
    cleanups.push(() => buttonElement.removeEventListener("click", handleClick));
  });

  return cleanups;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isRouteActive(href, pathname) {
  if (!href) {
    return false;
  }

  const url = new URL(href, window.location.origin);
  const linkPathname = resolveCanonicalRoute(url.pathname);

  if (linkPathname === "/") {
    return pathname === "/";
  }

  return pathname === linkPathname || pathname.startsWith(`${linkPathname}/`);
}

function enhanceAdminPages(container, pathname, navigate, setNotice) {
  if (pathname === "/admin/login") {
    return enhanceAdminLogin(container, navigate, setNotice);
  }

  if (pathname === "/admin/blog") {
    return enhanceAdminBlog(container, navigate, setNotice);
  }

  return [];
}

function enhanceAdminLogin(container, navigate, setNotice) {
  const tokenInput = container.querySelector('input[placeholder="ADMIN_TOKEN"]');
  const continueButton = findButtonByText(container, "Continuer");

  if (!(tokenInput instanceof HTMLInputElement) || !continueButton) {
    return [];
  }

  tokenInput.type = "password";
  tokenInput.name = "adminToken";
  tokenInput.autocomplete = "current-password";
  tokenInput.value = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";

  const saveToken = () => {
    const token = tokenInput.value.trim();

    if (!token) {
      setNotice("Saisissez un ADMIN_TOKEN avant de continuer.");
      tokenInput.focus();
      return;
    }

    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    setNotice("Jeton administrateur enregistre localement.");
    navigate("/admin/blog");
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveToken();
    }
  };

  continueButton.addEventListener("click", saveToken);
  tokenInput.addEventListener("keydown", handleKeyDown);

  return [
    () => {
      continueButton.removeEventListener("click", saveToken);
      tokenInput.removeEventListener("keydown", handleKeyDown);
    },
  ];
}

function enhanceAdminBlog(container, navigate, setNotice) {
  const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
  let localDraftPost = null;

  if (!token) {
    setNotice("Connectez-vous avec votre ADMIN_TOKEN.");
    navigate("/admin/login", { replace: true });
    return [];
  }

  const topicInput = container.querySelector('input[placeholder="Sujet"]');
  const keywordInput = container.querySelector('input[placeholder="Mot-cle principal"]');
  const categoryInput = container.querySelector('input[placeholder^="Categorie"]');
  const autoPublishInput = container.querySelector('input[type="checkbox"]');
  const resultBlock = container.querySelector("pre");
  const frenchButton = findButtonByText(container, "FR");
  const englishButton = findButtonByText(container, "EN");
  const generateTopicsButton = findButtonByText(container, "Generer des sujets");
  const generateAutoButton = findButtonByText(container, "Generer automatiquement");
  const regenerateCoversButton = findButtonByText(container, "Regenerer les covers SVG");
  const generatePostButton = findButtonByText(container, "Generer un nouvel article");
  const cleanups = [];
  let language = "fr";
  let publishButton = null;

  const setResult = (value) => {
    if (!resultBlock) {
      return;
    }

    resultBlock.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  };
  const setBusy = (button, isBusy, label) => {
    if (!button) {
      return;
    }

    button.disabled = isBusy;
    button.dataset.originalLabel ||= button.textContent || "";
    button.textContent = isBusy ? label : button.dataset.originalLabel;
  };
  const buildLocalAdminResponse = (endpoint, body) => {
    const generatedAt = new Date().toISOString();

    if (endpoint === "/api/ai/generate-topics") {
      const topicSeeds = language === "en"
        ? [
            "AI for SMEs: 7 quick wins in 30 days",
            "Local acquisition: SEO + Ads for SMBs",
            "Automating sales follow-up without a heavy CRM",
            "Customer support automation without losing the human touch",
            "B2B emailing sequences that do not end up in spam",
          ]
        : [
            "IA pour PME: 7 gains rapides en 30 jours",
            "Acquisition locale: SEO + Ads pour PME",
            "Automatiser le suivi commercial sans CRM lourd",
            "Automatiser le support client sans perdre le humain",
            "Sequences emailing B2B qui ne finissent pas en spam",
          ];

      return {
        mode: "local",
        generatedAt,
        language,
        topics: topicSeeds.map((title, index) => ({
          id: `topic_${index + 1}`,
          title,
          angle: language === "en" ? "Actionable playbook" : "Plan d action concret",
        })),
        message: "Sujets generes localement.",
      };
    }

    if (endpoint === "/api/ai/generate-post") {
      const topic = String(body?.topic || body?.primaryKeyword || body?.category || (language === "en" ? "New article" : "Nouvel article")).trim();
      const draftId = `draft_${Date.now().toString(36)}`;

      localDraftPost = {
        id: draftId,
        title: topic,
        slug: slugify(topic || "nouvel-article"),
        category: body?.category || "Web",
        language,
        primaryKeyword: body?.primaryKeyword || "",
        topic: body?.topic || "",
        autoPublish: Boolean(body?.autoPublish),
        published: Boolean(body?.autoPublish),
        updatedAt: generatedAt,
      };

      return {
        mode: "local",
        generatedAt,
        message: body?.autoPublish
          ? "Article publie localement."
          : "Brouillon genere localement.",
        post: localDraftPost,
      };
    }

    if (endpoint === "/api/blog/regenerate-covers") {
      return {
        mode: "local",
        generatedAt,
        message: "Covers SVG regeneres localement.",
        regenerated: true,
      };
    }

    if (endpoint === "/api/blog/publish") {
      const resolvedId = typeof body?.id === "string" && body.id.trim()
        ? body.id.trim()
        : localDraftPost?.id || `post_${Date.now().toString(36)}`;
      const publishedPost = {
        ...(localDraftPost?.id === resolvedId ? localDraftPost : {}),
        id: resolvedId,
        published: true,
        publishedAt: generatedAt,
      };

      localDraftPost = publishedPost;

      return {
        mode: "local",
        generatedAt,
        message: "Article publie localement.",
        post: publishedPost,
      };
    }

    return {
      mode: "local",
      generatedAt,
      message: "Action admin simulee localement.",
      endpoint,
    };
  };
  const callAdminApi = async (endpoint, body, button, busyLabel = "Traitement...") => {
    setBusy(button, true, busyLabel);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if ([404, 405, 501].includes(response.status)) {
          const localData = buildLocalAdminResponse(endpoint, body);
          setResult(localData);
          updatePublishButton(localData);
          setNotice(localData.message);
          return localData;
        }

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : { message: await response.text() };

        throw new Error(data?.message || `Erreur API ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      setResult(data);
      updatePublishButton(data);
      setNotice("Action admin terminee.");
      return data;
    } catch (error) {
      if (error?.name === "TypeError" || /fetch/i.test(error?.message || "")) {
        const localData = buildLocalAdminResponse(endpoint, body);
        setResult(localData);
        updatePublishButton(localData);
        setNotice(localData.message);
        return localData;
      }

      const message = error?.message || "Erreur inconnue.";
      const fallbackMessage = message.includes("404")
        ? "API admin introuvable: action simulee localement."
        : message;

      setResult({ error: fallbackMessage });
      setNotice(fallbackMessage);
      return null;
    } finally {
      setBusy(button, false);
    }
  };
  const updateLanguageButtons = () => {
    frenchButton?.setAttribute("aria-pressed", String(language === "fr"));
    englishButton?.setAttribute("aria-pressed", String(language === "en"));
  };
  const updatePublishButton = (data) => {
    const postId = data?.post?.published === false && typeof data?.post?.id === "string"
      ? data.post.id
      : null;

    if (!postId || !resultBlock?.parentElement) {
      publishButton?.remove();
      publishButton = null;
      return;
    }

    if (!publishButton) {
      publishButton = document.createElement("button");
      publishButton.type = "button";
      publishButton.className = generatePostButton?.className || "";
      publishButton.textContent = "Publier maintenant";
      resultBlock.parentElement.insertBefore(publishButton, resultBlock);
    }

    publishButton.onclick = () => {
      callAdminApi("/api/blog/publish", { id: postId }, publishButton, "Publication...");
    };
  };

  updateLanguageButtons();

  const bind = (button, handler) => {
    if (!button) {
      return;
    }

    button.addEventListener("click", handler);
    cleanups.push(() => button.removeEventListener("click", handler));
  };

  bind(frenchButton, () => {
    language = "fr";
    updateLanguageButtons();
  });
  bind(englishButton, () => {
    language = "en";
    updateLanguageButtons();
  });
  bind(generateTopicsButton, () => {
    callAdminApi("/api/ai/generate-topics", { language }, generateTopicsButton, "Generation...");
  });
  bind(generateAutoButton, () => {
    callAdminApi(
      "/api/ai/generate-post",
      {
        autoPublish: Boolean(autoPublishInput?.checked),
        autoTopic: true,
        language,
      },
      generateAutoButton,
      "Generation...",
    );
  });
  bind(regenerateCoversButton, () => {
    callAdminApi("/api/blog/regenerate-covers", {}, regenerateCoversButton, "Regeneration...");
  });
  bind(generatePostButton, () => {
    callAdminApi(
      "/api/ai/generate-post",
      {
        autoPublish: Boolean(autoPublishInput?.checked),
        category: categoryInput?.value || "Web",
        language,
        primaryKeyword: keywordInput?.value || "",
        topic: topicInput?.value || "",
      },
      generatePostButton,
      "Generation...",
    );
  });

  cleanups.push(() => {
    publishButton?.remove();
  });

  return cleanups;
}

function findButtonByText(container, text) {
  return Array.from(container.querySelectorAll("button")).find(
    (buttonElement) => buttonElement.textContent?.trim() === text,
  );
}

function enhanceHeroMobileLayout(container, pathname) {
  if (pathname !== "/") {
    return [];
  }

  const heroTitle = container.querySelector("[data-hero-title]");
  const heroSubtitle = container.querySelector("[data-hero-subtitle]");
  const heroCtas = container.querySelector("[data-hero-ctas]");
  const heroMeta = container.querySelector("[data-hero-meta]");
  const managedElements = [
    heroTitle,
    heroSubtitle,
    heroCtas,
    heroMeta,
    ...Array.from(heroCtas?.querySelectorAll(":scope > .inline-flex, :scope > .inline-flex > a") || []),
    ...Array.from(heroTitle?.querySelectorAll(":scope > .block") || []),
    ...Array.from(heroTitle?.querySelectorAll(".inline-flex") || []),
  ].filter(Boolean);

  if (managedElements.length === 0) {
    return [];
  }

  const applyMobileLayout = () => {
    const isMobile = window.innerWidth <= 640;

    managedElements.forEach((element) => {
      if (!isMobile) {
        element.style.removeProperty("max-width");
        element.style.removeProperty("width");
        element.style.removeProperty("display");
        element.style.removeProperty("overflow");
        element.style.removeProperty("column-gap");
        return;
      }

      if (element === heroTitle) {
        element.style.maxWidth = "calc(100vw - 3rem)";
        return;
      }

      if (element === heroSubtitle || element === heroCtas) {
        element.style.width = "min(18rem, calc(100vw - 5rem))";
        element.style.maxWidth = "min(18rem, calc(100vw - 5rem))";
        return;
      }

      if (element === heroMeta) {
        element.style.maxWidth = "calc(100vw - 3rem)";
        return;
      }

      if (heroTitle?.contains(element)) {
        element.style.display = "inline";
        element.style.overflow = "visible";
        element.style.columnGap = "0";
        return;
      }

      if (heroCtas?.contains(element)) {
        element.style.width = "min(18rem, calc(100vw - 5rem))";
        element.style.maxWidth = "min(18rem, calc(100vw - 5rem))";
      }
    });
  };

  applyMobileLayout();
  window.addEventListener("resize", applyMobileLayout);

  return [
    () => {
      window.removeEventListener("resize", applyMobileLayout);
      managedElements.forEach((element) => {
        element.style.removeProperty("max-width");
        element.style.removeProperty("width");
        element.style.removeProperty("display");
        element.style.removeProperty("overflow");
        element.style.removeProperty("column-gap");
      });
    },
  ];
}

function enhancePremiumMotion(container, pathname) {
  const cleanups = [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHoverPrecisely = () =>
    window.innerWidth >= 900 && window.matchMedia("(pointer: fine)").matches;

  container.classList.remove("premium-page-enter");

  const pageFrameId = window.requestAnimationFrame(() => {
    container.classList.add("premium-page-enter");
  });
  const pageTimerId = window.setTimeout(() => {
    container.classList.remove("premium-page-enter");
  }, 760);

  cleanups.push(() => {
    window.cancelAnimationFrame(pageFrameId);
    window.clearTimeout(pageTimerId);
    container.classList.remove("premium-page-enter");
  });

  const interactiveElements = Array.from(
    container.querySelectorAll(
      [
        "a[href]",
        "button",
        "summary",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  );

  interactiveElements.forEach((element) => {
    if (element.closest("header")) {
      element.classList.add("premium-header-interactive");
    }

    element.classList.add("premium-interactive");

    if (element.matches('button[aria-controls="primary-navigation-mobile"]')) {
      element.classList.add("premium-menu-toggle");
    }

    if (element.matches("a[href], button, summary, [role='button']")) {
      element.classList.add("premium-command");
    }

    if (element.matches("input, select, textarea")) {
      element.classList.add("premium-field");
    }
  });

  const cardElements = Array.from(
    container.querySelectorAll(
      [
        ".surface-card",
        ".surface-panel",
        ".surface-muted",
        "article",
        "details",
        "form",
        "main section [class*='rounded-2xl']",
        "main section [class*='rounded-3xl']",
      ].join(","),
    ),
  );

  cardElements.forEach((element) => {
    if (
      element.closest("header, footer") ||
      element.closest("[data-hero-detail], [data-hero-meta], [data-hero-ctas], [data-hero-title]")
    ) {
      return;
    }

    element.classList.add("premium-card");
  });

  container.querySelectorAll("details").forEach((element) => {
    element.classList.add("premium-details");
  });

  container.querySelectorAll("svg").forEach((element) => {
    if (!element.closest("header")) {
      element.classList.add("premium-icon");
    }
  });

  if (prefersReducedMotion) {
    return cleanups;
  }

  const feedbackTimers = new WeakMap();
  const addPressedState = (target) => {
    const existingTimerId = feedbackTimers.get(target);

    if (existingTimerId) {
      window.clearTimeout(existingTimerId);
    }

    target.classList.add("premium-pressed");
    feedbackTimers.set(
      target,
      window.setTimeout(() => {
        target.classList.remove("premium-pressed");
        feedbackTimers.delete(target);
      }, 220),
    );
  };
  const handlePointerDown = (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const target = event.target.closest(".premium-interactive");

    if (target && container.contains(target)) {
      addPressedState(target);
    }
  };
  const handleKeyDown = (event) => {
    if (!(event.target instanceof Element) || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    const target = event.target.closest(".premium-interactive");

    if (target && container.contains(target)) {
      addPressedState(target);
    }
  };

  container.addEventListener("pointerdown", handlePointerDown, { passive: true });
  container.addEventListener("keydown", handleKeyDown);
  cleanups.push(() => {
    container.removeEventListener("pointerdown", handlePointerDown);
    container.removeEventListener("keydown", handleKeyDown);
  });

  const revealElements = collectPremiumRevealElements(container, pathname);

  revealElements.forEach((element) => {
    element.classList.add("premium-reveal-ready");
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("premium-reveal-in");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    revealElements.forEach((element) => revealObserver.observe(element));
    cleanups.push(() => revealObserver.disconnect());
  } else {
    revealElements.forEach((element) => element.classList.add("premium-reveal-in"));
  }

  const counterRecords = collectPremiumCounters(container);
  const counterAnimationFrames = new Set();

  if (counterRecords.length > 0 && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const record = counterRecords.find((candidate) => candidate.element === entry.target);

          if (record) {
            animatePremiumCounter(record, counterAnimationFrames);
          }

          counterObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -18% 0px",
        threshold: 0.28,
      },
    );

    counterRecords.forEach((record) => counterObserver.observe(record.element));
    cleanups.push(() => counterObserver.disconnect());
  } else {
    counterRecords.forEach((record) => {
      record.element.textContent = `${record.prefix}${formatPremiumCounter(
        record.value,
        record.decimals,
        record.integerDigits,
        record.decimalSeparator,
      )}${record.suffix}`;
    });
  }

  cleanups.push(() => {
    counterAnimationFrames.forEach((frameId) => window.cancelAnimationFrame(frameId));
    counterAnimationFrames.clear();
  });

  const parallaxElements = Array.from(
    container.querySelectorAll(
      [
        "main > section:not(:first-of-type) img",
        "main > section:not(:first-of-type) video",
        "main > section:not(:first-of-type) .surface-card",
        "main > section:not(:first-of-type) .surface-panel",
      ].join(","),
    ),
  )
    .filter((element) => !element.closest("header, footer"))
    .slice(0, 36);

  parallaxElements.forEach((element, index) => {
    element.classList.add("premium-parallax");
    element.style.setProperty("--premium-parallax-strength", `${index % 2 === 0 ? 14 : 9}`);
  });

  let parallaxFrameId = 0;
  const updateParallax = () => {
    parallaxFrameId = 0;

    if (!canHoverPrecisely()) {
      parallaxElements.forEach((element) => {
        element.style.setProperty("--premium-parallax-y", "0px");
      });
      return;
    }

    const viewportHeight = window.innerHeight || 1;

    parallaxElements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > viewportHeight) {
        return;
      }

      const strength = Number(element.style.getPropertyValue("--premium-parallax-strength")) || 10;
      const elementCenter = rect.top + rect.height / 2;
      const progress = clamp((viewportHeight / 2 - elementCenter) / viewportHeight, -1, 1);
      element.style.setProperty("--premium-parallax-y", `${(progress * strength).toFixed(2)}px`);
    });
  };
  const requestParallax = () => {
    if (parallaxFrameId) {
      return;
    }

    parallaxFrameId = window.requestAnimationFrame(updateParallax);
  };

  requestParallax();
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  cleanups.push(() => {
    window.removeEventListener("scroll", requestParallax);
    window.removeEventListener("resize", requestParallax);

    if (parallaxFrameId) {
      window.cancelAnimationFrame(parallaxFrameId);
    }

    parallaxElements.forEach((element) => {
      element.style.removeProperty("--premium-parallax-y");
      element.style.removeProperty("--premium-parallax-strength");
    });
  });

  const tiltCards = cardElements.slice(0, 80);

  tiltCards.forEach((element) => {
    const handlePointerMove = (event) => {
      if (!canHoverPrecisely()) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
      const relativeY = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--premium-tilt-x", `${(-relativeY * 3.5).toFixed(2)}deg`);
      element.style.setProperty("--premium-tilt-y", `${(relativeX * 3.5).toFixed(2)}deg`);
      element.style.setProperty("--premium-glow-x", `${Math.round((relativeX + 0.5) * 100)}%`);
      element.style.setProperty("--premium-glow-y", `${Math.round((relativeY + 0.5) * 100)}%`);
    };
    const handlePointerLeave = () => {
      element.style.removeProperty("--premium-tilt-x");
      element.style.removeProperty("--premium-tilt-y");
      element.style.removeProperty("--premium-glow-x");
      element.style.removeProperty("--premium-glow-y");
    };

    element.addEventListener("pointermove", handlePointerMove, { passive: true });
    element.addEventListener("pointerleave", handlePointerLeave);
    cleanups.push(() => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
    });
  });

  return cleanups;
}

function collectPremiumRevealElements(container, pathname) {
  const revealElements = [];
  const seenElements = new Set();
  const sections = Array.from(container.querySelectorAll("main > section, main footer, footer"));

  const addRevealElement = (element, delay) => {
    if (!(element instanceof HTMLElement) || seenElements.has(element) || shouldSkipPremiumReveal(element)) {
      return;
    }

    seenElements.add(element);
    element.style.setProperty("--premium-delay", `${Math.min(delay, 560)}ms`);
    revealElements.push(element);
  };

  sections.forEach((section, sectionIndex) => {
    const isHomeHero = pathname === "/" && sectionIndex === 0;

    section.classList.add("premium-section");

    if (isHomeHero) {
      return;
    }

    addRevealElement(section, Math.min(sectionIndex, 4) * 46);

    let localIndex = 0;
    const childElements = section.querySelectorAll(
      [
        ":scope h1",
        ":scope h2",
        ":scope h3",
        ":scope .text-lead",
        ":scope .surface-card",
        ":scope .surface-panel",
        ":scope article",
        ":scope details",
        ":scope form > div",
        ":scope img",
        ":scope video",
        ":scope li",
        ":scope a[href]",
        ":scope button",
      ].join(","),
    );

    childElements.forEach((element) => {
      addRevealElement(element, 80 + localIndex * 44);
      localIndex += 1;
    });
  });

  return revealElements;
}

function shouldSkipPremiumReveal(element) {
  if (element.closest("header, script, style, [hidden], .legacy-mobile-menu")) {
    return true;
  }

  if (
    element.closest(
      [
        "[data-reveal]",
        "[data-hero-title]",
        "[data-hero-word]",
        "[data-hero-detail]",
        "[data-hero-subtitle]",
        "[data-hero-ctas]",
        "[data-hero-meta]",
        "[data-offer-line]",
      ].join(","),
    )
  ) {
    return true;
  }

  const rect = element.getBoundingClientRect();

  return rect.width === 0 && rect.height === 0;
}

function collectPremiumCounters(container) {
  const candidates = Array.from(
    container.querySelectorAll(
      [
        "main .text-3xl",
        "main .text-4xl",
        "main .text-5xl",
        "main [class*='text-3xl']",
        "main [class*='text-4xl']",
        "main [class*='text-5xl']",
      ].join(","),
    ),
  );

  return candidates
    .map((element) => parsePremiumCounter(element))
    .filter(Boolean);
}

function parsePremiumCounter(element) {
  if (!(element instanceof HTMLElement) || element.closest("footer, header, form")) {
    return null;
  }

  const originalText = element.textContent?.trim() || "";
  const match = originalText.match(/^([^0-9+-]*)([+-]?\d+(?:[.,]\d+)?)([%+a-zA-Z]*)$/);

  if (!match || originalText.length > 12) {
    return null;
  }

  const [, prefix, rawNumber, suffix] = match;
  const decimalSeparator = rawNumber.includes(",") ? "," : ".";
  const normalizedNumber = rawNumber.replace(",", ".");
  const value = Number(normalizedNumber);

  if (!Number.isFinite(value)) {
    return null;
  }

  const decimalPart = normalizedNumber.split(".")[1] || "";
  const integerPart = normalizedNumber.split(".")[0].replace(/[+-]/g, "");

  element.classList.add("premium-counter");
  element.textContent = `${prefix}${formatPremiumCounter(0, decimalPart.length, integerPart.length, decimalSeparator)}${suffix}`;

  return {
    decimalSeparator,
    decimals: decimalPart.length,
    element,
    integerDigits: integerPart.length,
    prefix,
    suffix,
    value,
  };
}

function animatePremiumCounter(record, frameSet) {
  const startTime = performance.now();
  const duration = Math.min(1600, 820 + Math.abs(record.value) * 9);

  const tick = (time) => {
    const progress = clamp((time - startTime) / duration, 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = record.value * easedProgress;

    record.element.textContent = `${record.prefix}${formatPremiumCounter(
      currentValue,
      record.decimals,
      record.integerDigits,
      record.decimalSeparator,
    )}${record.suffix}`;

    if (progress < 1) {
      const nextFrameId = window.requestAnimationFrame(tick);
      frameSet.add(nextFrameId);
      return;
    }

    record.element.textContent = `${record.prefix}${formatPremiumCounter(
      record.value,
      record.decimals,
      record.integerDigits,
      record.decimalSeparator,
    )}${record.suffix}`;
  };

  const frameId = window.requestAnimationFrame(tick);
  frameSet.add(frameId);
}

function formatPremiumCounter(value, decimals, integerDigits, decimalSeparator) {
  const fixedValue = value.toFixed(decimals);
  const [integerPart, decimalPart] = fixedValue.split(".");
  const paddedInteger = integerPart.padStart(integerDigits, "0");

  if (!decimalPart) {
    return paddedInteger;
  }

  return `${paddedInteger}${decimalSeparator}${decimalPart}`;
}

function enhanceHomePageAnimations(container, pathname) {
  if (pathname !== "/" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return [];
  }

  const cleanups = [];
  const ambientGlow = container.querySelector(
    'main > div[aria-hidden="true"][class*="fixed"][class*="blur-2xl"]',
  );
  const heroSection = container.querySelector("main > section");
  const heroFrame = container.querySelector("[data-hero-frame]");
  const heroTitle = container.querySelector("[data-hero-title]");
  const heroSubtitle = container.querySelector("[data-hero-subtitle]");
  const heroCtas = container.querySelector("[data-hero-ctas]");
  const heroMeta = container.querySelector("[data-hero-meta]");
  const heroOrbs = Array.from(container.querySelectorAll("[data-hero-orb]"));
  const heroDetails = Array.from(container.querySelectorAll("[data-hero-detail]"));
  const offerCard = container.querySelector("[data-reveal]");
  const offerGlow = container.querySelector("[data-offer-glow]");
  const offerLines = Array.from(container.querySelectorAll("[data-offer-line]"));

  let rafId = 0;
  let pointerX = window.innerWidth * 0.22;
  let pointerY = 140;
  let currentGlowX = pointerX;
  let currentGlowY = pointerY;

  const isDesktopMotion = () =>
    window.innerWidth >= 960 && window.matchMedia("(pointer: fine)").matches;

  const updateAmbientVisibility = () => {
    if (!ambientGlow) {
      return;
    }

    ambientGlow.style.display = isDesktopMotion() ? "" : "none";
  };

  const handlePointerMove = (event) => {
    if (!isDesktopMotion()) {
      return;
    }

    pointerX = event.clientX - 140;
    pointerY = event.clientY - 140;
  };

  const animateScene = (time) => {
    const heroDepth = isDesktopMotion() ? 1.5 : 1.2;
    const heroRange = Math.max(window.innerHeight * heroDepth, 1);
    const heroProgress = clamp(window.scrollY / heroRange, 0, 1);
    const offerProgress = offerCard
      ? clamp((window.innerHeight * 0.84 - offerCard.getBoundingClientRect().top) / (window.innerHeight * 0.92), 0, 1)
      : 0;
    const floatA = Math.sin(time / 3100);
    const floatB = Math.sin(time / 3600 + 1.2);

    if (ambientGlow) {
      currentGlowX += (pointerX - currentGlowX) * 0.08;
      currentGlowY += (pointerY - currentGlowY) * 0.08;
      ambientGlow.style.transform = `translate3d(${currentGlowX}px, ${currentGlowY}px, 0)`;
    }

    if (heroTitle) {
      const translateY = lerp(0, isDesktopMotion() ? -24 : -16, heroProgress);
      const scale = lerp(1, isDesktopMotion() ? 0.982 : 0.988, heroProgress);
      heroTitle.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    }

    if (heroSubtitle) {
      heroSubtitle.style.transform = `translate3d(0, ${lerp(0, isDesktopMotion() ? -36 : -24, heroProgress)}px, 0)`;
      heroSubtitle.style.opacity = String(lerp(1, isDesktopMotion() ? 0.52 : 0.58, heroProgress));
    }

    if (heroCtas) {
      heroCtas.style.transform = `translate3d(0, ${lerp(0, isDesktopMotion() ? -24 : -16, heroProgress)}px, 0)`;
      heroCtas.style.opacity = String(lerp(1, isDesktopMotion() ? 0.72 : 0.78, heroProgress));
    }

    if (heroMeta) {
      heroMeta.style.transform = `translate3d(0, ${lerp(0, isDesktopMotion() ? -20 : -12, heroProgress)}px, 0)`;
      heroMeta.style.opacity = String(lerp(1, isDesktopMotion() ? 0.7 : 0.76, heroProgress));
    }

    heroDetails.forEach((detailElement, detailIndex) => {
      const distance = isDesktopMotion() ? -18 : -10;
      const opacityTarget = isDesktopMotion() ? 0.58 : 0.65;
      const staggerOffset = detailIndex * 0.02;
      const detailProgress = clamp(heroProgress + staggerOffset, 0, 1);
      detailElement.style.transform = `translate3d(0, ${lerp(0, distance, detailProgress)}px, 0)`;
      detailElement.style.opacity = String(lerp(1, opacityTarget, detailProgress));
    });

    heroOrbs.forEach((orbElement, orbIndex) => {
      const direction = orbIndex === 0 ? 1 : -1;
      const floatOffsetY = (orbIndex === 0 ? floatA : floatB) * (orbIndex === 0 ? 14 : 18);
      const floatOffsetX = (orbIndex === 0 ? floatB : floatA) * (orbIndex === 0 ? 8 : 10);
      const scrollX = lerp(0, (orbIndex === 0 ? 2 : -2) * orbElement.clientWidth * 0.01, heroProgress);
      const scrollY = lerp(0, -(isDesktopMotion() ? 0.16 : 0.1) * orbElement.clientHeight, heroProgress);
      const scale = lerp(1, isDesktopMotion() ? 1.08 : 1.04, heroProgress);
      orbElement.style.transform = `translate3d(${floatOffsetX + scrollX * direction}px, ${floatOffsetY + scrollY}px, 0) scale(${scale})`;
    });

    if (heroFrame) {
      const inset = lerp(0, isDesktopMotion() ? 6 : 4, heroProgress);
      const radius = isDesktopMotion() ? 32 : 24;
      heroFrame.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`;
    }

    if (offerCard) {
      const verticalInset = lerp(isDesktopMotion() ? 20 : 18, isDesktopMotion() ? 0 : 2, offerProgress);
      const horizontalInset = lerp(isDesktopMotion() ? 16 : 14, isDesktopMotion() ? 0 : 2, offerProgress);
      const radius = isDesktopMotion() ? 32 : 24;
      offerCard.style.clipPath = `inset(${verticalInset}% ${horizontalInset}% ${verticalInset}% ${horizontalInset}% round ${radius}px)`;
    }

    offerLines.forEach((lineElement, lineIndex) => {
      const lineProgress = clamp(offerProgress * 1.15 - lineIndex * 0.1, 0, 1);
      lineElement.style.transform = `translate3d(${lerp(24, 0, lineProgress)}px, 0, 0)`;
      lineElement.style.opacity = String(lineProgress);
    });

    if (offerGlow) {
      offerGlow.style.opacity = String(lerp(0, 1, offerProgress));
      offerGlow.style.transform = `scale(${lerp(1, isDesktopMotion() ? 1.12 : 1.08, offerProgress)})`;
    }

    rafId = window.requestAnimationFrame(animateScene);
  };

  updateAmbientVisibility();
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("resize", updateAmbientVisibility);
  rafId = window.requestAnimationFrame(animateScene);

  cleanups.push(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("resize", updateAmbientVisibility);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  });

  return cleanups;
}

function enhanceLegacyAnimations(container, pathname) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return [];
  }

  const cleanups = [];
  const revealSelectors = [
    "[data-reveal]",
    "[data-hero-word]",
    "[data-hero-detail]",
    "[data-hero-subtitle]",
    "[data-hero-ctas]",
    "[data-hero-meta]",
    "[data-offer-line]",
  ];

  const revealElements = Array.from(container.querySelectorAll(revealSelectors.join(",")));
  const immediateRevealElements = new Set(
    pathname === "/"
      ? revealElements.filter((element) => element.closest("main > section:first-of-type"))
      : [],
  );

  revealElements.forEach((element, index) => {
    element.classList.add("legacy-animate-ready");
    element.style.setProperty("--legacy-delay", `${Math.min(index, 12) * 52}ms`);
  });

  if (immediateRevealElements.size > 0) {
    const immediateFrameId = window.requestAnimationFrame(() => {
      immediateRevealElements.forEach((element) => {
        element.classList.add("legacy-animate-in");
      });
    });

    cleanups.push(() => window.cancelAnimationFrame(immediateFrameId));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("legacy-animate-in");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    },
  );

  revealElements.forEach((element) => {
    if (!immediateRevealElements.has(element)) {
      observer.observe(element);
    }
  });
  cleanups.push(() => observer.disconnect());

  const heroFrame = pathname === "/" ? null : container.querySelector("[data-hero-frame]");
  const heroOrbs = pathname === "/" ? [] : Array.from(container.querySelectorAll("[data-hero-orb]"));
  const heroTitle = pathname === "/" ? null : container.querySelector("[data-hero-title]");
  const offerGlow = pathname === "/" ? null : container.querySelector("[data-offer-glow]");

  if (heroFrame || heroOrbs.length > 0 || heroTitle || offerGlow) {
    let rafId = 0;

    const updateParallax = () => {
      rafId = 0;

      const scrollY = window.scrollY;
      const limitedScroll = Math.min(scrollY, 720);

      if (heroFrame) {
        const insetAmount = Math.min(limitedScroll / 180, 18);
        heroFrame.style.clipPath = `inset(0% 0% ${insetAmount}% 0% round 24px)`;
      }

      if (heroTitle) {
        const tilt = Math.max(0, 8 - limitedScroll / 45);
        heroTitle.style.transform = `perspective(1000px) rotateX(${tilt}deg) translateY(${limitedScroll * 0.03}px)`;
      }

      heroOrbs.forEach((orbElement, orbIndex) => {
        const direction = orbIndex % 2 === 0 ? 1 : -1;
        const translateX = limitedScroll * 0.025 * direction;
        const translateY = limitedScroll * 0.045;
        orbElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${1 + limitedScroll / 2400})`;
      });

      if (offerGlow) {
        const glowOpacity = Math.min(0.92, limitedScroll / 260);
        const glowShift = Math.min(40, limitedScroll * 0.08);
        offerGlow.style.opacity = String(glowOpacity);
        offerGlow.style.transform = `translate3d(${glowShift}px, 0, 0) scale(${1 + limitedScroll / 1800})`;
      }
    };

    const requestUpdate = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(updateParallax);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    cleanups.push(() => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    });
  }

  const magneticElements = Array.from(container.querySelectorAll("[data-magnetic='true']"));

  magneticElements.forEach((element) => {
    const strength = 14;

    const handleMove = (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);
      const translateX = (offsetX / rect.width) * strength;
      const translateY = (offsetY / rect.height) * strength;
      element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    };

    const handleLeave = () => {
      element.style.transform = "";
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);
    cleanups.push(() => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
    });
  });

  return cleanups;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}
