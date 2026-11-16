"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SETTINGS_MENU, type SettingsSlug } from "@/lib/settings-types";

/** Menu con trên điện thoại: dải nút cuộn ngang, tự cuộn tới mục đang mở. */
export function SettingsTabs({ on }: { on: SettingsSlug }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = ref.current;
    const active = box?.querySelector<HTMLElement>(".on");
    if (box && active) box.scrollLeft = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
  }, [on]);
  return (
    <div className="only-m min-w-0">
      <nav ref={ref} className="seg" aria-label="Các mục cài đặt">
        {SETTINGS_MENU.map((m) => (
          <Link key={m.slug} href={`/quan-ly/cai-dat/${m.slug}`} className={m.slug === on ? "on" : ""}>
            {m.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
