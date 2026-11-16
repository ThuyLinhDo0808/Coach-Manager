import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Icon } from "@/components/icon";
import { hasSupabase } from "@/lib/env";
import { dong } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { publicClient } from "@/lib/supabase/public";
import { dmy, vnDate } from "@/lib/time";
import { canMakeQr, vietQrPayload } from "@/lib/vietqr";
import { reportPaid } from "./actions";

export const metadata: Metadata = { title: "Thanh toán học phí", robots: { index: false } };
export const dynamic = "force-dynamic";

type OfferView = {
  title: string; student_name: string; list_price: number; discount_pct: number; amount: number; pay_now: number;
  memo: string; expires_on: string | null; status: "cho" | "da-bao" | "da-xac-nhan" | "huy"; coach_name: string; payout: unknown; zalo: string | null;
};

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="divide-row flex items-center justify-between gap-3 py-2.5 first:border-t-0">
      <span className="text-faint">{label}</span>
      <span className={`num text-right ${strong ? "text-base font-extrabold" : "font-semibold"}`} style={{ whiteSpace: "normal" }}>{value}</span>
    </div>
  );
}

export default async function ThanhToanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase || !/^[0-9a-f-]{36}$/.test(token)) notFound();
  const { data, error } = await publicClient().rpc("get_offer", { p_token: token });
  if (error || !data) notFound();
  const o = data as OfferView;
  const payout = getSettings({ payout: o.payout }).payout;
  const expired = o.status === "cho" && o.expires_on != null && o.expires_on < vnDate();
  const open = o.status === "cho" && !expired;
  const qr = open && canMakeQr(payout)
    ? await QRCode.toString(vietQrPayload({ bankBin: payout.bank_bin, accountNo: payout.account_no, amount: o.pay_now, memo: o.memo }), { type: "svg", margin: 1, errorCorrectionLevel: "M" })
    : null;
  const zalo = o.zalo ? (o.zalo.startsWith("http") ? o.zalo : `https://zalo.me/${o.zalo}`) : null;

  return (
    <>
      <header className="pub-top">
        <span className="logo"><b>TM</b>{o.coach_name}</span>
      </header>
      <main className="mx-auto w-full max-w-[520px] px-4 py-6">
        <div className="card" style={{ padding: 24 }}>
          <div className="text-center">
            <h1 className="text-[22px] font-extrabold">Thanh toán học phí</h1>
            <div className="mt-1 text-muted">{o.title} · {o.student_name}</div>
          </div>

          {o.status === "da-xac-nhan" && (
            <div className="mt-4 rounded-[14px] bg-goodbg px-4 py-3 text-center font-semibold text-good" role="status">
              <Icon name="check" className="mr-1 inline" /> Coach đã xác nhận nhận tiền. Hẹn gặp bạn ở sân!
            </div>
          )}
          {o.status === "da-bao" && (
            <div className="mt-4 rounded-[14px] bg-warnbg px-4 py-3 text-center font-semibold text-warn" role="status">
              Đã ghi nhận bạn báo chuyển khoản. Coach sẽ kiểm tra và xác nhận sớm.
            </div>
          )}
          {(o.status === "huy" || expired) && (
            <div className="mt-4 rounded-[14px] bg-badbg px-4 py-3 text-center font-semibold text-bad" role="alert">
              {expired ? "Ưu đãi này đã hết hạn." : "Ưu đãi này đã được huỷ."} Bạn nhắn coach để nhận link mới nhé.
            </div>
          )}

          {qr && (
            <div className="mx-auto mt-5 w-[220px] rounded-[18px] border border-line p-3" role="img" aria-label="Mã VietQR chuyển khoản" dangerouslySetInnerHTML={{ __html: qr }} />
          )}
          {open && !qr && (
            <div className="soft mt-4 text-center text-[13px] text-muted">Coach chưa khai tài khoản nhận tiền. Bạn nhắn coach để lấy thông tin chuyển khoản.</div>
          )}

          <div className="mt-4">
            {o.discount_pct > 0 && <Line label="Học phí gốc" value={dong(o.list_price)} />}
            {o.discount_pct > 0 && <Line label="Ưu đãi" value={`−${o.discount_pct}%`} />}
            <Line label="Học phí" value={dong(o.amount)} />
            {o.pay_now < o.amount && <Line label="Còn lại đóng sau" value={dong(o.amount - o.pay_now)} />}
            <Line label={o.pay_now < o.amount ? "Đặt cọc lần này" : "Cần chuyển"} value={dong(o.pay_now)} strong />
            {open && payout.account_no && (
              <>
                <Line label="Ngân hàng" value={payout.bank_name || payout.bank_bin} />
                <Line label="Số tài khoản" value={payout.account_no} />
                {payout.account_name && <Line label="Chủ tài khoản" value={payout.account_name} />}
                <Line label="Nội dung" value={o.memo} strong />
              </>
            )}
            {open && o.expires_on && <Line label="Hạn ưu đãi" value={dmy(o.expires_on, true)} />}
          </div>

          {open && (
            <form action={reportPaid} className="mt-4 grid gap-2">
              <input type="hidden" name="token" value={token} />
              <button className="btn primary" style={{ height: 52, fontSize: 15 }}>Tôi đã chuyển khoản</button>
              <p className="text-center text-xs text-faint">Quét mã bằng app ngân hàng: số tiền và nội dung đã điền sẵn. Chuyển xong bấm nút trên để coach kiểm tra.</p>
            </form>
          )}
          {zalo && (
            <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn ghost mt-3 w-full">
              <Icon name="chat" /> Nhắn Zalo cho coach
            </a>
          )}
        </div>
      </main>
    </>
  );
}
