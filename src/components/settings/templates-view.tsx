import Link from "next/link";
import { Icon } from "@/components/icon";
import { SettingsShell } from "@/components/settings/shell";
import { TemplateForm } from "@/components/settings/template-form";
import { Notice } from "@/components/ui-kit";
import type { MessageTemplate } from "@/lib/message-templates";

const BASE = "/quan-ly/cai-dat/mau-tin";

export function TemplatesView({ templates, selectedKey, coachName }: { templates: MessageTemplate[]; selectedKey?: string; coachName: string }) {
  const picked = templates.find((t) => t.key === selectedKey) ?? null;
  const shown = picked ?? templates[0]!;
  const on = templates.filter((t) => t.enabled).length;
  return (
    <SettingsShell on="mau-tin" sub={`${templates.length} mẫu, ${on} đang dùng`}>
      <Notice>Web chưa tự gửi tin nhắn. Bạn soạn mẫu ở đây, xem trước, bấm Sao chép rồi dán sang Zalo để gửi tay.</Notice>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className={`card ${picked ? "hide-m" : ""}`}>
          <h2 className="h2">Mẫu</h2>
          {templates.map((t) => (
            <Link key={t.key} href={`${BASE}?mau=${t.key}`} scroll={false} className={`flex items-center gap-2.5 rounded-[14px] px-2.5 py-[11px] ${t.key === shown.key ? "md:bg-[#ececf0]" : "hover:bg-page"}`}>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{t.title}</b>
                <div className="truncate text-[13px] text-faint">{t.when}</div>
                <div className="mt-0.5 truncate text-xs text-muted">{t.edited ? "Đã sửa" : "Mẫu mặc định"} · sao chép gửi tay</div>
              </div>
              <span className={`pill ${t.enabled ? "good" : "n"}`}>{t.enabled ? "Đang dùng" : "Tắt"}</span>
            </Link>
          ))}
        </div>
        <div className={`min-w-0 ${picked ? "" : "hide-m"}`}>
          <Link href={BASE} scroll={false} className="only-m mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
            <Icon name="left" size={15} /> Danh sách mẫu
          </Link>
          <TemplateForm key={shown.key} template={shown} coachName={coachName} />
        </div>
      </div>
    </SettingsShell>
  );
}
