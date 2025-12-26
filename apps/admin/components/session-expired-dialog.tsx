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
import { onSessionExpired, type SessionExpiredDetail } from "@/lib/api/session-expired";

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

export function SessionExpiredDialog(props: {
  defaultOpen?: boolean;
  defaultDetail?: SessionExpiredDetail;
} = {}) {
  const [state, setState] = useState<State>(() => ({
    open: Boolean(props.defaultOpen),
    message: props.defaultDetail?.message?.trim().length
      ? props.defaultDetail.message.trim()
      : "登录已失效，请重新登录后继续。",
    nextPath: props.defaultDetail?.nextPath?.trim().length
      ? props.defaultDetail.nextPath.trim()
      : "/dashboard",
  }));

  const nextUrl = useMemo(() => {
    const next = state.nextPath && state.nextPath.startsWith("/") ? state.nextPath : "/dashboard";
    const search = new URLSearchParams({ next }).toString();
    return `/login?${search}`;
  }, [state.nextPath]);

  useEffect(() => {
    return onSessionExpired((detail: SessionExpiredDetail) => {
      setState({
        open: true,
        message: detail.message?.trim().length ? detail.message.trim() : "登录已失效，请重新登录后继续。",
        nextPath: detail.nextPath?.trim().length ? detail.nextPath.trim() : getDefaultNextPath(),
      });
    });
  }, []);

  return (
    <Dialog open={state.open} onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>会话已失效</DialogTitle>
          <DialogDescription>{state.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, open: false }))}>
            稍后再说
          </Button>
          <Button onClick={() => (window.location.href = nextUrl)}>重新登录</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
