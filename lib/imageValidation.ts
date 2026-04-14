export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "Only image uploads are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Images must be 8MB or smaller.";
  }

  return null;
}
