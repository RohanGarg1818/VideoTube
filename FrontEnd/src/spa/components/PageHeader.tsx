import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex animate-fade-up flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 ring-1 ring-inset ring-white/15">
            <Icon className="h-6 w-6 text-fuchsia-200" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
