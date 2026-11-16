"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteVenue, saveVenue } from "@/app/quan-ly/cai-dat/actions";
import { ConfirmButton, SaveBar, useSave } from "@/components/form-kit";
import { Field, Switch, UnitInput } from "@/components/ui-kit";
import type { VenueAdmin } from "@/lib/settings-types";

const str = (n: number | null) => (n == null ? "" : String(n));

export function VenueForm({ venue, nextSort }: { venue: VenueAdmin | null; nextSort: number }) {
  const [v, setV] = useState({
    id: venue?.id ?? "",
    name: venue?.name ?? "",
    district: venue?.district ?? "",
    address: venue?.address ?? "",
    maps_url: venue?.maps_url ?? "",
    image_url: venue?.image_url ?? "",
    hours_text: venue?.hours_text ?? "",
    court_count: str(venue?.court_count ?? null),
    rent_per_hour: str(venue?.rent_per_hour ?? null),
    is_public: venue?.is_public ?? true,
    sort: String(venue?.sort ?? nextSort),
  });
  const save = useSave(saveVenue, v);
  const txt = (k: Exclude<keyof typeof v, "is_public">) => ({
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value })),
  });

  return (
    <div className="card" id="form-san">
      <form onSubmit={save.onSubmit} noValidate>
        <h2 className="h2">{venue ? `Sửa ${venue.name}` : "Thêm sân mới"}</h2>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Tên sân" error={save.err("name")}>
            <input className="input" maxLength={80} placeholder="Ví dụ: Sân Sunrise" {...txt("name")} />
          </Field>
          <Field label="Khu vực" error={save.err("district")}>
            <input className="input" maxLength={60} placeholder="Ví dụ: Cầu Giấy" {...txt("district")} />
          </Field>
          <Field label="Địa chỉ" className="md:col-span-2" error={save.err("address")}>
            <input className="input" maxLength={200} placeholder="Số nhà, đường, phường" {...txt("address")} />
          </Field>
          <Field label="Link Google Maps" error={save.err("maps_url")}>
            <input className="input" inputMode="url" placeholder="https://maps.app.goo.gl/…" {...txt("maps_url")} />
          </Field>
          <Field label="Link ảnh sân" error={save.err("image_url")}>
            <input className="input" inputMode="url" placeholder="https://…" {...txt("image_url")} />
          </Field>
          <Field label="Giờ coach dạy" error={save.err("hours_text")}>
            <input className="input" maxLength={120} placeholder="Ví dụ: T3, T5 18:00–21:00" {...txt("hours_text")} />
          </Field>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Số sân" error={save.err("court_count")}>
              <UnitInput unit="sân" inputMode="numeric" maxLength={2} {...txt("court_count")} />
            </Field>
            <Field label="Thứ tự hiện" error={save.err("sort")}>
              <input className="input num" inputMode="numeric" maxLength={4} {...txt("sort")} />
            </Field>
          </div>
          <Field label="Giá thuê / giờ" error={save.err("rent_per_hour")}>
            <UnitInput unit="đ" inputMode="numeric" maxLength={12} placeholder="0" {...txt("rent_per_hour")} />
          </Field>
          <div className="flex items-center gap-2.5 font-medium md:pt-6">
            <Switch checked={v.is_public} onChange={(b) => setV((p) => ({ ...p, is_public: b }))} label="Hiện trên trang công khai" />
            Hiện trên trang công khai
          </div>
        </div>
        <div className="mt-3.5">
          <SaveBar save={save} label={venue ? "Lưu sân" : "Thêm sân"}>
            {venue && (
              <Link href="/quan-ly/cai-dat/san" className="btn ghost" scroll={false}>
                Đóng
              </Link>
            )}
          </SaveBar>
        </div>
        <p className="mt-2 text-xs text-faint">Giá thuê dùng để tính chi phí sân cho từng buổi trong Thu chi.</p>
      </form>
      {venue && (
        <form action={deleteVenue} className="divide-row mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3.5">
          <input type="hidden" name="id" value={venue.id} />
          <span className="text-[13px] text-faint">Xoá sân: khoá và lớp đang gắn sân này sẽ để trống phần sân.</span>
          <ConfirmButton message={`Xoá ${venue.name}? Việc này không hoàn tác được.`}>Xoá sân</ConfirmButton>
        </form>
      )}
    </div>
  );
}
