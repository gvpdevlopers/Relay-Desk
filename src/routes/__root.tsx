import { SessionMonitor } from "@/lib/auth/session-monitor";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { applyTheme, useTheme } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Relay Desk";

const THEME_BOOT = `(function(){try{var r=JSON.parse(localStorage.getItem("relay-desk-theme")||"{}");var t=r.state&&r.state.theme;if(t!=="light"&&t!=="dark")t="dark";var e=document.documentElement;e.classList.add(t);e.style.colorScheme=t;}catch(e){document.documentElement.classList.add("dark");}})();`;

function ThemeSync() {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{ className: "font-sans" }}
    />
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0c0d10" },
      {
        name: "description",
        content: "Post-processing desk for social media order refills, speedups, and refunds.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
    ],
    scripts: [{ children: THEME_BOOT }],
  }),
  component: () => (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <SessionMonitor />
          <Outlet />
        </AuthProvider>
        <ThemeSync />
        <Scripts />
      </body>
    </html>
  ),
});
