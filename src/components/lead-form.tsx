"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { BUDGETS, DAYS, DURATIONS, FOR_WHOM, FORMATS, GENDERS, LEVELS, SLOTS, SOURCES, SPORTS, STYLES } from "@/lib/labels";
import { fieldErrors, leadSchema, STEP_FIELDS, type LeadInput } from "@/lib/lead-schema";

type Result = { ok: false; message: string; errors?: Record<string, string> };
type Props = {
  courses: { id: string; title: string }[];
  preselectedCourseId: string | null;
  submit: (input: LeadInput, trap: string) => Promise<Result>;
};

const STEPS = ["Về bạn", "Kinh nghiệm", "Mong muốn"];
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Chips({ options, value, onChange, label }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value.includes(o)} className={`chip ${value.includes(o) ? "on" : ""}`} onClick={() => onChange(toggle(value, o))}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Single({ options, value, onChange, label }: { options: readonly (readonly [string, string])[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={`chip ${value === v ? "on" : ""}`} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function LeadForm({ courses, preselectedCourseId, submit }: Props) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    full_name: "",
    gender: "",
    birth_year: "",
    phone: "",
    for_whom: "ban-than",
    played_sports: null as boolean | null,
    sports: [] as string[],
    pickleball_duration: "",
    dupr: "",
    self_level: "",
    availability: {} as Record<string, string[]>,
    interestIds: preselectedCourseId ? [preselectedCourseId] : ([] as string[]),
    goal: "",
    formats: [] as string[],
    styles: [] as string[],
    area: "",
    budget: "",
    source: "",
    note: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const payload = (): LeadInput => {
    const { interestIds, ...rest } = f;
    return {
      ...rest,
      gender: rest.gender as "nam",
      for_whom: rest.for_whom as "ban-than",
      availability: rest.availability as LeadInput["availability"],
      course_id: interestIds[0] ?? null,
      interests: courses.filter((c) => interestIds.includes(c.id)).map((c) => c.title),
    };
  };

  /** Kiểm tra các ô của bước hiện tại; trả true nếu hợp lệ. */
  const validateStep = (s: number) => {
    const r = leadSchema.safeParse(payload());
    const all = r.success ? {} : fieldErrors(r.error);
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => (STEP_FIELDS[s] as string[]).includes(k)));
    setErrors(mine);
    if (Object.keys(mine).length) setMessage("Một vài ô chưa đúng, bạn xem lại giúp mình nhé.");
    return Object.keys(mine).length === 0;
  };

  const next = () => {
    setMessage("");
    if (!validateStep(step)) return;
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    start(async () => {
      const res = await submit(payload(), trap);
      if (res && !res.ok) {
        setMessage(res.message);
        if (res.errors) {
          setErrors(res.errors);
          const first = STEP_FIELDS.findIndex((fs) => fs.some((k) => res.errors![k as string]));
          if (first >= 0) setStep(first);
        }
      }
    });
  };

  const err = (k: string) => (errors[k] ? <div className="err" role="alert">{errors[k]}</div> : null);
  const slotOn = (d: string, s: string) => f.availability[d]?.includes(s) ?? false;
  const flipSlot = (d: string, s: string) => {
    const cur = f.availability[d] ?? [];
    const nextDay = toggle(cur, s);
    const a = { ...f.availability, [d]: nextDay };
    if (!nextDay.length) delete a[d];
    set("availability", a);
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
    >
      <ol className="mb-4 flex gap-2">
        {STEPS.map((t, i) => (
          <li key={t} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className="h-1.5 rounded-full" style={{ background: i <= step ? "var(--color-navy)" : "#dcdce1" }} />
            <div className={`mt-1.5 text-xs font-semibold ${i === step ? "text-ink" : "text-faint"}`}>
              {i + 1}. {t}
            </div>
          </li>
        ))}
      </ol>

      <div className="card grid gap-[18px]">
        {step === 0 && (
          <>
            <div className="field">
              <label htmlFor="full_name">Họ tên *</label>
              <input id="full_name" className="input" autoComplete="name" placeholder="Ví dụ Nguyễn Văn An" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
              {err("full_name")}
            </div>
            <div className="field">
              <span className="label">Giới tính *</span>
              <Single label="Giới tính" options={GENDERS} value={f.gender} onChange={(v) => set("gender", v)} />
              {err("gender")}
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="field">
                <label htmlFor="birth_year">Năm sinh *</label>
                <input id="birth_year" className="input" inputMode="numeric" maxLength={4} placeholder="Ví dụ 1992" value={f.birth_year} onChange={(e) => set("birth_year", e.target.value.replace(/\D/g, ""))} />
                {err("birth_year")}
              </div>
              <div className="field">
                <label htmlFor="phone">Số điện thoại (Zalo) *</label>
                <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                {err("phone")}
              </div>
            </div>
            <div className="field">
              <span className="label">Bạn đăng ký cho ai?</span>
              <Single label="Đăng ký cho ai" options={FOR_WHOM} value={f.for_whom} onChange={(v) => set("for_whom", v)} />
            </div>
            {/* Ô bẫy bot, ẩn với người dùng */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="field">
              <span className="label">Bạn đã chơi môn thể thao nào chưa?</span>
              <Single
                label="Đã chơi thể thao chưa"
                options={[["co", "Có, đã chơi"], ["chua", "Chưa chơi môn nào"]]}
                value={f.played_sports == null ? "" : f.played_sports ? "co" : "chua"}
                onChange={(v) => setF((p) => ({ ...p, played_sports: v === "co", sports: v === "co" ? p.sports : [] }))}
              />
            </div>
            {f.played_sports && (
              <div className="field">
                <span className="label">
                  Môn gì? <span className="font-medium text-faint">(chọn nhiều)</span>
                </span>
                <Chips label="Môn đã chơi" options={SPORTS} value={f.sports} onChange={(v) => set("sports", v)} />
              </div>
            )}
            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="field">
                <label htmlFor="duration">Đã chơi pickleball bao lâu?</label>
                <select id="duration" className="input" value={f.pickleball_duration} onChange={(e) => set("pickleball_duration", e.target.value)}>
                  <option value="">Chọn…</option>
                  {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="dupr">DUPR (nếu có)</label>
                <input id="dupr" className="input" inputMode="decimal" placeholder="Ví dụ 3.2" value={f.dupr} onChange={(e) => set("dupr", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <span className="label">Bạn tự đánh giá trình độ</span>
              <div className="seg w-full" role="radiogroup" aria-label="Trình độ">
                {LEVELS.map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={f.self_level === l} className={`flex-1 ${f.self_level === l ? "on" : ""}`} onClick={() => set("self_level", l)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">Có thể học vào lúc nào?</span>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[340px] text-[13px]">
                  <thead>
                    <tr>
                      <th />
                      {DAYS.map(([d, l]) => <th key={d} className="pb-1 text-center text-xs font-semibold text-faint">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(([s, sl]) => (
                      <tr key={s}>
                        <td className="p-1.5 font-semibold text-faint">{sl}</td>
                        {DAYS.map(([d, dl]) => (
                          <td key={d} className="p-1 text-center">
                            <button
                              type="button"
                              aria-pressed={slotOn(d, s)}
                              aria-label={`${sl} ${dl}`}
                              onClick={() => flipSlot(d, s)}
                              className={`inline-flex size-[34px] items-center justify-center rounded-[10px] ${slotOn(d, s) ? "bg-navy text-white" : "bg-page"}`}
                            >
                              {slotOn(d, s) && <Icon name="check" size={16} />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {courses.length > 0 && (
              <div className="field">
                <span className="label">
                  Bạn quan tâm khoá nào? <span className="font-medium text-faint">(chọn nhiều)</span>
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Khoá quan tâm">
                  {courses.map((c) => (
                    <button key={c.id} type="button" aria-pressed={f.interestIds.includes(c.id)} className={`chip ${f.interestIds.includes(c.id) ? "on" : ""}`} onClick={() => set("interestIds", toggle(f.interestIds, c.id))}>
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="goal">Mục tiêu của bạn</label>
              <input id="goal" className="input" placeholder="Ví dụ: chơi được trận đôi với bạn bè" value={f.goal} onChange={(e) => set("goal", e.target.value)} />
            </div>
            <div className="field">
              <span className="label">Hình thức học mong muốn</span>
              <Chips label="Hình thức học" options={FORMATS} value={f.formats} onChange={(v) => set("formats", v)} />
            </div>
            <div className="field">
              <span className="label">Bạn hợp kiểu dạy nào?</span>
              <Chips label="Kiểu dạy" options={STYLES} value={f.styles} onChange={(v) => set("styles", v)} />
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="field">
                <label htmlFor="area">Khu vực sân tiện cho bạn</label>
                <input id="area" className="input" placeholder="Ví dụ Cầu Giấy" value={f.area} onChange={(e) => set("area", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="budget">Ngân sách dự kiến</label>
                <select id="budget" className="input" value={f.budget} onChange={(e) => set("budget", e.target.value)}>
                  <option value="">Chọn…</option>
                  {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <span className="label">Bạn biết coach qua đâu?</span>
              <Single label="Biết coach qua đâu" options={SOURCES.map((s) => [s, s] as const)} value={f.source} onChange={(v) => set("source", v)} />
            </div>
            <div className="field">
              <label htmlFor="note">Ghi chú thêm</label>
              <textarea id="note" className="input" maxLength={1000} placeholder="Chấn thương cũ, câu hỏi cho coach…" value={f.note} onChange={(e) => set("note", e.target.value)} />
              {err("note")}
            </div>
          </>
        )}
      </div>

      {message && (
        <div className="mt-3 rounded-[14px] bg-badbg px-4 py-3 text-[13px] font-medium text-bad" role="alert">
          {message}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 flex justify-between gap-2 bg-white px-4 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-line)] md:static md:mt-4 md:bg-transparent md:p-0 md:shadow-none">
        <button type="button" className="btn ghost h-[52px] md:h-10" disabled={step === 0 || pending} onClick={() => { setErrors({}); setMessage(""); setStep(step - 1); }}>
          Quay lại
        </button>
        <button type="submit" className="btn primary h-[52px] flex-1 px-7 md:h-10 md:flex-none" disabled={pending}>
          {pending ? "Đang gửi…" : step < 2 ? "Tiếp tục" : "Gửi đăng ký"}
        </button>
      </div>
    </form>
  );
}
