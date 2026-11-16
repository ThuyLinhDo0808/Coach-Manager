"use client";

import Link from "next/link";
import { useState } from "react";
import { inviteMember, removeMember, saveMember, savePermissions } from "@/app/quan-ly/cai-dat/actions";
import { ConfirmButton, CopyButton, SaveBar, useSave } from "@/components/form-kit";
import { Field, Notice, RadioCard, SegPick, Switch, UnitInput } from "@/components/ui-kit";
import { PERMISSIONS, type LeadAssignSettings, type PermissionsSettings } from "@/lib/settings";
import type { InviteRole, MemberRow } from "@/lib/settings-types";
import { ROLE_LABEL, type MemberRole } from "@/lib/types";

const BASE = "/quan-ly/cai-dat/thanh-vien";
const ROLES: { value: MemberRole; label: string }[] = [
  { value: "owner", label: "Coach" },
  { value: "sale", label: "Sale" },
  { value: "tro-giang", label: "Trợ giảng" },
];
const INVITE_ROLES: { value: InviteRole; label: string }[] = [
  { value: "sale", label: "Sale" },
  { value: "tro-giang", label: "Trợ giảng" },
];

export function MemberForm({ member, isSelf }: { member: MemberRow; isSelf: boolean }) {
  const [v, setV] = useState({
    user_id: member.user_id,
    display_name: member.display_name ?? "",
    role: member.role,
    commission_pct: String(member.commission_pct),
    wage_per_session: String(member.wage_per_session),
  });
  const save = useSave(saveMember, v);
  const name = member.display_name ?? member.email ?? ROLE_LABEL[member.role];
  return (
    <div className="card" id="sua">
      <form onSubmit={save.onSubmit} noValidate>
        <h2 className="h2">
          <span className="min-w-0 truncate">Sửa thành viên: {name}</span>
        </h2>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Tên hiển thị" error={save.err("display_name")}>
            <input className="input" maxLength={60} value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} />
          </Field>
          <div className="field">
            <span className="label">Vai trò</span>
            {isSelf ? (
              <span className="input flex items-center bg-page text-muted">{ROLE_LABEL[member.role]} · không tự đổi vai trò của mình</span>
            ) : (
              <SegPick label="Vai trò" options={ROLES} value={v.role} onChange={(r) => setV({ ...v, role: r })} full />
            )}
            {save.err("role") && <span className="err">{save.err("role")}</span>}
          </div>
          {v.role === "sale" && (
            <Field label="Hoa hồng mỗi khoá chốt" error={save.err("commission_pct")}>
              <UnitInput unit="%" inputMode="decimal" maxLength={5} value={v.commission_pct} onChange={(e) => setV({ ...v, commission_pct: e.target.value })} />
            </Field>
          )}
          {v.role === "tro-giang" && (
            <Field label="Lương mỗi buổi dạy" error={save.err("wage_per_session")}>
              <UnitInput unit="đ" inputMode="numeric" maxLength={11} value={v.wage_per_session} onChange={(e) => setV({ ...v, wage_per_session: e.target.value })} />
            </Field>
          )}
        </div>
        <div className="mt-3.5">
          <SaveBar save={save}>
            <Link href={BASE} scroll={false} className="btn ghost">
              Đóng
            </Link>
          </SaveBar>
        </div>
      </form>
      {!isSelf && (
        <form action={removeMember} className="divide-row mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3.5">
          <input type="hidden" name="user_id" value={member.user_id} />
          <span className="min-w-0 text-[13px] text-faint">Gỡ khỏi đội: người này không vào khu quản lý được nữa. Tài khoản đăng nhập của họ không bị xoá.</span>
          <ConfirmButton message={`Gỡ ${name} khỏi đội?`}>Gỡ khỏi đội</ConfirmButton>
        </form>
      )}
    </div>
  );
}

