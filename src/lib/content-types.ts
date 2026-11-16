import type { Post, Review, Video } from "./types";

export type VideoVisibility = "public" | "students" | "private";
export const VIDEO_VISIBILITY: { value: VideoVisibility; label: string }[] = [
  { value: "public", label: "Công khai" },
  { value: "students", label: "Chỉ học viên" },
  { value: "private", label: "Riêng tư" },
];
export const VIDEO_LEVELS = ["Người mới", "Cơ bản", "Trung cấp", "Nâng cao"];

export type VideoGroupAdmin = { id: string; slug: string; name: string; sort: number };
export type VideoAdmin = Video & { visibility: VideoVisibility; sort: number };

export type PostStatus = "nhap" | "da-dang" | "an";
export const POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "nhap", label: "Nháp" },
  { value: "da-dang", label: "Đã đăng" },
  { value: "an", label: "Ẩn" },
];
export type PostAdmin = Post & { status: PostStatus; updated_at: string };

export type ReviewAdmin = Review & { is_public: boolean };
export const MAX_PINNED_REVIEWS = 3;

export type CourseOption = { id: string; title: string };

export const CONTENT_TABS = [
  { value: "video", label: "Video" },
  { value: "bai-viet", label: "Bài viết" },
  { value: "danh-gia", label: "Đánh giá" },
] as const;
export type ContentTab = (typeof CONTENT_TABS)[number]["value"];
