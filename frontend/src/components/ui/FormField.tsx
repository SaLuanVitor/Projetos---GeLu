import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export const fieldClassName =
  "mt-2 w-full border-0 border-b-2 border-dashed border-outline bg-transparent px-1 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary disabled:bg-surface-container disabled:text-on-surface-variant";

export function FormField({
  children,
  hint,
  label
}: {
  children: ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block text-sm font-bold uppercase tracking-wide text-tertiary">
      {label}
      {children}
      {hint ? (
        <span className="mt-1 block text-xs normal-case text-on-surface-variant">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  label,
  onValueChange,
  value,
  ...props
}: {
  label: string;
  onValueChange: (value: string) => void;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <FormField label={label}>
      <input
        className={fieldClassName}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...props}
      />
    </FormField>
  );
}

export function TextAreaField({
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
    <FormField label={label}>
      <textarea
        className={`${fieldClassName} min-h-24 resize-y`}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...props}
      />
    </FormField>
  );
}
