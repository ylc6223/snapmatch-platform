import { Button } from "@/components/ui/button";
import { generateMeta } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { SessionExpiredDialog } from "@/components/session-expired-dialog";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Session Expired",
    description: "Your session has expired or you have been signed out.",
  });
}

function normalizeNext(input: unknown) {
  const next = typeof input === "string" ? input : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function normalizeMessage(input: unknown) {
  const message = typeof input === "string" ? input : "";
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : "登录已失效或已被踢下线，请重新登录后继续。";
}

export default function SessionExpiredPage({
  searchParams,
}: {
  searchParams?: { next?: string; message?: string };
}) {
  const nextPath = normalizeNext(searchParams?.next);
  const message = normalizeMessage(searchParams?.message);
  const loginUrl = `/login?${new URLSearchParams({ next: nextPath }).toString()}`;

  return (
    <div className="grid h-screen items-center bg-background pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">401</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-7xl">
          Session expired
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          {message}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button asChild size="lg">
            <a href={loginUrl}>重新登录</a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href={nextPath}>
              返回上页 <ArrowRight className="ms-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <img src={`/images/404.svg`} alt="Session expired visual" className="object-contain" />
      </div>

      {/* A+B1：在 SSR/刷新场景也能出现交互式提示（而不是直接跳登录页） */}
      <SessionExpiredDialog
        defaultOpen
        defaultDetail={{
          message,
          nextPath,
        }}
      />
    </div>
  );
}

