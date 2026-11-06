import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Community } from "../models/community.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { aggregatePaginate, lookupPublicUser } from "../utils/helpers.js";

/**
 * Idempotent-under-concurrency toggle.
 * We try to delete first; if nothing was deleted we insert. The partial unique index
 * turns a racing duplicate insert into E11000, which we treat as "already liked".
 */
async function toggleLike(field, targetId, userId) {
  const filter = { [field]: targetId, likedBy: userId };
  const removed = await Like.deleteOne(filter);
  if (removed.deletedCount === 1) return { liked: false, changed: true };
  try {
    await Like.create(filter);
    return { liked: true, changed: true };
  } catch (err) {
    if (err?.code === 11000) return { liked: true, changed: false };
    throw err;
  }
}

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const exists = await Video.exists({ _id: videoId });
  if (!exists) throw ApiError.notFound("Video not found");

  const { liked, changed } = await toggleLike("video", videoId, req.user._id);
  let video;
  if (changed) {
    video = await Video.findOneAndUpdate(
      { _id: videoId },
      { $inc: { likes: liked ? 1 : -1 } },
      { returnDocument: "after" }
    ).select("likes");
    if (video.likes < 0)
      video = await Video.findOneAndUpdate(
        { _id: videoId },
        { $set: { likes: 0 } },
        { returnDocument: "after" }
      ).select("likes");
  } else {
    video = await Video.findById(videoId).select("likes");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isVideoLiked: liked, likes: Math.max(0, video?.likes ?? 0) },
        liked ? "Video liked" : "Video unliked"
      )
    );
});

const getVideoLikeStatus = asyncHandler(async (req, res) => {
  const isLiked = await Like.exists({ video: req.params.videoId, likedBy: req.user._id });
  return res.status(200).json(new ApiResponse(200, { isLiked: Boolean(isLiked) }, "Like status fetched"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!(await Comment.exists({ _id: commentId }))) throw ApiError.notFound("Comment not found");

  const { liked } = await toggleLike("comment", commentId, req.user._id);
  const likesCount = await Like.countDocuments({ comment: commentId });
  return res.status(200).json(new ApiResponse(200, { isCommentLiked: liked, likesCount }, "Comment like toggled"));
});

const toggleCommunityPostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!(await Community.exists({ _id: postId }))) throw ApiError.notFound("Post not found");

  const { liked } = await toggleLike("community", postId, req.user._id);
  const likesCount = await Like.countDocuments({ community: postId });
  return res.status(200).json(new ApiResponse(200, { isCommunityLiked: liked, likesCount }, "Post like toggled"));
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await aggregatePaginate(
    Like,
    [
      { $match: { likedBy: req.user._id, video: { $type: "objectId" } } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline: [{ $match: { isPublished: true } }, { $project: { viewers: 0 } }, ...lookupPublicUser()],
        },
      },
      { $unwind: "$video" },
      { $replaceRoot: { newRoot: { $mergeObjects: ["$video", { likedAt: "$createdAt" }] } } },
    ],
    { page, limit }
  );

  return res.status(200).json(new ApiResponse(200, result, "Liked videos fetched successfully"));
});

export {
  toggleVideoLike,
  getVideoLikeStatus,
  toggleCommentLike,
  toggleCommentLike as toggelCommentLike,
  toggleCommunityPostLike,
  getAllLikedVideos,
};
