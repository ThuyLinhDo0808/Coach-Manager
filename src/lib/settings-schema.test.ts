import { describe, expect, it } from "vitest";
import { fieldErrors } from "./lead-schema";
import { DEFAULT_SETTINGS } from "./settings";
import {
  bankAccountName,
  courseSchema,
  inviteSchema,
  primaryRole,
  joinSchema,
  memberSchema,
  notifySchema,
  payoutSchema,
  permissionsSchema,
  postSchema,
  profileSchema,
  reviewSchema,
  rulesSchema,
  templateSchema,
  venueSchema,
  videoSchema,
} from "./settings-schema";

const ID = "00000000-0000-0000-0000-0000000000a1"; // id mẫu, không đúng phiên bản UUID

describe("profileSchema", () => {
  const base = {
    display_name: "Coach Trung Muối",
    tagline: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
    birth_year: "1995",
    show_age: true,
    gender: "nam",
    area: " Hà Nội ",
    dupr: "4,5",
    stat_hours: "1.200",
    stat_students: "180",
    stat_courses: "45",
    stat_years: "3",
    teaching_style: ["Sửa qua video", "  ", "Nhóm nhỏ"],
    strengths: [{ title: "Footwork", text: "Di chuyển" }, { title: "", text: "bỏ" }],
    experience: [{ year: "2024", title: "Bắt đầu dạy", detail: "" }, { year: "2023", title: " ", detail: "bỏ" }],
    contacts: { zalo: "0912345678", facebook: "", tiktok: "", youtube: "", phone: "", show_phone: false },
    accepting_students: true,
  };

  it("đổi chữ thành số, bỏ dòng trống", () => {
    const d = profileSchema.parse(base);
    expect(d).toMatchObject({ birth_year: 1995, dupr: 4.5, stat_hours: "1.200", area: "Hà Nội", tagline: null, avatar_url: null });
    expect(d.teaching_style).toEqual(["Sửa qua video", "Nhóm nhỏ"]);
    expect(d.strengths).toEqual([{ title: "Footwork", text: "Di chuyển" }]);
    expect(d.experience).toEqual([{ year: "2024", title: "Bắt đầu dạy", detail: "" }]);
  });

  it("để trống năm sinh, giới tính, DUPR thì lưu null", () => {
    expect(profileSchema.parse({ ...base, birth_year: "", gender: "", dupr: "" })).toMatchObject({ birth_year: null, gender: null, dupr: null });
  });

  it("báo lỗi tiếng Việt theo từng ô", () => {
    const r = profileSchema.safeParse({ ...base, display_name: " ", birth_year: "1800", dupr: "12", avatar_url: "anh.jpg", contacts: { ...base.contacts, facebook: "fb.com/x" } });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(fieldErrors(r.error)).toEqual({
        display_name: "Bạn điền tên hiển thị nhé",
        avatar_url: "Link cần bắt đầu bằng http:// hoặc https://",
        birth_year: "Năm sinh chưa đúng",
        dupr: "DUPR nằm trong khoảng 1.0 – 8.0",
        contacts: "Link cần bắt đầu bằng http:// hoặc https://",
      });
    }
  });
});

