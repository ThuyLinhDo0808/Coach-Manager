import { describe, expect, it } from "vitest";
import { DEFAULT_RULE, deducted, perSessionBase, splitAmount, totalsByParty, parsePct, parseRuleForm, type SplitRule } from "./split";

const rule: SplitRule = {
  ...DEFAULT_RULE,
  shareholders: [
    { user_id: "trung", name: "Trung", bp: 1000 },
    { user_id: "linh", name: "Linh", bp: 1000 },
  ],
};

describe("chia tiền theo buổi", () => {
  it("ví dụ: gói 10 buổi 3.000.000 đ, buổi có 4 học viên bị trừ buổi → chia 1.200.000 đ", () => {
    const base = perSessionBase({ price: 3_000_000, sessions_total: 10 });
    expect(base).toBe(300_000);
    // Mỗi học viên có người chốt riêng; cùng một coach dạy buổi đó.
    const closers = ["sale-a", "sale-a", "sale-b", "coach-1"];
    const parts = closers.flatMap((saleId) => splitAmount(base!, rule, { saleId, coachId: "coach-1" }));
    expect(parts.reduce((n, p) => n + p.amount, 0)).toBe(1_200_000);

    const sum = (pred: (p: (typeof parts)[number]) => boolean) => parts.filter(pred).reduce((n, p) => n + p.amount, 0);
    expect(sum((p) => p.kind === "coach" && p.user_id === "coach-1")).toBe(600_000);
    expect(sum((p) => p.kind === "quy-du-phong")).toBe(60_000);
    expect(sum((p) => p.kind === "quy-van-hanh")).toBe(120_000);
    expect(sum((p) => p.kind === "quy-phat-trien")).toBe(60_000);
    expect(sum((p) => p.kind === "co-dong" && p.user_id === "trung")).toBe(120_000);
    expect(sum((p) => p.kind === "co-dong" && p.user_id === "linh")).toBe(120_000);
    expect(sum((p) => p.kind === "sale")).toBe(120_000);
    // 30.000 đ / học viên cho người chốt của học viên đó
    expect(sum((p) => p.kind === "sale" && p.user_id === "sale-a")).toBe(60_000);
    expect(sum((p) => p.kind === "sale" && p.user_id === "sale-b")).toBe(30_000);
    // Người vừa chốt vừa dạy nhận cả 10% và 50%
    const byParty = totalsByParty(parts);
    expect(byParty.get("sale:coach-1")!.amount).toBe(30_000);
    expect(byParty.get("coach:coach-1")!.amount).toBe(600_000);
  });

  it("phần lẻ do làm tròn vào quỹ vận hành, tổng luôn đúng", () => {
    const parts = splitAmount(266_667, rule, { saleId: "s", coachId: "c" });
    expect(parts.reduce((n, p) => n + p.amount, 0)).toBe(266_667);
    const ops = parts.find((p) => p.kind === "quy-van-hanh")!.amount;
    expect(ops).toBe(266_667 - 26_666 - 133_333 - 13_333 - 13_333 - 26_666 - 26_666);
  });

  it("phí buổi ưu tiên hơn giá gói; thiếu dữ liệu thì không chia", () => {
    expect(perSessionBase({ price: 3_000_000, sessions_total: 10, price_per_session: 350_000 })).toBe(350_000);
    expect(perSessionBase({ price: 2_000_000, sessions_total: 3 })).toBe(666_666);
    expect(perSessionBase({ price: null, sessions_total: 10 })).toBeNull();
    expect(perSessionBase({ price: 3_000_000, sessions_total: null })).toBeNull();
  });

  it("tỉ lệ sai tổng thì báo lỗi", () => {
    expect(() => splitAmount(100, { ...rule, coach_bp: 4000 }, { saleId: null, coachId: null })).toThrow();
  });

  it("trạng thái bị trừ buổi theo quy định lớp", () => {
    expect(deducted("co-mat-hoac-khong-bao")).toEqual(["co-mat", "vang"]);
    expect(deducted("chi-co-mat")).toEqual(["co-mat"]);
    expect(deducted("moi-buoi")).toEqual(["co-mat", "vang", "bao-nghi"]);
  });
});

describe("form tỉ lệ", () => {
  const form = (o: Record<string, string>) => (k: string) => o[k] ?? null;
  const base = { effective_from: "2026-12-01", sale_bp: "10", coach_bp: "50", reserve_bp: "5", ops_bp: "10", dev_bp: "5", sh_name_0: "Trung", sh_pct_0: "10", sh_name_1: "Linh", sh_pct_1: "10" };
  it("đọc đúng tỉ lệ đã chốt", () => {
    const r = parseRuleForm(form(base));
    expect(r.ok && r.rule.coach_bp).toBe(5000);
    expect(r.ok && r.rule.shareholders.map((s) => s.name)).toEqual(["Trung", "Linh"]);
  });
  it("chặn tổng khác 100%", () => {
    const r = parseRuleForm(form({ ...base, coach_bp: "45" }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("95%");
  });
  it("nhận số lẻ có dấu phẩy", () => {
    expect(parsePct("2,5")).toBe(250);
    expect(parsePct("101")).toBeNull();
    expect(parsePct("abc")).toBeNull();
  });
});
