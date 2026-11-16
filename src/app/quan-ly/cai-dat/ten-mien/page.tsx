import { DomainForm } from "@/components/settings/domain-form";
import { requireOwner } from "@/lib/owner";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Tên miền riêng" };

export default async function TenMienPage() {
  const session = await requireOwner();
  return <DomainForm domain={getSettings(session.coach.settings).custom_domain} />;
}
