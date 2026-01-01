"use client";

export type ForbiddenDetail = {
  message?: string;
  nextPath?: string;
};

const target = new EventTarget();
const EVENT_NAME = "forbidden";

export function emitForbidden(detail: ForbiddenDetail = {}) {
  target.dispatchEvent(new CustomEvent<ForbiddenDetail>(EVENT_NAME, { detail }));
}

export function onForbidden(handler: (detail: ForbiddenDetail) => void) {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<ForbiddenDetail>;
    handler(custom.detail ?? {});
  };
  target.addEventListener(EVENT_NAME, listener);
  return () => target.removeEventListener(EVENT_NAME, listener);
}

