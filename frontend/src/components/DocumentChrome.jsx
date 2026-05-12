import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Matches `AppHeader` `bg-white` for iOS / PWA status & overscroll chrome. */
const CHROME_HEADER = "#ffffff";
/** Full-bleed active call (`ActiveCall`). */
const CHROME_CALL = "#003388";

function chromeColorForPath(pathname) {
  if (/^\/leads\/[^/]+\/call$/.test(pathname)) return CHROME_CALL;
  if (pathname === "/dialer/call") return CHROME_CALL;
  return CHROME_HEADER;
}

/**
 * Keeps `theme-color` and root backgrounds aligned with the visible top chrome.
 * Call screen stays blue; all other routes match the white app header.
 */
export function DocumentChrome() {
  const { pathname } = useLocation();

  useEffect(() => {
    const color = chromeColorForPath(pathname);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  }, [pathname]);

  return null;
}
