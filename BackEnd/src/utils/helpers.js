import crypto from "crypto";
import mongoose from "mongoose";
import { PAGINATION } from "../constants.js";

export const toObjectId = (id) =>
  id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));

export const isSameId = (a, b) => Boolean(a && b) && String(a._id ?? a) === String(b._id ?? b);

/** Escape user input before using it inside a RegExp (prevents ReDoS / regex injection). */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

export function getPagination(query = {}) {
  const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Runs an aggregation and paginates it in a single round-trip using $facet.
 * Returns the same envelope shape as mongoose-paginate so clients can rely on it.
 */
export async function aggregatePaginate(Model, pipeline, { page, limit }) {
  const skip = (page - 1) * limit;
  const [result] = await Model.aggregate([
    ...pipeline,
    {
      $facet: {
        docs: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    },
  ]);
  return buildPage(result?.docs ?? [], result?.meta?.[0]?.total ?? 0, { page, limit });
}

export function buildPage(docs, totalDocs, { page, limit }) {
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  return {
    docs,
    totalDocs,
    limit,
    page,
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  };
}

/** $lookup stage that embeds a user with only public fields. */
export const lookupPublicUser = ({ localField = "owner", as = "owner" } = {}) => [
  {
    $lookup: {
      from: "users",
      localField,
      foreignField: "_id",
      as,
      pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
    },
  },
  { $addFields: { [as]: { $first: `$${as}` } } },
];

/** Adds `likesCount` and `isLiked` (for the current viewer) to documents via the likes collection. */
export const lookupLikes = ({ field, viewerId }) => [
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: field,
      as: "_likes",
      pipeline: [{ $project: { likedBy: 1 } }],
    },
  },
  {
    $addFields: {
      likesCount: { $size: "$_likes" },
      isLiked: viewerId ? { $in: [toObjectId(viewerId), "$_likes.likedBy"] } : false,
    },
  },
  { $project: { _likes: 0 } },
];
