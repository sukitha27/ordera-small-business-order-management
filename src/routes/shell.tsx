import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/shell")({
  component: ShellRedirect,
});

function ShellRedirect() {
  return <Navigate to="/" />;
}