import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { aggregatePaginate, toObjectId } from "../utils/helpers.js";

/** Creator analytics for the signed-in channel, computed in a single $facet pass. */
const getChannelStats = asyncHandler(async (req, res) => {
  const owner = toObjectId(req.user._id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [[videoStats], subscribersCount, newSubscribers, commentsCount] = await Promise.all([
    Video.aggregate([
      { $match: { owner } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                publishedVideos: { $sum: { $cond: ["$isPublished", 1, 0] } },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: "$likes" },
                totalDuration: { $sum: "$duration" },
              },
            },
          ],
          topVideos: [
            { $sort: { views: -1, likes: -1 } },
            { $limit: 5 },
            { $project: { title: 1, thumbnail: 1, views: 1, likes: 1, createdAt: 1, isPublished: 1, duration: 1 } },
          ],
          uploadsByMonth: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                uploads: { $sum: 1 },
                views: { $sum: "$views" },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 12 },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", uploads: 1, views: 1 } },
          ],
        },
      },
    ]),
    Subscription.countDocuments({ channel: owner }),
    Subscription.countDocuments({ channel: owner, createdAt: { $gte: since } }),
    Video.find({ owner })
      .distinct("_id")
      .then((ids) => Comment.countDocuments({ video: { $in: ids } })),
  ]);

  const totals = videoStats?.totals?.[0] ?? {};
  const stats = {
    totalVideos: totals.totalVideos ?? 0,
    publishedVideos: totals.publishedVideos ?? 0,
    draftVideos: (totals.totalVideos ?? 0) - (totals.publishedVideos ?? 0),
    totalViews: totals.totalViews ?? 0,
    totalLikes: totals.totalLikes ?? 0,
    totalDuration: totals.totalDuration ?? 0,
    totalComments: commentsCount,
    subscribersCount,
    newSubscribersLast30Days: newSubscribers,
    topVideos: videoStats?.topVideos ?? [],
    uploadsByMonth: videoStats?.uploadsByMonth ?? [],
  };

  return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched"));
});

/** All of the creator's videos – including unpublished drafts – with per-video comment counts. */
const getChannelVideos = asyncHandler(async (req, res) => {
  const result = await aggregatePaginate(
    Video,
    [
      { $match: { owner: toObjectId(req.user._id) } },
      { $sort: { createdAt: -1 } },
      { $project: { viewers: 0 } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "_c",
          pipeline: [{ $project: { _id: 1 } }],
        },
      },
      { $addFields: { commentsCount: { $size: "$_c" } } },
      { $project: { _c: 0 } },
    ],
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Channel videos fetched"));
});

export { getChannelStats, getChannelVideos };
