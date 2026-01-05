import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { generateMeta } from "@/lib/utils";
import { withAdminBasePath } from "@/lib/routing/base-path";
import { LogoutButton } from "./logout-button";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Forbidden",
    description: "You don't have permission to access this page.",
  });
}

function normalizeNext(input: unknown) {
  const next = typeof input === "string" ? input : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard/analytics";
  return next;
}

function normalizeMessage(input: unknown) {
  const message = typeof input === "string" ? input : "";
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : "你没有权限访问该页面，请联系管理员开通权限。";
}

export default function ForbiddenPage({
  searchParams,
}: {
  searchParams?: { next?: string; message?: string };
}) {
  const nextPath = normalizeNext(searchParams?.next);
  const message = normalizeMessage(searchParams?.message);

  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">403</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Forbidden
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">{message}</p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button asChild size="lg">
            <Link href={nextPath}>返回</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="hidden lg:block">
        <img src="/admin/images/404.svg" alt="Forbidden visual" className="object-contain" />
      </div>
    </div>
  );
}

