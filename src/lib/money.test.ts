import { describe, expect, it } from "vitest";
import { memoCode, monthRange, offerAmounts, profitByClass, shiftMonth, totals, trieu } from "./money";
import { canMakeQr, crc16, plainMemo, vietQrPayload } from "./vietqr";

describe("VietQR", () => {
  it("CRC-16/CCITT-FALSE đúng giá trị kiểm tra chuẩn", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("chuỗi QR có đủ trường và CRC khớp", () => {
    const p = vietQrPayload({ bankBin: "970436", accountNo: "0123456789", amount: 2160000, memo: "CTM 7K2QX9 Lê Huy" });
    expect(p.startsWith("000201010212")).toBe(true);
    expect(p).toContain("0006970436");
    expect(p).toContain("01100123456789");
    expect(p).toContain("5303704");
    expect(p).toContain("54072160000");
    expect(p).toContain("CTM 7K2QX9 Le Huy");
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4));
  });
  it("không có số tiền thì là QR tĩnh", () => {
    expect(vietQrPayload({ bankBin: "970436", accountNo: "0123456789" }).startsWith("000201010211")).toBe(true);
  });
  it("bỏ dấu nội dung", () => {
    expect(plainMemo("Đỗ Thuỳ Linh — khoá #2")).toBe("Do Thuy Linh khoa 2");
  });
  it("kiểm tra đủ thông tin tài khoản", () => {
    expect(canMakeQr({ bank_bin: "970436", account_no: "0123456789" })).toBe(true);
    expect(canMakeQr({ bank_bin: "", account_no: "0123456789" })).toBe(false);
  });
});

describe("tiền", () => {
  it("offer: ưu đãi và cọc", () => {
    expect(offerAmounts(2400000, 10, 0)).toEqual({ amount: 2160000, payNow: 2160000 });
    expect(offerAmounts(2400000, 0, 30)).toEqual({ amount: 2400000, payNow: 720000 });
  });
  it("tổng thu chi và lãi theo lớp", () => {
    const rows = [
      { kind: "thu" as const, amount: 3200000, class_id: "a" },
      { kind: "chi" as const, amount: 1400000, class_id: "a" },
      { kind: "chi" as const, amount: 560000, class_id: null },
    ];
    expect(totals(rows)).toEqual({ thu: 3200000, chi: 1960000, net: 1240000 });
    expect(profitByClass(rows)).toEqual([{ class_id: "a", thu: 3200000, chi: 1400000, net: 1800000 }]);
  });
  it("tháng", () => {
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 2)).toBe("2027-01");
  });
  it("định dạng và mã chuyển khoản", () => {
    expect(trieu(38400000)).toBe("38,4 tr");
    expect(memoCode("CTM", () => 0)).toBe("CTM 222222");
  });
});
