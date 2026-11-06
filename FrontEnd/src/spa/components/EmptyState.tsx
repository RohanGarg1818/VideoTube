import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass mx-auto flex max-w-lg animate-fade-up flex-col items-center justify-center rounded-3xl px-6 py-14 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-fuchsia-500/30 blur-2xl" />
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className="h-7 w-7 text-fuchsia-300" />
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw /> Try again
          </Button>
        )
      }
    />
  );
}
