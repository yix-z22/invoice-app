import { useState } from "react";
import "./ComboField.css";

interface ComboFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export default function ComboField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: ComboFieldProps) {
  const [open, setOpen] = useState(false);

  const filtered = options.filter(
    (opt) => opt.toLowerCase().includes(value.toLowerCase()) && opt !== value,
  );

  return (
    <div className="form-group combo-field">
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <ul className="combo-list">
          {filtered.map((opt) => (
            <li key={opt} onMouseDown={() => onChange(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
