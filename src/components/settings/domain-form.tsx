"use client";

import { useState } from "react";
import { saveDomain } from "@/app/quan-ly/cai-dat/actions";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { SettingsShell } from "@/components/settings/shell";
import { Field, Notice } from "@/components/ui-kit";

export function DomainForm({ domain }: { domain: string }) {
  const [v, setV] = useState({ custom_domain: domain });
  const save = useSave(saveDomain, v);
  const shown = v.custom_domain.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/\/.*$/, "") || "hoc.tenmiencuaban.vn";
  const isApex = shown.split(".").length === 2 || /\.(com|net|org|edu|id)\.vn$/.test(shown) && shown.split(".").length === 3;
  const steps: [string, React.ReactNode][] = [
    ["Mở dự án trên Vercel", <>Vào vercel.com → dự án của web này → Settings → Domains.</>],
    ["Thêm tên miền", <>Bấm Add Domain, nhập <b className="break-all">{shown}</b> rồi Add.</>],
    [
      "Tạo bản ghi DNS ở nơi bạn mua tên miền",
      isApex ? (
        <>
          Tên miền gốc: tạo bản ghi <b>A</b>, tên <b>@</b>, trỏ về địa chỉ IP mà Vercel hiện ở bước trên. Thêm bản ghi <b>CNAME</b> tên <b>www</b> trỏ về giá trị Vercel đưa (dạng <b>cname.vercel-dns.com</b>).
        </>
      ) : (
        <>
          Tạo bản ghi <b>CNAME</b>, tên <b>{shown.split(".")[0]}</b>, trỏ về giá trị Vercel hiện ở bước trên (dạng <b>cname.vercel-dns.com</b>).
        </>
      ),
    ],
    ["Chờ Vercel xác nhận", <>Thường vài phút, có khi tới 24 giờ. Khi Vercel báo Valid Configuration là dùng được, chứng chỉ https tự cấp.</>],
  ];

  return (
    <form onSubmit={save.onSubmit} noValidate>
      <SettingsShell on="ten-mien" sub="dùng tên miền của riêng bạn" act={<SaveAct save={save} />}>
        <SaveError save={save} />
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="card grid gap-3">
            <h2 className="h2 mb-0">Tên miền riêng</h2>
            <Field label="Tên miền" error={save.err("custom_domain")}>
              <input className="input" inputMode="url" autoCapitalize="none" autoCorrect="off" maxLength={253} placeholder="hoc.trungmuoi.vn" value={v.custom_domain} onChange={(e) => setV({ custom_domain: e.target.value })} />
            </Field>
            <p className="text-[13px] text-muted">Để trống nếu bạn dùng địa chỉ mặc định của web.</p>
            <Notice>Ô này chỉ ghi lại tên miền bạn muốn dùng. Web không tự trỏ tên miền; bạn làm theo các bước bên cạnh trong Vercel.</Notice>
            <SaveBar save={save} />
          </div>
          <div className="card">
            <h2 className="h2">Cách trỏ tên miền trong Vercel</h2>
            <ol className="grid gap-3">
              {steps.map(([title, body], i) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="num flex h-7 w-7 flex-none items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white">{i + 1}</span>
                  <div className="min-w-0">
                    <b className="block">{title}</b>
                    <span className="text-[13px] text-muted">{body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SettingsShell>
    </form>
  );
}
