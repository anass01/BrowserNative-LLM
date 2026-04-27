"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallButton({ collapsed }: { collapsed?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent browser's native mini-infobar prompt
      e.preventDefault();
      // Stash the event so it can be triggered when the user clicks 'Install'
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // App was just installed
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Initial check: if already running as standalone, hide button
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!isInstallable) return null;

  return (
    <div className={`px-3 mb-3 ${collapsed ? "flex justify-center" : ""}`}>
      <button
        onClick={() => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === "accepted") {
              setIsInstallable(false);
            }
            setDeferredPrompt(null);
          });
        }}
        className={`flex items-center gap-2 rounded-lg text-sm font-medium
          bg-[#1a1a1e] border border-[#6366f1]/30 text-[#6366f1]
          hover:bg-[#6366f1]/10 hover:border-[#6366f1]/60
          transition-all duration-150 shadow-sm
          ${collapsed ? "w-10 h-10 justify-center px-0" : "w-full px-3 py-2.5"}
        `}
        title="Install Desktop App"
      >
        <Download size={15} className="shrink-0" />
        {!collapsed && <span>Install App</span>}
      </button>
    </div>
  );
}
