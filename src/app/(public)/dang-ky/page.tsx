import type { Metadata } from "next";

export const metadata: Metadata = { title: "Đăng ký học thử" };

export default function Page() {
  return (
    <section className="card space-y-2">
      <h2 className="h-section">Đăng ký học thử</h2>
      <p className="text-muted">Form nhu cầu học đang được hoàn thiện.</p>
    </section>
  );
}
