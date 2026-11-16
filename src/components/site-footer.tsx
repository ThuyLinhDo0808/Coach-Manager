export function SiteFooter({ name }: { name: string }) {
  return (
    <footer className="mt-16 border-t border-line pb-28 md:pb-10">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-1 px-4 pt-6 text-sm text-muted md:flex-row md:justify-between md:px-8">
        <span>© {new Date().getFullYear()} {name}</span>
        <span>Pickleball cho người mới và người muốn nâng trình</span>
      </div>
    </footer>
  );
}
