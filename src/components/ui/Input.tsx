interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
  /** Displays a red error message below the input */
  error?: string;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon,
  className = '',
  error,
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-ink-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full h-10 ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 rounded-xl border ${
            error ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-400' : 'border-ink-200 focus:ring-brand-500/30 focus:border-brand-400'
          } bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 transition-all`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  className = '',
  placeholder,
}: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-ink-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3.5 rounded-xl border border-ink-200 bg-white text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737d94%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
