import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const addComment = asyncHandler(async(req,res)=>{
    const {channelId, videoId} = req.params;
    const {content} = req.body;
    const ownerId = req.user?._id;

    if (!channelId || !videoId) {
        throw new ApiError(400,"channel id or video id is missing")
    }

    if (!ownerId) {
        throw new ApiError(401,"Unauthorized to add comment")
    }

    if (!content) {
        throw new ApiError(400,"comment cannot be empty")
    }

    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: ownerId
        }
    )

    if (!comment) {
        throw new ApiError(404,"error while creating comment")
    }

    await comment.populate({ path: "owner", select: "username fullName avatar" });

    return res.status(200).json(new ApiResponse(200,comment,"comment added successfully"))
})

const getAllVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400,"video id is missing")
    }

    const comments = await Comment.find({ video: videoId })
        .populate({ path: "owner", select: "username fullName avatar" })
        .sort({ createdAt: -1 });

    if (!comments) {
        throw new ApiError(404,"comments not found")
    }

    return res.status(200).json(new ApiResponse(200,comments,"comments fetched successfully"))
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400,"comment id missing")
    }

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "comment id is invalid")
    }

    if (!userId) {
        throw new ApiError(401,"Unauthorized request")
    }

    const comment = await Comment.findById(commentId).select("owner");
    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    if (!comment.owner || comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403,"You are not authorized to delete this comment")
    }

    const deletedComment = await Comment.findOneAndDelete({ _id: commentId, owner: userId });
    if (!deletedComment) {
        throw new ApiError(400,"error while deleting comment")
    }

    return res.status(200).json(new ApiResponse(200,deletedComment,"comment deleted successfully"))
})

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    const {content} = req.body;
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400,"comment id is required")
    }

    if(!content){
        throw new ApiError(400,"write something to update")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    if (!userId || comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403,"You are not authorized to update this comment")
    }

    comment.content = content;
    await comment.save();
    await comment.populate({ path: "owner", select: "username fullName avatar" });

    return res.status(200).json(new ApiResponse(200,comment,"comment updated successfully"))
})

export {addComment,getAllVideoComments, deleteComment, updateComment}