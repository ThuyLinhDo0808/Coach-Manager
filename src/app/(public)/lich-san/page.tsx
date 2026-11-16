import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lịch & sân" };

export default function Page() {
  return (
    <section className="card space-y-2">
      <h2 className="h-section">Lịch & sân</h2>
      <p className="text-muted">Lịch lớp và sân dạy đang được hoàn thiện.</p>
    </section>
  );
}
