import Link from "next/link";
import { IconChat } from "@/components/icons";

/** Nút đăng ký dính đáy màn hình trên điện thoại. */
export function MobileCta({ zalo }: { zalo: string | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="flex gap-2">
        {zalo && (
          <a href={zalo} target="_blank" rel="noopener noreferrer" aria-label="Nhắn Zalo" className="btn-secondary h-[52px] w-[52px] px-0">
            <IconChat />
          </a>
        )}
        <Link href="/dang-ky" className="btn-primary h-[52px] flex-1 text-base">
          Đăng ký học thử
        </Link>
      </div>
    </div>
  );
}
