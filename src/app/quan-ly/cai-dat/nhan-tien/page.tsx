import { PayoutForm } from "@/components/settings/payout-form";
import { requireOwner } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { getCourseTemplates } from "@/lib/settings-data";

export const metadata = { title: "Nhận tiền" };

export default async function NhanTienPage() {
  const session = await requireOwner();
  const settings = getSettings(session.coach.settings);
  // Lấy một khoá có học phí để khung xem trước dùng số tiền thật.
  const course = (await getCourseTemplates(session.coach.id)).find((c) => c.price_full);
  return <PayoutForm payout={settings.payout} collect={settings.collect} example={course ? { title: course.title, price: course.price_full! } : null} />;
}
