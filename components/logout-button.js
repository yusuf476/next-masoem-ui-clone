"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal");
      }

      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setLoading(false);
    }
  }

  return (
    <button className="button button-secondary button-small" onClick={handleLogout} disabled={loading}>
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
