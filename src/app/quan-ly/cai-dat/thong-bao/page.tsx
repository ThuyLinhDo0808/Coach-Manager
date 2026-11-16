import { NotifyForm } from "@/components/settings/notify-form";
import { requireOwner } from "@/lib/owner";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Thông báo" };

export default async function ThongBaoPage() {
  const session = await requireOwner();
  return <NotifyForm notify={getSettings(session.coach.settings).notify} />;
}
