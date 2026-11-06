export const API_PREFIX = "/api/v1";

export const PAGINATION = Object.freeze({ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 12, MAX_LIMIT: 50 });

export const WATCH_HISTORY_LIMIT = 50;

export const UPLOAD_LIMITS = Object.freeze({
  VIDEO_MAX_BYTES: 500 * 1024 * 1024, // 500 MB
  IMAGE_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
});

export const VIDEO_SORT_FIELDS = Object.freeze(["createdAt", "views", "likes", "duration", "title"]);

// Fields of a user that are safe to embed in other resources (never password / tokens / email).
export const PUBLIC_USER_FIELDS = Object.freeze({ _id: 1, username: 1, fullName: 1, avatar: 1 });
export const PUBLIC_USER_SELECT = "username fullName avatar";
