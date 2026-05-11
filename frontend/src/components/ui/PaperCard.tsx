import type { ReactNode } from "react";

type PaperCardProps = {
  children: ReactNode;
  className?: string;
  tape?: "orange" | "green" | "brown" | "none";
};

const tapeColors = {
  orange: "bg-primary-fixed",
  green: "bg-secondary-fixed",
  brown: "bg-tertiary-fixed",
  none: "hidden"
};

export function PaperCard({ children, className = "", tape = "orange" }: PaperCardProps) {
  return (
    <section
      className={`wobbly-paper relative border-2 border-outline bg-surface-container-low p-5 shadow-paper ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -top-3 left-7 h-6 w-20 rotate-[-3deg] border border-outline/30 opacity-80 ${tapeColors[tape]}`}
      />
      {children}
    </section>
  );
}
