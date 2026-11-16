import type { Coach, Course, OpenClass, Post, Venue, Video, VideoGroup } from "./types";

/**
 * Nội dung MẪU, dùng khi chưa nối Supabase (chạy máy, CI) và làm dữ liệu khởi tạo.
 * Trung sẽ thay bằng nội dung thật trong database.
 */
export const sampleCoach: Coach = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "trung-muoi",
  display_name: "Coach Trung Muối",
  tagline: "Dạy pickleball cho người mới và người muốn nâng trình",
  bio:
    "Nội dung mẫu: đoạn giới thiệu 300–800 chữ về Coach Trung Muối — bắt đầu chơi từ khi nào, vì sao đi dạy, đã dạy bao nhiêu học viên và điều Trung muốn mỗi học viên mang về sau khoá học.\n\nĐoạn thứ hai nói về cách dạy: chia nhỏ từng động tác, quay video để học viên tự xem lại, và luôn có bài tập về nhà ngắn.",
  avatar_url: null,
  cover_url: null,
  birth_year: 1995,
  show_age: true,
  gender: "nam",
  area: "Hà Nội",
  dupr: 4.5,
  stat_hours: 1200,
  stat_students: 180,
  stat_courses: 45,
  stat_rating: null,
  stat_years: 3,
  teaching_style: [
    "Sửa từng động tác qua video quay tại sân",
    "Mỗi buổi một mục tiêu rõ ràng, có bài tập về nhà",
    "Nhóm nhỏ tối đa 4 người để ai cũng được chạm bóng nhiều",
    "Vui vẻ nhưng nghiêm túc với kỹ thuật nền",
  ],
  strengths: [
    { title: "Kỹ thuật nền", text: "Cầm vợt, tư thế, dink chắc tay từ buổi đầu" },
    { title: "Sửa lỗi", text: "Nhìn ra lỗi và đưa bài tập sửa cụ thể" },
    { title: "Footwork", text: "Di chuyển ở vạch bếp, split step đúng nhịp" },
    { title: "Chiến thuật đôi", text: "Phối hợp, stacking, chọn cú theo tình huống" },
  ],
  experience: [
    { year: "2026", title: "Mở lớp nhóm nhỏ tại Hà Nội", detail: "Nội dung mẫu" },
    { year: "2025", title: "Chứng chỉ huấn luyện viên pickleball", detail: "Nội dung mẫu" },
    { year: "2024", title: "Bắt đầu dạy kèm 1-1", detail: "Nội dung mẫu" },
  ],
  contacts: {
    zalo: "",
    facebook: "",
    tiktok: "https://www.tiktok.com/@trungmuoipickleball",
    youtube: "",
    phone: "",
    show_phone: false,
  },
  accepting_students: true,
};

export const sampleVenues: Venue[] = [
  {
    id: "00000000-0000-0000-0000-0000000000a1",
    name: "Sân mẫu A",
    address: "Địa chỉ sân sẽ cập nhật",
    district: "Cầu Giấy",
    image_url: null,
    maps_url: null,
    hours_text: "T3, T5 18:00–21:00",
  },
  {
    id: "00000000-0000-0000-0000-0000000000a2",
    name: "Sân mẫu B",
    address: "Địa chỉ sân sẽ cập nhật",
    district: "Đống Đa",
    image_url: null,
    maps_url: null,
    hours_text: "T7, CN 7:00–10:00",
  },
];

// Bảng giá L2T Academy: 10 buổi × 120 phút, giá theo giờ, đã gồm bóng tập,
// chưa gồm thuê sân và nhặt bóng. Học phí là trọn khoá cho cả nhóm.
const priceNote = (perHour: string, extra = "") =>
  `${perHour}/giờ · đã gồm bóng tập${extra} · chưa gồm thuê sân, nhặt bóng`;

