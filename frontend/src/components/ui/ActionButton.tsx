import { Link } from "@/i18n/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

const variants: Record<Variant, string> = {
  primary: "border-tertiary bg-primary-container text-on-primary shadow-label hover:bg-primary",
  secondary:
    "border-tertiary bg-secondary text-on-secondary shadow-label hover:bg-secondary-container hover:text-on-secondary-container",
  outline:
    "border-stone-400 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary"
};

const baseClass =
  "inline-flex items-center justify-center rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

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
