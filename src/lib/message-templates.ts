// Mẫu tin nhắn: 5 mẫu mặc định + phần coach đã sửa (bảng message_templates).
// Web chưa tự gửi tin; coach xem trước rồi sao chép sang Zalo.

export type MessageTemplate = {
  key: string;
  title: string;
  when: string; // dùng khi nào (chỉ để coach nhớ)
  body: string;
  enabled: boolean;
  edited: boolean; // đã có bản lưu trong database
};

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, "enabled" | "edited">[] = [
  {
    key: "sinh-nhat",
    title: "Chúc mừng sinh nhật",
    when: "Đúng ngày sinh của học viên",
    body: "Chúc mừng sinh nhật {tên gọi}! Cảm ơn bạn đã tập cùng mình {số buổi đã học} buổi. Tặng bạn 1 buổi kèm miễn phí, mã {mã ưu đãi}, dùng trước {hạn}.",
  },
  {
    key: "nhac-lich",
    title: "Nhắc lịch học",
    when: "Trước buổi học vài giờ",
    body: "Chào {tên gọi}, nhắc bạn buổi học {giờ học} tại {sân}. Bạn nhớ mang nước và đến sớm 10 phút để khởi động nhé. Nếu bận, bạn báo mình sớm để xếp học bù.",
  },
  {
    key: "nhac-gia-han",
    title: "Nhắc gia hạn gói",
    when: "Khi gói còn 2 buổi hoặc sắp hết hạn",
    body: "Chào {tên gọi}, khoá {khoá đang học} của bạn còn {buổi còn lại} buổi. Bạn muốn học tiếp thì nhắn mình để giữ chỗ và lịch cũ nhé.",
  },
  {
    key: "chao-nhu-cau",
    title: "Chào nhu cầu mới",
    when: "Ngay khi có người gửi form đăng ký",
    body: "Chào {tên gọi}, mình là {tên coach}. Mình đã nhận được đăng ký học pickleball của bạn. Bạn rảnh lúc nào để mình gọi tư vấn lớp và lịch phù hợp ạ?",
  },
  {
    key: "cam-on",
    title: "Cảm ơn sau khoá",
    when: "Khi học viên học xong khoá",
    body: "Cảm ơn {tên gọi} đã hoàn thành khoá {khoá đang học}! Nếu thấy lớp có ích, bạn viết giúp mình vài dòng đánh giá nhé. Hẹn gặp lại bạn trên sân.",
  },
];

/** Biến chèn được vào mẫu, kèm giá trị ví dụ cho khung xem trước. */
export const TEMPLATE_VARS: { name: string; sample: string }[] = [
  { name: "tên gọi", sample: "Hà" },
  { name: "tên coach", sample: "Coach Trung Muối" },
  { name: "tuổi", sample: "29" },
  { name: "khoá đang học", sample: "Cơ bản cho người mới" },
  { name: "buổi còn lại", sample: "2" },
  { name: "số buổi đã học", sample: "13" },
  { name: "giờ học", sample: "18:00 thứ Ba" },
  { name: "sân", sample: "Sân mẫu A" },
  { name: "mã ưu đãi", sample: "HPBD-HA17" },
  { name: "hạn", sample: "31/12" },
];

const VAR = /\{([^{}\n]{1,40})\}/g;

/** Tên các biến có trong nội dung, theo thứ tự xuất hiện, không lặp. */
export function templateVars(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(VAR)) {
    const name = m[1]!.trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

/** Thay {biến} bằng giá trị. Biến chưa có giá trị (hoặc để trống) thì giữ nguyên để coach thấy mà điền. */
export function fillTemplate(body: string, values: Record<string, string | undefined>): string {
  return body.replace(VAR, (whole, name: string) => {
    const v = values[name.trim()]?.trim();
    return v ? v : whole;
  });
}

export const sampleValues = (coachName?: string): Record<string, string> =>
  Object.fromEntries(TEMPLATE_VARS.map((v) => [v.name, v.name === "tên coach" && coachName ? coachName : v.sample]));

/** Ghép 5 mẫu mặc định với bản coach đã lưu (theo key). Dòng lạ trong database bị bỏ qua. */
export function mergeTemplates(rows: { key: string; title: string; body: string; enabled: boolean }[]): MessageTemplate[] {
  return DEFAULT_TEMPLATES.map((d) => {
    const row = rows.find((r) => r.key === d.key);
    return row ? { ...d, title: row.title, body: row.body, enabled: row.enabled, edited: true } : { ...d, enabled: true, edited: false };
  });
}
