import Link from "next/link";
import { Icon } from "@/components/icon";
import { LostReasonForm } from "@/components/lead-status";
import { availabilityText, forWhomLabel, genderLabel } from "@/lib/labels";
import { ageText, isOverdue, maskPhone } from "@/lib/leads";
import { LEAD_ORIGINS, LEAD_STATUSES, ROLE_LABEL, type Lead, type LeadNote, type Member } from "@/lib/types";
import { addLeadNote, assignLead, changeStatus } from "@/app/quan-ly/nhu-cau/actions";
import { addSession, closeLead } from "@/app/quan-ly/_actions/teaching";
import { ActionForm, Submit } from "@/components/action-form";
import { vnDate } from "@/lib/time";

const KIND_LABEL: Record<string, string> = { "ghi-chu": "Ghi chú", goi: "Gọi", nhan: "Nhắn", hen: "Hẹn", "trang-thai": "Trạng thái", "he-thong": "Hệ thống" };
const when = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1 text-[13px]">
      <span className="w-[108px] flex-none text-faint">{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
    </div>
  );
}

type Choice = { id: string; label: string; price?: number | null };

export function LeadDetail({ lead, notes, members, courseTitle, closeHref, classes, venues, studentId, offers }: { lead: Lead; notes: LeadNote[]; members: Member[]; courseTitle?: string; closeHref: string; classes: Choice[]; venues: Choice[]; studentId: string | null; offers: React.ReactNode }) {
  const status = LEAD_STATUSES.find((s) => s.value === lead.status)!;
  const overdue = isOverdue(lead);
  const memberName = (id: string | null) => {
    const m = members.find((x) => x.user_id === id);
    return m ? (m.display_name ?? (ROLE_LABEL[m.role])) : null;
  };
  const sportLine = lead.played_sports == null ? null : lead.played_sports ? `Đã chơi ${lead.sports.join(", ").toLowerCase() || "thể thao"}` : "Chưa chơi môn nào";

  return (
    <section className="card mt-1.5 grid gap-5 md:grid-cols-3" id="chi-tiet" aria-label={`Chi tiết nhu cầu của ${lead.full_name}`}>
      <div>
        <Link href={closeHref} scroll={false} className="only-m mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
          <Icon name="left" size={15} /> Danh sách nhu cầu
        </Link>
        <h2 className="h2" style={{ fontSize: 15 }}>
          <span className="truncate">{lead.full_name}</span>
          <span className={`pill ${overdue ? "bad" : lead.status === "da-chot" ? "good" : "n"}`}>
            {status.label} · {ageText(lead.created_at)}
          </span>
        </h2>
        <Row label="Thông tin" value={[genderLabel(lead.gender), lead.birth_year, lead.for_whom && lead.for_whom !== "ban-than" ? `đăng ký cho ${forWhomLabel(lead.for_whom).toLowerCase()}` : null].filter(Boolean).join(" · ")} />
        <Row label="Điện thoại" value={<span className="num font-semibold">{maskPhone(lead.phone)}</span>} />
        <Row label="Kinh nghiệm" value={[sportLine, lead.pickleball_duration ? `pickleball ${lead.pickleball_duration.toLowerCase()}` : null, lead.dupr ? `DUPR ${lead.dupr}` : null, lead.self_level].filter(Boolean).join(" · ")} />
        <Row label="Khoá quan tâm" value={lead.interests.join(", ") || courseTitle} />
        <Row label="Mục tiêu" value={lead.goal} />
        <Row label="Muốn" value={[...lead.formats, ...lead.styles].join(", ").toLowerCase()} />
        <Row label="Khu vực" value={lead.area} />
        <Row label="Giờ rảnh" value={availabilityText(lead.availability)} />
        <Row label="Ngân sách" value={lead.budget} />
        <Row label="Nguồn" value={[LEAD_ORIGINS.find((o) => o.value === lead.origin)?.label, lead.source].filter(Boolean).join(" · ")} />
        <Row label="Ghi chú" value={lead.note} />
        {lead.lost_reason && <Row label="Lý do" value={lead.lost_reason} />}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`} className="btn sm navy">
            <Icon name="phone" size={16} /> Gọi
          </a>
          <a href={`https://zalo.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="btn sm ghost">
            <Icon name="chat" size={16} /> Zalo
          </a>
        </div>
      </div>

      <div>
        <h2 className="h2" style={{ fontSize: 15 }}>Nhật ký</h2>
        <form action={addLeadNote} className="mb-2 grid gap-2">
          <input type="hidden" name="id" value={lead.id} />
          <textarea name="body" className="input" style={{ minHeight: 64 }} maxLength={2000} placeholder="Ví dụ: gọi lần 1 không nghe máy" aria-label="Nội dung ghi chú" />
          <div className="flex flex-wrap items-center gap-2">
            <select name="kind" className="input" style={{ height: 34, width: "auto", fontSize: 13 }} aria-label="Loại" defaultValue="goi">
              <option value="goi">Gọi</option>
              <option value="nhan">Nhắn</option>
              <option value="hen">Hẹn</option>
              <option value="ghi-chu">Ghi chú</option>
            </select>
            <label className="flex items-center gap-1.5 text-[13px] text-faint">
              Nhắc lại
              <input type="date" name="remind_on" defaultValue={lead.remind_on ?? ""} className="input" style={{ height: 34, width: "auto", fontSize: 13 }} />
            </label>
            <button className="btn sm navy ml-auto">Lưu</button>
          </div>
        </form>
        {notes.length === 0 && <div className="text-[13px] text-faint">Chưa có ghi chú nào.</div>}
        {notes.map((n) => (
          <div key={n.id} className="divide-row py-[7px] text-[13px]">
            <div className="flex justify-between gap-2">
              <b>{n.kind === "he-thong" ? "Hệ thống" : (memberName(n.author_id) ?? "Thành viên")}{n.kind !== "he-thong" && n.kind !== "ghi-chu" ? ` · ${KIND_LABEL[n.kind]}` : ""}</b>
              <span className="num text-faint">{when(n.created_at)}</span>
            </div>
            <div className="text-muted">{n.body}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="h2" style={{ fontSize: 15 }}>Chuyển trạng thái</h2>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_STATUSES.filter((s) => s.value !== "khong-thanh").map((s) => (
            <form key={s.value} action={changeStatus}>
              <input type="hidden" name="id" value={lead.id} />
              <input type="hidden" name="status" value={s.value} />
              <button className={`chip ${lead.status === s.value ? "on" : ""}`} disabled={lead.status === s.value} style={{ height: 34 }}>
                {s.label}
              </button>
            </form>
          ))}
        </div>
        <LostReasonForm leadId={lead.id} active={lead.status === "khong-thanh"} action={changeStatus} />

        <h2 className="h2 mt-5" style={{ fontSize: 15 }}>Người phụ trách</h2>
        <form action={assignLead} className="flex gap-2">
          <input type="hidden" name="id" value={lead.id} />
          <select name="assigned_to" defaultValue={lead.assigned_to ?? ""} className="input" style={{ height: 40 }} aria-label="Người phụ trách">
            <option value="">Chưa giao ai</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name ?? (ROLE_LABEL[m.role])} · {ROLE_LABEL[m.role]}
              </option>
            ))}
          </select>
          <button className="btn ghost">Giao</button>
        </form>
        {offers}
        {lead.status !== "da-chot" && (
          <>
            <h2 className="h2 mt-5" style={{ fontSize: 15 }}>Hẹn học thử</h2>
            <ActionForm action={addSession} className="grid gap-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <input type="hidden" name="title" value={lead.full_name} />
              <input type="hidden" name="minutes" value="60" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" required className="input" style={{ height: 40 }} defaultValue={vnDate()} aria-label="Ngày học thử" />
                <input type="time" name="time" required className="input" style={{ height: 40 }} defaultValue="18:00" aria-label="Giờ học thử" />
              </div>
              <div className="flex gap-2">
                <select name="venue_id" className="input" style={{ height: 40 }} aria-label="Sân học thử" defaultValue="">
                  <option value="">Chưa chọn sân</option>
                  {venues.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
                <Submit className="btn ghost" pendingText="Đang lưu…">Đặt lịch</Submit>
              </div>
            </ActionForm>

            <h2 className="h2 mt-5" style={{ fontSize: 15 }}>Chốt ngay (đã nhận tiền mặt)</h2>
            <form action={closeLead} className="grid gap-2">
              <input type="hidden" name="id" value={lead.id} />
              <select name="class_id" className="input" style={{ height: 40 }} aria-label="Lớp" defaultValue="">
                <option value="">Chưa xếp lớp (chỉ tạo học viên)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input name="price" inputMode="numeric" className="input num" style={{ height: 40 }} placeholder="Học phí thoả thuận (đ)" aria-label="Học phí thoả thuận" />
                <button className="btn primary">Chốt</button>
              </div>
            </form>
            <p className="mt-1.5 text-xs text-faint">Tạo hồ sơ học viên và ghi danh vào lớp đã chọn. Tiền mặt thì ghi thêm ở Thu chi.</p>
          </>
        )}
        {studentId && (
          <Link href={`/quan-ly/hoc-vien/${studentId}`} className="btn sm navy mt-4">
            Mở hồ sơ học viên
          </Link>
        )}
      </div>
    </section>
  );
}
