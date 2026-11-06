import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "./ApiError.js";

const useMock = config.media.driver === "mock";

if (!useMock) {
  cloudinary.config({ ...config.media.cloudinary, secure: true });
}

/**
 * Upload a local file to Cloudinary.
 * Temp files are removed by the `cleanupUploads` middleware once the response finishes,
 * so this function never has to worry about the local filesystem.
 *
 * @returns {{ url: string, publicId: string, duration?: number, resourceType: string }}
 */
export async function uploadOnCloudinary(localFilePath, { folder = "misc", resourceType = "auto" } = {}) {
  if (!localFilePath) return null;

  if (useMock) {
    const name = path.basename(localFilePath).replace(/\.[^.]+$/, "");
    const type = resourceType === "auto" ? "image" : resourceType;
    return {
      url: `https://res.cloudinary.com/mock/${type}/upload/v1/${config.media.folder}/${folder}/${name}`,
      publicId: `${config.media.folder}/${folder}/${name}`,
      duration: type === "video" ? 42.5 : undefined,
      resourceType: type,
    };
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
      folder: `${config.media.folder}/${folder}`,
      // Large videos are uploaded in 20 MB chunks
      ...(resourceType === "video" ? { chunk_size: 20 * 1024 * 1024 } : {}),
    });
    return {
      url: response.secure_url,
      publicId: response.public_id,
      duration: response.duration,
      resourceType: response.resource_type,
    };
  } catch (err) {
    logger.error({ err }, "Cloudinary upload failed");
    throw new ApiError(502, "Media upload failed, please try again");
  }
}

/** Extracts the Cloudinary public_id from a delivery URL. */
export function publicIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const idx = url.indexOf("/upload/");
  if (idx === -1) return null;
  const parts = url
    .slice(idx + "/upload/".length)
    .split("?")[0]
    .split("/");
  const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  // everything after the version segment (or after any transformation segments) is the public id
  const idParts =
    versionIdx >= 0
      ? parts.slice(versionIdx + 1)
      : parts.filter((p) => !p.includes(",") && !/^[a-z]{1,3}_[^/]+$/.test(p));
  return idParts.join("/").replace(/\.[a-z0-9]+$/i, "") || null;
}

/**
 * Best-effort deletion of an asset. Never throws – a failed cleanup must not fail the request.
 */
export async function deleteFromCloudinary(url, resourceType = "image") {
  const publicId = publicIdFromUrl(url);
  if (!publicId || useMock) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err) {
    logger.warn({ err, publicId }, "Cloudinary cleanup failed");
  }
}
