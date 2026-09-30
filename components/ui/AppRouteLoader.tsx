"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import StairsLoader from "@/components/auth/StairsLoader";
import {
  ROUTE_LOADER_DONE,
  ROUTE_LOADER_EVENT,
  isInternalNavHref,
  readPendingLoader,
  startRouteLoader,
  type RouteLoaderPayload,
} from "@/lib/route-loader";

const MIN_VISIBLE_MS = 850;
const AFTER_READY_MS = 280;
const MAX_VISIBLE_MS = 12000;

function destReached(pathname: string, dest?: string) {
  if (!dest) return false;
  const clean = dest.split("#")[0].split("?")[0] || "/";
  return pathname === clean;
}

export default function AppRouteLoader() {
  const pathname = usePathname();
  const [view, setView] = useState({ open: false, title: "Loading...", subtitle: "Preparing environment" });
  const startedAt = useRef(0);
  const destRef = useRef<string | undefined>(undefined);
  const hideTimer = useRef<number | null>(null);

  function clearHide() {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function openLoader(payload: RouteLoaderPayload) {
    clearHide();
    startedAt.current = payload.startedAt || Date.now();
    destRef.current = payload.dest;
    setView({ open: true, title: payload.title, subtitle: payload.subtitle });
    window.setTimeout(() => {
      if (Date.now() - (payload.startedAt || Date.now()) >= MAX_VISIBLE_MS - 50) {
        scheduleHide();
      }
    }, MAX_VISIBLE_MS);
  }

  function scheduleHide() {
    clearHide();
    const elapsed = Date.now() - (startedAt.current || Date.now());
    const wait = Math.max(AFTER_READY_MS, MIN_VISIBLE_MS - elapsed + AFTER_READY_MS);
    hideTimer.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setView((s) => ({ ...s, open: false }));
          try {
            sessionStorage.removeItem("pow3folio_route_loader");
          } catch {
            /* ignore */
          }
        });
      });
    }, wait);
  }

  useEffect(() => {
    function onStart(event: Event) {
      const detail = (event as CustomEvent<RouteLoaderPayload>).detail;
      if (!detail) return;
      openLoader(detail);
    }
    function onDone() {
      destRef.current = undefined;
      scheduleHide();
    }
    window.addEventListener(ROUTE_LOADER_EVENT, onStart);
    window.addEventListener(ROUTE_LOADER_DONE, onDone);
    const pending = readPendingLoader();
    if (pending) openLoader(pending);
    return () => {
      window.removeEventListener(ROUTE_LOADER_EVENT, onStart);
      window.removeEventListener(ROUTE_LOADER_DONE, onDone);
      clearHide();
    };
  }, []);

  useEffect(() => {
    if (!view.open) return;
    const dest = destRef.current;
    if (!dest) return;
    if (!destReached(pathname, dest)) return;
    scheduleHide();
  }, [pathname, view.open]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const node = event.target as HTMLElement | null;
      const anchor = node?.closest?.("a");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!isInternalNavHref(href, pathname)) return;
      const dest = (href || "/").split("#")[0].split("?")[0] || "/";
      const label = (anchor.getAttribute("aria-label") || anchor.textContent || "next screen").replace(/\s+/g, " ").trim();
      startRouteLoader("Loading...", label.slice(0, 64) || "Opening the next screen", dest.startsWith("/") ? dest : pathname);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    function onPop() {
      startRouteLoader("Loading...", "Restoring the previous screen", window.location.pathname);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return <StairsLoader open={view.open} title={view.title} subtitle={view.subtitle} />;
}

export { startRouteLoader };
