import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { getCoach, getReviews, ratingSummary } from "@/lib/data";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const coach = await getCoach();
  if (!coach) notFound();
  const rating = ratingSummary(await getReviews());
  return (
    <PublicShell coach={coach} rating={rating}>
      {children}
    </PublicShell>
  );
}
