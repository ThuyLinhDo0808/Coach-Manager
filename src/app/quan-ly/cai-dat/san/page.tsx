import { VenuesView } from "@/components/settings/venues-view";
import { requireOwner } from "@/lib/owner";
import { getAdminVenues, getCourseTemplates } from "@/lib/settings-data";

export const metadata = { title: "Sân dạy" };

export default async function SanPage({ searchParams }: { searchParams: Promise<{ sua?: string }> }) {
  const { sua } = await searchParams;
  const session = await requireOwner();
  const [venues, courses] = await Promise.all([getAdminVenues(session.coach.id), getCourseTemplates(session.coach.id)]);
  return <VenuesView venues={venues} courses={courses} editId={sua} />;
}
