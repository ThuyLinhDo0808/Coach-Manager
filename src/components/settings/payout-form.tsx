"use client";

import { useState } from "react";
import { savePayout } from "@/app/quan-ly/cai-dat/actions";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { SettingsShell } from "@/components/settings/shell";
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
      <SettingsShell on="nhan-tien" sub="tài khoản nhận học phí" act={<SaveAct save={save} />}>
        <SaveError save={save} />
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-4 *:min-w-0">
            <div className="card">
              <h2 className="h2">Tài khoản ngân hàng</h2>
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
                  <input className="input num" inputMode="numeric" maxLength={24} autoComplete="off" value={v.account_no} onChange={(e) => set("account_no", e.target.value)} />
                </Field>
                <Field label="Tên chủ tài khoản" error={save.err("account_name")}>
                  <input className="input uppercase" maxLength={60} autoComplete="off" placeholder="NGUYEN VAN A" value={v.account_name} onChange={(e) => set("account_name", e.target.value)} />
                </Field>
              </div>
              <p className="mt-2 text-xs text-faint">Tên chủ tài khoản viết hoa không dấu. Web không kiểm tra được tên với ngân hàng; bạn dò lại số tài khoản và tên trước khi lưu.</p>
            </div>

            <div className="card">
              <h2 className="h2">Cách thu tiền</h2>
              <div className="flex items-center justify-between gap-2.5 py-2.5">
                <div className="min-w-0">
                  <b>Chuyển khoản ngân hàng</b>
                  <div className="text-[13px] text-faint">Luôn dùng khi đã điền tài khoản ở trên</div>
                </div>
                <span className={`pill ${ready ? "good" : "n"}`}>{ready ? "Sẵn sàng" : "Chưa có tài khoản"}</span>
              </div>
              <SwitchRow title="Tiền mặt tại sân" sub="Coach / trợ giảng ghi nhận đã thu" checked={v.accept_cash} onChange={(b) => set("accept_cash", b)} />
              <SwitchRow title="Học viên gửi ảnh chuyển khoản" sub="Cần ảnh để coach xác nhận đã nhận tiền" checked={v.require_proof} onChange={(b) => set("require_proof", b)} />
            </div>

            <div className="card">
              <h2 className="h2">Đặt cọc và hạn thanh toán</h2>
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
            </div>
          </div>

          <div className="card">
            <div className="mb-3 text-xs font-semibold text-faint">XEM TRƯỚC · THÔNG TIN CHUYỂN KHOẢN</div>
            <div className="rounded-[18px] bg-page p-[18px]">
              {ready ? (
                <>
                  <div className="num text-center text-2xl font-extrabold">{dong(amount)}</div>
                  <div className="text-center text-[13px] text-faint">
                    {pct < 100 ? `Cọc ${pct}%` : "Đóng đủ"} · {example?.title ?? "ví dụ khoá 3.200.000 đ"}
                  </div>
                  <div className="mt-3 grid gap-1.5 text-[13px]">
                    {[
                      ["Ngân hàng", bankName(v.bank_bin) || payout.bank_name || v.bank_bin],
                      ["Số tài khoản", v.account_no.replace(/\s/g, "")],
                      ["Chủ tài khoản", v.account_name.toUpperCase()],
                      ["Nội dung", "mã riêng của từng offer"],
                    ].map(([a, b]) => (
                      <div key={a} className="flex justify-between gap-3">
                        <span className="flex-none text-faint">{a}</span>
                        <b className="min-w-0 text-right break-words">{b}</b>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-[13px] text-muted">Điền đủ ngân hàng, số tài khoản và tên chủ tài khoản để xem trước.</div>
              )}
            </div>
            <p className="mt-3 text-xs text-faint">Mã QR chuyển khoản và link thanh toán nằm ở phần offer trong Thu chi; trang này chỉ lưu tài khoản nhận tiền.</p>
          </div>
        </div>
        <SaveBar save={save} />
      </SettingsShell>
    </form>
  );
}
