import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { WATCH_HISTORY_LIMIT } from "../constants.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { lookupPublicUser, toObjectId } from "../utils/helpers.js";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  // Frontend (Vercel) and API (Render) live on different sites in production
  sameSite: config.isProduction ? "none" : "lax",
  path: "/",
});

/** Issues a fresh access/refresh pair and stores only the hash of the refresh token. */
async function issueTokens(user) {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.setRefreshToken(refreshToken);
  await user.save({ validateModifiedOnly: true });
  return { accessToken, refreshToken };
}

const sendAuth = (res, status, payload, message) =>
  res
    .status(status)
    .cookie("accessToken", payload.accessToken, cookieOptions())
    .cookie("refreshToken", payload.refreshToken, cookieOptions())
    .json(new ApiResponse(status, payload, message));

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) throw ApiError.badRequest("Avatar file is required");

  // Check uniqueness *before* uploading anything to the CDN
  const existing = await User.findOne({ $or: [{ username }, { email }] })
    .select("username email")
    .lean();
  if (existing) {
    throw ApiError.conflict(existing.email === email ? "Email is already registered" : "Username is already taken");
  }

  const [avatar, coverImage] = await Promise.all([
    uploadOnCloudinary(avatarLocalPath, { folder: "avatars", resourceType: "image" }),
    coverImageLocalPath ? uploadOnCloudinary(coverImageLocalPath, { folder: "covers", resourceType: "image" }) : null,
  ]);

  let user;
  try {
    user = await User.create({
      fullName,
      email,
      username,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url ?? "",
    });
  } catch (err) {
    // Roll back the uploads if the insert loses a race on the unique index
    deleteFromCloudinary(avatar.url);
    if (coverImage) deleteFromCloudinary(coverImage.url);
    throw err;
  }

  return res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, identifier, password } = req.body;
  const id = identifier ?? email ?? username;
  const filter = id.includes("@") ? { email: id } : { username: id };

  const user = await User.findOne(filter).select("+password");
  // Same message for unknown user & wrong password → no account enumeration
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw ApiError.unauthorized("Invalid username/email or password");
  }

  const tokens = await issueTokens(user);
  return sendAuth(res, 200, { user, ...tokens }, "User logged in successfully");
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $unset: { refreshToken: 1 } });
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions())
    .clearCookie("refreshToken", cookieOptions())
    .json(new ApiResponse(200, {}, "User logged out"));
});

/**
 * Refresh-token rotation with reuse detection:
 * every refresh issues a new pair; presenting an already-rotated token revokes the session.
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incoming = req.body?.refreshToken || req.cookies?.refreshToken;
  if (!incoming) throw ApiError.unauthorized("Refresh token missing");

  let decoded;
  try {
    decoded = jwt.verify(incoming, config.jwt.refreshSecret);
  } catch {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user) throw ApiError.unauthorized("Refresh token is invalid or expired");

  if (!user.matchesRefreshToken(incoming)) {
    // Token was valid but not the current one → possible theft. Kill the session.
    await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1 } });
    throw ApiError.unauthorized("Refresh token has already been used");
  }

  const tokens = await issueTokens(user);
  return sendAuth(res, 200, tokens, "Access token refreshed");
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.isPasswordCorrect(oldPassword))) throw ApiError.badRequest("Current password is incorrect");

  user.password = newPassword;
  // Changing the password signs out every other session
  const tokens = await issueTokens(user);
  return sendAuth(res, 200, tokens, "Password updated");
});

/* ------------------------------------------------------------------ */
/* profile                                                             */
/* ------------------------------------------------------------------ */

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (email && email !== req.user.email) {
    const taken = await User.exists({ email, _id: { $ne: req.user._id } });
    if (taken) throw ApiError.conflict("Email is already registered");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...(fullName && { fullName }), ...(email && { email }) } },
    { returnDocument: "after", runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, user, "Account details updated"));
});

const replaceUserImage = (field, folder) =>
  asyncHandler(async (req, res) => {
    if (!req.file?.path) throw ApiError.badRequest(`${field} file is missing`);

    const uploaded = await uploadOnCloudinary(req.file.path, { folder, resourceType: "image" });
    const previous = req.user[field];

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { [field]: uploaded.url } },
      { returnDocument: "after" }
    );
    deleteFromCloudinary(previous); // fire-and-forget cleanup of the old asset

    return res.status(200).json(new ApiResponse(200, user, `${field === "avatar" ? "Avatar" : "Cover image"} updated`));
  });

const updateUserAvatar = replaceUserImage("avatar", "avatars");
const updateUserCoverImage = replaceUserImage("coverImage", "covers");

/* ------------------------------------------------------------------ */
/* channel & history                                                   */
/* ------------------------------------------------------------------ */

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const viewerId = req.user?._id ? toObjectId(req.user._id) : null;

  const [channel] = await User.aggregate([
    { $match: { username } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [{ $project: { subscriber: 1 } }],
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videoStats",
        pipeline: [
          { $match: { isPublished: true } },
          { $group: { _id: null, count: { $sum: 1 }, views: { $sum: "$views" } } },
        ],
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        videosCount: { $ifNull: [{ $first: "$videoStats.count" }, 0] },
        totalViews: { $ifNull: [{ $first: "$videoStats.views" }, 0] },
        isSubscribed: viewerId ? { $in: [viewerId, "$subscribers.subscriber"] } : { $literal: false },
      },
    },
  ]);

  if (!channel) throw ApiError.notFound("Channel does not exist");
  return res.status(200).json(new ApiResponse(200, channel, "User channel fetched successfully"));
});

/** Atomically moves a video to the front of the user's history, de-duplicated and capped. */
export async function pushToWatchHistory(userId, videoId) {
  const vid = toObjectId(videoId);
  await User.updateOne(
    { _id: userId },
    [
      {
        $set: {
          watchHistory: {
            $slice: [
              {
                $concatArrays: [
                  [vid],
                  { $filter: { input: { $ifNull: ["$watchHistory", []] }, cond: { $ne: ["$$this", vid] } } },
                ],
              },
              WATCH_HISTORY_LIMIT,
            ],
          },
        },
      },
    ],
    { updatePipeline: true }
  );
}

const getWatchHistory = asyncHandler(async (req, res) => {
  const ids = req.user.watchHistory ?? [];
  if (!ids.length) return res.status(200).json(new ApiResponse(200, [], "Watch history fetched"));

  const videos = await Video.aggregate([
    { $match: { _id: { $in: ids }, $or: [{ isPublished: true }, { owner: req.user._id }] } },
    { $project: { viewers: 0 } },
    ...lookupPublicUser(),
  ]);

  // $in does not preserve order – restore most-recent-first ordering
  const byId = new Map(videos.map((v) => [String(v._id), v]));
  const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

  return res.status(200).json(new ApiResponse(200, ordered, "Watch history fetched"));
});

const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $set: { watchHistory: [] } });
  return res.status(200).json(new ApiResponse(200, [], "Watch history cleared"));
});

const removeFromWatchHistory = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { watchHistory: toObjectId(req.params.videoId) } });
  return res.status(200).json(new ApiResponse(200, {}, "Video removed from watch history"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory,
};
