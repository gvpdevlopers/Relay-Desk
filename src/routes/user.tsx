import { createFileRoute } from "@tanstack/react-router";
import { UserManagement } from "@/components/app/user-management";

export const Route = createFileRoute("/user")({
  ssr: false,
  component: UserManagement,
});
