import Link from "next/link";
import { Icon } from "@/components/icon";
import { CourseForm } from "@/components/settings/course-form";
import { SettingsShell } from "@/components/settings/shell";
import { formatVnd } from "@/lib/format";
import { kindLabel } from "@/lib/labels";
import type { CourseAdmin } from "@/lib/settings-types";

const BASE = "/quan-ly/cai-dat/mau-khoa";

export function CoursesView({
  courses,
  classCounts,
  venues,
  selectedId,
  isNew,
}: {
  courses: CourseAdmin[];
  classCounts: Record<string, number>;
  venues: { id: string; name: string }[];
  selectedId?: string;
  isNew?: boolean;
}) {
  // Máy tính luôn mở sẵn một mẫu; điện thoại chỉ mở form khi đã chọn.
  const picked = isNew ? null : (courses.find((c) => c.id === selectedId) ?? null);
  const shown = isNew ? null : (picked ?? courses[0] ?? null);
  const formOpenOnMobile = isNew || Boolean(picked);
  const totalClasses = Object.values(classCounts).reduce((a, b) => a + b, 0);
  const nextSort = courses.reduce((m, c) => Math.max(m, c.sort), -1) + 1;
  const showForm = isNew || shown;

  return (
    <SettingsShell
      on="mau-khoa"
      sub={`${courses.length} mẫu · ${totalClasses} lớp đang tuyển`}
      act={
        <Link href={`${BASE}?moi=1`} className="btn primary">
          <Icon name="plus" /> Tạo mẫu khoá
        </Link>
      }
    >
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className={`card ${formOpenOnMobile ? "hide-m" : ""}`}>
          <h2 className="h2">Mẫu khoá</h2>
          {courses.length === 0 && <div className="text-muted">Chưa có mẫu khoá nào. Bấm “Tạo mẫu khoá” để bắt đầu.</div>}
          {courses.map((c) => {
            const price = c.price_full ?? c.price_single;
            const line = [kindLabel(c.kind), c.session_count ? `${c.session_count} buổi` : null, price != null ? formatVnd(price)!.replace("đ", " đ") : null].filter(Boolean).join(" · ");
            return (
              <Link key={c.id} href={`${BASE}?id=${c.id}`} scroll={false} className={`flex items-center gap-2.5 rounded-[14px] px-2.5 py-[11px] ${shown?.id === c.id ? "md:bg-[#ececf0]" : "hover:bg-page"}`}>
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{c.title}</b>
                  <div className="truncate text-[13px] text-faint">{line}</div>
                </div>
                <div className="flex-none text-right">
                  <div className="num font-bold">{classCounts[c.id] ?? 0} lớp</div>
                  <div className={`text-xs font-semibold ${c.is_public ? "text-good" : "text-faint"}`}>{c.is_public ? "Công khai" : "Nháp"}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {showForm ? (
          <div className={`min-w-0 ${formOpenOnMobile ? "" : "hide-m"}`}>
            <Link href={BASE} scroll={false} className="only-m mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
              <Icon name="left" size={15} /> Danh sách mẫu khoá
            </Link>
            <CourseForm key={shown?.id ?? "moi"} course={shown} venues={venues} nextSort={nextSort} />
          </div>
        ) : (
          <div className="card hide-m text-muted">Chọn một mẫu ở bên trái để sửa.</div>
        )}
      </div>
    </SettingsShell>
  );
}
