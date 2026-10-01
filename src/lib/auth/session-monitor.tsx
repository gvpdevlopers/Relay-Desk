// import { useEffect, useRef } from "react";
// import { useRouter } from "@tanstack/react-router";
// import { authClient, authEnabled, getBearerToken } from "./client";

// const SESSION_CHECK_INTERVAL = 3000;

// export function SessionMonitor() {
//   const router = useRouter();
//   const redirectingRef = useRef(false);

//   useEffect(() => {
//     if (!authEnabled) return;

//     let stopped = false;

//     const checkSession = async () => {
//       if (stopped || redirectingRef.current) return;

//       try {
//         const { data } = await authClient.getSession({
//           query: {
//             disableCookieCache: true,
//           },
//         });

//         if (stopped || redirectingRef.current) return;

//         // A missing session means the server-side session was revoked.
//         if (!data?.user) {
//           redirectingRef.current = true;

//           // Clear the preview bearer token if one exists.
//           // This is harmless in normal cookie-based deployments.
//           if (getBearerToken()) {
//             try {
//               sessionStorage.removeItem("grok-auth.bearer-token");
//             } catch {
//               // Ignore storage errors.
//             }
//           }

//           await router.navigate({
//             to: "/login",
//             replace: true,
//           });
//         }
//       } catch {
//         // Do NOT log the user out because of a temporary
//         // network/server error. Only a confirmed missing
//         // session should cause logout.
//       }
//     };

//     const interval = window.setInterval(
//       checkSession,
//       SESSION_CHECK_INTERVAL,
//     );

//     return () => {
//       stopped = true;
//       window.clearInterval(interval);
//     };
//   }, [router]);

//   return null;
// }
import { useEffect, useRef } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import { authClient, authEnabled } from "./client";

const SESSION_CHECK_INTERVAL = 3000;

const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function SessionMonitor() {
  const router = useRouter();
  const location = useLocation();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!authEnabled) return;

    // Never monitor the session on public authentication pages.
    if (PUBLIC_AUTH_ROUTES.includes(location.pathname)) {
      return;
    }

    let stopped = false;

    const checkSession = async () => {
      if (stopped || redirectingRef.current) return;

      try {
        const { data } = await authClient.getSession({
          query: {
            disableCookieCache: true,
          },
        });

        if (stopped || redirectingRef.current) return;

        // Session still exists — do absolutely nothing.
        if (data?.user) {
          return;
        }

        // Session no longer exists.
        redirectingRef.current = true;

        await router.navigate({
          to: "/login",
          replace: true,
        });
      } catch {
        // Ignore temporary network/server errors.
        // Never log the user out because of a failed request.
      }
    };

    const interval = window.setInterval(
      checkSession,
      SESSION_CHECK_INTERVAL,
    );

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [location.pathname, router]);

  return null;
}