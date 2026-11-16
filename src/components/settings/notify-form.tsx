"use client";

import { useState } from "react";
import { saveNotify } from "@/app/quan-ly/cai-dat/actions";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { SettingsShell } from "@/components/settings/shell";
import { Notice, Switch } from "@/components/ui-kit";
import { NOTIFY_CHANNELS, NOTIFY_EVENTS, type NotifyChannel, type NotifyEventKey, type NotifySettings } from "@/lib/settings";

const timeInput = "input num flex-1 text-center";

export function NotifyForm({ notify }: { notify: NotifySettings }) {
  const [v, setV] = useState(notify);
  const save = useSave(saveNotify, v);
  const tick = (event: NotifyEventKey, channel: NotifyChannel, on: boolean) =>
    setV((p) => ({ ...p, events: { ...p.events, [event]: { ...p.events[event], [channel]: on } } }));
  const quiet = (patch: Partial<NotifySettings["quiet"]>) => setV((p) => ({ ...p, quiet: { ...p.quiet, ...patch } }));
  const digest = (patch: Partial<NotifySettings["digest"]>) => setV((p) => ({ ...p, digest: { ...p.digest, ...patch } }));

  return (
    <form onSubmit={save.onSubmit} noValidate>
      <SettingsShell on="thong-bao" sub="báo cho bạn khi nào, qua kênh nào" act={<SaveAct save={save} />}>
        <SaveError save={save} />
        <Notice>Hiện web mới lưu lựa chọn của bạn. Việc gửi thông báo qua chuông, email và Zalo chưa hoạt động.</Notice>
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="card min-w-0">
            <h2 className="h2">Báo cho tôi</h2>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Sự kiện</th>
                  {NOTIFY_CHANNELS.map((c) => (
                    <th key={c.key} style={{ textAlign: "center", paddingInline: 6 }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFY_EVENTS.map((e) => (
                  <tr key={e.key}>
                    <td className="font-medium" style={{ paddingLeft: 0 }}>
                      {e.label}
                    </td>
                    {NOTIFY_CHANNELS.map((c) => (
                      <td key={c.key} style={{ textAlign: "center", paddingInline: 6 }}>
                        <input
                          type="checkbox"
                          className="h-[22px] w-[22px] cursor-pointer rounded-[7px] align-middle accent-[var(--color-navy)]"
                          checked={v.events[e.key][c.key]}
                          onChange={(ev) => tick(e.key, c.key, ev.target.checked)}
                          aria-label={`${e.label}: ${c.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid min-w-0 gap-4 *:min-w-0">
            <div className="card">
              <h2 className="h2">Giờ yên lặng</h2>
              <div className="flex items-center justify-between gap-2.5">
                <span>Không báo trong khoảng</span>
                <Switch checked={v.quiet.on} onChange={(on) => quiet({ on })} label="Bật giờ yên lặng" />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input type="time" className={timeInput} value={v.quiet.from} disabled={!v.quiet.on} onChange={(e) => quiet({ from: e.target.value })} aria-label="Yên lặng từ" />
                <span className="text-faint">đến</span>
                <input type="time" className={timeInput} value={v.quiet.to} disabled={!v.quiet.on} onChange={(e) => quiet({ to: e.target.value })} aria-label="Yên lặng đến" />
              </div>
              {save.err("quiet") && <div className="err mt-1.5">{save.err("quiet")}</div>}
              <div className="mt-2 text-xs text-faint">Thông báo trong giờ yên lặng sẽ gộp vào bản tóm tắt sáng.</div>
            </div>

            <div className="card">
              <h2 className="h2">Tóm tắt mỗi sáng</h2>
              <div className="flex items-center justify-between gap-2.5">
                <span>Gửi một bản tóm tắt lúc</span>
                <Switch checked={v.digest.on} onChange={(on) => digest({ on })} label="Bật tóm tắt mỗi sáng" />
              </div>
              <div className="mt-2.5 flex">
                <input type="time" className={timeInput} value={v.digest.at} disabled={!v.digest.on} onChange={(e) => digest({ at: e.target.value })} aria-label="Giờ gửi tóm tắt" />
              </div>
              {save.err("digest") && <div className="err mt-1.5">{save.err("digest")}</div>}
              <div className="mt-3 rounded-[18px] bg-[#e8eef9] p-3">
                <div className="rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 text-[13px] leading-normal">
                  <span className="text-faint">Ví dụ: </span>Hôm nay: <b>3 buổi</b> (07:00, 17:30, 19:00) · <b>2 nhu cầu</b> chờ gọi · <b>1 ảnh</b> chuyển khoản chờ xác nhận.
                </div>
              </div>
            </div>
          </div>
        </div>
        <SaveBar save={save} />
      </SettingsShell>
    </form>
  );
}
