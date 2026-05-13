import type { ReactNode } from "react";

export function NotebookPageHeader({
  action,
  eyebrow,
  subtitle,
  title
}: {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-sm font-bold text-primary">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-5xl font-extrabold leading-none text-primary md:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-3xl text-base italic leading-7 text-on-surface-variant">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function WashiTape({
  className = "",
  tone = "green"
}: {
  className?: string;
  tone?: "cream" | "green" | "orange";
}) {
  const color =
    tone === "green" ? "washi-green" : tone === "orange" ? "washi-orange" : "washi-cream";
  return <span aria-hidden="true" className={`washi-tape ${color} ${className}`} />;
}

export function SketchIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary text-base font-extrabold text-primary">
      {children}
    </span>
  );
}

export function RecipePhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="paper-dots-block flex h-full min-h-56 flex-col items-center justify-center gap-3 border-2 border-dashed border-outline text-center text-sm font-bold text-outline">
      <span className="text-4xl">+</span>
      <span>{label}</span>
    </div>
  );
}
