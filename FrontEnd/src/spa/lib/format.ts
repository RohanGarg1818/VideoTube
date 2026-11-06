const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatViews(n?: number): string {
  return compact.format(Math.max(0, n ?? 0));
}

export const formatCount = formatViews;

export function plural(n: number | undefined, word: string) {
  const v = n ?? 0;
  return `${formatCount(v)} ${word}${v === 1 ? "" : "s"}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatLongDuration(seconds?: number): string {
  const s = Math.floor(seconds ?? 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m} min`;
  return `${s}s`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, unit] of units) {
    if (diff >= secs) {
      const v = Math.floor(diff / secs);
      return `${v} ${unit}${v === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type OwnerLike = {
  _id?: string;
  username?: string;
  fullName?: string;
  avatar?: string;
};

export function getOwner(v: { owner?: unknown } | undefined): OwnerLike | null {
  const o = v?.owner;
  if (!o || typeof o === "string") return null;
  if (Array.isArray(o)) return (o[0] as OwnerLike) ?? null;
  return o as OwnerLike;
}

export const initials = (name?: string) =>
  (name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
