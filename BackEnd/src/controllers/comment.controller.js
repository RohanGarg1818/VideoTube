import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { aggregatePaginate, isSameId, lookupLikes, lookupPublicUser, toObjectId } from "../utils/helpers.js";

async function assertVideoVisible(videoId, viewer) {
  const video = await Video.findById(videoId).select("isPublished owner").lean();
  if (!video || (!video.isPublished && !isSameId(video.owner, viewer))) throw ApiError.notFound("Video not found");
  return video;
}

async function findOwnedComment(commentId, user) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  if (!isSameId(comment.owner, user)) throw ApiError.forbidden("You can only modify your own comments");
  return comment;
}

const getAllVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page, limit } = req.query;
  await assertVideoVisible(videoId, req.user);

  const result = await aggregatePaginate(
    Comment,
    [
      { $match: { video: toObjectId(videoId) } },
      { $sort: { createdAt: -1, _id: -1 } },
      ...lookupPublicUser(),
      ...lookupLikes({ field: "comment", viewerId: req.user?._id }),
    ],
    { page, limit }
  );

  return res.status(200).json(new ApiResponse(200, result, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  await assertVideoVisible(videoId, req.user);

  const comment = await Comment.create({ content: req.body.content, video: videoId, owner: req.user._id });
  await comment.populate({ path: "owner", select: "username fullName avatar" });

  return res
    .status(201)
    .json(new ApiResponse(201, { ...comment.toObject(), likesCount: 0, isLiked: false }, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await findOwnedComment(req.params.commentId, req.user);
  comment.content = req.body.content;
  await comment.save();
  await comment.populate({ path: "owner", select: "username fullName avatar" });
  return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await findOwnedComment(req.params.commentId, req.user);
  await Promise.all([Comment.deleteOne({ _id: comment._id }), Like.deleteMany({ comment: comment._id })]);
  return res.status(200).json(new ApiResponse(200, { _id: comment._id }, "Comment deleted successfully"));
});

export { addComment, getAllVideoComments, deleteComment, updateComment };
