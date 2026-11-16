"use client";

import { useState } from "react";
import { saveRules } from "@/app/quan-ly/cai-dat/actions";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { SettingsShell } from "@/components/settings/shell";
import { Field, RadioCard, SegPick, Switch, SwitchRow, UnitInput } from "@/components/ui-kit";
import { rulesText, type DeductMode, type RulesSettings, type TrialMode } from "@/lib/settings";

const NOTICE = [2, 6, 12, 24].map((h) => ({ value: h, label: `${h} giờ` }));
const DEDUCT: { value: DeductMode; title: string; sub: string }[] = [
  { value: "co-mat-hoac-khong-bao", title: "Có mặt, hoặc vắng không báo trước hạn", sub: "Mặc định · báo nghỉ đúng hạn không bị trừ" },
  { value: "chi-co-mat", title: "Chỉ khi có mặt", sub: "Vắng không báo cũng không trừ" },
  { value: "moi-buoi", title: "Mọi buổi đã xếp", sub: "Nghỉ vẫn trừ, kể cả báo trước" },
];
const TRIAL: { value: TrialMode; label: string }[] = [
  { value: "co-phi", label: "Có phí" },
  { value: "mien-phi", label: "Miễn phí" },
  { value: "khong-nhan", label: "Không nhận" },
];
const MAKEUP_DAYS = [14, 30, 60, 90];
const n = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export function RulesForm({ rules }: { rules: RulesSettings }) {
  const [v, setV] = useState({
    ...rules,
    makeup_max: String(rules.makeup_max),
    refund_after_sessions: String(rules.refund_after_sessions),
    refund_pct: String(rules.refund_pct),
    trial_fee: String(rules.trial_fee),
    signup_cutoff_hours: String(rules.signup_cutoff_hours),
  });
  const save = useSave(saveRules, v);
  type V = typeof v;
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const txt = (k: "makeup_max" | "refund_after_sessions" | "refund_pct" | "trial_fee" | "signup_cutoff_hours") => ({
    value: v[k],
    inputMode: "numeric" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });
  // Khung bên phải viết lại đúng những gì đang chọn (kể cả khi chưa bấm Lưu).
  const preview = rulesText({
    ...v,
    makeup_max: n(v.makeup_max),
    refund_after_sessions: n(v.refund_after_sessions),
    refund_pct: n(v.refund_pct),
    trial_fee: n(v.trial_fee),
    signup_cutoff_hours: n(v.signup_cutoff_hours),
  });
  const noticeOptions = NOTICE.some((o) => o.value === v.notice_hours) ? NOTICE : [...NOTICE, { value: v.notice_hours, label: `${v.notice_hours} giờ` }];
  const makeupDays = MAKEUP_DAYS.includes(v.makeup_days) ? MAKEUP_DAYS : [...MAKEUP_DAYS, v.makeup_days];

  return (
    <form onSubmit={save.onSubmit} noValidate>
      <SettingsShell on="quy-dinh" sub="áp dụng cho mọi lớp" act={<SaveAct save={save} />}>
        <SaveError save={save} />
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-4 *:min-w-0">
            <div className="card">
              <h2 className="h2">Báo nghỉ và trừ buổi</h2>
              <div className="field">
                <span className="label">Hạn báo nghỉ trước giờ học</span>
                <div>
                  <SegPick label="Hạn báo nghỉ" options={noticeOptions} value={v.notice_hours} onChange={(h) => set("notice_hours", h)} />
                </div>
              </div>
              <div className="field mt-3.5">
                <span className="label">Trừ một buổi trong gói khi</span>
                <div className="grid gap-2">
                  {DEDUCT.map((d) => (
                    <RadioCard key={d.value} name="deduct_mode" checked={v.deduct_mode === d.value} onChange={() => set("deduct_mode", d.value)} title={d.title} sub={d.sub} />
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="h2">Học bù và hoàn phí</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Số buổi bù tối đa / khoá" error={save.err("makeup_max")}>
                  <UnitInput unit="buổi" maxLength={2} {...txt("makeup_max")} />
                </Field>
                <Field label="Hạn học bù" error={save.err("makeup_days")}>
                  <select className="input" value={v.makeup_days} onChange={(e) => set("makeup_days", Number(e.target.value))}>
                    {makeupDays.map((d) => (
                      <option key={d} value={d}>
                        Trong {d} ngày sau khoá
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Không hài lòng sau" error={save.err("refund_after_sessions")}>
                  <UnitInput unit="buổi" maxLength={2} {...txt("refund_after_sessions")} />
                </Field>
                <Field label="Hoàn phần học phí còn lại" error={save.err("refund_pct")}>
                  <UnitInput unit="%" maxLength={3} {...txt("refund_pct")} />
                </Field>
              </div>
              <p className="mt-2 text-xs text-faint">Để 0 buổi hoặc 0% nếu lớp không hoàn phí.</p>
              <div className="mt-1.5">
                <SwitchRow first title="Huỷ do mưa / sân đóng" sub="Dời sang cùng giờ tuần sau, học viên không mất buổi" checked={v.rain_makeup} onChange={(b) => set("rain_makeup", b)} />
              </div>
            </div>

            <div className="card">
              <h2 className="h2">Học thử và đăng ký</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="field">
                  <span className="label">Buổi học thử</span>
                  <SegPick label="Buổi học thử" options={TRIAL} value={v.trial_mode} onChange={(m) => set("trial_mode", m)} full />
                </div>
                <Field label="Phí học thử" error={save.err("trial_fee")}>
                  <UnitInput unit="đ" maxLength={10} disabled={v.trial_mode !== "co-phi"} {...txt("trial_fee")} />
                </Field>
                <Field label="Chốt đăng ký trước giờ học" error={save.err("signup_cutoff_hours")}>
                  <UnitInput unit="giờ" maxLength={3} {...txt("signup_cutoff_hours")} />
                </Field>
                <div className="field">
                  <span className="label">Trừ phí học thử khi đăng ký khoá</span>
                  <div className="flex h-11 items-center">
                    <Switch checked={v.trial_deduct} onChange={(b) => set("trial_deduct", b)} label="Trừ phí học thử khi đăng ký khoá" disabled={v.trial_mode !== "co-phi"} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="h2">Học viên sẽ thấy</h2>
            <div className="mb-2.5 text-xs text-faint">Quy định viết bằng lời, đổi theo lựa chọn bên cạnh.</div>
            {preview.map((t) => (
              <div key={t} className="mb-2.5 flex items-start gap-2">
                <Icon name="check" className="text-good" />
                <span className="min-w-0">{t}</span>
              </div>
            ))}
            <p className="divide-row mt-3 pt-3 text-xs text-faint">
              Hiện web mới lưu quy định để coach và sale tư vấn cho thống nhất. Trang khoá học công khai, việc trừ buổi và tạo buổi bù chưa tự chạy theo các lựa chọn này.
            </p>
          </div>
        </div>
        <SaveBar save={save} />
      </SettingsShell>
    </form>
  );
}
