"use client";

import Link from "next/link";
import { useState } from "react";
import { inviteMember, removeMember, saveMember, savePermissions } from "@/app/quan-ly/cai-dat/actions";
import { ConfirmButton, CopyButton, SaveBar, useSave } from "@/components/form-kit";
import { RolePicker } from "@/components/settings/role-picker";
import { Field, Notice, RadioCard, Switch } from "@/components/ui-kit";
import { ROLES, permsFor, type Role } from "@/lib/permissions";
import type { LeadAssignSettings, PermissionsSettings } from "@/lib/settings";
import type { MemberRow } from "@/lib/settings-types";
import { ROLE_LABEL } from "@/lib/types";

const BASE = "/quan-ly/cai-dat/thanh-vien";

export function MemberForm({ member, isSelf }: { member: MemberRow; isSelf: boolean }) {
  const [v, setV] = useState({ user_id: member.user_id, display_name: member.display_name ?? "", roles: member.roles });
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
          <div className="field md:col-span-2">
            <span className="label">Vai trò (chọn nhiều)</span>
            <RolePicker value={v.roles} onChange={(roles) => setV({ ...v, roles })} locked={isSelf ? ["chu"] : []} />
            {isSelf && <span className="text-xs text-faint">Bạn không tự bỏ vai trò Team Leader của mình.</span>}
            {save.err("roles") && <span className="err">{save.err("roles")}</span>}
          </div>
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
  const [v, setV] = useState({ email: "", roles: ["sale"] as Role[], display_name: "" });
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
          <div className="field md:col-span-3">
            <span className="label">Vai trò (chọn nhiều)</span>
            <RolePicker value={v.roles} onChange={(roles) => setV({ ...v, roles })} exclude={["chu"]} />
            {save.err("roles") && <span className="err">{save.err("roles")}</span>}
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

const PERM_ROWS: { label: string; perms: string[] }[] = [
  { label: "Tổng quan hôm nay", perms: ["tong-quan"] },
  { label: "Cần xử lý (đăng ký chờ duyệt, buổi chưa điểm danh…)", perms: ["can-xu-ly"] },
  { label: "Lịch của tôi, điểm danh buổi mình dạy", perms: ["lich-cua-toi"] },
  { label: "Lịch trung tâm, lịch rảnh 1-1", perms: ["lich-trung-tam"] },
  { label: "Học viên (coach: chỉ lớp mình)", perms: ["hoc-vien"] },
  { label: "Lớp (coach: chỉ lớp mình); sửa lớp", perms: ["lop", "lop-sua"] },
  { label: "Tuyển sinh: nhu cầu, học thử, chốt khoá", perms: ["tuyen-sinh"] },
  { label: "Xác nhận đã xếp lớp sau khi chốt", perms: ["xac-nhan-xep-lop"] },
  { label: "Phân công lớp (dạy chính, dạy thay)", perms: ["phan-cong"] },
  { label: "Sổ thu chi, công nợ, chia tiền, chi trả", perms: ["tai-chinh"] },
  { label: "Các quỹ, báo cáo lãi / lỗ (xem)", perms: ["quy-xem", "bao-cao"] },
  { label: "Thu nhập / tiền của tôi", perms: ["thu-nhap"] },
  { label: "Phần của tôi (cổ đông)", perms: ["phan-cua-toi"] },
  { label: "Gói buổi, giáo án, đánh giá, thống kê, đội ngũ", perms: ["goi-buoi", "giao-an", "thong-ke", "doi-ngu"] },
  { label: "Cài đặt, tỉ lệ chia & cổ đông, chốt tháng", perms: ["cai-dat", "ti-le"] },
];

export function PermissionsForm({ permissions, leadAssign }: { permissions: PermissionsSettings; leadAssign: LeadAssignSettings }) {
  const [v, setV] = useState({ permissions, lead_assign: leadAssign });
  const save = useSave(savePermissions, v);
  const assign = (patch: Partial<LeadAssignSettings>) => setV((p) => ({ ...p, lead_assign: { ...p.lead_assign, ...patch } }));
  const has = (role: Role, perms: string[]) => perms.some((p) => (permsFor([role]) as string[]).includes(p));
  return (
    <form onSubmit={save.onSubmit} className="grid gap-4" noValidate>
      <div className="card min-w-0">
        <h2 className="h2">Quyền theo vai trò</h2>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 0 }}>Việc được làm</th>
                {ROLES.map((r) => (
                  <th key={r.value} style={{ textAlign: "center" }}>{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="font-medium" style={{ paddingLeft: 0 }}>{row.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.value} style={{ textAlign: "center" }} aria-label={`${r.label}: ${has(r.value, row.perms) ? "có" : "không"}`}>
                      {has(r.value, row.perms) ? <span className="text-good">●</span> : <span className="text-[#d2d2d7]">·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2.5 text-xs text-faint">
          Một người có nhiều vai trò thì có quyền của tất cả vai trò đó. Quyền được kiểm tra ở cả trang, thao tác và database.
          Trợ giảng không thấy học phí, số điện thoại và ghi chú của học viên.
        </div>
      </div>

      <div className="card min-w-0">
        <h2 className="h2">Chia nhu cầu cho sale</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <RadioCard name="lead_assign" checked={v.lead_assign.mode === "xoay-vong"} onChange={() => assign({ mode: "xoay-vong" })} title="Xoay vòng tự động" sub="Mỗi nhu cầu mới giao lần lượt cho từng sale" />
          <RadioCard name="lead_assign" checked={v.lead_assign.mode === "coach-giao"} onChange={() => assign({ mode: "coach-giao" })} title="Tự giao" sub="Nhu cầu vào cột Mới, chưa giao ai" />
        </div>
        <div className="flex items-center justify-between gap-2.5 px-0.5 py-2">
          <span className="font-medium">Báo khi nhu cầu quá 24 giờ chưa gọi</span>
          <Switch checked={v.lead_assign.alert_24h} onChange={(on) => assign({ alert_24h: on })} label="Báo khi nhu cầu quá 24 giờ chưa gọi" />
        </div>
        <Notice>Hiện mới lưu lựa chọn. Nhu cầu mới vẫn vào cột Mới; xoay vòng tự động chưa chạy. Ai chốt được thì người đó là sale của học viên.</Notice>
      </div>
      <SaveBar save={save} label="Lưu cách chia nhu cầu" />
    </form>
  );
}
