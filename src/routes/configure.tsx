import { createFileRoute, redirect } from "@tanstack/react-router";

// /configure has been merged into /localisability — redirect for back-compat.
export const Route = createFileRoute("/configure")({
  beforeLoad: () => {
    throw redirect({ to: "/localisability" });
  },
});
