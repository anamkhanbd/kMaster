/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

interface AdBannerProps {
  theme: "light" | "dark";
}

export default function AdBanner({ theme }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous scripts/iframes to ensure healthy hot reload and transition
    containerRef.current.innerHTML = "";

    try {
      // Define configuration options on the window object
      (window as any).atOptions = {
        key: "1db833156a625059c199f61f676c8b04",
        format: "iframe",
        height: 90,
        width: 728,
        params: {},
      };

      // Create primary ad execution script element
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://www.highperformanceformat.com/1db833156a625059c199f61f676c8b04/invoke.js";
      script.async = true;

      // Append to key container layout node
      containerRef.current.appendChild(script);
    } catch (e) {
      console.error("Ad script configuration issue:", e);
    }
  }, [theme]); // Re-execute on theme changes if necessary for iframe contrast

  return (
    <div className="w-full flex flex-col items-center justify-center my-3 select-none">
      <span className="text-[9px] uppercase tracking-widest text-slate-400/60 dark:text-slate-500/60 mb-1 font-mono font-bold">
        Sponsored Advertisement
      </span>
      <div 
        ref={containerRef} 
        id="ad-banner-placement"
        className="w-full max-w-[728px] h-[90px] min-h-[90px] relative rounded-xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-center shadow-inner"
        style={{ width: "728px", height: "90px" }}
      />
    </div>
  );
}
