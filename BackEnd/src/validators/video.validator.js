import { z } from "zod";
import { VIDEO_SORT_FIELDS } from "../constants.js";
import { idParams, objectId, paginationQuery } from "./common.js";

export const videoIdParams = { params: idParams("videoId") };

export const listVideosSchema = {
  query: paginationQuery.extend({
    query: z.string().trim().max(100).optional(),
    userId: objectId.optional(),
    sortBy: z.enum(VIDEO_SORT_FIELDS).default("createdAt"),
    sortType: z.enum(["asc", "desc"]).default("desc"),
  }),
};

export const publishVideoSchema = {
  body: z.object({
    title: z.string({ error: "Title is required" }).trim().min(1, "Title is required").max(120),
    description: z.string().trim().max(5000).optional().default(""),
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v !== "false"),
  }),
};

export const updateVideoSchema = {
  params: idParams("videoId"),
  body: z.object({
    title: z.string().trim().min(1, "Title cannot be empty").max(120).optional(),
    description: z.string().trim().max(5000).optional(),
  }),
};
