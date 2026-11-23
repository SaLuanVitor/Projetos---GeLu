const variants = {
  error: "border-danger bg-danger-container text-danger-text",
  info: "border-outline bg-tertiary-fixed text-on-tertiary-fixed",
  success: "border-secondary bg-secondary-fixed text-on-secondary-fixed",
  warning: "border-tertiary bg-primary-fixed text-on-primary-fixed"
};

export function StatusMessage({
  children,
  className = "",
  variant = "info"
}: {
  children: string;
  className?: string;
  variant?: keyof typeof variants;
}) {
  return (
    <p
      className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </p>
  );
}
