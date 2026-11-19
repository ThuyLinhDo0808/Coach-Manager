"use client";

import { ROLES, type Role } from "@/lib/permissions";

/** Chọn nhiều vai trò (chip bật / tắt). */
export function RolePicker({ value, onChange, exclude = [], locked = [] }: { value: Role[]; onChange: (r: Role[]) => void; exclude?: Role[]; locked?: Role[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Vai trò">
      {ROLES.filter((r) => !exclude.includes(r.value)).map((r) => {
        const on = value.includes(r.value);
        const lock = locked.includes(r.value);
        return (
          <button
            key={r.value}
            type="button"
            title={r.hint}
            aria-pressed={on}
            disabled={lock}
            className={`chip ${on ? "on" : ""}`}
            onClick={() => onChange(on ? value.filter((x) => x !== r.value) : [...value, r.value])}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
