import { z } from "zod";
import { normalizePhone } from "@/lib/format";

const strList = z.array(z.string().max(60)).max(12).default([]);
const optText = (max: number) => z.string().trim().max(max).optional().default("");

/** Dữ liệu form nhu cầu học (cả 3 bước). Dùng chung cho form công khai và sale nhập tay. */
export const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Bạn điền họ tên giúp mình nhé").max(80),
  gender: z.enum(["nam", "nu", "khac"], { error: "Bạn chọn giới tính nhé" }),
  birth_year: z.coerce
    .number({ error: "Năm sinh chưa đúng" })
    .int()
    .min(1930, "Năm sinh chưa đúng")
    .max(new Date().getFullYear() - 3, "Năm sinh chưa đúng"),
  phone: z.string().transform((v, ctx) => {
    const p = normalizePhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Số điện thoại cần 10 chữ số, ví dụ 0912 345 678" });
      return z.NEVER;
    }
    return p;
  }),
  for_whom: z.enum(["ban-than", "con", "nhom"]).default("ban-than"),
  played_sports: z.boolean().nullable().default(null),
  sports: strList,
  pickleball_duration: optText(40),
  dupr: optText(10),
  self_level: optText(40),
  availability: z.record(z.string(), z.array(z.enum(["sang", "chieu", "toi"]))).default({}),
  course_id: z.guid().nullable().default(null),
  interests: strList,
  goal: optText(300),
  formats: strList,
  styles: strList,
  area: optText(80),
  budget: optText(40),
  source: optText(40),
  note: optText(1000),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;

export const STEP_FIELDS: (keyof LeadInput)[][] = [
  ["full_name", "gender", "birth_year", "phone", "for_whom"],
  ["played_sports", "sports", "pickleball_duration", "dupr", "self_level", "availability"],
  ["course_id", "interests", "goal", "formats", "styles", "area", "budget", "source", "note"],
];

/** Trả lỗi theo tên trường (chỉ lỗi đầu tiên của mỗi trường). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
