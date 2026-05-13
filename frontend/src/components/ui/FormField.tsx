import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

export const fieldClassName =
  "mt-2 w-full border-0 border-b-2 border-paper-line bg-transparent px-1 py-2 text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/55 focus:border-primary disabled:bg-surface-container disabled:text-on-surface-variant";

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
    <label className="block text-sm font-bold text-tertiary">
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

export function SelectField({
  label,
  onValueChange,
  options,
  value,
  ...props
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  return (
    <FormField label={label}>
      <select
        className={`${fieldClassName} cursor-pointer`}
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
  value
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-tertiary">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-transform hover:rotate-1 ${
                active
                  ? "border-secondary bg-secondary-fixed text-secondary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
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
  value
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
                ? "border-primary bg-primary-fixed text-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
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
