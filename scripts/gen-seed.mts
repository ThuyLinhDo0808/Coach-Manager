// Sinh supabase/seed.sql từ nội dung mẫu trong src/lib/sample-data.ts.
// Chạy: npm run seed:gen
import { writeFileSync } from "node:fs";
import * as s from "../src/lib/sample-data.ts";

const JSONB_COLUMNS = new Set(["strengths", "experience", "contacts", "curriculum", "availability"]);

const q = (v: unknown, col = ""): string => {
  if (JSONB_COLUMNS.has(col)) return `${q(JSON.stringify(v))}::jsonb`;
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
    return v.length ? `array[${v.map((x) => q(x)).join(", ")}]::text[]` : "'{}'::text[]";
  }
  if (typeof v === "object") return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

function insert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => q(r[c], c)).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}\non conflict (id) do nothing;\n`;
}

const coachId = s.sampleCoach.id;
const withCoach = <T extends object>(rows: T[], extra: (r: T, i: number) => object = () => ({})) =>
  rows.map((r, i) => ({ ...r, coach_id: coachId, ...extra(r, i) }));

const sql = [
  "-- Dữ liệu khởi tạo (nội dung MẪU) cho Coach Trung Muối. Chạy được nhiều lần, không ghi đè dòng đã có.",
  "-- File sinh tự động bởi scripts/gen-seed.mts — sửa src/lib/sample-data.ts rồi chạy npm run seed:gen.",
  "",
  insert("coaches", [s.sampleCoach]),
  insert("venues", withCoach(s.sampleVenues, (_, i) => ({ sort: i }))),
  insert(
    "courses",
    withCoach(s.sampleCourses, (_, i) => ({ sort: i, is_public: true })),
  ),
  insert("open_classes", withCoach(s.sampleOpenClasses, (_, i) => ({ sort: i }))),
  insert("video_groups", withCoach(s.sampleVideoGroups, (_, i) => ({ sort: i }))),
  insert("videos", withCoach(s.sampleVideos, (_, i) => ({ sort: i }))),
].join("\n");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("Đã ghi supabase/seed.sql");
