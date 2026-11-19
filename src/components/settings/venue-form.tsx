"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteVenue, saveVenue } from "@/app/quan-ly/cai-dat/actions";
import { ConfirmButton, SaveBar, useSave } from "@/components/form-kit";
import { PriceTable } from "@/components/settings/price-table";
import { Field, Switch } from "@/components/ui-kit";
import type { VenueAdmin } from "@/lib/settings-types";
import type { PriceRule } from "@/lib/venue-price";

export function VenueForm({ venue }: { venue: VenueAdmin | null }) {
  const [v, setV] = useState({
    id: venue?.id ?? "",
    name: venue?.name ?? "",
    district: venue?.district ?? "",
    address: venue?.address ?? "",
    maps_url: venue?.maps_url ?? "",
    image_url: venue?.image_url ?? "",
    price_rules: venue?.price_rules ?? ([] as PriceRule[]),
    is_public: venue?.is_public ?? true,
  });
  const save = useSave(saveVenue, v);
  const txt = (k: Exclude<keyof typeof v, "is_public" | "price_rules">) => ({
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
          <div className="flex items-center gap-2.5 font-medium md:col-span-2">
            <Switch checked={v.is_public} onChange={(b) => setV((p) => ({ ...p, is_public: b }))} label="Hiện trên trang công khai" />
            Hiện trên trang công khai
          </div>
        </div>
        <div className="divide-row mt-4 pt-4">
          <div className="mb-3">
            <b>Giá thuê sân</b>
            <p className="text-[13px] text-faint">Giá mỗi giờ cho một sân, theo khung giờ. Ngày thường và cuối tuần tính riêng.</p>
          </div>
          <PriceTable rules={v.price_rules} onChange={(r) => setV((p) => ({ ...p, price_rules: r }))} error={save.err("price_rules")} />
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
