import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isSameId, lookupPublicUser, toObjectId } from "../utils/helpers.js";

async function findOwnedPlaylist(playlistId, user) {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw ApiError.notFound("Playlist not found");
  if (!isSameId(playlist.owner, user)) throw ApiError.forbidden("You can only modify your own playlists");
  return playlist;
}

/**
 * Embeds playlist videos (public fields + owner) while preserving the order in which
 * they were added – $lookup on an array does not guarantee order on its own.
 */
const playlistPipeline = (match, viewerId) => [
  { $match: match },
  {
    $lookup: {
      from: "videos",
      localField: "videos",
      foreignField: "_id",
      as: "_videos",
      pipeline: [
        {
          $match: viewerId ? { $or: [{ isPublished: true }, { owner: toObjectId(viewerId) }] } : { isPublished: true },
        },
        { $project: { viewers: 0 } },
        ...lookupPublicUser(),
      ],
    },
  },
  {
    $addFields: {
      videos: {
        $filter: {
          input: {
            $map: {
              input: "$videos",
              as: "id",
              in: { $first: { $filter: { input: "$_videos", as: "v", cond: { $eq: ["$$v._id", "$$id"] } } } },
            },
          },
          cond: { $ne: ["$$this", null] },
        },
      },
    },
  },
  {
    $addFields: {
      totalVideos: { $size: "$videos" },
      totalDuration: { $sum: "$videos.duration" },
      totalViews: { $sum: "$videos.views" },
    },
  },
  { $project: { _videos: 0 } },
  ...lookupPublicUser(),
];

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const playlist = await Playlist.create({ name, description, owner: req.user._id });
  return res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

const addVideos = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  await findOwnedPlaylist(playlistId, req.user);

  const video = await Video.findById(videoId).select("isPublished owner").lean();
  if (!video || (!video.isPublished && !isSameId(video.owner, req.user))) throw ApiError.notFound("Video not found");

  // $addToSet makes the operation idempotent and race-free
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: video._id } },
    { returnDocument: "after" }
  );
  return res.status(200).json(new ApiResponse(200, playlist, "Video added successfully"));
});

const removePlaylistVideo = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  await findOwnedPlaylist(playlistId, req.user);
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: toObjectId(videoId) } },
    { returnDocument: "after" }
  );
  return res.status(200).json(new ApiResponse(200, playlist, "Video removed successfully"));
});

const getPlaylist = asyncHandler(async (req, res) => {
  const [playlist] = await Playlist.aggregate(
    playlistPipeline({ _id: toObjectId(req.params.playlistId) }, req.user?._id)
  );
  if (!playlist) throw ApiError.notFound("Playlist not found");
  return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const playlists = await Playlist.aggregate([
    ...playlistPipeline({ owner: toObjectId(req.params.userId) }, req.user?._id),
    { $sort: { updatedAt: -1 } },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, playlists.length ? "Playlists fetched" : "No playlists found"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const playlist = await findOwnedPlaylist(req.params.playlistId, req.user);
  playlist.name = req.body.name;
  playlist.description = req.body.description;
  await playlist.save();
  return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await findOwnedPlaylist(req.params.playlistId, req.user);
  await Playlist.deleteOne({ _id: playlist._id });
  return res.status(200).json(new ApiResponse(200, { _id: playlist._id }, "Playlist deleted successfully"));
});

export { createPlaylist, addVideos, getPlaylist, getUserPlaylist, deletePlaylist, updatePlaylist, removePlaylistVideo };
