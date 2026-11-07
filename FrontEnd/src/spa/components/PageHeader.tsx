import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex animate-rise flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display text-[44px] md:text-[56px]">{title}</h1>
        {subtitle && (
          <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** "01 — Latest uploads" style section heading with a hairline rule. */
export function SectionHeading({
  index,
  title,
  right,
}: {
  index?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      {index && <span className="eyebrow text-brand">{index}</span>}
      <h2 className="display text-[28px]">{title}</h2>
      <span className="hidden h-px flex-1 bg-[var(--color-border)] sm:block" />
      {right}
    </div>
  );
}