// Giáo án 10 buổi: NỘI DUNG MẪU, Trung sửa lại theo giáo trình thật.
const curriculum10 = [
  "Cầm vợt, tư thế, luật cơ bản",
  "Giao bóng và trả giao bóng",
  "Dink thuận tay, luật vùng bếp",
  "Dink trái tay, di chuyển ở vạch bếp",
  "Volley và punch volley",
  "Third shot drop",
  "Third shot drive, reset bóng",
  "Vị trí và phối hợp đánh đôi",
  "Chiến thuật lên lưới",
  "Đấu tập, quay video tổng kết",
].map((content, i) => ({ title: `Buổi ${i + 1}`, content }));

const pkg = (
  n: number,
  id: string,
  perHour: string,
  total: number,
  outcomes: string[],
  extra = "",
): Course => ({
  id,
  slug: `lop-1-${n}`,
  title: `Lớp 1:${n}`,
  kind: n === 1 ? "kem-1-1" : "nhom",
  cover_url: null,
  summary: n === 1 ? "Kèm riêng 1 coach 1 học viên, giáo án theo mục tiêu của bạn." : `Nhóm ${n} học viên, 1 coach. Giáo án theo trình độ của nhóm.`,
  audience: n === 1 ? "Mọi trình độ, muốn tiến bộ nhanh và sửa kỹ từng lỗi" : `Nhóm ${n} người cùng trình độ (bạn bè, gia đình, đồng nghiệp)`,
  goal: null,
  session_count: 10,
  minutes_per_session: 120,
  max_students: n,
  schedule_text: "Theo lịch hẹn",
  venue_id: null,
  price_full: total,
  price_single: null,
  price_note: priceNote(perHour, extra),
  curriculum: curriculum10,
  commitments: ["Đã bao gồm: bóng tập" + extra, "Chưa bao gồm: thuê sân tập, nhặt bóng"],
  outcomes,
});

export const sampleCourses: Course[] = [
  pkg(1, "00000000-0000-0000-0000-0000000000c1", "300.000đ", 6_000_000, [
    "Cá nhân hoá giáo án theo mục tiêu",
    "Sửa chi tiết từng lỗi kỹ thuật",
    "Theo sát tiến bộ từng buổi",
  ]),
  pkg(2, "00000000-0000-0000-0000-0000000000c2", "350.000đ", 7_000_000, [
    "Giáo án phù hợp trình độ",
    "Sửa lỗi thường gặp",
    "Tăng thời gian thực hành",
  ]),
  pkg(3, "00000000-0000-0000-0000-0000000000c3", "400.000đ", 8_000_000, [
    "Giáo án phù hợp dành cho học nhóm",
    "Sửa lỗi trong quá trình tập",
    "Tập luyện với các bài tập nhóm 3 người",
  ]),
  pkg(
    4,
    "00000000-0000-0000-0000-0000000000c4",
    "500.000đ",
    10_000_000,
    ["Giáo án phù hợp dành cho học nhóm", "Sửa lỗi trong quá trình tập", "Tập luyện với các bài tập nhóm 4 người"],
    ", trợ giảng",
  ),
];

export const sampleOpenClasses: OpenClass[] = [
  {
    id: "00000000-0000-0000-0000-0000000000d1",
    course_id: "00000000-0000-0000-0000-0000000000c4",
    title: "Nhóm 1:4 — sáng T7, CN",
    schedule_text: "T7, CN 08:00–10:00",
    venue_id: "00000000-0000-0000-0000-0000000000a1",
    start_date: "2026-12-01",
    seats_total: 4,
    seats_left: 2,
  },
];

export const sampleVideoGroups: VideoGroup[] = [
  { id: "00000000-0000-0000-0000-0000000000e1", slug: "nhap-mon", name: "Nhập môn" },
  { id: "00000000-0000-0000-0000-0000000000e2", slug: "ky-thuat-nen", name: "Kỹ thuật nền" },
  { id: "00000000-0000-0000-0000-0000000000e3", slug: "chien-thuat-doi", name: "Chiến thuật đôi" },
  { id: "00000000-0000-0000-0000-0000000000e4", slug: "kien-thuc-chung", name: "Kiến thức chung" },
];

