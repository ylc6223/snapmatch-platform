"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withAdminBasePath } from "@/lib/routing/base-path";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch(withAdminBasePath("/api/auth/logout"), { method: "POST" });
    } finally {
      window.location.href = withAdminBasePath("/login");
    }
  };

  return (
    <Button onClick={handleLogout} size="lg" variant="ghost">
      切换账号 <ArrowRight className="ms-2 h-4 w-4" />
    </Button>
  );
}
