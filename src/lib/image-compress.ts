// Nén ảnh ở trình duyệt trước khi tải lên: thu cạnh dài về tối đa `maxSide`, xuất WEBP (hoặc JPEG).
// Ảnh GIF giữ nguyên để không mất chuyển động.

export async function compressImage(file: File, maxSide: number): Promise<File> {
  if (file.type === "image/gif" || !file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
  const blob = (await toBlob("image/webp", 0.85)) ?? (await toBlob("image/jpeg", 0.85));
  if (!blob || (blob.size >= file.size && scale === 1)) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
}
