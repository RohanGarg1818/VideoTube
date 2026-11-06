import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { aggregatePaginate, isSameId, lookupPublicUser, toObjectId } from "../utils/helpers.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (isSameId(channelId, req.user)) throw ApiError.badRequest("You cannot subscribe to your own channel");
  if (!(await User.exists({ _id: channelId }))) throw ApiError.notFound("Channel not found");

  const filter = { channel: channelId, subscriber: req.user._id };
  const removed = await Subscription.deleteOne(filter);
  let isSubscribed = false;
  if (removed.deletedCount === 0) {
    try {
      await Subscription.create(filter);
    } catch (err) {
      if (err?.code !== 11000) throw err; // concurrent duplicate → already subscribed
    }
    isSubscribed = true;
  }

  const subscribersCount = await Subscription.countDocuments({ channel: channelId });
  return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed, subscribersCount }, isSubscribed ? "Subscribed" : "Unsubscribed"));
});

/** Subscribers of a channel. */
const getChannelSubscriber = asyncHandler(async (req, res) => {
  const result = await aggregatePaginate(
    Subscription,
    [
      { $match: { channel: toObjectId(req.params.channelId) } },
      { $sort: { createdAt: -1 } },
      ...lookupPublicUser({ localField: "subscriber", as: "subscriber" }),
      { $project: { subscriber: 1, createdAt: 1 } },
    ],
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Channel subscribers fetched"));
});

/** Channels a user is subscribed to (with each channel's subscriber count). */
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const channels = await Subscription.aggregate([
    { $match: { subscriber: toObjectId(req.params.channelId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subs",
              pipeline: [{ $project: { _id: 1 } }],
            },
          },
          { $project: { username: 1, fullName: 1, avatar: 1, coverImage: 1, subscribersCount: { $size: "$subs" } } },
        ],
      },
    },
    { $addFields: { channel: { $first: "$channel" } } },
    { $match: { channel: { $ne: null } } },
    { $project: { channel: 1, createdAt: 1 } },
  ]);
  return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
});

/** Latest videos from every channel the current user follows. */
const getSubscriptionFeed = asyncHandler(async (req, res) => {
  const channelIds = await Subscription.find({ subscriber: req.user._id }).distinct("channel");
  const result = await aggregatePaginate(
    Video,
    [
      { $match: { owner: { $in: channelIds }, isPublished: true } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $project: { viewers: 0 } },
      ...lookupPublicUser(),
    ],
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Subscription feed fetched"));
});

export { toggleSubscription, getChannelSubscriber, getSubscribedChannels, getSubscriptionFeed };
