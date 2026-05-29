import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "video id is missing");
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    let video;
    if (!isLiked) {
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });

        if (!like) {
            throw new ApiError(400, "error while liking");
        }

        video = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { likes: 1 } },
            { new: true },
        );
    } else {
        await Like.findByIdAndDelete(isLiked._id);
        video = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { likes: -1 } },
            { new: true },
        );
    }

    const videoLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    const isVideoLiked = Boolean(videoLiked);
    const likes = Math.max(0, video?.likes ?? 0);

    return res.status(200).json(
        new ApiResponse(200, { isVideoLiked, likes }, "video liked"),
    );
})

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "video id is missing");
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: Boolean(isLiked) }, "like status fetched"),
    );
})

const toggelCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "comment id is missing")
    }

    const isLiked = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user._id
        }
    )

    if (!isLiked) {
        const like = await Like.create(
            {
                comment: commentId,
                likedBy: req.user._id
            }
        )
        if (!like) {
            throw new ApiError(400, "error while liking comment")
        }
    } else {
        await Like.findByIdAndDelete(isLiked._id)
    }

    const commentLiked = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user._id
        }
    )

    let isCommentLiked;

    if (!commentLiked) {
        isCommentLiked = false
    } else {
        isCommentLiked = true
    }

    return res.status(200).json(new ApiResponse(200, { isCommentLiked }, "like status"))
})

const toggleCommunityPostLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        throw new ApiError(400, "post id is missing")
    }

    const isLiked = await Like.findOne(
        {
            community: postId,
            likedBy: req.user._id
        }
    )

    if (!isLiked) {
        const likedPost = await Like.create(
            {
                community: postId,
                likedBy: req.user._id
            }
        )
        if (!likedPost) {
            throw new ApiError(400, "error while liking post")
        }
    } else {
        await Like.findByIdAndDelete(isLiked._id);
    }

    const like = await Like.findOne(
        {
            community: postId,
            likedBy: req.user._id
        }
    )

    let isCommunityLiked;

    if (!like) {
        isCommunityLiked = false
    } else {
        isCommunityLiked = true
    }

    return res.status(200).json(new ApiResponse(200, { isCommunityLiked }, "community like status"))
})

const getAllLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            likes: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $arrayElemAt: ["$ownerDetails", 0] }
                        }
                    },
                    {
                        $project: {
                            ownerDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $arrayElemAt: ["$videoDetails", 0] }
            }
        },
        {
            $project: {
                video: 1,
                _id: 0
            }
        }
    ]);

    if (!likedVideos.length) {
        return res.status(200).json(
            new ApiResponse(200, [], "no liked videos found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, likedVideos.map(item => item.video), "liked videos fetched successfully")
    );
});

export { toggleVideoLike, getVideoLikeStatus, toggelCommentLike, toggleCommunityPostLike, getAllLikedVideos }