describe("venueSchema", () => {
  const base = {
    id: "", name: "Sân Sunrise", district: "", address: "", maps_url: "", image_url: "", is_public: true,
    price_rules: [
      { days: "t2-t6", from: "12:00", to: "16:00", price: 250000 },
      { days: "t2-t6", from: "05:00", to: "11:59", price: 150000 },
    ],
  };
  it("nhận bảng giá theo khung giờ, sắp theo giờ", () => {
    expect(venueSchema.parse(base).price_rules.map((r) => r.from)).toEqual(["05:00", "12:00"]);
    expect(venueSchema.parse({ ...base, price_rules: [] }).price_rules).toEqual([]);
  });
  it("từ chối khung giá trùng giờ", () => {
    expect(venueSchema.safeParse({ ...base, price_rules: [...base.price_rules, { days: "t2-t6", from: "11:00", to: "13:00", price: 1 }] }).success).toBe(false);
  });
  it("nhận id mẫu không đúng phiên bản UUID", () => {
    expect(venueSchema.parse({ ...base, id: ID }).id).toBe(ID);
  });
  it("từ chối tên trống", () => {
    expect(venueSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
});

describe("courseSchema", () => {
  const base = {
    id: "",
    title: "Khoá Cơ bản",
    kind: "co-ban",
    cover_url: "",
    summary: "",
    audience: "",
    goal: "",
    session_count: "8",
    minutes_per_session: "90",
    max_students: "",
    schedule_text: "",
    venue_id: "",
    price_full: "3.200.000",
    price_single: "",
    price_note: "",
    curriculum: [{ title: "Buổi 1", content: "Cầm vợt" }, { title: "", content: "Giao bóng" }, { title: "", content: "" }],
    commitments: ["Học bù", ""],
    outcomes: [],
    is_public: false,
    sort: "2",
  };
  it("dọn giáo án: bỏ dòng trống, tự đặt tên buổi", () => {
    const d = courseSchema.parse(base);
    expect(d.curriculum).toEqual([{ title: "Buổi 1", content: "Cầm vợt" }, { title: "Buổi 2", content: "Giao bóng" }]);
    expect(d.commitments).toEqual(["Học bù"]);
    expect(d).toMatchObject({ price_full: 3200000, price_single: null, venue_id: null, session_count: 8, sort: 2 });
  });
  it("từ chối loại khoá lạ", () => {
    expect(courseSchema.safeParse({ ...base, kind: "yoga" }).success).toBe(false);
  });
});

describe("rulesSchema, notifySchema, permissionsSchema", () => {
  it("nhận đúng giá trị mặc định", () => {
    expect(rulesSchema.parse(DEFAULT_SETTINGS.rules)).toEqual(DEFAULT_SETTINGS.rules);
    expect(notifySchema.parse(DEFAULT_SETTINGS.notify)).toEqual(DEFAULT_SETTINGS.notify);
    expect(permissionsSchema.parse({ permissions: DEFAULT_SETTINGS.permissions, lead_assign: DEFAULT_SETTINGS.lead_assign })).toEqual({
      permissions: DEFAULT_SETTINGS.permissions,
      lead_assign: DEFAULT_SETTINGS.lead_assign,
    });
  });
  it("bỏ khoá lạ, từ chối thiếu khoá và giờ sai", () => {
    const withExtra = { ...DEFAULT_SETTINGS.notify, events: { ...DEFAULT_SETTINGS.notify.events, la: { bell: true, email: true, zalo: true } } };
    expect(Object.keys(notifySchema.parse(withExtra).events)).not.toContain("la");
    expect(notifySchema.safeParse({ ...DEFAULT_SETTINGS.notify, quiet: { on: true, from: "25:00", to: "07:00" } }).success).toBe(false);
    expect(permissionsSchema.safeParse({ permissions: {}, lead_assign: DEFAULT_SETTINGS.lead_assign }).success).toBe(false);
  });
  it("quy định: số nhập dạng chữ, phần trăm quá 100 bị từ chối", () => {
    expect(rulesSchema.parse({ ...DEFAULT_SETTINGS.rules, trial_fee: "200.000", refund_pct: "70" })).toMatchObject({ trial_fee: 200000, refund_pct: 70 });
    expect(rulesSchema.safeParse({ ...DEFAULT_SETTINGS.rules, refund_pct: "120" }).success).toBe(false);
  });
});

describe("payoutSchema", () => {
  const base = { bank_bin: "970436", account_no: "0071 0009 1234 58", account_name: "Nguyễn Trung Muối", deposit_pct: 30, offer_days: "3", accept_cash: true, require_proof: false };
  it("chuẩn hoá số tài khoản và tên chủ tài khoản", () => {
    expect(payoutSchema.parse(base)).toMatchObject({ bank_bin: "970436", account_no: "0071000912345" + "8", account_name: "NGUYEN TRUNG MUOI", deposit_pct: 30, offer_days: 3 });
  });
  it("cho để trống cả ba ô ngân hàng", () => {
    expect(payoutSchema.safeParse({ ...base, bank_bin: "", account_no: "", account_name: "" }).success).toBe(true);
  });
  it("điền dở thì chỉ ra ô còn thiếu", () => {
    const r = payoutSchema.safeParse({ ...base, account_no: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toEqual({ account_no: "Bạn điền số tài khoản nhé" });
  });
  it("từ chối mã ngân hàng ngoài danh sách", () => {
    expect(payoutSchema.safeParse({ ...base, bank_bin: "123456" }).success).toBe(false);
  });
  it("bankAccountName: viết hoa không dấu, gộp khoảng trắng", () => {
    expect(bankAccountName("  đỗ  thuỳ linh ")).toBe("DO THUY LINH");
  });
});

describe("thành viên và lời mời", () => {
  it("email lời mời về chữ thường, nhiều vai trò, không mời được Team Leader", () => {
    expect(inviteSchema.parse({ email: " Hanh@Email.COM ", roles: ["sale", "coach", "sale"], display_name: "" })).toEqual({
      email: "hanh@email.com",
      roles: ["sale", "coach"],
      display_name: null,
    });
    expect(inviteSchema.safeParse({ email: "a@b.vn", roles: ["chu"], display_name: "" }).success).toBe(false);
    expect(inviteSchema.safeParse({ email: "a@b.vn", roles: [], display_name: "" }).success).toBe(false);
    expect(inviteSchema.safeParse({ email: "khong-phai-email", roles: ["sale"], display_name: "" }).success).toBe(false);
  });
  it("thành viên: ít nhất một vai trò, mã đúng dạng", () => {
    expect(memberSchema.parse({ user_id: ID, display_name: "Linh", roles: ["quan-ly", "co-dong"] })).toMatchObject({ roles: ["quan-ly", "co-dong"] });
    expect(memberSchema.safeParse({ user_id: ID, display_name: "", roles: [] }).success).toBe(false);
    expect(memberSchema.safeParse({ user_id: "abc", display_name: "", roles: ["sale"] }).success).toBe(false);
  });
  it("vai trò chính khớp database", () => {
    expect(primaryRole(["coach", "chu"])).toBe("owner");
    expect(primaryRole(["co-dong", "quan-ly"])).toBe("quan-ly");
    expect(primaryRole(["co-dong"])).toBe("co-dong");
  });
  it("mật khẩu tham gia ít nhất 8 ký tự", () => {
    expect(joinSchema.safeParse({ email: "a@b.vn", password: "1234567" }).success).toBe(false);
    expect(joinSchema.parse({ email: "A@b.vn", password: "12345678" }).email).toBe("a@b.vn");
  });
});

describe("templateSchema", () => {
  it("chỉ nhận key của 5 mẫu mặc định, nội dung không trống", () => {
    expect(templateSchema.safeParse({ key: "sinh-nhat", title: "Sinh nhật", body: "Chúc {tên gọi}", enabled: true }).success).toBe(true);
    expect(templateSchema.safeParse({ key: "la", title: "Sinh nhật", body: "x", enabled: true }).success).toBe(false);
    expect(templateSchema.safeParse({ key: "sinh-nhat", title: "Sinh nhật", body: "  ", enabled: true }).success).toBe(false);
  });
});

describe("nội dung", () => {
  const video = { id: "", title: "Dink đầu tiên", youtube: "https://youtu.be/dQw4w9WgXcQ?si=abc", description: "", level: "", duration_text: "4:30", group_id: "", course_id: ID, visibility: "public" };
  it("video: tách mã YouTube từ link", () => {
    expect(videoSchema.parse(video)).toMatchObject({ youtube: "dQw4w9WgXcQ", group_id: null, course_id: ID, level: null, duration_text: "4:30" });
  });
  it("video: link sai hoặc thời lượng sai thì báo lỗi", () => {
    const r = videoSchema.safeParse({ ...video, youtube: "https://vimeo.com/1", duration_text: "4 phút" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["duration_text", "youtube"]);
  });

  const post = { id: "", title: "Luật vùng bếp", excerpt: "", topic: "luat", cover_url: "", youtube: "", body: "## Mở đầu\r\n\r\nNội dung", is_featured: false, status: "nhap", course_id: "" };
  it("bài viết: video không bắt buộc, bỏ ký tự xuống dòng kiểu Windows", () => {
    expect(postSchema.parse(post)).toMatchObject({ youtube: null, body: "## Mở đầu\n\nNội dung", course_id: null });
    expect(postSchema.parse({ ...post, youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }).youtube).toBe("dQw4w9WgXcQ");
    expect(postSchema.safeParse({ ...post, youtube: "abc" }).success).toBe(false);
  });
  it("bài viết: không đăng bài trống, nhưng lưu nháp trống thì được", () => {
    expect(postSchema.safeParse({ ...post, body: " ", status: "nhap" }).success).toBe(true);
    const r = postSchema.safeParse({ ...post, body: " ", status: "da-dang" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toEqual({ body: "Bài chưa có nội dung nên chưa đăng được" });
  });

  it("đánh giá: 1 đến 5 sao", () => {
    expect(reviewSchema.parse({ author_name: "Chị Hà", rating: 5, body: "", course_id: "" })).toEqual({ author_name: "Chị Hà", rating: 5, body: null, course_id: null });
    expect(reviewSchema.safeParse({ author_name: "Chị Hà", rating: 6, body: "", course_id: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ author_name: "", rating: 5, body: "", course_id: "" }).success).toBe(false);
  });
});
