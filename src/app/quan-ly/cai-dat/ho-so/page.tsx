import { ProfileForm } from "@/components/settings/profile-form";
import { requireOwner } from "@/lib/owner";

export const metadata = { title: "Hồ sơ trung tâm" };

export default async function HoSoPage() {
  const session = await requireOwner();
  return <ProfileForm coach={session.coach} />;
}
