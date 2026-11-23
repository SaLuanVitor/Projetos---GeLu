import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const fieldClassName =
  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3.5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:bg-white dark:focus:bg-[#2f2823] focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-500 transition-all";

export function FormField({
  children,
  hint,
  label,
  error,
  containerClassName,
}: {
  children: ReactNode;
  hint?: string;
  label?: string;
  error?: string;
  containerClassName?: string;
}) {
  return (
    <div className={`block text-left ${containerClassName ?? ""}`}>
      {label ? (
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs normal-case text-stone-500 dark:text-stone-400">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  onValueChange,
  value,
  containerClassName,
  className,
  error,
  hint,
  ...props
}: {
  label?: string;
  onValueChange: (value: string) => void;
  value: string;
  containerClassName?: string;
  className?: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      containerClassName={containerClassName}
    >
      <input
        className={`${fieldClassName} ${
          error ? "border-red-400 focus:border-red-600 focus:ring-red-500/20" : ""
        } ${className ?? ""}`}
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
  containerClassName,
  className,
  error,
  hint,
  ...props
}: {
  label?: string;
  onValueChange: (value: string) => void;
  value: string;
  containerClassName?: string;
  className?: string;
  error?: string;
  hint?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value">) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      containerClassName={containerClassName}
    >
      <textarea
        className={`${fieldClassName} min-h-24 resize-y ${
          error ? "border-red-400 focus:border-red-600 focus:ring-red-500/20" : ""
        } ${className ?? ""}`}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...props}
      />
    </FormField>
  );
}

export function SelectField({
  label,
  onValueChange,
  options,
  value,
  containerClassName,
  className,
  error,
  hint,
  ...props
}: {
  label?: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
  containerClassName?: string;
  className?: string;
  error?: string;
  hint?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      containerClassName={containerClassName}
    >
      <select
        className={`${fieldClassName} cursor-pointer ${
          error ? "border-red-400 focus:border-red-600 focus:ring-red-500/20" : ""
        } ${className ?? ""}`}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function SegmentedChoice({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 ${
                active
                  ? "border-amber-600 bg-amber-500/15 text-amber-900 shadow-sm"
                  : "border-stone-300 bg-white/90 text-stone-600 hover:border-stone-400"
              }`}
              key={option.value}
              onClick={() => onValueChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PresetNumberField({
  label,
  min,
  onValueChange,
  presets,
  step,
  value,
}: {
  label: string;
  min?: string;
  onValueChange: (value: string) => void;
  presets: Array<{ label: string; value: string }>;
  step?: string;
  value: string;
}) {
  return (
    <div>
      <TextInput
        label={label}
        min={min}
        step={step}
        type="number"
        value={value}
        onValueChange={onValueChange}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            className={`rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
              value === preset.value
                ? "border-amber-600 bg-amber-100 text-amber-900"
                : "border-stone-300 bg-white/90 text-stone-600 hover:border-stone-400"
            }`}
            key={preset.value}
            onClick={() => onValueChange(preset.value)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
