import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
//import { useCurrentUserState } from "@/lib/auth/use-current-user";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// export const Route = createFileRoute("/admin/team")({
//   component: AdminTeam,
// });
export const Route = createFileRoute("/admin/team")({
  ssr: false,
  component: AdminTeam,
});

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean;
};
type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

function AdminTeam() {
  //const { user, isPending } = useCurrentUserState();
const [user, setUser] = useState<SessionUser | null>(null);
const [isPending, setIsPending] = useState(true);

useEffect(() => {
  async function loadSession() {
    try {
      const response = await fetch("/api/auth/get-session", {
        credentials: "include",
      });

      const data = await response.json();

      if (data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role ?? null,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }

  void loadSession();
}, []);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [creating, setCreating] = useState(false);

  async function loadMembers() {
    setLoading(true);

    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 100,
        sortBy: "name",
        sortDirection: "asc",
      },
    });

    if (error) {
      toast.error(
        error.message || "Unable to load team members.",
      );
      setLoading(false);
      return;
    }

    setMembers((data?.users ?? []) as TeamMember[]);
    setLoading(false);
  }

  // useEffect(() => {
  //   if (user?.role === "admin") {
  //     void loadMembers();
  //   } else {
  //     setLoading(false);
  //   }
  // }, [user?.role]);
  useEffect(() => {
  if (user?.role === "admin") {
    void loadMembers();
  } else if (user) {
    setLoading(false);
  }
}, [user]);

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="text-sm text-muted">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  async function createEmployee() {
    if (!name.trim()) {
      toast.error("Please enter the employee name.");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter the employee email.");
      return;
    }

    if (password.length < 8) {
      toast.error(
        "Temporary password must be at least 8 characters.",
      );
      return;
    }

    setCreating(true);

    const { error } = await authClient.admin.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "user",
    });

    if (error) {
      toast.error(
        error.message || "Unable to create employee.",
      );
      setCreating(false);
      return;
    }

    toast.success("Employee account created successfully.");

    setName("");
    setEmail("");
    setPassword("");

    await loadMembers();

    setCreating(false);
  }

  async function resetPassword(member: TeamMember) {
    const newPassword = window.prompt(
      `Enter a new temporary password for ${member.name}:`,
    );

    if (!newPassword) {
      return;
    }

    if (newPassword.length < 8) {
      toast.error(
        "Password must be at least 8 characters.",
      );
      return;
    }

    const { error } =
      await authClient.admin.setUserPassword({
        userId: member.id,
        newPassword,
      });

    if (error) {
      toast.error(
        error.message || "Unable to reset password.",
      );
      return;
    }

    toast.success(
      "Employee password updated successfully.",
    );
  }

  async function disableEmployee(member: TeamMember) {
    const { error } =
      await authClient.admin.banUser({
        userId: member.id,
        banReason: "Disabled by administrator",
      });

    if (error) {
      toast.error(
        error.message || "Unable to disable employee.",
      );
      return;
    }

    toast.success(
      `${member.name} has been disabled.`,
    );

    await loadMembers();
  }

  async function enableEmployee(member: TeamMember) {
    const { error } =
      await authClient.admin.unbanUser({
        userId: member.id,
      });

    if (error) {
      toast.error(
        error.message || "Unable to enable employee.",
      );
      return;
    }

    toast.success(
      `${member.name} has been enabled.`,
    );

    await loadMembers();
  }

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">

        {/* Header */}
        <header>
          <p className="text-xs uppercase tracking-[0.16em] text-subtle">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-tight">
            Team Members
          </h1>

          <p className="mt-2 text-sm text-muted">
            Create and manage employee accounts.
          </p>
        </header>

        {/* Create Employee */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-medium">
            Create Employee
          </h2>

          <p className="mt-1 text-sm text-muted">
            Create login credentials for a staff member.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <Input
              placeholder="Full name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />

            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <Input
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

          </div>

          <div className="mt-4">
            <Button
              onClick={() => void createEmployee()}
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Employee"}
            </Button>
          </div>
        </section>

        {/* Employees */}
        <section className="rounded-xl border border-border bg-surface">

          <div className="border-b border-border p-5">
            <h2 className="font-medium">
              Team Members
            </h2>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-muted">
              Loading team members...
            </div>
          ) : members.length === 0 ? (
            <div className="p-5 text-sm text-muted">
              No team members found.
            </div>
          ) : (
            <div className="divide-y divide-border">

              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center"
                >

                  <div className="mr-auto">
                    <p className="font-medium">
                      {member.name}
                    </p>

                    <p className="text-sm text-muted">
                      {member.email}
                    </p>
                  </div>

                  <span className="rounded-full border border-border px-3 py-1 text-xs">
                    {member.role === "admin"
                      ? "Admin"
                      : "Employee"}
                  </span>

                  {member.banned ? (
                    <span className="text-xs text-red-400">
                      Disabled
                    </span>
                  ) : (
                    <span className="text-xs text-ok">
                      Active
                    </span>
                  )}

                  <div className="flex flex-wrap gap-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void resetPassword(member)
                      }
                    >
                      Reset Password
                    </Button>

                    {member.banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void enableEmployee(member)
                        }
                      >
                        Enable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void disableEmployee(member)
                        }
                      >
                        Disable
                      </Button>
                    )}

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>
      </div>
    </main>
  );
}