import { Video } from "../models/video.model.js";
import { View } from "../models/view.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { aggregatePaginate, escapeRegex, isSameId, lookupPublicUser, toObjectId } from "../utils/helpers.js";
import { pushToWatchHistory } from "./user.controller.js";

/** Owners can see their unpublished videos, everyone else only sees published ones. */
const visibilityFilter = (viewer) =>
  viewer ? { $or: [{ isPublished: true }, { owner: toObjectId(viewer._id) }] } : { isPublished: true };

async function findVisibleVideo(videoId, viewer) {
  const video = await Video.findById(videoId);
  if (!video || (!video.isPublished && !isSameId(video.owner, viewer))) {
    throw ApiError.notFound("Video not found");
  }
  return video;
}

async function findOwnedVideo(videoId, user) {
  const video = await Video.findById(videoId);
  if (!video) throw ApiError.notFound("Video not found");
  if (!isSameId(video.owner, user)) throw ApiError.forbidden("You can only modify your own videos");
  return video;
}

/**
 * Full video payload for the watch page: owner (+ subscriber count), whether the
 * current viewer liked it / is subscribed – one aggregation instead of 3 extra API calls.
 */
async function getVideoDetails(videoId, viewer) {
  const viewerId = viewer?._id ? toObjectId(viewer._id) : null;
  const [video] = await Video.aggregate([
    { $match: { _id: toObjectId(videoId) } },
    { $project: { viewers: 0 } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subs",
              pipeline: [{ $project: { subscriber: 1 } }],
            },
          },
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              coverImage: 1,
              subscribersCount: { $size: "$subs" },
              isSubscribed: viewerId ? { $in: [viewerId, "$subs.subscriber"] } : { $literal: false },
            },
          },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $lookup: {
        from: "likes",
        let: { vid: "$_id" },
        as: "viewerLike",
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$video", "$$vid"] }, { $eq: ["$likedBy", viewerId] }] } } },
          { $limit: 1 },
        ],
      },
    },
    { $addFields: { isLiked: { $gt: [{ $size: "$viewerLike" }, 0] } } },
    { $project: { viewerLike: 0 } },
  ]);
  return video;
}

/* ------------------------------------------------------------------ */

const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit, query, sortBy, sortType, userId } = req.query;

  const match = { ...visibilityFilter(req.user) };
  if (userId) match.owner = toObjectId(userId);
  if (query) {
    const rx = new RegExp(escapeRegex(query), "i");
    match.$and = [{ $or: [{ title: rx }, { description: rx }] }];
  }

  const direction = sortType === "asc" ? 1 : -1;
  const result = await aggregatePaginate(
    Video,
    [
      { $match: match },
      { $sort: { [sortBy]: direction, _id: direction } },
      { $project: { viewers: 0 } },
      ...lookupPublicUser(),
    ],
    { page, limit }
  );

  return res.status(200).json(new ApiResponse(200, result, "Videos fetched"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw ApiError.badRequest("Video file is required");
  if (!thumbnailLocalPath) throw ApiError.badRequest("Thumbnail is required");

  // Upload both assets in parallel – roughly halves publish latency
  const [videoAsset, thumbAsset] = await Promise.all([
    uploadOnCloudinary(videoLocalPath, { folder: "videos", resourceType: "video" }),
    uploadOnCloudinary(thumbnailLocalPath, { folder: "thumbnails", resourceType: "image" }),
  ]);

  const video = await Video.create({
    title,
    description,
    isPublished,
    videoFile: videoAsset.url,
    thumbnail: thumbAsset.url,
    duration: Math.round(videoAsset.duration ?? 0),
    owner: req.user._id,
  });

  req.log?.info({ videoId: video._id, owner: req.user._id }, "Video published");
  return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const video = await getVideoDetails(req.params.videoId, req.user);
  if (!video || (!video.isPublished && !isSameId(video.owner, req.user))) throw ApiError.notFound("Video not found");
  return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const video = await findOwnedVideo(req.params.videoId, req.user);
  const oldThumbnail = video.thumbnail;

  if (title !== undefined) video.title = title;
  if (description !== undefined) video.description = description;
  if (req.file?.path) {
    const thumb = await uploadOnCloudinary(req.file.path, { folder: "thumbnails", resourceType: "image" });
    video.thumbnail = thumb.url;
  }

  await video.save();
  if (video.thumbnail !== oldThumbnail) deleteFromCloudinary(oldThumbnail);
  await video.populate("owner", "fullName username avatar");

  return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

/** Deletes a video and everything that hangs off it (likes, comments, views, playlist refs, CDN assets). */
const deleteVideo = asyncHandler(async (req, res) => {
  const video = await findOwnedVideo(req.params.videoId, req.user);

  const commentIds = await Comment.find({ video: video._id }).distinct("_id");
  await Promise.all([
    Video.deleteOne({ _id: video._id }),
    Like.deleteMany({ $or: [{ video: video._id }, { comment: { $in: commentIds } }] }),
    Comment.deleteMany({ video: video._id }),
    View.deleteMany({ video: video._id }),
    Playlist.updateMany({ videos: video._id }, { $pull: { videos: video._id } }),
    User.updateMany({ watchHistory: video._id }, { $pull: { watchHistory: video._id } }),
  ]);
  deleteFromCloudinary(video.videoFile, "video");
  deleteFromCloudinary(video.thumbnail, "image");

  req.log?.info({ videoId: video._id }, "Video deleted");
  return res.status(200).json(new ApiResponse(200, { _id: video._id }, "Video deleted successfully"));
});

const toggleIsPublished = asyncHandler(async (req, res) => {
  const video = await findOwnedVideo(req.params.videoId, req.user);
  video.isPublished = !video.isPublished;
  await video.save();
  return res.status(200).json(new ApiResponse(200, video, video.isPublished ? "Video published" : "Video unpublished"));
});

/**
 * Registers a view. Unique per signed-in user (enforced by a unique index on the
 * views collection, so concurrent requests can't double count). Also updates watch history.
 */
const viewVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  await findVisibleVideo(videoId, req.user);

  if (req.user) {
    const result = await View.updateOne(
      { video: videoId, viewer: req.user._id },
      { $setOnInsert: { video: videoId, viewer: req.user._id } },
      { upsert: true }
    );
    if (result.upsertedCount === 1) {
      await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });
    }
    await pushToWatchHistory(req.user._id, videoId);
  }

  const video = await getVideoDetails(videoId, req.user);
  return res.status(200).json(new ApiResponse(200, video, "Video viewed successfully"));
});

/** "Up next" suggestions: same-channel videos first, then popular ones. */
const getRelatedVideos = asyncHandler(async (req, res) => {
  const video = await findVisibleVideo(req.params.videoId, req.user);
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 8, 20);

  const related = await Video.aggregate([
    { $match: { isPublished: true, _id: { $ne: video._id } } },
    { $addFields: { sameChannel: { $eq: ["$owner", video.owner] } } },
    { $sort: { sameChannel: -1, views: -1, createdAt: -1 } },
    { $limit: limit },
    { $project: { viewers: 0, sameChannel: 0 } },
    ...lookupPublicUser(),
  ]);

  return res.status(200).json(new ApiResponse(200, related, "Related videos fetched"));
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleIsPublished,
  viewVideo,
  getRelatedVideos,
};
