import type { ReactNode, MouseEventHandler } from "react";

type PaperCardProps = {
  children: ReactNode;
  className?: string;
  ink?: boolean;
  tape?: "orange" | "green" | "brown" | "none";
  onClick?: MouseEventHandler<HTMLElement>;
};

const tapeColors = {
  orange: "washi-orange",
  green: "washi-green",
  brown: "washi-cream",
  none: "hidden"
};

export function PaperCard({
  children,
  className = "",
  ink = false,
  tape = "orange",
  onClick
}: PaperCardProps) {
  return (
    <section
      onClick={onClick}
      className={`notebook-card ${ink ? "notebook-card-ink" : ""} relative p-5 ${className}`}
    >
      <span aria-hidden="true" className={`washi-tape ${tapeColors[tape]}`} />
      {children}
    </section>
  );
}
