import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { UPLOAD_LIMITS } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";

export const TEMP_DIR = path.resolve("public/temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/mpeg",
  "video/ogg",
]);
const VIDEO_FIELDS = new Set(["videoFile"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  // Random names: avoids collisions between concurrent uploads and path traversal via originalname
  filename: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "")
      .slice(0, 8);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const isVideoField = VIDEO_FIELDS.has(file.fieldname);
  const allowed = isVideoField ? VIDEO_MIME : IMAGE_MIME;
  if (!allowed.has(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type for "${file.fieldname}": ${file.mimetype}`));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_LIMITS.VIDEO_MAX_BYTES, files: 3, fields: 20 },
});

/** Multer only supports one global size limit – enforce a tighter limit on image fields. */
export const limitImageSize = (req, _res, next) => {
  const files = [req.file, ...Object.values(req.files ?? {}).flat()].filter(Boolean);
  const tooBig = files.find((f) => !VIDEO_FIELDS.has(f.fieldname) && f.size > UPLOAD_LIMITS.IMAGE_MAX_BYTES);
  if (tooBig) {
    return next(
      new ApiError(413, `"${tooBig.fieldname}" must be smaller than ${UPLOAD_LIMITS.IMAGE_MAX_BYTES / 1024 / 1024} MB`)
    );
  }
  next();
};

/** Deletes temp upload files once the response is done – on success *and* on error. */
export const cleanupUploads = (req, res, next) => {
  const cleanup = () => {
    const files = [req.file, ...Object.values(req.files ?? {}).flat()].filter(Boolean);
    for (const f of files) fs.rm(f.path, { force: true }, () => {});
  };
  res.on("finish", cleanup);
  res.on("close", cleanup);
  next();
};
