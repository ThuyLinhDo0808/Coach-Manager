import type { Metadata } from "next";

export const metadata: Metadata = { title: "Khoá học" };

export default function Page() {
  return (
    <section className="card space-y-2">
      <h2 className="h-section">Khoá học</h2>
      <p className="text-muted">Danh sách khoá học đang được hoàn thiện.</p>
    </section>
  );
}
