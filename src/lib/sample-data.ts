import type { Coach, Course, OpenClass, Venue, Video, VideoGroup } from "./types";

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
  stat_rating: 4.9,
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
    tiktok: "",
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

export const sampleCourses: Course[] = [
  {
    id: "00000000-0000-0000-0000-0000000000c1",
    slug: "co-ban-cho-nguoi-moi",
    title: "Khoá Cơ bản cho người mới",
    kind: "co-ban",
    cover_url: null,
    summary: "Từ chưa cầm vợt đến chơi được trận đôi và nắm luật.",
    audience: "Chưa từng cầm vợt hoặc DUPR dưới 3.0",
    goal: "Chơi được trận đôi, nắm luật, có kỹ thuật nền đúng",
    session_count: 8,
    minutes_per_session: 90,
    max_students: 4,
    schedule_text: "T3, T5 18:00",
    venue_id: "00000000-0000-0000-0000-0000000000a1",
    price_full: 2400000,
    price_single: 350000,
    price_note: "Đăng ký nhóm 2 người giảm 10%",
    curriculum: [
      { title: "Buổi 1", content: "Cầm vợt, tư thế chuẩn bị, luật cơ bản" },
      { title: "Buổi 2", content: "Giao bóng và trả giao bóng" },
      { title: "Buổi 3", content: "Dink thuận tay, luật vùng bếp" },
      { title: "Buổi 4", content: "Dink trái tay, di chuyển ở vạch bếp" },
      { title: "Buổi 5", content: "Volley và punch volley" },
      { title: "Buổi 6", content: "Third shot drop" },
      { title: "Buổi 7", content: "Vị trí và phối hợp đánh đôi" },
      { title: "Buổi 8", content: "Đấu tập, quay video tổng kết" },
    ],
    commitments: ["Học bù nếu báo nghỉ trước 12 giờ", "Nội dung mẫu: chính sách hoàn phí"],
    outcomes: ["Chơi trọn một trận đôi đúng luật", "Video tổng kết kỹ thuật cá nhân", "DUPR dự kiến 3.0"],
  },
  {
    id: "00000000-0000-0000-0000-0000000000c2",
    slug: "sua-loi-ky-thuat",
    title: "Khoá Sửa lỗi kỹ thuật",
    kind: "sua-loi",
    cover_url: null,
    summary: "Quay video, chỉ ra lỗi và sửa từng cú trong 4 buổi.",
    audience: "Đã chơi 3 tháng trở lên, muốn chơi chắc hơn",
    goal: "Sửa 2–3 lỗi lớn nhất đang làm mất điểm",
    session_count: 4,
    minutes_per_session: 90,
    max_students: 3,
    schedule_text: "Theo lịch hẹn",
    venue_id: null,
    price_full: 1600000,
    price_single: null,
    price_note: null,
    curriculum: [
      { title: "Buổi 1", content: "Quay video, đánh giá lỗi" },
      { title: "Buổi 2", content: "Sửa lỗi số 1" },
      { title: "Buổi 3", content: "Sửa lỗi số 2–3" },
      { title: "Buổi 4", content: "Đấu tập, quay lại so sánh" },
    ],
    commitments: ["Học bù nếu báo nghỉ trước 12 giờ"],
    outcomes: ["Video trước và sau khoá"],
  },
  {
    id: "00000000-0000-0000-0000-0000000000c3",
    slug: "kem-1-1",
    title: "Kèm 1-1 theo mục tiêu",
    kind: "kem-1-1",
    cover_url: null,
    summary: "Lộ trình riêng theo mục tiêu của bạn, giờ linh hoạt.",
    audience: "Mọi trình độ",
    goal: "Theo mục tiêu riêng: lên DUPR, thi đấu, sửa cú",
    session_count: null,
    minutes_per_session: 60,
    max_students: 1,
    schedule_text: "Theo lịch hẹn",
    venue_id: null,
    price_full: null,
    price_single: 500000,
    price_note: "Gói 10 buổi có giá riêng",
    curriculum: [],
    commitments: ["Đổi lịch nếu báo trước 12 giờ"],
    outcomes: ["Lộ trình riêng và nhận xét sau mỗi buổi"],
  },
];

export const sampleOpenClasses: OpenClass[] = [
  {
    id: "00000000-0000-0000-0000-0000000000d1",
    course_id: "00000000-0000-0000-0000-0000000000c1",
    title: "Cơ bản K12 — tối T3, T5",
    schedule_text: "T3, T5 18:00–19:30",
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
  })),
);
