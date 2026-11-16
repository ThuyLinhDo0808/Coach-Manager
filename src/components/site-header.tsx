import Link from "next/link";

export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-lime text-sm text-navy">
            TM
          </span>
          <span className="text-[17px]">{name}</span>
        </Link>
        <Link href="/dang-ky" className="btn-primary hidden h-10 md:inline-flex">
          Đăng ký học thử
        </Link>
      </div>
    </header>
  );
}
