import Link from "next/link";
import { regenMonth } from "@/app/quan-ly/_actions/split";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong, isMonth, monthRange, shiftMonth } from "@/lib/money";
import { PARTY_LABEL, type PartyKind } from "@/lib/split";
import { splitDb } from "@/lib/split-data";
import { peopleOf, teachingDb } from "@/lib/teaching-data";
import { dmy, nowMs, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Chia tiền tháng" };

const ORDER: PartyKind[] = ["coach", "sale", "co-dong", "quy-van-hanh", "quy-du-phong", "quy-phat-trien"];

export default async function ChiaTienPage({ searchParams }: { searchParams: Promise<{ thang?: string; "tinh-lai"?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("tai-chinh");
  const month = isMonth(sp.thang) ? sp.thang : vnDate().slice(0, 7);
  const [y, mm] = month.split("-");
  const s = await splitDb(session.coach.id);
  const t = await teachingDb(session.coach.id);
  const { from, to } = monthRange(month);
  const [entries, closed, sessions, classes, members] = await Promise.all([
    s.entriesOfMonth(month), s.closedMonths(), t.sessionsBetween(vnIso(from, "00:00"), vnIso(to, "00:00")), t.classes(), t.members(),
  ]);
  const isClosed = closed.includes(month);
  const people = peopleOf(members);
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title ?? "Lớp";
  const personName = (id: string | null) => people.find((p) => p.id === id)?.name;

  // Mỗi (buổi × học viên) có một khoản đem chia; các phần của nó cộng lại đúng bằng khoản đó.
  const lines = new Map<string, number>();
  for (const e of entries) lines.set(`${e.session_id}:${e.student_id}`, e.base_amount);
  const total = [...lines.values()].reduce((n, v) => n + v, 0);

  const byParty = new Map<string, { kind: PartyKind; name: string; amount: number; missing: boolean }>();
  for (const e of entries) {
    const name = e.party_kind === "co-dong" ? (e.party_name ?? "Cổ đông") : e.party_user_id ? (personName(e.party_user_id) ?? e.party_name ?? "Thành viên") : (e.party_name ?? PARTY_LABEL[e.party_kind]);
    const key = `${e.party_kind}:${e.party_user_id ?? name}`;
    const cur = byParty.get(key) ?? { kind: e.party_kind, name, amount: 0, missing: (e.party_kind === "sale" || e.party_kind === "coach") && !e.party_user_id };
    cur.amount += e.amount;
    byParty.set(key, cur);
  }
  const parties = [...byParty.values()].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || b.amount - a.amount);
  const missing = parties.filter((p) => p.missing);

  const perSession = sessions
    .filter((x) => x.class_id && x.kind === "day" && x.status !== "huy")
    .map((x) => {
      const mine = [...lines.entries()].filter(([k]) => k.startsWith(`${x.id}:`));
      return { x, students: mine.length, amount: mine.reduce((n, [, v]) => n + v, 0) };
    });
  const done = perSession.filter((p) => p.students > 0);
  const notYet = perSession.filter((p) => p.students === 0 && new Date(p.x.ends_at).getTime() < nowMs());
  const byClass = new Map<string, { title: string; sessions: number; amount: number }>();
  for (const p of done) {
    const cur = byClass.get(p.x.class_id!) ?? { title: className(p.x.class_id), sessions: 0, amount: 0 };
    cur.sessions += 1;
    cur.amount += p.amount;
    byClass.set(p.x.class_id!, cur);
  }

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Chia tiền tháng" sub={`Tháng ${mm}/${y} · ${isClosed ? "đã chốt" : "tạm tính, chưa chốt"}`}>
        <Link href={`?thang=${shiftMonth(month, -1)}`} className="btn sm glass" aria-label="Tháng trước">‹</Link>
        <Link href={`?thang=${shiftMonth(month, 1)}`} className="btn sm glass" aria-label="Tháng sau">›</Link>
        {!isClosed && session.roles.includes("chu") && (
          <form action={regenMonth}>
            <input type="hidden" name="month" value={month} />
            <button className="btn sm glass">Tính lại tháng</button>
          </form>
        )}
      </PageHead>
      {sp["tinh-lai"] && <div className="card mb-4 text-[13px] font-semibold text-good" role="status">Đã tính lại toàn bộ buổi trong tháng theo điểm danh và tỉ lệ hiện có.</div>}

      <div className="kpis">
        <div className="card kpi"><div className="l">Đem chia</div><div className="v">{dong(total)}</div><div className="s">{isClosed ? "đã chốt" : "tạm tính"}</div></div>
        <div className="card kpi"><div className="l">Buổi đã tính</div><div className="v">{done.length}</div><div className="s">{lines.size} lượt học viên</div></div>
        <div className="card kpi"><div className="l">Coach đứng lớp</div><div className="v">{dong(parties.filter((p) => p.kind === "coach").reduce((n, p) => n + p.amount, 0))}</div><div className="s">gồm cả dạy thay</div></div>
        <div className="card kpi"><div className="l">Vào các quỹ</div><div className="v">{dong(parties.filter((p) => p.kind.startsWith("quy-")).reduce((n, p) => n + p.amount, 0))}</div><div className="s">dự phòng · vận hành · phát triển</div></div>
      </div>

      {(missing.length > 0 || notYet.length > 0) && (
        <div className="card mb-4" style={{ background: "#fffbeb" }}>
          <h2 className="h2">Cần kiểm tra</h2>
          {missing.map((p) => (
            <div key={p.kind + p.name} className="text-[13px]">· {PARTY_LABEL[p.kind]}: {dong(p.amount)} đang ghi cho “{p.name}”. Chọn người {p.kind === "sale" ? "chốt ở đăng ký học của học viên" : "dạy ở buổi học"} rồi bấm Tính lại tháng.</div>
          ))}
          {notYet.length > 0 && <div className="text-[13px]">· {notYet.length} buổi đã qua nhưng chưa có học viên bị trừ buổi (chưa điểm danh, hoặc học viên chưa có học phí).</div>}
        </div>
      )}

      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-[1fr_1fr]">
        <div className="card">
          <h2 className="h2">Theo người & quỹ</h2>
          {parties.length === 0 && <div className="text-muted">Tháng này chưa có buổi nào được tính. Bút toán tự sinh khi điểm danh hoặc hoàn tất buổi.</div>}
          {parties.map((p) => (
            <div key={p.kind + p.name} className="divide-row flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <b className="block truncate">{p.kind.startsWith("quy-") ? PARTY_LABEL[p.kind] : p.name}</b>
                <div className="text-[13px] text-faint">{p.kind.startsWith("quy-") ? "quỹ" : PARTY_LABEL[p.kind]}</div>
              </div>
              <span className={`num font-bold ${p.missing ? "text-warn" : ""}`}>{dong(p.amount)}</span>
            </div>
          ))}
          {parties.length > 0 && (
            <div className="divide-row flex justify-between pt-2.5 font-extrabold"><span>Tổng</span><span className="num">{dong(total)}</span></div>
          )}
          <p className="mt-3 text-xs text-faint">Số trong tháng chưa chốt là tạm tính: sửa điểm danh, người dạy, học phí hay người chốt thì số tự đổi theo. Phải trả từng người chốt ở bước Chốt tháng.</p>
        </div>

        <div className="grid min-w-0 gap-4 *:min-w-0">
          <div className="card">
            <h2 className="h2">Theo lớp</h2>
            {byClass.size === 0 && <div className="text-muted">Chưa có.</div>}
            {[...byClass.entries()].map(([id, c]) => (
              <Link key={id} href={`/quan-ly/khoa-hoc/${id}`} className="divide-row flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1"><b className="block truncate">{c.title}</b><div className="text-[13px] text-faint">{c.sessions} buổi</div></div>
                <span className="num font-bold">{dong(c.amount)}</span>
              </Link>
            ))}
          </div>
          <div className="card">
            <h2 className="h2">Từng buổi</h2>
            {done.length === 0 && <div className="text-muted">Chưa có.</div>}
            {done.map(({ x, students, amount }) => (
              <Link key={x.id} href={`/quan-ly/lich-day/${x.id}`} className="divide-row flex items-center gap-3 py-2.5">
                <div className="num w-[74px] shrink-0 text-[13px] font-semibold">{dmy(vnDate(x.starts_at))} {vnTime(x.starts_at)}</div>
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{className(x.class_id)}{x.seq ? ` · buổi ${x.seq}` : ""}</b>
                  <div className="truncate text-[13px] text-faint">{personName(x.teacher_id) ?? "Chưa có người dạy"} · {students} học viên</div>
                </div>
                <span className="num font-semibold">{dong(amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
