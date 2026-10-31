/** 브라우저에서 사진 줄이기: 긴 변 maxPx, JPEG. EXIF(위치정보 등)도 함께 제거됨. 실패하면 원본 반환 */
export async function shrinkImage(file: File, maxPx = 1600, quality = 0.85): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file;
    const bmp = await createImageBitmap(file).catch(() => null);
    const img: ImageBitmap | HTMLImageElement | null = bmp ?? await new Promise<HTMLImageElement | null>(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = URL.createObjectURL(file); });
    if (!img) return file;
    const w = (img as any).width, h = (img as any).height, sc = Math.min(1, maxPx / Math.max(w, h));
    const cv = document.createElement("canvas"); cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    cv.getContext("2d")!.drawImage(img as any, 0, 0, cv.width, cv.height);
    const blob = await new Promise<Blob | null>(r => cv.toBlob(r, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { return file; }
}
