import { auth } from "./server";

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return {
      ok: false as const,
      response: Response.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      ),
    };
  }

  const role = (session.user as { role?: string | null }).role ?? null;

  if (role !== "admin") {
    return {
      ok: false as const,
      response: Response.json(
        {
          success: false,
          error: "Admin access required.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}