import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { categoryLabel, isMonth, monthRange } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { vnDate } from "@/lib/time";

// Xuất sổ thu chi của một tháng thành CSV (mở được bằng Excel).
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session.role !== "owner") return new NextResponse("Không có quyền", { status: 403 });
  const asked = request.nextUrl.searchParams.get("thang");
  const month = isMonth(asked) ? asked : vnDate().slice(0, 7);
  const { from, to } = monthRange(month);
  const rows = await (await moneyDb(session.coach.id)).ledgerBetween(from, to);
  // Ô bắt đầu bằng = + - @ có thể bị Excel hiểu là công thức: thêm dấu nháy đơn phía trước.
  const cell = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [
    ["Ngày", "Thu/Chi", "Loại", "Nội dung", "Số tiền"].map(cell).join(","),
    ...rows.map((r) => [r.entry_date, r.kind === "thu" ? "Thu" : "Chi", categoryLabel(r.category), r.description, r.kind === "thu" ? r.amount : -r.amount].map(cell).join(",")),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="thu-chi-${month}.csv"` },
  });
}
