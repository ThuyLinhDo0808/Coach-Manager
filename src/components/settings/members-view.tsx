import Link from "next/link";
import { revokeInvite } from "@/app/quan-ly/cai-dat/actions";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { InviteForm, MemberForm, PermissionsForm } from "@/components/settings/member-forms";
import { SettingsShell } from "@/components/settings/shell";
import { formatVnd } from "@/lib/format";
import type { CoachSettings } from "@/lib/settings";
import type { InviteRow, MemberRow } from "@/lib/settings-types";
import { ROLE_LABEL, type MemberRole } from "@/lib/types";

const BASE = "/quan-ly/cai-dat/thanh-vien";
const COLOR: Record<MemberRole, string> = { owner: "var(--amber)", sale: "var(--pink)", "tro-giang": "var(--cyan)" };

function pay(m: MemberRow): string | null {
  if (m.role === "sale") return m.commission_pct > 0 ? `${String(m.commission_pct).replace(".", ",")}% / khoá chốt` : null;
  if (m.role === "tro-giang") return m.wage_per_session > 0 ? `${formatVnd(m.wage_per_session)!.replace("đ", " đ")} / buổi` : null;
  return null;
}

export function MembersView({
  members,
  invites,
  settings,
  selfId,
  editId,
}: {
  members: MemberRow[];
  invites: InviteRow[];
  settings: CoachSettings;
  selfId: string;
  editId?: string;
}) {
  const editing = members.find((m) => m.user_id === editId) ?? null;
  const count = (r: MemberRole) => members.filter((m) => m.role === r).length;
  const sub = [`${count("sale")} sale`, `${count("tro-giang")} trợ giảng`, invites.length ? `${invites.length} lời mời đang chờ` : null].filter(Boolean).join(", ");
  const nameOf = (m: MemberRow) => m.display_name ?? m.email ?? ROLE_LABEL[m.role];
  const face = (name: string, role: MemberRole, size: number) => <Avatar name={name} size={size} style={{ background: COLOR[role], color: "#fff" }} />;
  const revoke = (i: InviteRow) => (
    <form action={revokeInvite}>
      <input type="hidden" name="id" value={i.id} />
      <button className="btn sm ghost">Thu hồi</button>
    </form>
  );

  return (
    <SettingsShell
      on="thanh-vien"
      sub={sub}
      act={
        <Link href={`${BASE}#moi`} className="btn primary">
          <Icon name="plus" /> Mời thành viên
        </Link>
      }
    >
      <div className="card">
        <h2 className="h2">Thành viên</h2>
        <table className="tbl hide-m">
          <thead>
            <tr>
              <th style={{ paddingLeft: 0 }}>Người</th>
              <th>Vai trò</th>
              <th style={{ textAlign: "right" }}>Hoa hồng / lương</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td style={{ paddingLeft: 0 }}>
                  <span className="flex items-center gap-2.5">
                    {face(nameOf(m), m.role, 32)}
                    <span className="min-w-0">
                      <b className="block truncate">
                        {nameOf(m)}
                        {m.user_id === selfId && <span className="font-medium text-faint"> · bạn</span>}
                      </b>
                      {m.email && m.display_name && <span className="block truncate text-[13px] text-faint">{m.email}</span>}
                    </span>
                  </span>
                </td>
                <td>
                  <span className="pill n">{ROLE_LABEL[m.role]}</span>
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {pay(m) ?? <span className="text-faint">—</span>}
                </td>
                <td>
                  <span className="pill good">Đang hoạt động</span>
                </td>
                <td style={{ textAlign: "right", paddingRight: 0 }}>
                  <Link href={`${BASE}?sua=${m.user_id}#sua`} className="btn sm ghost">
                    Sửa
                  </Link>
                </td>
              </tr>
            ))}
            {invites.map((i) => (
              <tr key={i.id}>
                <td style={{ paddingLeft: 0 }}>
                  <span className="flex items-center gap-2.5">
                    {face(i.display_name ?? i.email, i.role, 32)}
                    <span className="min-w-0">
                      <b className="block truncate">{i.display_name ?? i.email}</b>
                      {i.display_name && <span className="block truncate text-[13px] text-faint">{i.email}</span>}
                    </span>
                  </span>
                </td>
                <td>
                  <span className="pill n">{ROLE_LABEL[i.role]}</span>
                </td>
                <td className="text-faint" style={{ textAlign: "right" }}>
                  —
                </td>
                <td>
                  <span className="pill warn">Chờ nhận lời mời</span>
                </td>
                <td style={{ paddingRight: 0 }}>
                  <div className="flex justify-end">{revoke(i)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="only-m">
          {members.map((m) => (
            <Link key={m.user_id} href={`${BASE}?sua=${m.user_id}#sua`} className="divide-row flex items-center gap-2.5 py-[11px]">
              {face(nameOf(m), m.role, 36)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <b className="min-w-0 truncate">
                    {nameOf(m)} · {ROLE_LABEL[m.role]}
                  </b>
                  <span className="pill good">Hoạt động</span>
                </div>
                <div className="truncate text-[13px] text-faint">{[m.user_id === selfId ? "Bạn" : null, pay(m), m.display_name ? m.email : null].filter(Boolean).join(" · ") || "Bấm để sửa"}</div>
              </div>
            </Link>
          ))}
          {invites.map((i) => (
            <div key={i.id} className="divide-row flex items-center gap-2.5 py-[11px]">
              {face(i.display_name ?? i.email, i.role, 36)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <b className="min-w-0 truncate">
                    {i.display_name ?? i.email} · {ROLE_LABEL[i.role]}
                  </b>
                  <span className="pill warn">Chờ nhận</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[13px] text-faint">{i.email}</span>
                  {revoke(i)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && <MemberForm key={editing.user_id} member={editing} isSelf={editing.user_id === selfId} />}
      <InviteForm key={`moi-${invites.length}`} />
      <PermissionsForm permissions={settings.permissions} leadAssign={settings.lead_assign} />
    </SettingsShell>
  );
}
