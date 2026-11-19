"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { UnitInput } from "@/components/ui-kit";
import { DAY_GROUPS, ruleError, sortRules, type DayGroup, type PriceRule } from "@/lib/venue-price";

const vnd = (n: number) => n.toLocaleString("vi-VN");

/** Bảng giá sân: mỗi nhóm ngày một bảng khung giờ → giá / giờ / sân; dòng dưới cùng để thêm khung. */
export function PriceTable({ rules, onChange, error }: { rules: PriceRule[]; onChange: (r: PriceRule[]) => void; error?: string }) {
  const [draft, setDraft] = useState({ days: "t2-t6" as DayGroup, from: "", to: "", price: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    const rule: PriceRule = { days: draft.days, from: draft.from, to: draft.to, price: Number(draft.price.replace(/\D/g, "")) || 0 };
    const err = ruleError(rule, rules);
    setMsg(err);
    if (err) return;
    onChange(sortRules([...rules, rule]));
    // Gợi ý khung tiếp theo bắt đầu ở giờ vừa kết thúc.
    setDraft({ days: draft.days, from: draft.to, to: "", price: "" });
  };
  const remove = (r: PriceRule) => onChange(rules.filter((x) => x !== r));

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        {DAY_GROUPS.map((g) => {
          const list = rules.filter((r) => r.days === g.value);
          return (
            <div key={g.value} className="overflow-hidden rounded-2xl border border-line">
              <div className="grid grid-cols-[1fr_1fr_1.2fr_44px] items-center gap-2 bg-page px-3.5 py-2.5 text-xs font-semibold text-faint">
                <span className="col-span-2">{g.label}</span>
                <span className="text-right">Giá / giờ / sân</span>
                <span />
              </div>
              {list.length === 0 && <div className="px-3.5 py-3 text-[13px] text-faint">Chưa có khung giá.</div>}
              {list.map((r) => (
                <div key={`${r.from}-${r.to}`} className="grid grid-cols-[1fr_1fr_1.2fr_44px] items-center gap-2 border-t border-line px-3.5 py-3 text-sm">
                  <span className="num">{r.from}</span>
                  <span className="num">{r.to}</span>
                  <span className="num text-right font-semibold">{vnd(r.price)}</span>
                  <button type="button" onClick={() => remove(r)} className="text-right text-[13px] font-semibold text-faint hover:text-bad" aria-label={`Bỏ khung ${r.from}–${r.to}`}>
                    Bỏ
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 items-end gap-2.5 md:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto]">
        <label className="field col-span-2 md:col-span-1">
          <span className="label">Nhóm ngày</span>
          <select className="input" value={draft.days} onChange={(e) => setDraft({ ...draft, days: e.target.value as DayGroup })}>
            {DAY_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="label">Từ</span>
          <input type="time" className="input num" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className="field">
          <span className="label">Đến</span>
          <input type="time" className="input num" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </label>
        <label className="field col-span-2 md:col-span-1">
          <span className="label">Giá / giờ</span>
          <UnitInput
            unit="đ"
            inputMode="numeric"
            maxLength={12}
            placeholder="0"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, "") ? vnd(Number(e.target.value.replace(/\D/g, ""))) : "" })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </label>
        <button type="button" onClick={add} className="btn primary col-span-2 md:col-span-1">
          <Icon name="plus" size={16} /> Thêm
        </button>
      </div>
      {(msg || error) && <span className="err">{msg ?? error}</span>}
    </div>
  );
}
