import { ActionForm, Submit } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { cancelOffer, confirmOffer, createOffer } from "@/app/quan-ly/_actions/money";
import { CloserSelect } from "@/components/closer-select";
import type { Member } from "@/lib/types";
import { dong, type Offer } from "@/lib/money";
import { dmy } from "@/lib/time";

const STATUS: Record<Offer["status"], [string, string]> = {
  cho: ["Chờ chuyển", "n"],
  "da-bao": ["Đã báo chuyển", "warn"],
  "da-xac-nhan": ["Đã nhận tiền", "good"],
  huy: ["Đã huỷ", "n"],
};

/** Khối "Gửi offer" trong chi tiết nhu cầu: tạo link thanh toán VietQR và theo dõi trạng thái. */
export function LeadOffers({ leadId, offers, classes, isOwner, origin, depositPct, canClose, members, meId }: { leadId: string; offers: Offer[]; classes: { id: string; label: string; price: number | null }[]; isOwner: boolean; origin: string; depositPct: number; canClose: boolean; members: Member[]; meId: string }) {
  return (
    <div>
      <h2 className="h2 mt-5" style={{ fontSize: 15 }}>Gửi offer</h2>
      {offers.map((o) => {
        const link = `${origin}/thanh-toan/${o.token}`;
        const open = o.status === "cho" || o.status === "da-bao";
        return (
          <div key={o.id} className="soft mb-2 grid gap-1.5 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <b className="truncate">{o.title}</b>
              <span className={`pill ${STATUS[o.status][1]}`}>{STATUS[o.status][0]}</span>
            </div>
            <div className="text-muted">
              <span className="num font-semibold text-ink">{dong(o.amount)}</span>
              {o.discount_pct > 0 && ` · giảm ${o.discount_pct}%`}
              {o.pay_now < o.amount && ` · cọc ${dong(o.pay_now)}`}
              {o.expires_on && open && ` · hạn ${dmy(o.expires_on)}`}
            </div>
            <div className="num text-faint">Nội dung CK: {o.memo}</div>
            {open && (
              <div className="flex flex-wrap gap-1.5">
                <CopyButton text={link} label="Sao chép link thanh toán" />
                {isOwner && (
                  <form action={confirmOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn sm primary">Xác nhận tiền</button>
                  </form>
                )}
                <form action={cancelOffer}>
                  <input type="hidden" name="id" value={o.id} />
                  <button className="btn sm ghost">Huỷ</button>
                </form>
              </div>
            )}
          </div>
        );
      })}
      {canClose && (
        <ActionForm action={createOffer} className="grid gap-2">
          <input type="hidden" name="lead_id" value={leadId} />
          <CloserSelect members={members} defaultValue={meId} />
          <select name="class_id" className="input" style={{ height: 40 }} aria-label="Lớp" defaultValue="">
            <option value="">Chưa có lớp (ghi tên khoá bên dưới)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}{c.price != null ? ` · ${dong(c.price)}` : ""}</option>
            ))}
          </select>
          <input name="title" className="input" style={{ height: 40 }} placeholder="Tên khoá (nếu chưa có lớp)" aria-label="Tên khoá" />
          <div className="flex gap-2">
            <input name="list_price" inputMode="numeric" required className="input num" style={{ height: 40 }} placeholder="Học phí (đ)" aria-label="Học phí" />
            <select name="discount_pct" className="input" style={{ height: 40 }} aria-label="Ưu đãi" defaultValue="0">
              <option value="0">Không giảm</option>
              <option value="5">Giảm 5%</option>
              <option value="10">Giảm 10%</option>
              <option value="15">Giảm 15%</option>
              <option value="20">Giảm 20%</option>
            </select>
          </div>
          <Submit className="btn primary" pendingText="Đang tạo…">Tạo link thanh toán</Submit>
          <p className="text-xs text-faint">
            {depositPct > 0 && depositPct < 100 ? `Học viên đặt cọc ${depositPct}% khi chốt. ` : ""}
            Học viên mở link, quét VietQR rồi bấm “Tôi đã chuyển khoản”. Coach xác nhận tiền thì nhu cầu tự chốt.
          </p>
        </ActionForm>
      )}
    </div>
  );
}
