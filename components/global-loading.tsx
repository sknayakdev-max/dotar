"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function GlobalLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const stop = () => setLoading(false);

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.target !== "_blank" && !link.hasAttribute("download")) {
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) start();
      }

      const button = target?.closest("button") as HTMLButtonElement | null;
      const action = `${button?.title || ""} ${button?.ariaLabel || ""} ${button?.textContent || ""}`.toLowerCase();
      if (button && /(delete|suspend|restore|logout|save|update|create|submit|record|approve|reject)/.test(action)) {
        start();
        window.setTimeout(stop, 15000);
      }
    };

    const handleChange = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("select.inline-status")) {
        start();
        window.setTimeout(stop, 15000);
      }
    };

    const handleSubmit = () => {
      start();
      window.setTimeout(stop, 15000);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("change", handleChange, true);
    window.addEventListener("app:loading-start", start);
    window.addEventListener("app:loading-stop", stop);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("change", handleChange, true);
      window.removeEventListener("app:loading-start", start);
      window.removeEventListener("app:loading-stop", stop);
    };
  }, []);

  useEffect(() => setLoading(false), [pathname]);

  if (!loading) return null;
  return <div className="global-loading-overlay" role="status" aria-live="polite" aria-label="Loading">
    <div className="global-loading-card"><span className="global-loading-spinner" /><span>Processing…</span></div>
  </div>;
}
