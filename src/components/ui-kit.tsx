import { Icon } from "@/components/icon";

// Các mảnh form dùng chung cho Cài đặt và Nội dung, theo bộ mẫu (công tắc, thẻ chọn, nhóm nút).
// Không có trạng thái riêng: component cha giữ giá trị.

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`relative inline-flex flex-none ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="inline-flex h-[26px] w-[44px] rounded-full bg-[#d2d2d7] p-[3px] transition-colors peer-checked:justify-end peer-checked:bg-navy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy">
        <i className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
      </span>
    </label>
  );
}

/** Một dòng: chữ bên trái, công tắc bên phải. */
export function SwitchRow({ title, sub, checked, onChange, first }: { title: string; sub?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; first?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2.5 py-2.5 ${first ? "" : "divide-row"}`}>
      <div className="min-w-0">
        <b>{title}</b>
        {sub && <div className="text-[13px] text-faint">{sub}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function RadioCard({ name, checked, onChange, title, sub }: { name: string; checked: boolean; onChange: () => void; title: string; sub?: string }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-[14px] p-3 ${checked ? "bg-[#eef1f7] shadow-[inset_0_0_0_2px_var(--color-navy)]" : "bg-page"}`}
    >
      <input type="radio" name={name} className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        aria-hidden
        className={`mt-px h-5 w-5 flex-none rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy ${checked ? "border-[6px] border-navy" : "border-2 border-[#b0b0b8]"}`}
      />
      <span className="min-w-0">
        <b className="block">{title}</b>
        {sub && <span className="block text-[13px] text-faint">{sub}</span>}
      </span>
    </label>
  );
}

/** Nhóm nút chọn một (lớp `seg` của bộ mẫu). */
export function SegPick<T extends string | number>({
  options,
  value,
  onChange,
  full,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label} style={full ? { display: "flex", width: "100%" } : undefined}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={o.value === value ? "on" : ""}
          aria-pressed={o.value === value}
          style={full ? { flex: "1 0 auto", textAlign: "center", paddingInline: 8 } : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${className ?? ""}`}>
      <span className="label">
        {label}
        {hint && <span className="font-medium text-faint"> · {hint}</span>}
      </span>
      {children}
      {error && (
        <span className="err" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

/** Ô nhập có đơn vị nằm sẵn bên phải ("đ", "giờ", "%"). */
export function UnitInput({ unit, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { unit: string }) {
  return (
    <span className="relative block">
      <input {...props} className={`input num text-right ${className ?? ""}`} style={{ paddingRight: 14 + unit.length * 8 + 6, ...props.style }} />
      <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-faint">{unit}</span>
    </span>
  );
}

const iconBtn = "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-faint hover:bg-page disabled:opacity-30";

/** Danh sách dòng chữ: thêm, xoá, đưa lên / xuống. */
export function LinesEditor({
  items,
  onChange,
  placeholder,
  addLabel,
  max = 12,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
  max?: number;
  label: string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="grid gap-2">
      {items.map((t, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            className="input min-w-0 flex-1"
            style={{ height: 40 }}
            value={t}
            placeholder={placeholder}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <RowTools index={i} count={items.length} onMove={move} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="justify-self-start text-[13px] font-semibold text-faint hover:text-ink" onClick={() => onChange([...items, ""])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

/** Ba nút nhỏ cuối mỗi dòng: lên, xuống, xoá. */
export function RowTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (i: number, d: -1 | 1) => void; onRemove: () => void }) {
  return (
    <span className="flex flex-none items-center">
      <button type="button" className={iconBtn} style={{ width: 30 }} disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Đưa lên">
        <Icon name="left" size={15} className="rotate-90" />
      </button>
      <button type="button" className={iconBtn} style={{ width: 30 }} disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label="Đưa xuống">
        <Icon name="right" size={15} className="rotate-90" />
      </button>
      <button type="button" className={iconBtn} style={{ width: 30 }} onClick={onRemove} aria-label="Xoá dòng">
        <Icon name="x" size={15} />
      </button>
    </span>
  );
}

/** Dòng chữ nhỏ nói thật về phần chưa hoạt động. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-[14px] bg-warnbg px-3.5 py-2.5 text-[13px] font-medium text-warn">
      <Icon name="info" size={16} className="mt-px" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export const moveItem = <T,>(list: T[], i: number, d: -1 | 1): T[] => {
  const next = [...list];
  [next[i], next[i + d]] = [next[i + d]!, next[i]!];
  return next;
};
