// Tạo chuỗi VietQR (chuẩn EMVCo của NAPAS) để vẽ mã QR chuyển khoản ngay trên web,
// không gửi số tài khoản tới dịch vụ bên ngoài.

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF), trả 4 ký tự hex in hoa. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Bỏ dấu tiếng Việt và ký tự lạ: nội dung chuyển khoản chỉ nên có chữ, số, dấu cách. */
export function plainMemo(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

export function vietQrPayload(opts: { bankBin: string; accountNo: string; amount?: number; memo?: string }): string {
  const account = tlv("00", "A000000727") + tlv("01", tlv("00", opts.bankBin) + tlv("01", opts.accountNo)) + tlv("02", "QRIBFTTA");
  const memo = opts.memo ? plainMemo(opts.memo) : "";
  const body =
    tlv("00", "01") +
    tlv("01", opts.amount ? "12" : "11") +
    tlv("38", account) +
    tlv("53", "704") +
    (opts.amount ? tlv("54", String(Math.round(opts.amount))) : "") +
    tlv("58", "VN") +
    (memo ? tlv("62", tlv("08", memo)) : "") +
    "6304";
  return body + crc16(body);
}

export function canMakeQr(p: { bank_bin?: string; account_no?: string }): boolean {
  return /^\d{6}$/.test(p.bank_bin ?? "") && /^[0-9A-Za-z]{4,19}$/.test(p.account_no ?? "");
}
