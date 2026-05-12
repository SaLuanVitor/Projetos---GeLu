import { Link } from "@/i18n/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

const variants: Record<Variant, string> = {
  primary: "border-tertiary bg-primary text-on-primary shadow-label hover:bg-primary-container",
  secondary:
    "border-tertiary bg-secondary text-on-secondary shadow-label hover:bg-secondary-container hover:text-on-secondary-container",
  outline:
    "border-outline bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed"
};

const baseClass =
  "inline-flex items-center justify-center rounded-lg border-2 px-4 py-2 text-sm font-bold transition-transform hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export function ActionButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ActionLink({
  children,
  className = "",
  href,
  variant = "primary"
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: Variant;
}) {
  return (
    <Link className={`${baseClass} ${variants[variant]} ${className}`} href={href}>
      {children}
    </Link>
  );
}
