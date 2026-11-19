import { ContentView } from "@/components/content/content-view";
import { requireOwner } from "@/lib/owner";
import { getAdminReviews, getCourseOptions } from "@/lib/settings-data";

export const metadata = { title: "Đánh giá" };

// Đánh giá của học viên (hiện ở tab Đánh giá trang công khai). Chỉ coach chủ sửa được.
export default async function DanhGiaPage() {
  const session = await requireOwner();
  const [reviews, courses] = await Promise.all([getAdminReviews(session.coach.id), getCourseOptions(session.coach.id)]);
  return <ContentView only="danh-gia" data={{ groups: [], videos: [], posts: [], reviews, courses }} params={{}} />;
}
