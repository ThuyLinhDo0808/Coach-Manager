import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { getLeads } from "@/lib/admin-data";
import { requirePerm } from "@/lib/auth";
import { availabilityText } from "@/lib/labels";
import { ageText } from "@/lib/leads";

export const metadata = { title: "Danh sách chờ" };

// Nhu cầu chưa có lớp phù hợp: giữ lại để báo khi mở lớp mới.
export default async function DanhSachChoPage() {
  const session = await requirePerm("tuyen-sinh");
  const leads = (await getLeads(session.coach.id)).filter((l) => l.status === "danh-sach-cho");
  return (
    <>
      <PageHead icon="inbox" color="pink" title="Danh sách chờ" sub={`${leads.length} người chờ mở lớp`} />
      <div className="card">
        {leads.length === 0 && <div className="text-muted">Chưa ai trong danh sách chờ. Chuyển nhu cầu sang “Danh sách chờ” khi chưa có lớp phù hợp.</div>}
        {leads.map((l, i) => (
          <Link key={l.id} href={`/quan-ly/nhu-cau?id=${l.id}#chi-tiet`} className={`flex flex-wrap items-center gap-x-4 gap-y-1 py-3 ${i ? "divide-row" : ""}`}>
            <div className="min-w-[180px] flex-1">
              <b>{l.full_name}</b>
              <div className="text-[13px] text-faint">{[l.interests.join(", "), l.area, availabilityText(l.availability)].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            {l.remind_on && <span className="pill warn">Nhắc {l.remind_on.slice(5).split("-").reverse().join("/")}</span>}
            <span className="text-[13px] text-faint">{ageText(l.created_at)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
