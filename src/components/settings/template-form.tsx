"use client";

import { useRef, useState } from "react";
import { saveTemplate } from "@/app/quan-ly/cai-dat/actions";
import { CopyButton, SaveBar, useSave } from "@/components/form-kit";
import { Field, Switch } from "@/components/ui-kit";
import { DEFAULT_TEMPLATES, fillTemplate, sampleValues, TEMPLATE_VARS, templateVars, type MessageTemplate } from "@/lib/message-templates";

export function TemplateForm({ template, coachName }: { template: MessageTemplate; coachName: string }) {
  const [v, setV] = useState({ key: template.key, title: template.title, body: template.body, enabled: template.enabled });
  const [values, setValues] = useState(() => sampleValues(coachName));
  const save = useSave(saveTemplate, v);
  const area = useRef<HTMLTextAreaElement>(null);
  const used = templateVars(v.body);
  const preview = fillTemplate(v.body, values);
  const original = DEFAULT_TEMPLATES.find((t) => t.key === template.key);

  /** Chèn {biến} vào đúng chỗ con trỏ đang đứng. */
  const insert = (name: string) => {
    const token = `{${name}}`;
    const el = area.current;
    const start = el?.selectionStart ?? v.body.length;
    const end = el?.selectionEnd ?? v.body.length;
    setV((p) => ({ ...p, body: p.body.slice(0, start) + token + p.body.slice(end) }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <form onSubmit={save.onSubmit} className="card min-w-0" noValidate>
      <h2 className="h2">
        <span className="min-w-0 truncate">{v.title || template.title}</span>
        <span className="flex flex-none items-center gap-2">
          <Switch checked={v.enabled} onChange={(b) => setV({ ...v, enabled: b })} label="Đang dùng mẫu này" />
          <span className="text-[13px] font-medium">{v.enabled ? "Đang dùng" : "Tạm tắt"}</span>
        </span>
      </h2>
      <div className="grid gap-3">
        <Field label="Tên mẫu" error={save.err("title")}>
          <input className="input" maxLength={80} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        </Field>
        <div className="text-[13px] text-faint">Dùng khi: {template.when.toLowerCase()}</div>
        <Field label="Nội dung" hint={`${v.body.length} / 2000 ký tự`} error={save.err("body")}>
          <textarea ref={area} className="input" style={{ minHeight: 132, lineHeight: 1.6 }} maxLength={2000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
        </Field>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-faint">Chèn:</span>
          {TEMPLATE_VARS.map((t) => (
            <button key={t.name} type="button" className="pill n cursor-pointer hover:brightness-95" onClick={() => insert(t.name)}>
              {`{${t.name}}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-xs font-semibold text-faint">XEM TRƯỚC</div>
        {used.length > 0 && (
          <div className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-3">
            {used.map((name) => (
              <label key={name} className="grid gap-1 text-xs font-semibold text-faint">
                {name}
                <input className="input font-normal" style={{ height: 36, fontSize: 13, paddingInline: 10 }} value={values[name] ?? ""} onChange={(e) => setValues({ ...values, [name]: e.target.value })} />
              </label>
            ))}
          </div>
        )}
        <div className="rounded-[18px] bg-[#e8eef9] p-3.5">
          <div className="max-w-[88%] rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 break-words whitespace-pre-wrap shadow-[0_1px_2px_rgba(0,0,0,0.06)]">{preview || "Nội dung đang trống"}</div>
        </div>
        <p className="mt-2 text-xs text-faint">Điền tên học viên và các ô trên, bấm Sao chép rồi dán sang Zalo. Ô để trống thì giữ nguyên dạng {"{biến}"}.</p>
      </div>

      <div className="mt-3.5">
        <SaveBar save={save} label="Lưu mẫu">
          {original && v.body !== original.body && (
            <button type="button" className="btn ghost hide-m" onClick={() => setV({ ...v, title: original.title, body: original.body })}>
              Về mặc định
            </button>
          )}
          <CopyButton text={preview} label="Sao chép" />
        </SaveBar>
      </div>
    </form>
  );
}
