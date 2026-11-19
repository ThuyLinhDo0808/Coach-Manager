import type { Member } from "@/lib/types";

/** Người được ghi là người chốt: thành viên có vai trò sale, quản lý hoặc coach chủ. */
export const closerCandidates = (members: Member[]) =>
  members.filter((m) => (m.roles ?? [m.role === "owner" ? "chu" : m.role]).some((r) => r === "sale" || r === "quan-ly" || r === "chu"));

export function CloserSelect({ members, defaultValue, name = "closer_id" }: { members: Member[]; defaultValue?: string | null; name?: string }) {
  const list = closerCandidates(members);
  const def = list.some((m) => m.user_id === defaultValue) ? defaultValue! : "";
  return (
    <select name={name} required className="input" style={{ height: 40 }} aria-label="Người chốt" defaultValue={def}>
      <option value="" disabled>Người chốt…</option>
      {list.map((m) => (
        <option key={m.user_id} value={m.user_id}>
          Người chốt: {m.display_name ?? "Thành viên"}
        </option>
      ))}
    </select>
  );
}
