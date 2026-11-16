import Link from "next/link";
import { availabilityText } from "@/lib/labels";
import { ageText, isOverdue } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export function LeadCard({ lead, courseTitle, assignee, href, selected }: { lead: Lead; courseTitle?: string; assignee?: string | null; href: string; selected?: boolean }) {
  const overdue = isOverdue(lead);
  const age = lead.birth_year ? `${new Date().getFullYear() - lead.birth_year} tuổi` : null;
  const avail = availabilityText(lead.availability);
  const foot =
    lead.status === "khong-thanh" && lead.lost_reason
      ? lead.lost_reason
      : lead.remind_on
        ? `Nhắc ${lead.remind_on.slice(5).split("-").reverse().join("/")}`
        : ageText(lead.created_at);
  return (
    <Link
      href={href}
      scroll={false}
      className="card mb-2.5 block"
      style={{ padding: 14, borderRadius: 16, boxShadow: selected ? "inset 0 0 0 2px var(--color-navy), var(--sh)" : undefined }}
    >
      <div className="flex items-center justify-between gap-2">
        <b className="truncate">{lead.full_name}{lead.for_whom === "con" ? " (con)" : ""}</b>
        {overdue && <span className="pill bad">Quá 24 giờ</span>}
      </div>
      <div className="text-[13px] text-faint">{[age, lead.area].filter(Boolean).join(" · ") || "—"}</div>
      {(courseTitle || avail) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {courseTitle && <span className="pill n max-w-full truncate">{courseTitle}</span>}
          {avail && <span className="pill n max-w-full truncate">{avail}</span>}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className={lead.status === "da-chot" ? "font-bold text-good" : "text-faint"}>{foot}</span>
        {assignee && (
          <span className="avatar" style={{ width: 22, height: 22, fontSize: 10, background: "#fce7f3", color: "#9d174d" }} title={`Phụ trách: ${assignee}`}>
            {assignee.trim().split(/\s+/).pop()![0]?.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}