const plannedTitles: [string, string[]][] = [
  [
    "00000000-0000-0000-0000-0000000000e1",
    [
      "Cách cầm vợt",
      "Tư thế chuẩn bị",
      "Luật vùng bếp (kitchen)",
      "Cách tính điểm đánh đôi",
      "Giao bóng đúng luật",
      "Trả giao bóng sâu",
      "Luật nảy hai lần",
      "Bước đệm (split step) và di chuyển cơ bản",
    ],
  ],
  [
    "00000000-0000-0000-0000-0000000000e2",
    [
      "Dink thuận tay",
      "Dink trái tay",
      "Third shot drop",
      "Third shot drive",
      "Volley và punch volley",
      "Reset bóng khi bị ép",
      "Lob và cách xử lý lob",
      "Đập bóng trên cao (overhead)",
      "Di chuyển ở vạch bếp",
      "Speed-up và phản xạ tay nhanh",
    ],
  ],
  [
    "00000000-0000-0000-0000-0000000000e3",
    [
      "Vị trí và phối hợp hai người",
      "Lên lưới sau khi giao/trả giao",
      "Đánh vào giữa hai đối thủ",
      "Stacking",
      "Erne",
      "ATP (đánh vòng ngoài cột lưới)",
      "Poaching (cắt bóng của đồng đội)",
      "Đánh đôi nam nữ",
    ],
  ],
  [
    "00000000-0000-0000-0000-0000000000e4",
    [
      "5 lỗi người mới hay mắc",
      "Chọn vợt và bóng cho người mới",
      "Khởi động và tránh chấn thương",
      "DUPR là gì, cách lên điểm",
    ],
  ],
];

/** 30 clip theo kế hoạch; youtube_id để trống = "Sắp có". */
export const sampleVideos: Video[] = plannedTitles.flatMap(([groupId, titles], g) =>
  titles.map((title, i) => ({
    id: `00000000-0000-0000-0000-0000000${String(100 + g * 20 + i).padStart(5, "0")}`,
    group_id: groupId,
    title,
    youtube_id: null,
    description: null,
    level: g === 0 ? "Người mới" : null,
    published_on: null,
    duration_text: null,
    course_id: null,
  })),
);

/** Bài viết mẫu — Trung thay bằng bài thật. */
export const samplePosts: Post[] = [
  {
    id: "00000000-0000-0000-0000-0000000000f1",
    slug: "luat-vung-bep-cho-nguoi-moi",
    title: "Luật vùng bếp (kitchen) cho người mới",
    excerpt: "Khi nào được bước vào vùng bếp, volley thế nào là phạm luật. Bài mẫu, nội dung sẽ được cập nhật.",
    topic: "luat",
    cover_url: null,
    youtube_id: null,
    body:
      "## Vùng bếp là gì?\n\nVùng bếp là khu vực 2,13 m tính từ lưới về mỗi bên sân. Đây là bài viết mẫu để xem bố cục trang.\n\n## Ba điều cần nhớ\n\n- Không volley khi đang đứng trong vùng bếp hoặc chạm vạch bếp.\n- Được bước vào vùng bếp để đánh bóng đã nảy.\n- Sau khi volley, đà người không được đưa bạn vào vùng bếp.\n\nNội dung chi tiết sẽ do Coach Trung Muối viết.",
    read_minutes: 4,
    is_featured: true,
    published_at: "2026-11-16T03:00:00Z",
    course_id: "00000000-0000-0000-0000-0000000000c1",
  },
  {
    id: "00000000-0000-0000-0000-0000000000f2",
    slug: "chon-vot-dau-tien",
    title: "Chọn vợt đầu tiên cho người mới",
    excerpt: "Độ nặng, bề mặt, cán vợt: nên để ý gì khi mua cây vợt đầu tiên. Bài mẫu.",
    topic: "dung-cu",
    cover_url: null,
    youtube_id: null,
    body: "Bài viết mẫu để xem bố cục. Nội dung chi tiết sẽ do Coach Trung Muối viết.",
    read_minutes: 3,
    is_featured: false,
    published_at: "2026-11-15T03:00:00Z",
    course_id: null,
  },
];
