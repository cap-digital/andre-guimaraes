import clsx from "clsx";

export function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const light = variant === "light";
  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tracking-tight",
          light ? "bg-white text-navy" : "bg-navy text-white"
        )}
      >
        AG
      </span>
      <span className="leading-none">
        <span
          className={clsx(
            "block text-[13px] font-semibold tracking-tight",
            light ? "text-white" : "text-ink"
          )}
        >
          André Guimarães
        </span>
        <span
          className={clsx(
            "block text-[10px] font-medium uppercase tracking-[0.18em]",
            light ? "text-white/60" : "text-muted"
          )}
        >
          Grupo
        </span>
      </span>
    </div>
  );
}
