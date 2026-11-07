import { Outlet } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAsync } from "../hooks/useAsync";
import { VideoAPI } from "../services/endpoints";

/** A slowly drifting wall of real thumbnails from the platform. */
function ReelWall() {
  const { data } = useAsync(
    () => VideoAPI.list({ sortBy: "views", limit: 18 }).then((p) => p.docs),
    [],
  );
  const thumbs = (data ?? [])
    .map((v) => v.thumbnail)
    .filter(Boolean) as string[];
  const columns = [0, 1, 2].map((c) => {
    const col = thumbs.filter((_, i) => i % 3 === c);
    return col.length ? [...col, ...col] : Array.from({ length: 8 }, () => "");
  });

  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-3 overflow-hidden p-3 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
      {columns.map((col, c) => (
        <div
          key={c}
          className="flex flex-col gap-3"
          style={{
            animation: `reel ${60 + c * 12}s linear infinite ${c % 2 ? "reverse" : "normal"}`,
          }}
        >
          {col.map((src, i) =>
            src ? (
              <img
                key={i}
                src={src}
                alt=""
                className="aspect-video w-full rounded-lg object-cover opacity-60 grayscale-[35%]"
              />
            ) : (
              <div
                key={i}
                className="aspect-video w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
              />
            ),
          )}
        </div>
      ))}
      <style>{`@keyframes reel { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        @media (prefers-reduced-motion: reduce) { [style*="reel"] { animation: none !important } }`}</style>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-[var(--color-border)] lg:block">
        <ReelWall />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <div className="max-w-md">
            <p className="eyebrow mb-6 flex items-center gap-2.5">
              <span className="rec-dot" /> Rolling since 2026
            </p>
            <h2 className="display text-[64px] xl:text-[80px]">
              Every story
              <br />
              deserves <span className="italic text-brand">a screen.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              Upload your work, find your audience and keep the conversation
              going — all in one place.
            </p>
          </div>
          <p className="eyebrow text-[10px]">
            © {new Date().getFullYear()} VideoTube
          </p>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-16 items-center px-6 lg:hidden">
          <Logo />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
