"use client";

export type SessionExpiredDetail = {
  message?: string;
  nextPath?: string;
};

const target = new EventTarget();
const EVENT_NAME = "session-expired";

export function emitSessionExpired(detail: SessionExpiredDetail = {}) {
  target.dispatchEvent(new CustomEvent<SessionExpiredDetail>(EVENT_NAME, { detail }));
}

export function onSessionExpired(handler: (detail: SessionExpiredDetail) => void) {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<SessionExpiredDetail>;
    handler(custom.detail ?? {});
  };
  target.addEventListener(EVENT_NAME, listener);
  return () => target.removeEventListener(EVENT_NAME, listener);
}

