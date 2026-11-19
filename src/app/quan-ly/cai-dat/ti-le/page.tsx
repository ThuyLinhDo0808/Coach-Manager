import { deleteSplitRule, saveSplitRule } from "@/app/quan-ly/_actions/split";
import { SettingsShell } from "@/components/settings/shell";
import { dong } from "@/lib/money";
import { requireOwner } from "@/lib/owner";
import { DEFAULT_RULE, PARTY_LABEL, pct, splitAmount, type SplitRule } from "@/lib/split";
import { splitDb } from "@/lib/split-data";
import { peopleOf, teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Tỉ lệ chia & cổ đông" };

const PARTS: { key: keyof Omit<SplitRule, "shareholders">; label: string; hint: string }[] = [
  { key: "sale_bp", label: "Sale (người chốt)", hint: "người chốt từng học viên × gói" },
  { key: "coach_bp", label: "Coach đứng lớp", hint: "người dạy thực tế, kể cả dạy thay" },
  { key: "reserve_bp", label: "Quỹ dự phòng", hint: "chi quảng cáo lấy từ quỹ này" },
  { key: "ops_bp", label: "Quỹ vận hành", hint: "nhận cả phần lẻ do làm tròn" },
  { key: "dev_bp", label: "Quỹ phát triển", hint: "phần mềm, phí nền tảng" },
];

export default async function TiLePage({ searchParams }: { searchParams: Promise<{ loi?: string; "da-luu"?: string }> }) {
  const session = await requireOwner();
  const sp = await searchParams;
  const [rules, members] = await Promise.all([(await splitDb(session.coach.id)).rules(), (await teachingDb(session.coach.id)).members()]);
  const people = peopleOf(members);
  const today = vnDate();
  const current = rules.find((r) => r.effective_from <= today) ?? rules[rules.length - 1] ?? null;
  const start: SplitRule = current ?? DEFAULT_RULE;
  const rows = [...start.shareholders, { user_id: null, name: "", bp: 0 }, { user_id: null, name: "", bp: 0 }];
  // Ví dụ: 4 học viên, gói 10 buổi 3.000.000 → mỗi buổi đem chia 1.200.000.
  const example = current ? splitAmount(1200000, current, { saleId: null, coachId: null }) : [];

  return (
    <SettingsShell on="ti-le">
      {sp["da-luu"] && <div className="card text-[13px] font-semibold text-good" role="status">Đã lưu tỉ lệ. Các buổi từ ngày áp dụng (tháng chưa chốt) đã được tính lại.</div>}
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="card">
          <h2 className="h2">
            Đang áp dụng
            {current && <span className="text-[13px] font-medium text-faint">từ {dmy(current.effective_from, true)}</span>}
          </h2>
          {!current && <div className="text-muted">Chưa có tỉ lệ. Chạy migration chia tiền hoặc thêm tỉ lệ bên dưới.</div>}
          {current && (
            <>
              {PARTS.map((p) => (
                <div key={p.key} className="divide-row flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1"><b>{p.label}</b><div className="text-[13px] text-faint">{p.hint}</div></div>
                  <span className="num text-base font-extrabold">{pct(current[p.key])}%</span>
                </div>
              ))}
              {current.shareholders.map((s, i) => (
                <div key={i} className="divide-row flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <b>Cổ đông {s.name}</b>
                    <div className="text-[13px] text-faint">{s.user_id ? `tài khoản: ${people.find((p) => p.id === s.user_id)?.name ?? "thành viên"}` : "chưa gắn tài khoản — chưa xem được “Phần của tôi”"}</div>
                  </div>
                  <span className="num text-base font-extrabold">{pct(s.bp)}%</span>
                </div>
              ))}
            </>
          )}
        </div>
        {current && (
          <div className="card">
            <h2 className="h2">Ví dụ một buổi</h2>
            <p className="mb-2 text-[13px] text-muted">Gói 10 buổi 3.000.000 đ → 300.000 đ / buổi / học viên. Buổi có 4 học viên → đem chia {dong(1200000)}:</p>
            {example.map((p, i) => (
              <div key={i} className="flex justify-between py-1 text-[13px]">
                <span>{p.kind === "co-dong" ? `Cổ đông ${p.name}` : PARTY_LABEL[p.kind]}</span>
                <span className="num font-semibold">{dong(p.amount)}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-faint">Tiền sân / bóng không đem chia (học viên tự chịu, ghi thu hộ / chi hộ). Trợ giảng tính riêng, ngoài các phần này.</p>
          </div>
        )}
      </div>

      <form action={saveSplitRule} className="card" id="moi">
        <h2 className="h2">Đổi tỉ lệ</h2>
        <p className="mb-3 text-[13px] text-muted">Tỉ lệ mới áp dụng cho các buổi từ ngày chọn. Tháng đã chốt giữ nguyên số cũ. Chọn đúng ngày của một tỉ lệ đã có để sửa tỉ lệ đó.</p>
        {sp.loi && <div className="mb-3 text-[13px] font-semibold text-bad" role="alert">{sp.loi}</div>}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="field">
            <label htmlFor="effective_from">Áp dụng từ ngày</label>
            <input id="effective_from" name="effective_from" type="date" required className="input" defaultValue={today} />
          </div>
          {PARTS.map((p) => (
            <div key={p.key} className="field">
              <label htmlFor={p.key}>{p.label} (%)</label>
              <input id={p.key} name={p.key} inputMode="decimal" required className="input num" defaultValue={pct(start[p.key])} />
            </div>
          ))}
        </div>
        <h3 className="mt-4 mb-2 text-sm font-bold">Cổ đông</h3>
        <div className="grid gap-2">
          {rows.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_88px] gap-2 md:grid-cols-[1fr_1fr_110px]">
              <input name={`sh_name_${i}`} className="input" placeholder="Tên cổ đông" defaultValue={s.name} aria-label={`Tên cổ đông ${i + 1}`} />
              <select name={`sh_user_${i}`} className="input col-span-2 md:col-span-1 md:row-start-1 md:col-start-2" defaultValue={s.user_id ?? ""} aria-label={`Tài khoản cổ đông ${i + 1}`}>
                <option value="">Chưa gắn tài khoản</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input name={`sh_pct_${i}`} inputMode="decimal" className="input num md:row-start-1 md:col-start-3" placeholder="%" defaultValue={s.name ? pct(s.bp) : ""} aria-label={`Tỉ lệ cổ đông ${i + 1} (%)`} />
            </div>
          ))}
        </div>
        <div className="field mt-3">
          <label htmlFor="note">Ghi chú</label>
          <input id="note" name="note" className="input" placeholder="Ví dụ: tăng quỹ dự phòng cho mùa quảng cáo" />
        </div>
        <p className="mt-2 text-xs text-faint">Tổng mọi phần (kể cả cổ đông) phải đúng 100%. Gắn tài khoản để cổ đông xem được “Phần của tôi”.</p>
        <button className="btn primary mt-3">Lưu tỉ lệ</button>
      </form>

      {rules.length > 0 && (
        <div className="card">
          <h2 className="h2">Lịch sử tỉ lệ</h2>
          {rules.map((r) => (
            <div key={r.id} className="divide-row flex flex-wrap items-center gap-2.5 py-2.5 text-[13px]">
              <b className="w-[92px]">{dmy(r.effective_from, true)}</b>
              <span className="min-w-0 flex-1 text-muted">
                Sale {pct(r.sale_bp)} · Coach {pct(r.coach_bp)} · Dự phòng {pct(r.reserve_bp)} · Vận hành {pct(r.ops_bp)} · Phát triển {pct(r.dev_bp)}
                {r.shareholders.map((s) => ` · ${s.name} ${pct(s.bp)}`).join("")}
                {r.note ? ` — ${r.note}` : ""}
              </span>
              {rules.length > 1 && (
                <form action={deleteSplitRule}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn sm ghost">Xoá</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </SettingsShell>
  );
}
