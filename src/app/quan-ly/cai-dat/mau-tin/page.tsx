import { TemplatesView } from "@/components/settings/templates-view";
import { requireOwner } from "@/lib/owner";
import { getMessageTemplates } from "@/lib/settings-data";

export const metadata = { title: "Mẫu tin nhắn" };

export default async function MauTinPage({ searchParams }: { searchParams: Promise<{ mau?: string }> }) {
  const { mau } = await searchParams;
  const session = await requireOwner();
  const templates = await getMessageTemplates(session.coach.id);
  return <TemplatesView templates={templates} selectedKey={mau} coachName={session.coach.display_name} />;
}
