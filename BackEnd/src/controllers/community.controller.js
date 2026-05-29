import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Community } from "../models/community.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const createCommunityPost = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "write something to post")
    }

    const community = await Community.create(
        {
            content,
            owner: req.user._id
        }
    )

    if (!community) {
        throw new ApiError(400, "error while creating community post")
    }

    await community.populate({ path: "owner", select: "username fullName avatar" });

    return res.status(200).json(new ApiResponse(200, community, "community post created successfully"));
})

const getAllCommunityPost = asyncHandler(async (req, res) => {

    const communityPost = await Community.find({})
        .populate({ path: "owner", select: "username fullName avatar" })
        .sort({ createdAt: -1 });

    if (!communityPost) {
        throw new ApiError(400, "error while fetching posts")
    }

    return res.status(200).json(new ApiResponse(200, communityPost, "all post fetched"))
})

const getChannelPost = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "channel id is missing")
    }

    const post = await Community.find({ owner: channelId })
        .populate({ path: "owner", select: "username fullName avatar" })
        .sort({ createdAt: -1 });

    if (!post) {
        throw new ApiError(404, "post not found")
    }

    return res.status(200).json(new ApiResponse(200, post, "post fetched"));

})

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!postId) {
        throw new ApiError(400, "post id is missing")
    }

    if (!mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "post id is invalid")
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized request")
    }

    const post = await Community.findById(postId).select("owner");
    if (!post) {
        throw new ApiError(404, "post not found")
    }

    if (!post.owner || post.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post")
    }

    const deletedPost = await Community.findOneAndDelete({ _id: postId, owner: userId });
    if (!deletedPost) {
        throw new ApiError(400, "error while deleting post")
    }

    return res.status(200).json(new ApiResponse(200, deletedPost, "post deleted"))
})

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;
    if (!postId) {
        throw new ApiError(400, "post id is missing")
    }

    if (!content) {
        throw new ApiError(400, "write something to update")
    }

    const post = await Community.findById(postId);
    if (!post) {
        throw new ApiError(404, "post not found")
    }

    if (!userId || post.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this post")
    }

    post.content = content;
    await post.save();
    await post.populate({ path: "owner", select: "username fullName avatar" });

    return res.status(200).json(new ApiResponse(200, post, "post updated successfully"))
})

export { createCommunityPost, getAllCommunityPost, getChannelPost, deletePost, updatePost }