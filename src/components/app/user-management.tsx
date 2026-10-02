import { Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Member = { id: string; name: string; email: string; role?: string | null; banned?: boolean };
type Editor = { id?: string; name: string; email: string; password: string };
const emptyEditor: Editor = { name: "", email: "", password: "" };

export function UserManagement() {
  const { user, isPending } = useCurrentUserState();
  const isAdmin = user?.role === "admin";
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Member | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 20, offset: page * 20, sortBy: "name", sortDirection: "asc" },
      });
      if (error) throw new Error(error.message || "Unable to load users.");
      setMembers((data?.users ?? []) as Member[]);
      setTotal(data?.total ?? 0);
      if (page > 0 && !data?.users.length) setPage(page - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isAdmin) void loadMembers();
  }, [isAdmin, loadMembers]);

  async function mutate(
    action: () => Promise<{ error?: { message?: string } | null }>,
    message: string,
    close?: () => void,
  ) {
    setBusy(true);
    try {
      const result = await action();
      if (result.error) throw new Error(result.error.message || "Unable to save changes.");
      toast.success(message);
      close?.();
      await loadMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  }

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    const name = editor.name.trim();
    const email = editor.email.trim().toLowerCase();
    if (!name || !email) return;
    void mutate(
      () =>
        editor.id
          ? authClient.admin.updateUser({ userId: editor.id, data: { name, email } })
          : authClient.admin.createUser({ name, email, password: editor.password, role: "user" }),
      editor.id ? "User updated." : "User created.",
      () => setEditor(null),
    );
  }

  if (isPending)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-fg">Loading workspace…</div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto text-lg font-medium tracking-tight">
            Relay Desk
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/user" aria-current="page">
              User
            </Link>
          </Button>
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-subtle">Administration</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">Users</h1>
            <p className="mt-2 text-sm text-muted">
              Manage employee accounts and access to Relay Desk.
            </p>
          </div>
          <Button onClick={() => setEditor({ ...emptyEditor })} disabled={busy}>
            Create user
          </Button>
        </div>
        <section className="rounded-xl border border-border bg-surface" aria-label="User accounts">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-medium">
              Accounts <span className="text-muted">({total})</span>
            </h2>
            <Button variant="ghost" onClick={() => void loadMembers()} disabled={loading || busy}>
              Refresh
            </Button>
          </div>
          {error ? (
            <div role="alert" className="p-5 text-sm text-muted">
              {error}{" "}
              <Button variant="outline" onClick={() => void loadMembers()}>
                Retry
              </Button>
            </div>
          ) : loading ? (
            <p className="p-5 text-sm text-muted">Loading users…</p>
          ) : members.length === 0 ? (
            <p className="p-5 text-sm text-muted">No users yet. Create a user to get started.</p>
          ) : (
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center"
                >
                  <div className="min-w-0 md:mr-auto">
                    <p className="break-words font-medium">
                      {member.name}
                      {member.id === user.id ? " (you)" : ""}
                    </p>
                    <p className="break-all text-sm text-muted">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border px-3 py-1 text-xs">
                      {member.role === "admin" ? "Admin" : "User"}
                    </span>
                    <span className="text-xs text-muted">
                      {member.banned ? "Disabled" : "Active"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setEditor({
                          id: member.id,
                          name: member.name,
                          email: member.email,
                          password: "",
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setPassword("");
                        setPasswordTarget(member);
                      }}
                    >
                      Reset password
                    </Button>
                    {member.role !== "admin" && (
                      <>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              () =>
                                member.banned
                                  ? authClient.admin.unbanUser({ userId: member.id })
                                  : authClient.admin.banUser({
                                      userId: member.id,
                                      banReason: "Disabled by administrator",
                                    }),
                              member.banned ? "User enabled." : "User disabled.",
                            )
                          }
                        >
                          {member.banned ? "Enable" : "Disable"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => setDeleting(member)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
            <p className="text-sm text-muted">
              Page {page + 1} of {Math.max(1, Math.ceil(total / 20))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0 || loading || busy}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={(page + 1) * 20 >= total || loading || busy}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{editor?.id ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {editor?.id
              ? "Update the account name and email address."
              : "Create an employee account with a temporary password."}
          </DialogDescription>
          {editor && (
            <form onSubmit={saveUser} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full name</Label>
                <Input
                  id="user-name"
                  required
                  maxLength={100}
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email address</Label>
                <Input
                  id="user-email"
                  type="email"
                  required
                  value={editor.email}
                  onChange={(e) => setEditor({ ...editor, email: e.target.value })}
                  disabled={busy}
                />
              </div>
              {!editor.id && (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Temporary password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={editor.password}
                    onChange={(e) => setEditor({ ...editor, password: e.target.value })}
                    disabled={busy}
                  />
                  <p className="text-xs text-muted">At least 8 characters.</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save user"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            Permanently delete {deleting?.name} ({deleting?.email}) and their login access. This
            cannot be undone.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (deleting)
                  void mutate(
                    () => authClient.admin.removeUser({ userId: deleting.id }),
                    "User deleted.",
                    () => setDeleting(null),
                  );
              }}
            >
              {busy ? "Deleting…" : "Delete user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={passwordTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPasswordTarget(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {passwordTarget?.name}.</DialogDescription>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (passwordTarget && !busy)
                void mutate(
                  () =>
                    authClient.admin.setUserPassword({
                      userId: passwordTarget.id,
                      newPassword: password,
                    }),
                  "Password updated.",
                  () => {
                    setPasswordTarget(null);
                    setPassword("");
                  },
                );
            }}
          >
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setPasswordTarget(null)}
              >
                Cancel
              </Button>
              <Button disabled={busy}>{busy ? "Saving…" : "Reset password"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
