import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
//import { RedirectToSignIn } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  async function createDemoUser() {
  const { error } = await authClient.signUp.email({
    email: "admin@example.com",
    password: "Admin@12345",
    name: "Admin",
  });

  if (error) {
    toast.error(error.message || "Failed to create account");
    return;
  }

  toast.success("Demo account created!");
}
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={() => void createDemoUser()}
>
  Create Demo Account
</Button>
  const { user, isPending } = useCurrentUserState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  //const [providerLoading, setProviderLoading] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-fg">
        <div className="text-sm text-muted">Checking your session…</div>
      </main>
    );
  }

 if (user) {
  return <Navigate to="/" replace />;
}

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/",
    });

    if (error) {
      toast.error(error.message || "Unable to sign in.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  // async function handleProviderLogin(providerId: string) {
  //   try {
  //     setProviderLoading(providerId);

  //     await signIn(providerId, {
  //       callbackURL: "/",
  //       errorCallbackURL: "/login",
  //     });
  //   } catch (error) {
  //     toast.error(
  //       error instanceof Error ? error.message : "Unable to sign in.",
  //     );
  //     setProviderLoading(null);
  //   }
  // }

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">

          {/* Brand / intro */}
          <section className="hidden border-r border-border bg-surface-2/30 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-md border border-border bg-surface">
                  <span className="text-sm font-semibold">R</span>
                </div>

                <div>
                  <p className="text-sm font-medium">Relay Desk</p>
                  <p className="text-xs text-muted">
                    Post-processing workspace
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-md">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                  Team workspace
                </p>

                <h1 className="mt-4 text-4xl font-medium tracking-tight">
                  Keep every request moving.
                </h1>

                <p className="mt-4 text-sm leading-6 text-muted">
                  Manage refills, speedups, cancellations, refunds and pending
                  requests from one focused workspace.
                </p>
              </div>
            </div>

            <p className="text-xs text-subtle">
              Internal team workspace
            </p>
          </section>

          {/* Login */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <div className="lg:hidden">
                <p className="text-sm font-medium">Relay Desk</p>
                <p className="text-xs text-muted">Team workspace</p>
              </div>

              <div className="mt-8 lg:mt-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-medium tracking-tight">
                  Sign in
                </h2>

                <p className="mt-2 text-sm text-muted">
                  Use your team account to access the workspace.
                </p>
              </div>

              {!authEnabled ? (
                <div className="mt-8 rounded-md border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
                  Authentication is currently disabled.
                </div>
              ) : (
                <>
                  <form onSubmit={handleEmailLogin} className="mt-8 space-y-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />

                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />

                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="h-11 pl-10 pr-11"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Signing in…" : "Sign in"}
                      {!loading && <ArrowRight />}
                    </Button>
                  </form>

                  {/* <div className="my-7 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-subtle">OR</span>
                    <div className="h-px flex-1 bg-border" />
                  </div> */}

                  {/* <div className="space-y-2">
                    {GROK_PROVIDERS.map((provider) => (
                      <Button
                        key={provider.providerId}
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={providerLoading !== null}
                        onClick={() =>
                          void handleProviderLogin(provider.providerId)
                        }
                      >
                        {providerLoading === provider.providerId
                          ? "Connecting…"
                          : `Continue with ${provider.label}`}
                      </Button>
                    ))}
                  </div> */}

                 {/* <div className="mt-6 text-center text-sm text-muted">
  Don't have an account?{" "}
  <Link
    to="/signup"
    className="font-medium text-fg underline underline-offset-4"
  >
    Sign up
  </Link>
</div> */}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}