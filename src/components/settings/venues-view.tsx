import Link from "next/link";
import { Icon } from "@/components/icon";
import { SettingsShell } from "@/components/settings/shell";
import { VenueForm } from "@/components/settings/venue-form";
import { Thumb } from "@/components/thumb";
import type { VenueAdmin } from "@/lib/settings-types";
import { DAY_GROUPS, priceSummary } from "@/lib/venue-price";

const BASE = "/quan-ly/cai-dat/san";

export function VenuesView({ venues, courses, editId }: { venues: VenueAdmin[]; courses: { title: string; venue_id: string | null }[]; editId?: string }) {
  const editing = venues.find((v) => v.id === editId) ?? null;
  return (
    <SettingsShell
      on="san"
      sub={venues.length ? `${venues.length} sân` : "chưa có sân nào"}
      act={
        <Link href={`${BASE}#form-san`} className="btn primary">
          <Icon name="plus" /> Thêm sân
        </Link>
      }
    >
      {venues.length === 0 && <div className="card text-muted">Chưa có sân nào. Thêm sân đầu tiên ở khung bên dưới.</div>}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
        {venues.map((v) => {
          const used = courses.filter((c) => c.venue_id === v.id).map((c) => c.title);
          const rows: [string, string | null][] = [
            ...DAY_GROUPS.map((g): [string, string | null] => [g.label, priceSummary(v.price_rules.filter((r) => r.days === g.value))]),
            ["Khoá dạy ở đây", used.length ? used.join(", ") : null],
          ];
          return (
            <div key={v.id} className={`card ${v.id === editId ? "shadow-[inset_0_0_0_2px_var(--color-navy)]" : ""}`} style={{ padding: 0, overflow: "hidden" }}>
              <Thumb src={v.image_url} alt={v.name} style={{ aspectRatio: "auto", height: 110, borderRadius: 0 }} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <b className="min-w-0 truncate text-base">{v.name}</b>
                  <span className={`pill ${v.is_public ? "good" : "n"}`}>{v.is_public ? "Hiện công khai" : "Ẩn"}</span>
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
                  <Icon name="map" size={15} className="mt-0.5" />
                  <span className="min-w-0">{[v.address, v.district].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</span>
                </div>
                <div className="mt-3 grid gap-1.5 text-[13px]">
                  {rows.map(([k, x]) => (
                    <div key={k} className="flex justify-between gap-2.5">
                      <span className="flex-none text-faint">{k}</span>
                      {x ? <span className="min-w-0 text-right font-semibold">{x}</span> : <span className="text-faint">—</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 flex gap-2">
                  {v.maps_url && (
                    <a href={v.maps_url} target="_blank" rel="noopener noreferrer" className="btn sm ghost flex-1">
                      Bản đồ
                    </a>
                  )}
                  <Link href={`${BASE}?sua=${v.id}#form-san`} className="btn sm ghost flex-1">
                    Sửa
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <VenueForm key={editing?.id ?? `moi-${venues.length}`} venue={editing} />
    </SettingsShell>
  );
}
