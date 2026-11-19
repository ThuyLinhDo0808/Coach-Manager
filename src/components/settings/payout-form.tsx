"use client";

import { useState } from "react";
import { savePayout } from "@/app/quan-ly/cai-dat/actions";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { Hint, SectionHead, SettingsShell } from "@/components/settings/shell";
import { Field, SegPick, SwitchRow, UnitInput } from "@/components/ui-kit";
import { formatVnd } from "@/lib/format";
import type { CollectSettings, PayoutSettings } from "@/lib/settings";
import { bankName, BANKS } from "@/lib/settings-types";

const DEPOSITS = [
  { value: 0, label: "Không" },
  { value: 30, label: "30%" },
  { value: 50, label: "50%" },
  { value: 100, label: "100%" },
];
const dong = (n: number) => formatVnd(n)!.replace("đ", " đ");

export function PayoutForm({ payout, collect, example }: { payout: PayoutSettings; collect: CollectSettings; example: { title: string; price: number } | null }) {
  const [v, setV] = useState({
    bank_bin: payout.bank_bin,
    account_no: payout.account_no,
    account_name: payout.account_name,
    deposit_pct: payout.deposit_pct,
    offer_days: String(payout.offer_days),
    accept_cash: collect.accept_cash,
    require_proof: collect.require_proof,
  });
  const save = useSave(savePayout, v);
  type V = typeof v;
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const deposits = DEPOSITS.some((d) => d.value === v.deposit_pct) ? DEPOSITS : [...DEPOSITS, { value: v.deposit_pct, label: `${v.deposit_pct}%` }];
  // Ngân hàng đã lưu từ trước mà không có trong danh sách: vẫn hiện đúng tên; muốn lưu thì phải chọn lại trong danh sách.
  const unknownBank = v.bank_bin && !BANKS.some((b) => b.bin === v.bank_bin);
  const ready = Boolean(v.bank_bin && v.account_no.trim() && v.account_name.trim());
  const price = example?.price ?? 3_200_000;
  const pct = v.deposit_pct > 0 && v.deposit_pct < 100 ? v.deposit_pct : 100;
  const amount = Math.round((price * pct) / 100 / 1000) * 1000;

  return (
    <form onSubmit={save.onSubmit} noValidate>
      <SettingsShell on="nhan-tien" act={<SaveAct save={save} />}>
        <SaveError save={save} />
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-4 *:min-w-0">
            <section className="card">
              <SectionHead
                icon="wallet"
                color="emerald"
                title="Tài khoản nhận tiền"
                caption="Học viên chuyển học phí vào tài khoản này."
                right={<span className={`pill ${ready ? "good" : "warn"}`}>{ready ? "Đã đủ thông tin" : "Chưa đủ thông tin"}</span>}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Ngân hàng" className="md:col-span-2" error={save.err("bank_bin")}>
                  <select className="input" value={v.bank_bin} onChange={(e) => set("bank_bin", e.target.value)}>
                    <option value="">Chọn ngân hàng</option>
                    {BANKS.map((b) => (
                      <option key={b.bin} value={b.bin}>
                        {b.name}
                      </option>
                    ))}
                    {unknownBank && <option value={v.bank_bin}>{payout.bank_name || `Mã ${v.bank_bin}`}</option>}
                  </select>
                </Field>
                <Field label="Số tài khoản" error={save.err("account_no")}>
                  <input className="input num" inputMode="numeric" maxLength={24} autoComplete="off" placeholder="0123 456 789" value={v.account_no} onChange={(e) => set("account_no", e.target.value)} />
                </Field>
                <Field label="Tên chủ tài khoản" error={save.err("account_name")}>
                  <input className="input uppercase" maxLength={60} autoComplete="off" placeholder="NGUYEN VAN A" value={v.account_name} onChange={(e) => set("account_name", e.target.value)} />
                </Field>
              </div>
              <Hint>Tên viết hoa, không dấu, đúng như trên ứng dụng ngân hàng. Web không đối chiếu được với ngân hàng, bạn dò lại trước khi lưu.</Hint>
            </section>

            <section className="card">
              <SectionHead icon="check" color="blue" title="Cách thu tiền" caption="Những cách học viên được đóng học phí." />
              <div className="flex items-center justify-between gap-2.5 pb-2.5">
                <div className="min-w-0">
                  <b>Chuyển khoản</b>
                  <div className="text-[13px] text-faint">Mã QR và nội dung chuyển khoản tạo riêng cho từng offer</div>
                </div>
                <span className={`pill ${ready ? "good" : "n"}`}>{ready ? "Đang bật" : "Cần tài khoản"}</span>
              </div>
              <SwitchRow title="Tiền mặt tại sân" sub="Coach hoặc trợ giảng ghi nhận đã thu" checked={v.accept_cash} onChange={(b) => set("accept_cash", b)} />
              <SwitchRow title="Bắt buộc gửi ảnh chuyển khoản" sub="Có ảnh thì xác nhận tiền nhanh hơn" checked={v.require_proof} onChange={(b) => set("require_proof", b)} />
            </section>

            <section className="card">
              <SectionHead icon="clock" color="amber" title="Đặt cọc và hạn đóng" caption="Số tiền cần đóng khi chốt khoá và offer giữ chỗ bao lâu." />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="field">
                  <span className="label">Đặt cọc khi chốt khoá</span>
                  <SegPick label="Đặt cọc khi chốt khoá" options={deposits} value={v.deposit_pct} onChange={(d) => set("deposit_pct", d)} full />
                  {save.err("deposit_pct") && <span className="err">{save.err("deposit_pct")}</span>}
                </div>
                <Field label="Offer hết hạn sau" error={save.err("offer_days")}>
                  <UnitInput unit="ngày" inputMode="numeric" maxLength={2} value={v.offer_days} onChange={(e) => set("offer_days", e.target.value)} />
                </Field>
              </div>
              <Hint>{v.deposit_pct > 0 && v.deposit_pct < 100 ? `Học viên đóng trước ${v.deposit_pct}% học phí, phần còn lại đóng sau.` : v.deposit_pct === 100 ? "Học viên đóng đủ học phí khi chốt khoá." : "Không thu cọc: học viên đóng đủ khi vào học."} Quá hạn mà chưa đóng thì offer tự hết hiệu lực.</Hint>
            </section>
          </div>

          <section className="card md:sticky md:top-4">
            <SectionHead icon="qr" color="indigo" title="Học viên sẽ thấy" caption="Xem trước thông tin chuyển khoản trên offer." />
            {ready ? (
              <div className="overflow-hidden rounded-[18px] text-white" style={{ background: "var(--grad-navy)" }}>
                <div className="flex items-center justify-between gap-2 px-[18px] pt-4 text-[13px] text-[#b9c5da]">
                  <span className="font-semibold text-white">{bankName(v.bank_bin) || payout.bank_name || v.bank_bin}</span>
                  <span>{pct < 100 ? `Cọc ${pct}%` : "Đóng đủ"}</span>
                </div>
                <div className="px-[18px] pt-3 pb-4">
                  <div className="num text-[28px] leading-none font-extrabold text-lime">{dong(amount)}</div>
                  <div className="mt-1 truncate text-[13px] text-[#b9c5da]">{example?.title ?? "Ví dụ khoá 3.200.000 đ"}</div>
                </div>
                <div className="grid gap-2 bg-white/5 px-[18px] py-3.5 text-[13px]">
                  {[
                    ["Số tài khoản", v.account_no.replace(/\s/g, "")],
                    ["Chủ tài khoản", v.account_name.toUpperCase()],
                    ["Nội dung", "Mã riêng của offer"],
                  ].map(([a, b]) => (
                    <div key={a} className="flex justify-between gap-3">
                      <span className="flex-none text-[#b9c5da]">{a}</span>
                      <b className="num min-w-0 text-right break-words">{b}</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid place-items-center gap-2 rounded-[18px] border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                <Icon name="wallet" size={22} className="text-faint" />
                Điền ngân hàng, số tài khoản và tên chủ tài khoản để xem trước.
              </div>
            )}
            <Hint>Mã QR và link thanh toán gửi học viên nằm ở offer trong Tuyển sinh / Sổ thu chi.</Hint>
          </section>
        </div>
        <SaveBar save={save} />
      </SettingsShell>
    </form>
  );
}
