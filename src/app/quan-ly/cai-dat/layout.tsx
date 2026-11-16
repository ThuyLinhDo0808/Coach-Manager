import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner";

export const metadata: Metadata = { title: "Cài đặt" };

// Chỉ coach (owner) vào được Cài đặt. Từng trang và từng server action cũng tự kiểm tra lại.
export default async function CaiDatLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return children;
}
