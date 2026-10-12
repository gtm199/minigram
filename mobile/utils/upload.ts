import type { ImagePickerAsset } from "expo-image-picker";

import type { ImageFile } from "../types";

export function assetToImageFile(asset: ImagePickerAsset): ImageFile {
  const extension = asset.uri.split(".").pop()?.toLowerCase();
  const type =
    asset.mimeType ??
    (asset.type === "video"
      ? extension === "mov"
        ? "video/quicktime"
        : "video/mp4"
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg");
  const fallbackExt = type === "video/quicktime" ? "mov" : (type.split("/")[1] ?? "jpg");
  const name = asset.fileName ?? `upload.${fallbackExt}`;
  return { uri: asset.uri, name, type };
}

export function buildFormData(
  fields: Record<string, string | undefined>,
  imageField?: string,
  image?: ImageFile | null,
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) form.append(key, value);
  });
  if (imageField && image) {
    // React Native's FormData accepts a { uri, name, type } descriptor for files.
    form.append(imageField, { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
  }
  return form;
}
