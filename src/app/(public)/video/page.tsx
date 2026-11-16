import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kho video" };

export default function Page() {
  return (
    <section className="card space-y-2">
      <h2 className="h-section">Kho video</h2>
      <p className="text-muted">Kho video bài giảng đang được hoàn thiện.</p>
    </section>
  );
}
