// components/ForceHomeOnLoad.tsx
"use client";
import { useEffect } from "react";

export default function ForceHomeOnLoad() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if the page load was a reload. Robustly support older browsers.
    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType?.("navigation") ?? [];
      if (navEntries.length > 0) {
        // navigation type: "navigate" | "reload" | "back_forward" | "prerender"
        isReload = (navEntries[0] as any).type === "reload";
      } else if ((performance as any).navigation) {
        // fallback (deprecated API)
        isReload = (performance as any).navigation.type === 1; // 1 === TYPE_RELOAD
      }
    } catch {
      // if anything goes wrong, default to false
      isReload = false;
    }

    if (!isReload) return; // only act on reloads

    const desiredId = "home"; // change if your id is different
    const desiredHash = document.getElementById(desiredId) ? `#${desiredId}` : "#";

    // Replace the URL without adding a history entry
    window.history.replaceState(null, "", desiredHash);

    // scroll if element exists (poll briefly in case it mounts after layout)
    const scrollToHome = () => {
      const el = document.getElementById(desiredId);
      if (el) {
        el.scrollIntoView({ behavior: "auto" });
        return true;
      }
      return false;
    };

    if (!scrollToHome()) {
      let attempts = 0;
      const iv = setInterval(() => {
        attempts += 1;
        if (scrollToHome() || attempts >= 10) {
          clearInterval(iv);
          if (attempts >= 10 && !document.getElementById(desiredId)) {
            window.scrollTo(0, 0);
          }
        }
      }, 50);
      return () => clearInterval(iv);
    }

    return;
  }, []);

  return null;
}
