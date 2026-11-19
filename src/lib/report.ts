// Báo cáo lãi / lỗ theo tháng từ số tổng của database (public.split_summary). Hàm thuần để kiểm thử.

export type SummaryRow = { month: string; kind: string; amount: number };

export type MonthReport = {
  month: string;
  revenue: number; // doanh thu đã dạy (khoản đem chia)
  coach: number;
  sale: number;
  kept: number; // phần trung tâm giữ = quỹ + cổ đông
  fundsIn: number;
  fundsOut: number;
  shareholders: number;
  assistantDue: number;
  assistantPaidByStudents: number;
  /** Lãi / lỗ của trung tâm = cổ đông + (quỹ vào − quỹ chi) + (học viên trả trợ giảng − phải trả trợ giảng). */
  profit: number;
  adSpend: number;
};

export function monthReport(rows: SummaryRow[], month: string): MonthReport {
  const get = (kind: string) => rows.filter((r) => r.month === month && r.kind === kind).reduce((n, r) => n + Number(r.amount), 0);
  const fundsIn = get("quy-du-phong") + get("quy-van-hanh") + get("quy-phat-trien");
  const fundsOut = get("chi-quy-du-phong") + get("chi-quy-van-hanh") + get("chi-quy-phat-trien");
  const shareholders = get("co-dong");
  const assistantDue = get("tro-giang");
  const assistantPaidByStudents = get("tro-giang-hv-tra");
  return {
    month,
    revenue: get("doanh-thu"),
    coach: get("coach"),
    sale: get("sale"),
    kept: fundsIn + shareholders,
    fundsIn,
    fundsOut,
    shareholders,
    assistantDue,
    assistantPaidByStudents,
    profit: shareholders + fundsIn - fundsOut + assistantPaidByStudents - assistantDue,
    adSpend: get("chi-loai-quang-cao"),
  };
}

export function sumReports(list: MonthReport[]): Omit<MonthReport, "month"> {
  const keys = ["revenue", "coach", "sale", "kept", "fundsIn", "fundsOut", "shareholders", "assistantDue", "assistantPaidByStudents", "profit", "adSpend"] as const;
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Omit<MonthReport, "month">;
  for (const r of list) for (const k of keys) out[k] += r[k];
  return out;
}
