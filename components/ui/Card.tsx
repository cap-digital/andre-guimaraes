import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line bg-white shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={clsx("flex flex-col animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className={clsx("px-2 pb-4 pt-3 sm:px-4", bodyClassName)}>
        {children}
      </div>
    </Card>
  );
}
