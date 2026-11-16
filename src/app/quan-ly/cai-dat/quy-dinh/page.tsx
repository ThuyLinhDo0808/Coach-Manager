import { RulesForm } from "@/components/settings/rules-form";
import { requireOwner } from "@/lib/owner";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Quy định lớp" };

export default async function QuyDinhPage() {
  const session = await requireOwner();
  return <RulesForm rules={getSettings(session.coach.settings).rules} />;
}
