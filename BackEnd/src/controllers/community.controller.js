import { Community } from "../models/community.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { aggregatePaginate, isSameId, lookupLikes, lookupPublicUser, toObjectId } from "../utils/helpers.js";

const postPipeline = (match, viewerId) => [
  { $match: match },
  { $sort: { createdAt: -1, _id: -1 } },
  ...lookupPublicUser(),
  ...lookupLikes({ field: "community", viewerId }),
];

async function findOwnedPost(postId, user) {
  const post = await Community.findById(postId);
  if (!post) throw ApiError.notFound("Post not found");
  if (!isSameId(post.owner, user)) throw ApiError.forbidden("You can only modify your own posts");
  return post;
}

const createCommunityPost = asyncHandler(async (req, res) => {
  const post = await Community.create({ content: req.body.content, owner: req.user._id });
  await post.populate({ path: "owner", select: "username fullName avatar" });
  return res
    .status(201)
    .json(
      new ApiResponse(201, { ...post.toObject(), likesCount: 0, isLiked: false }, "Community post created successfully")
    );
});

const getAllCommunityPost = asyncHandler(async (req, res) => {
  const result = await aggregatePaginate(Community, postPipeline({}, req.user?._id), req.query);
  return res.status(200).json(new ApiResponse(200, result, "Posts fetched"));
});

const getChannelPost = asyncHandler(async (req, res) => {
  const result = await aggregatePaginate(
    Community,
    postPipeline({ owner: toObjectId(req.params.channelId) }, req.user?._id),
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Channel posts fetched"));
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.postId, req.user);
  post.content = req.body.content;
  await post.save();
  await post.populate({ path: "owner", select: "username fullName avatar" });
  return res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.postId, req.user);
  await Promise.all([Community.deleteOne({ _id: post._id }), Like.deleteMany({ community: post._id })]);
  return res.status(200).json(new ApiResponse(200, { _id: post._id }, "Post deleted"));
});

export { createCommunityPost, getAllCommunityPost, getChannelPost, deletePost, updatePost };
