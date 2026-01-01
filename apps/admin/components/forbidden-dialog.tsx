"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { onForbidden, type ForbiddenDetail } from "@/lib/api/forbidden";
import { withAdminBasePath } from "@/lib/routing/base-path";

type State = {
  open: boolean;
  message: string;
  nextPath: string;
};

function getDefaultNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const path = window.location.pathname + window.location.search;
  return path.length > 0 ? path : "/dashboard";
}

export function ForbiddenDialog(props: { defaultOpen?: boolean; defaultDetail?: ForbiddenDetail } = {}) {
  const [state, setState] = useState<State>(() => ({
    open: Boolean(props.defaultOpen),
    message: props.defaultDetail?.message?.trim().length
      ? props.defaultDetail.message.trim()
      : "你没有权限访问该功能。",
    nextPath: props.defaultDetail?.nextPath?.trim().length
      ? props.defaultDetail.nextPath.trim()
      : "/dashboard",
  }));

  const backUrl = useMemo(() => {
    const next = state.nextPath && state.nextPath.startsWith("/") ? state.nextPath : "/dashboard";
    return next;
  }, [state.nextPath]);

  const loginUrl = useMemo(() => {
    const next = state.nextPath && state.nextPath.startsWith("/") ? state.nextPath : "/dashboard";
    const search = new URLSearchParams({ next }).toString();
    return withAdminBasePath(`/login?${search}`);
  }, [state.nextPath]);

  const handleLogout = async () => {
    try {
      await fetch(withAdminBasePath("/api/auth/logout"), { method: "POST" });
    } finally {
      window.location.href = loginUrl;
    }
  };

  useEffect(() => {
    return onForbidden((detail) => {
      setState({
        open: true,
        message: detail.message?.trim().length ? detail.message.trim() : "你没有权限访问该功能。",
        nextPath: detail.nextPath?.trim().length ? detail.nextPath.trim() : getDefaultNextPath(),
      });
    });
  }, []);

  return (
    <Dialog open={state.open} onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>无权限</DialogTitle>
          <DialogDescription>{state.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => (window.location.href = backUrl)}>
            返回
          </Button>
          <Button onClick={handleLogout}>切换账号</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

