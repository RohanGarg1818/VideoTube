import { z } from "zod";
import { PAGINATION } from "../constants.js";

export const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

export const idParams = (...names) => z.object(Object.fromEntries(names.map((n) => [n, objectId])));

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const nonEmptyText = (label, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} is too long`);
