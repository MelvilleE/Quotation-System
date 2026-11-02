"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <Button variant="outline" onClick={logout} disabled={submitting}>
      {submitting ? "Signing out…" : "Sign Out"}
    </Button>
  );
}
