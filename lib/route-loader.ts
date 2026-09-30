"use client";

export const ROUTE_LOADER_KEY = "pow3folio_route_loader";
export const ROUTE_LOADER_EVENT = "pow:route-loader";
export const ROUTE_LOADER_DONE = "pow:route-loader-done";

export type RouteLoaderPayload = {
  title: string;
  subtitle: string;
  dest?: string;
  startedAt: number;
};

export function startRouteLoader(title: string, subtitle: string, dest?: string) {
  if (typeof window === "undefined") return;
  const payload: RouteLoaderPayload = {
    title,
    subtitle,
    dest,
    startedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(ROUTE_LOADER_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ROUTE_LOADER_EVENT, { detail: payload }));
}

export function stopRouteLoader() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ROUTE_LOADER_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ROUTE_LOADER_DONE));
}

export function readPendingLoader(): RouteLoaderPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ROUTE_LOADER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RouteLoaderPayload;
    if (!parsed || typeof parsed.title !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function pathOnly(href: string) {
  const cut = href.split("#")[0].split("?")[0];
  return cut || "/";
}

export function isInternalNavHref(href: string | null, currentPath: string) {
  if (!href) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;
  if (href.startsWith("#")) return false;
  let path = href;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return false;
      path = url.pathname + url.search + url.hash;
    } catch {
      return false;
    }
  } else if (!href.startsWith("/")) {
    return false;
  }
  return pathOnly(path) !== pathOnly(currentPath);
}
