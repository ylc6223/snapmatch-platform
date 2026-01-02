import type { ValueTransformer } from "typeorm";

export const bigintMsTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => (value === null || value === undefined ? null : value),
  from: (value: unknown) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  },
};

