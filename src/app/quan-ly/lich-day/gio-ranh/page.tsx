import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { addFreeSlot, deleteFreeSlot } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { teachingDb } from "@/lib/teaching-data";
import { WEEKDAY_LONG } from "@/lib/time";

export const metadata = { title: "Lịch rảnh 1-1" };

// Giờ rảnh lặp hằng tuần: hiện ở lưới "Còn trống" trang Lịch & sân để học viên đặt học 1-1 / học thử.
export default async function GioRanhPage() {
  const session = await requirePerm("lich-trung-tam");
  const t = await teachingDb(session.coach.id);
  const [slotsAll, venues] = await Promise.all([t.freeSlots(), t.venues()]);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name ?? null;
  const hours = slotsAll.reduce((n, s) => n + (Number(s.end_time.slice(0, 2)) * 60 + Number(s.end_time.slice(3, 5)) - Number(s.start_time.slice(0, 2)) * 60 - Number(s.start_time.slice(3, 5))) / 60, 0);

  return (
    <>
      <PageHead icon="cal" color="cyan" title="Lịch rảnh 1-1" sub={`${slotsAll.length} khung giờ · ${String(Math.round(hours * 10) / 10).replace(".", ",")} giờ mỗi tuần · học viên thấy ở trang Lịch & sân`} />
      <section className="card">
        <h2 className="h2">Giờ rảnh hằng tuần</h2>
        <div className="flex flex-wrap gap-2">
          {slotsAll.length === 0 && <span className="text-muted">Chưa khai giờ rảnh nào.</span>}
          {slotsAll.map((s) => (
            <form key={s.id} action={deleteFreeSlot} className="chip" style={{ cursor: "default", paddingRight: 6 }}>
              <input type="hidden" name="id" value={s.id} />
              {WEEKDAY_LONG[s.weekday - 1]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              {venueName(s.venue_id) ? ` · ${venueName(s.venue_id)}` : ""}
              <button className="grid size-6 place-items-center rounded-full hover:bg-page" aria-label="Xoá giờ rảnh này">
                <Icon name="x" size={14} />
              </button>
            </form>
          ))}
        </div>
        <ActionForm action={addFreeSlot} resetOnOk className="divide-row mt-3 grid grid-cols-2 items-end gap-3 pt-3 md:grid-cols-5">
          <div className="field">
            <label htmlFor="fs_day">Thứ</label>
            <select id="fs_day" name="weekday" className="input" defaultValue="1">
              {WEEKDAY_LONG.map((l, i) => <option key={l} value={i + 1}>{l}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="fs_s">Từ</label><input id="fs_s" name="start_time" type="time" required className="input" defaultValue="18:00" /></div>
          <div className="field"><label htmlFor="fs_e">Đến</label><input id="fs_e" name="end_time" type="time" required className="input" defaultValue="20:00" /></div>
          <div className="field">
            <label htmlFor="fs_v">Sân</label>
            <select id="fs_v" name="venue_id" className="input" defaultValue="">
              <option value="">Sân nào cũng được</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <Submit className="btn navy">Thêm giờ rảnh</Submit>
        </ActionForm>
      </section>
    </>
  );
}
