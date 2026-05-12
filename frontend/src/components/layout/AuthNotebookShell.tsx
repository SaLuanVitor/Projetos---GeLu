import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";

type AuthNotebookShellProps = {
  children: ReactNode;
  featureLabel?: string;
  note?: string;
};

export function AuthNotebookShell({ children, featureLabel, note }: AuthNotebookShellProps) {
  const t = useTranslations("Brand");
  const auth = useTranslations("Auth");

  return (
    <main className="paper-canvas min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-6 lg:px-10">
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center py-8">
        <Link
          className="absolute left-0 top-0 z-10 hidden rotate-[-12deg] rounded-lg border-2 border-dashed border-outline bg-surface-container-low px-4 py-2 font-display text-xl font-bold text-outline shadow-paper transition-transform hover:rotate-[-8deg] md:inline-flex"
          href="/"
        >
          * {featureLabel ?? t("featureDefault")}
        </Link>
        <span
          aria-hidden="true"
          className="absolute left-[30%] top-14 z-10 hidden h-10 w-36 rotate-[-1deg] border border-secondary/30 bg-secondary-fixed/70 shadow-paper md:block"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-8 right-1 z-10 hidden rotate-[5deg] rounded-full border-2 border-secondary/40 bg-secondary-fixed/55 px-7 py-3 font-display text-xl font-bold text-secondary shadow-paper md:block"
        >
          {t("organic")}
        </span>

        <section className="relative grid w-full max-w-6xl gap-8 rounded-[2rem] border-2 border-outline-variant bg-surface-container-low/80 px-5 py-8 shadow-paper md:px-10 lg:grid-cols-[1fr_0.92fr] lg:gap-16 lg:px-16 lg:py-14">
          <span
            aria-hidden="true"
            className="absolute -bottom-4 right-10 hidden h-8 w-32 rotate-[2deg] border border-tertiary/20 bg-tertiary-fixed/65 md:block"
          />
          <BrandPanel note={note ?? t("note")} />
          <section className="flex items-center justify-center">
            <div className="w-full max-w-[470px] rounded-[2rem] border-[3px] border-tertiary bg-surface-container-highest/75 p-6 shadow-[7px_8px_0_rgba(95,64,42,0.95)] sm:p-8">
              {children}
              <div className="mt-8 flex items-center justify-center gap-6 text-sm font-bold text-tertiary">
                <Link className="transition-colors hover:text-primary" href="/ajuda-acesso">
                  ? {auth("help")}
                </Link>
                <span aria-hidden="true">oo</span>
                <LocaleSwitcher />
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function BrandPanel({ note }: { note: string }) {
  return (
    <aside className="hidden flex-col items-center justify-center gap-6 text-center lg:flex">
      <div className="relative w-full max-w-md rotate-[-1deg] rounded-[1.75rem] border-4 border-dashed border-outline-variant bg-surface-bright p-4 shadow-paper">
        <Image
          alt="Cozinha familiar com caderno de receitas, legumes e panela"
          className="aspect-square w-full rounded-xl object-cover sepia-[0.12]"
          height={560}
          src="/auth-kitchen.svg"
          width={560}
        />
        <span className="absolute -bottom-7 -right-7 flex h-20 w-20 rotate-[12deg] items-center justify-center rounded-full border-2 border-tertiary bg-primary-container font-display text-3xl font-extrabold text-on-primary shadow-label">
          G
        </span>
      </div>
      <div>
        <h1 className="font-display text-5xl font-extrabold text-primary">GeLu - Menu</h1>
        <p className="mx-auto mt-4 max-w-sm text-xl italic leading-9 text-on-surface-variant">
          {note}
        </p>
      </div>
    </aside>
  );
}

export function AuthPanelHeader({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header>
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl font-extrabold leading-tight text-on-surface sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 text-base leading-7 text-on-surface-variant">{subtitle}</p>
    </header>
  );
}

export function AuthTextInput({
  label,
  labelAction,
  marker,
  onValueChange,
  value,
  ...props
}: {
  label: string;
  labelAction?: ReactNode;
  marker?: string;
  onValueChange: (value: string) => void;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block text-sm font-extrabold tracking-wide text-tertiary">
      <span className="flex items-center justify-between gap-3 px-1">
        <span>{label}</span>
        {labelAction}
      </span>
      <span className="relative mt-2 block">
        <input
          className="w-full border-2 border-outline bg-transparent px-2 py-3 pr-10 text-lg text-on-surface outline-none placeholder:text-outline/70 focus:border-primary"
          onChange={(event) => onValueChange(event.target.value)}
          value={value}
          {...props}
        />
        {marker ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-outline">
            {marker}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function AuthTextArea({
  label,
  onValueChange,
  value,
  ...props
}: {
  label: string;
  onValueChange: (value: string) => void;
  value: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value">) {
  return (
    <label className="block text-sm font-extrabold tracking-wide text-tertiary">
      <span className="px-1">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full resize-y border-2 border-outline bg-transparent px-2 py-3 text-base text-on-surface outline-none placeholder:text-outline/70 focus:border-primary"
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  );
}

export function AuthStickerButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const colorClass =
    variant === "primary"
      ? "rotate-[-1deg] border-tertiary bg-primary text-on-primary shadow-[5px_6px_0_rgba(61,36,16,0.96)]"
      : "rotate-[1deg] border-on-secondary-fixed-variant bg-secondary text-on-secondary shadow-[5px_6px_0_rgba(33,80,37,0.96)]";

  return (
    <button
      className={`w-full rounded-xl border-2 px-5 py-4 font-display text-3xl font-extrabold transition-transform hover:translate-y-1 hover:shadow-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthStickerLink({
  children,
  href,
  variant = "secondary"
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const colorClass =
    variant === "primary"
      ? "rotate-[-1deg] border-tertiary bg-primary text-on-primary shadow-[5px_6px_0_rgba(61,36,16,0.96)]"
      : "rotate-[1deg] border-on-secondary-fixed-variant bg-secondary text-on-secondary shadow-[5px_6px_0_rgba(33,80,37,0.96)]";

  return (
    <Link
      className={`flex w-full items-center justify-center rounded-xl border-2 px-5 py-4 font-display text-3xl font-extrabold transition-transform hover:translate-y-1 hover:shadow-none active:scale-[0.98] ${colorClass}`}
      href={href}
    >
      {children}
    </Link>
  );
}

export function AuthDivider({ label = "ou entao" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-outline">
      <span className="h-[2px] flex-1 bg-outline-variant/60" />
      <span>{label}</span>
      <span className="h-[2px] flex-1 bg-outline-variant/60" />
    </div>
  );
}
