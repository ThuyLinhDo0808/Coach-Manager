import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { LeadCard } from "@/components/lead-card";
import { LeadDetail } from "@/components/lead-detail";
import { NewLeadForm } from "@/components/new-lead-form";
import { getAdminCourses, getLeadNotes, getLeads, getMembers } from "@/lib/admin-data";
import { requireSession } from "@/lib/auth";
import { headers } from "next/headers";
import { LeadOffers } from "@/components/lead-offers";
import { moneyDb } from "@/lib/money-data";
import { getSettings } from "@/lib/settings";
import { teachingDb } from "@/lib/teaching-data";
import { BOARD_STATUSES, closeRate, countByStatus, isOverdue, OPEN_STATUSES } from "@/lib/leads";
import { LEAD_STATUSES, ROLE_LABEL, type LeadStatus } from "@/lib/types";

export const metadata = { title: "Nhu cầu & chốt khoá" };

type Search = { id?: string; cot?: string; sale?: string; them?: string };

export default async function NhuCauPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const session = await requireSession();
  const [allLeads, members, courses] = await Promise.all([
    getLeads(session.coach.id),
    getMembers(session.coach.id),
    getAdminCourses(session.coach.id),
  ]);
  const leads = sp.sale ? allLeads.filter((l) => (sp.sale === "chua-giao" ? !l.assigned_to : l.assigned_to === sp.sale)) : allLeads;
  const counts = countByStatus(leads);
  const open = OPEN_STATUSES.reduce((n, s) => n + counts[s], 0);
  const rate = closeRate(leads);
  const selected = sp.id ? (allLeads.find((l) => l.id === sp.id) ?? null) : null;
  const notes = selected ? await getLeadNotes(selected.id) : [];
  const t = await teachingDb(session.coach.id);
  const [classes, venues, students] = selected ? await Promise.all([t.classes(), t.venues(), t.students()]) : [[], [], []];
  const offers = selected ? await (await moneyDb(session.coach.id)).offersOfLead(selected.id) : [];
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host") ?? ""}`;
  const openClasses = classes.filter((c) => c.status === "sap-dien-ra" || c.status === "dang-dien-ra").map((c) => ({ id: c.id, label: c.title, price: c.price }));

  const mobileStatus = (LEAD_STATUSES.some((s) => s.value === sp.cot) ? sp.cot : "moi") as LeadStatus;
  const courseTitle = (id: string | null) => courses.find((c) => c.id === id)?.title;
  const memberName = (id: string | null) => {
    const m = members.find((x) => x.user_id === id);
    return m ? (m.display_name ?? (ROLE_LABEL[m.role])) : null;
  };
  const href = (patch: Partial<Search>) => {
    const q = new URLSearchParams();
    const merged = { cot: sp.cot, sale: sp.sale, id: sp.id, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return `/quan-ly/nhu-cau${s ? `?${s}` : ""}`;
  };
  const sortLeads = (s: LeadStatus) =>
    leads.filter((l) => l.status === s).sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || b.created_at.localeCompare(a.created_at));
  const card = (l: (typeof leads)[number]) => (
    <LeadCard key={l.id} lead={l} courseTitle={courseTitle(l.course_id)} assignee={memberName(l.assigned_to)} href={href({ id: l.id }) + "#chi-tiet"} selected={l.id === selected?.id} />
  );
  const sideStatuses: LeadStatus[] = ["danh-sach-cho", "khong-thanh"];

  return (
    <>
      <PageHead icon="inbox" color="pink" title="Nhu cầu & chốt khoá" sub={`${open} đang mở${rate != null ? ` · tỷ lệ chốt ${rate}%` : ""}`}>
        <Link href={href({ them: "1", id: undefined })} className="btn primary">
          <Icon name="plus" /> Thêm nhu cầu
        </Link>
      </PageHead>

      {sp.them && <NewLeadForm courses={courses} />}

      {members.length > 1 && (
        <div className={`mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] ${selected ? "hide-m" : ""}`}>
          <Link href={href({ sale: undefined })} className={`chip ${!sp.sale ? "on" : ""}`}>Tất cả</Link>
          {members.map((m) => (
            <Link key={m.user_id} href={href({ sale: m.user_id })} className={`chip ${sp.sale === m.user_id ? "on" : ""}`}>
              {memberName(m.user_id)}
            </Link>
          ))}
          <Link href={href({ sale: "chua-giao" })} className={`chip ${sp.sale === "chua-giao" ? "on" : ""}`}>Chưa giao</Link>
        </div>
      )}

      {/* Máy tính: bảng Kanban */}
      <div className="hide-m grid items-start gap-3" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {BOARD_STATUSES.map((s) => (
          <div key={s} className="rounded-[18px] bg-[#ebebf0] p-2.5">
            <div className="flex items-center justify-between px-1.5 pt-1 pb-2.5">
              <b>{LEAD_STATUSES.find((x) => x.value === s)!.label}</b>
              <span className="pill n" style={{ background: "#fff" }}>{counts[s]}</span>
            </div>
            {sortLeads(s).slice(0, 30).map(card)}
            {counts[s] === 0 && <div className="px-1.5 pb-2 text-[13px] text-faint">Trống</div>}
          </div>
        ))}
      </div>
      <div className="hide-m mt-3 grid grid-cols-2 gap-3">
        {sideStatuses.map((s) => (
          <details key={s} className="rounded-[18px] bg-[#ebebf0] p-2.5" open={selected?.status === s}>
            <summary className="flex cursor-pointer items-center justify-between px-1.5 py-1">
              <b>{LEAD_STATUSES.find((x) => x.value === s)!.label}</b>
              <span className="pill n" style={{ background: "#fff" }}>{counts[s]}</span>
            </summary>
            <div className="mt-2.5 grid grid-cols-2 gap-x-2.5">{sortLeads(s).slice(0, 30).map(card)}</div>
          </details>
        ))}
      </div>

      {/* Điện thoại: nhóm nút trạng thái + danh sách */}
      {!selected && (
        <div className="only-m">
          <div className="seg mb-3">
            {LEAD_STATUSES.map((s) => (
              <Link key={s.value} href={href({ cot: s.value })} className={mobileStatus === s.value ? "on" : ""}>
                {s.label} {counts[s.value]}
              </Link>
            ))}
          </div>
          {sortLeads(mobileStatus).map(card)}
          {counts[mobileStatus] === 0 && <div className="card text-muted">Không có nhu cầu nào ở mục này.</div>}
        </div>
      )}

      {selected && (
        <LeadDetail
          lead={selected}
          notes={notes}
          members={members}
          courseTitle={courseTitle(selected.course_id)}
          closeHref={href({ id: undefined })}
          classes={openClasses}
          offers={
            <LeadOffers
              leadId={selected.id}
              offers={offers}
              classes={openClasses}
              isOwner={session.role === "owner"}
              origin={origin}
              depositPct={getSettings(session.coach.settings).payout.deposit_pct}
              canClose={selected.status !== "da-chot"}
            />
          }
          venues={venues.map((v) => ({ id: v.id, label: v.name }))}
          studentId={students.find((x) => x.lead_id === selected.id)?.id ?? null}
        />
      )}
      {allLeads.length === 0 && !sp.them && (
        <div className="card mt-3 text-muted">
          Chưa có nhu cầu nào. Khi có người điền form trên trang công khai, nhu cầu sẽ hiện ở cột Mới.
        </div>
      )}
    </>
  );
}
