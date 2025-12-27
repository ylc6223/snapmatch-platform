const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  settings: "Settings",
}

export function toNavigationLabel(segment: string) {
  if (segment in LABELS) return LABELS[segment]
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