export function InviteForm() {
  const [v, setV] = useState({ email: "", role: "sale" as InviteRole, display_name: "" });
  const save = useSave(inviteMember, v);
  return (
    <div className="card" id="moi">
      <form onSubmit={save.onSubmit} noValidate>
        <h2 className="h2">Mời thành viên</h2>
        <div className="grid gap-3.5 md:grid-cols-3">
          <Field label="Email" error={save.err("email")}>
            <input className="input" type="email" inputMode="email" autoComplete="off" maxLength={200} placeholder="ten@email.com" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
          <Field label="Tên hiển thị" error={save.err("display_name")}>
            <input className="input" maxLength={60} placeholder="Ví dụ: Hạnh" value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} />
          </Field>
          <div className="field">
            <span className="label">Vai trò</span>
            <SegPick label="Vai trò" options={INVITE_ROLES} value={v.role} onChange={(r) => setV({ ...v, role: r })} full />
            {save.err("role") && <span className="err">{save.err("role")}</span>}
          </div>
        </div>
        <div className="mt-3.5">
          <SaveBar save={save} label="Ghi lời mời">
            <CopyButton label="Sao chép link tạo mật khẩu" text={() => `${window.location.origin}/tham-gia`} />
          </SaveBar>
        </div>
      </form>
      <p className="mt-2.5 text-xs text-faint">
        Web không tự gửi email. Sau khi ghi lời mời, bạn sao chép link tạo mật khẩu và gửi cho người được mời; họ đăng ký bằng đúng email này là vào đội.
      </p>
    </div>
  );
}

export function PermissionsForm({ permissions, leadAssign }: { permissions: PermissionsSettings; leadAssign: LeadAssignSettings }) {
  const [v, setV] = useState({ permissions, lead_assign: leadAssign });
  const save = useSave(savePermissions, v);
  const toggle = (key: keyof PermissionsSettings, role: "sale" | "tro-giang", on: boolean) =>
    setV((p) => ({ ...p, permissions: { ...p.permissions, [key]: { ...p.permissions[key], [role]: on } } }));
  const assign = (patch: Partial<LeadAssignSettings>) => setV((p) => ({ ...p, lead_assign: { ...p.lead_assign, ...patch } }));
  return (
    <form onSubmit={save.onSubmit} className="grid gap-4" noValidate>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="card min-w-0">
          <h2 className="h2">Quyền theo vai trò</h2>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 0 }}>Việc được làm</th>
                <th style={{ textAlign: "center" }}>Sale</th>
                <th style={{ textAlign: "center" }}>Trợ giảng</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key}>
                  <td className="font-medium" style={{ paddingLeft: 0 }}>{p.label}</td>
                  <td style={{ textAlign: "center" }}>
                    <Switch checked={v.permissions[p.key].sale} onChange={(on) => toggle(p.key, "sale", on)} label={`Sale: ${p.label}`} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Switch checked={v.permissions[p.key]["tro-giang"]} onChange={(on) => toggle(p.key, "tro-giang", on)} label={`Trợ giảng: ${p.label}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2.5 grid gap-2">
            <Notice>Công tắc ở bảng này hiện mới là ghi nhận. Phần chặn theo quyền sẽ áp dụng dần; lúc này sale và trợ giảng vẫn dùng được các mục đang mở cho thành viên.</Notice>
            <div className="text-xs text-faint">Coach luôn có mọi quyền. Cài đặt và Nội dung chỉ coach vào được.</div>
          </div>
        </div>

        <div className="card min-w-0">
          <h2 className="h2">Chia nhu cầu cho sale</h2>
          <div className="grid gap-2">
            <RadioCard name="lead_assign" checked={v.lead_assign.mode === "xoay-vong"} onChange={() => assign({ mode: "xoay-vong" })} title="Xoay vòng tự động" sub="Mỗi nhu cầu mới giao lần lượt cho từng sale" />
            <RadioCard name="lead_assign" checked={v.lead_assign.mode === "coach-giao"} onChange={() => assign({ mode: "coach-giao" })} title="Coach tự giao" sub="Nhu cầu vào cột Mới, chưa giao ai" />
            <div className="flex items-center justify-between gap-2.5 px-0.5 py-2">
              <span className="font-medium">Báo khi nhu cầu quá 24 giờ chưa gọi</span>
              <Switch checked={v.lead_assign.alert_24h} onChange={(on) => assign({ alert_24h: on })} label="Báo khi nhu cầu quá 24 giờ chưa gọi" />
            </div>
            <Notice>Hiện mới lưu lựa chọn. Nhu cầu mới vẫn vào cột Mới và coach giao tay; xoay vòng tự động chưa chạy.</Notice>
          </div>
        </div>
      </div>
      <SaveBar save={save} label="Lưu quyền và cách chia" />
    </form>
  );
}
